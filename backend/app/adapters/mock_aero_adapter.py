import asyncio
import math
import time
from typing import Dict, Any, Optional
from app.adapters.ixil_adapter import IXILAdapter

class MockAeroAdapter(IXILAdapter):
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        
        self.active_vehicle = "Boeing 787-8"
        self.active_weather = "Clear (25°C)"
        self.configured_fuel_kg = 50000.0
        
        self.state = {
            "domain": 1,
            "altitude_ft": 0.0,
            "airspeed_kts": 0.0,
            "mach_number": 0.0,
            "pitch_deg": 0.0,
            "roll_deg": 0.0,
            "heading_deg": 0.0,
            "engine1_n1_percent": 0.0,
            "engine2_n1_percent": 0.0,
            "engine1_n2_percent": 0.0,
            "engine2_n2_percent": 0.0,
            "engine1_egt_c": 20.0,
            "engine2_egt_c": 20.0,
            "engine1_fuel_flow_kgh": 0.0,
            "engine2_fuel_flow_kgh": 0.0,
            "thrust_kn": 0.0,
            "fuel_remaining_kg": 50000.0,
            "throttle_pos_percent": 0.0, # Target thrust (0-100)
            "brake_pressure_bar": 0.0,
            "acceleration_mps2": 0.0,
            "lateral_acceleration_mps2": 0.0
        }
        
        self.active_faults = set()
        self.PHYSICS_TICK_S = 0.01 

    async def start_simulation(self) -> None:
        self.state["altitude_ft"] = 0.0
        self.state["airspeed_kts"] = 0.0
        self.state["mach_number"] = 0.0
        self.state["pitch_deg"] = 0.0
        self.state["roll_deg"] = 0.0
        self.state["engine1_n1_percent"] = 20.0 # Idle N1
        self.state["engine2_n1_percent"] = 20.0
        self.state["engine1_egt_c"] = 400.0 # Idle EGT
        self.state["engine2_egt_c"] = 400.0
        self.state["thrust_kn"] = 0.0
        self.state["fuel_remaining_kg"] = self.configured_fuel_kg
        self.state["throttle_pos_percent"] = 0.0
        self.state["brake_pressure_bar"] = 0.0
        
        if self._running and self._task and not self._task.done(): return
        
        self._running = True
        self._task = asyncio.create_task(self._physics_loop())

    async def stop_simulation(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try: await self._task
            except asyncio.CancelledError: pass
            self._task = None

    async def read_signals(self) -> Dict[str, Any]:
        return self.state.copy()

    async def write_signal(self, signal_name: str, value: Any) -> None:
        if signal_name in self.state:
            self.state[signal_name] = type(self.state[signal_name])(value)

    async def inject_fault(self, fault_id: str, parameters: Optional[Dict[str, Any]] = None) -> None:
        if fault_id in self.active_faults:
            self.active_faults.remove(fault_id)
        else:
            self.active_faults.add(fault_id)

    async def get_status(self) -> str:
        return "running" if self._running else "idle"

    async def _physics_loop(self):
        # Boeing 787-8 Parameters
        mass_kg = 119000.0 + self.state["fuel_remaining_kg"]
        wing_area_m2 = 325.0
        max_thrust_kn = 330.0 # Per engine (GEnx-1B)
        
        v_mps = self.state["airspeed_kts"] * 0.51444
        altitude_m = self.state["altitude_ft"] * 0.3048
        
        while self._running:
            throttle = self.state["throttle_pos_percent"] / 100.0
            brake = self.state["brake_pressure_bar"] / 100.0
            pitch_cmd = self.state["pitch_deg"] # Using this as direct yoke input for simplicity
            
            # Fault: Engine 1 Failure
            eng1_target_n1 = 20.0 + (throttle * 80.0) if "Engine1Failure" not in self.active_faults else 0.0
            eng2_target_n1 = 20.0 + (throttle * 80.0) if "Engine2Failure" not in self.active_faults else 0.0
            
            # Engine Spool Dynamics (Low pass filter)
            self.state["engine1_n1_percent"] += (eng1_target_n1 - self.state["engine1_n1_percent"]) * 0.2 * self.PHYSICS_TICK_S
            self.state["engine2_n1_percent"] += (eng2_target_n1 - self.state["engine2_n1_percent"]) * 0.2 * self.PHYSICS_TICK_S
            
            # EGT and Fuel Flow
            self.state["engine1_egt_c"] = 400 + (self.state["engine1_n1_percent"] - 20) * 6
            self.state["engine2_egt_c"] = 400 + (self.state["engine2_n1_percent"] - 20) * 6
            
            ff1 = max(0, (self.state["engine1_n1_percent"] - 20) * 50)
            ff2 = max(0, (self.state["engine2_n1_percent"] - 20) * 50)
            self.state["engine1_fuel_flow_kgh"] = ff1
            self.state["engine2_fuel_flow_kgh"] = ff2
            
            total_ff_kgs = (ff1 + ff2) / 3600.0
            self.state["fuel_remaining_kg"] -= total_ff_kgs * self.PHYSICS_TICK_S
            self.state["fuel_remaining_kg"] = max(0.0, self.state["fuel_remaining_kg"])
            mass_kg = 119000.0 + self.state["fuel_remaining_kg"]
            
            # Thrust calculation
            t1 = max(0, (self.state["engine1_n1_percent"] - 20) / 80.0) * max_thrust_kn * 1000.0
            t2 = max(0, (self.state["engine2_n1_percent"] - 20) / 80.0) * max_thrust_kn * 1000.0
            total_thrust = t1 + t2
            self.state["thrust_kn"] = total_thrust / 1000.0
            
            # Aerodynamics
            air_density = 1.225 * math.exp(-altitude_m / 10400.0)
            q = 0.5 * air_density * (v_mps ** 2)
            
            # Simplified lift and drag
            cl = 0.1 + (pitch_cmd * 0.1) # Lift coefficient
            cd = 0.02 + (cl ** 2) * 0.05 # Drag coefficient
            
            lift = q * wing_area_m2 * cl
            drag = q * wing_area_m2 * cd
            
            gravity = mass_kg * 9.81
            weight_force = gravity * math.cos(math.radians(pitch_cmd))
            
            # Ground physics
            if altitude_m <= 0.1:
                altitude_m = 0.0
                if lift >= weight_force:
                    # Liftoff
                    vertical_accel = (lift - weight_force) / mass_kg
                else:
                    vertical_accel = 0.0
                
                # Rolling resistance + wheel brakes
                rolling_res = (gravity - lift) * 0.02 if lift < gravity else 0
                wheel_brake_force = brake * mass_kg * 5.0
                net_long_force = total_thrust - drag - rolling_res - wheel_brake_force - (gravity * math.sin(math.radians(pitch_cmd)))
            else:
                # Flight physics
                vertical_accel = (lift * math.cos(math.radians(pitch_cmd)) + total_thrust * math.sin(math.radians(pitch_cmd)) - gravity) / mass_kg
                net_long_force = total_thrust * math.cos(math.radians(pitch_cmd)) - drag - (gravity * math.sin(math.radians(pitch_cmd)))
                
            long_accel = net_long_force / mass_kg
            self.state["acceleration_mps2"] = long_accel
            
            v_mps += long_accel * self.PHYSICS_TICK_S
            v_mps = max(0.0, v_mps)
            
            # Vertical speed and altitude
            vertical_speed = vertical_accel * self.PHYSICS_TICK_S
            altitude_m += vertical_speed * self.PHYSICS_TICK_S
            if altitude_m < 0: 
                altitude_m = 0
                vertical_speed = 0
                
            self.state["airspeed_kts"] = v_mps / 0.51444
            self.state["altitude_ft"] = altitude_m / 0.3048
            
            speed_of_sound = 340.0 - (altitude_m * 0.004) # Rough approximation
            self.state["mach_number"] = v_mps / speed_of_sound
            
            await asyncio.sleep(self.PHYSICS_TICK_S)

    async def configure_environment(self, vehicle: str, road: str, weather: str, initial_soc: float = 100.0, domain: int = 1) -> None:
        self.active_vehicle = vehicle
        self.active_weather = weather
        self.configured_fuel_kg = float(initial_soc) * 1000 # Reuse initial_soc parameter for fuel
        self.state["fuel_remaining_kg"] = self.configured_fuel_kg
