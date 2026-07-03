import asyncio
import time
import math
from typing import Dict, Any, Optional
from .ixil_adapter import IXILAdapter

VEHICLES = {
    "Generic EV": { "mass_kg": 1800, "cd": 0.28, "frontal_area_m2": 2.4, "tire_radius_m": 0.35, "gear_ratio": 9.0, "max_rpm": 12000, "max_power_kw": 150 },
    "Tata Nexon EV": { "mass_kg": 1400, "cd": 0.33, "frontal_area_m2": 2.5, "tire_radius_m": 0.33, "gear_ratio": 8.5, "max_rpm": 10000, "max_power_kw": 95 },
    "Tata Curvv EV": { "mass_kg": 1600, "cd": 0.29, "frontal_area_m2": 2.6, "tire_radius_m": 0.36, "gear_ratio": 9.2, "max_rpm": 11000, "max_power_kw": 125 },
    "Tata Harrier EV": { "mass_kg": 2100, "cd": 0.35, "frontal_area_m2": 2.9, "tire_radius_m": 0.38, "gear_ratio": 10.0, "max_rpm": 14000, "max_power_kw": 200 }
}

ROADS = {
    "Dry Asphalt": {"friction_mu": 0.9, "rolling_res": 0.015},
    "Wet Road": {"friction_mu": 0.6, "rolling_res": 0.018},
    "Gravel": {"friction_mu": 0.5, "rolling_res": 0.030},
    "Snow": {"friction_mu": 0.3, "rolling_res": 0.025},
    "Ice": {"friction_mu": 0.15, "rolling_res": 0.020}
}

WEATHER = {
    "Clear (25°C)": {"air_density": 1.184, "temp_c": 25.0, "battery_eff": 1.0},
    "Hot (40°C)": {"air_density": 1.127, "temp_c": 40.0, "battery_eff": 0.95},
    "Cold (-10°C)": {"air_density": 1.341, "temp_c": -10.0, "battery_eff": 0.70},
    "Rain (20°C)": {"air_density": 1.204, "temp_c": 20.0, "battery_eff": 0.98},
}

class MockXILAdapter(IXILAdapter):
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        
        self.active_vehicle = "Generic EV"
        self.active_road = "Dry Asphalt"
        self.active_weather = "Clear (25°C)"
        
        self.state = {
            "vehicle_speed_kmh": 0.0,
            "rpm": 0.0,
            "battery_soc": 100.0,
            "battery_voltage": 400.0,
            "motor_temp_c": 25.0,
            "brake_pressure_bar": 0.0,
            "steering_angle_deg": 0.0,
            "throttle_pos_percent": 0.0,
            "gear": 1,
            "motor_current_a": 0.0,
            "power_consumption_kw": 0.0,
            "wheel_slip_percent": 0.0,
            "abs_active": 0,
            "esc_active": 0,
            "coolant_temp_c": 25.0,
            "coolant_pump_speed_percent": 0.0,
            "radiator_fan_speed_percent": 0.0,
            "acceleration_mps2": 0.0,
            "lateral_acceleration_mps2": 0.0
        }
        
        self.active_faults = set()
        self.PHYSICS_TICK_S = 0.01 

    async def start_simulation(self) -> None:
        # Reset the physics state every time start is requested
        self.state["vehicle_speed_kmh"] = 0.0
        self.state["rpm"] = 0.0
        self.state["battery_soc"] = getattr(self, "configured_initial_soc", 100.0)
        self.state["motor_temp_c"] = WEATHER[self.active_weather]["temp_c"]
        self.state["coolant_temp_c"] = WEATHER[self.active_weather]["temp_c"]
        self.state["coolant_pump_speed_percent"] = 0.0
        self.state["radiator_fan_speed_percent"] = 0.0
        self.state["acceleration_mps2"] = 0.0
        self.state["lateral_acceleration_mps2"] = 0.0
        
        # If it's already running in the background and the task is healthy, we don't need a new task
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

    async def load_scenario(self, scenario_id: str) -> None:
        pass
            
    async def inject_fault(self, fault_id: str, parameters: Optional[Dict[str, Any]] = None) -> None:
        if fault_id in self.active_faults:
            self.active_faults.remove(fault_id)
        else:
            self.active_faults.add(fault_id)

    async def configure_environment(self, vehicle: str, road: str, weather: str, initial_soc: float = 100.0) -> None:
        if vehicle in VEHICLES: self.active_vehicle = vehicle
        if road in ROADS: self.active_road = road
        if weather in WEATHER: self.active_weather = weather
        self.configured_initial_soc = float(initial_soc)
        self.state["battery_soc"] = self.configured_initial_soc

    async def get_status(self) -> str:
        return "running" if self._running else "idle"

    async def _physics_loop(self):
        while self._running:
            v_model = VEHICLES[self.active_vehicle]
            r_model = ROADS[self.active_road]
            w_model = WEATHER[self.active_weather]
            
            throttle = self.state["throttle_pos_percent"] / 100.0
            brake = self.state["brake_pressure_bar"] / 150.0  # Normalized 0-1 (max 150 bar)
            
            mass = v_model["mass_kg"]
            v_mps = self.state["vehicle_speed_kmh"] / 3.6
            rpm = self.state["rpm"]
            
            # 1. Traction Force (from Motor) - Realistic EV Torque Curve
            base_rpm = 4000.0
            if rpm < base_rpm:
                # Constant torque region
                current_max_torque = (v_model["max_power_kw"] * 1000) / (base_rpm * 0.1047)
            else:
                # Constant power region
                current_max_torque = (v_model["max_power_kw"] * 1000) / (rpm * 0.1047 + 1)
            
            if throttle > 0:
                motor_force = throttle * (current_max_torque * v_model["gear_ratio"] / v_model["tire_radius_m"])
            else:
                # Lift-off regenerative braking (EV "engine braking" / one-pedal drive)
                # Reduced to 0.08G to simulate a "Low Regen" coasting profile
                regen_g = 0.08 if v_mps > 2.0 else (0.08 * (v_mps / 2.0))
                motor_force = -(mass * 9.81 * regen_g)
            
            # 2. Road Friction (Slip limit)
            max_grip_force = mass * 9.81 * r_model["friction_mu"]
            
            # Tire Slip & Traction Control
            traction_force = motor_force
            self.state["esc_active"] = 0
            if abs(traction_force) > max_grip_force:
                traction_force = math.copysign(max_grip_force, traction_force)
                self.state["wheel_slip_percent"] = math.copysign(100.0, traction_force)
                self.state["esc_active"] = 1
            else:
                self.state["wheel_slip_percent"] = (traction_force / (max_grip_force + 0.1)) * 10
            
            # 3. Aerodynamic Drag & Rolling Resistance
            drag_force = 0.5 * w_model["air_density"] * v_model["cd"] * v_model["frontal_area_m2"] * (v_mps ** 2)
            rolling_force = mass * 9.81 * r_model["rolling_res"]
            
            # 4. Braking Force - Realistic 1.0G Max Deceleration for street tires
            brake_force = brake * (mass * 9.81 * 1.0)
            self.state["abs_active"] = 0
            if brake_force > max_grip_force:
                brake_force = max_grip_force
                self.state["abs_active"] = 1 # ABS limits brake to max grip
                self.state["wheel_slip_percent"] = -100.0
            
            if "BrakeFailure" in self.active_faults:
                brake_force = 0.0
                self.state["brake_pressure_bar"] = 0.0
                
            # 5. Net Force and Acceleration
            net_force = traction_force - drag_force - rolling_force - brake_force
            
            if v_mps <= 0.1 and net_force < 0:
                net_force = 0
                v_mps = 0
            
            acceleration = net_force / mass
            self.state["acceleration_mps2"] = acceleration
            v_mps += acceleration * self.PHYSICS_TICK_S
            
            if v_mps < 0: v_mps = 0
            
            self.state["vehicle_speed_kmh"] = v_mps * 3.6
            
            # Cornering Physics (Lateral Acceleration)
            steer_deg = self.state["steering_angle_deg"]
            steer_rad = math.radians(steer_deg)
            wheelbase_m = 2.6
            if abs(steer_rad) > 0.01 and v_mps > 0.1:
                turn_radius = wheelbase_m / math.tan(abs(steer_rad))
                lateral_accel = (v_mps ** 2) / turn_radius
                self.state["lateral_acceleration_mps2"] = lateral_accel * (1 if steer_rad > 0 else -1)
            else:
                self.state["lateral_acceleration_mps2"] = 0.0
            
            # RPM derived from speed and slip
            wheel_rpm = (v_mps / (2 * 3.14159 * v_model["tire_radius_m"])) * 60
            
            # Incorporate slip (wheel spins faster or slower than actual ground speed)
            slip = self.state["wheel_slip_percent"]
            if slip > 0:
                wheel_rpm *= (1.0 + (slip / 100.0) * 2.0) # Up to 3x faster in heavy burnout
            elif slip < 0:
                wheel_rpm *= max(0.0, 1.0 - (abs(slip) / 100.0)) # Locks up to 0 in full skid
                
            self.state["rpm"] = wheel_rpm * v_model["gear_ratio"]
            
            # Power, Temp, and Realistic Battery Drain (75 kWh pack)
            power_kw = (traction_force * v_mps) / 1000.0
            
            # If braking, add blended regen braking on top of lift-off regen
            if brake > 0:
                regen_power_kw = -((brake_force * 0.5 * v_mps) / 1000.0) # Assume 50% brake force goes to regen
                power_kw += regen_power_kw
                
            # Cap regen power to motor limits (approx 80% of max output power)
            max_regen_kw = -v_model["max_power_kw"] * 0.8
            if power_kw < max_regen_kw:
                power_kw = max_regen_kw
                
            self.state["power_consumption_kw"] = power_kw
            self.state["motor_current_a"] = (power_kw * 1000) / self.state["battery_voltage"]
            
            battery_capacity_kwh = 75.0
            energy_kwh_per_tick = (power_kw * (self.PHYSICS_TICK_S / 3600.0))
            time_scale = 1.0 # Realistic real-time battery drain
            
            if power_kw > 0:
                # Discharging: takes MORE energy from battery than delivered (due to inefficiency)
                self.state["battery_soc"] -= (energy_kwh_per_tick / battery_capacity_kwh) * 100.0 * time_scale / w_model["battery_eff"]
            else:
                # Charging: puts LESS energy into battery than generated (due to inefficiency)
                self.state["battery_soc"] -= (energy_kwh_per_tick / battery_capacity_kwh) * 100.0 * time_scale * w_model["battery_eff"]
                
            self.state["battery_soc"] = max(0.0, min(100.0, self.state["battery_soc"]))
            
            # Thermodynamic Cooling Loop
            motor_heat_kw = abs(power_kw) * 0.1 # 10% inefficiency
            battery_heat_kw = abs(power_kw) * 0.05 # 5% inefficiency
            
            ambient_c = w_model["temp_c"]
            total_heat_kw = motor_heat_kw + battery_heat_kw
            
            # Heat transfers to coolant
            self.state["coolant_temp_c"] += (total_heat_kw * 0.1 * self.PHYSICS_TICK_S)
            
            # ECU Thermal Management Controller (Driven by hottest component)
            max_sys_temp = max(self.state["coolant_temp_c"], self.state["motor_temp_c"])
            
            # Pump controller
            if max_sys_temp > 35.0:
                self.state["coolant_pump_speed_percent"] = min(100.0, (max_sys_temp - 35.0) * 10.0)
            else:
                self.state["coolant_pump_speed_percent"] = 0.0
                
            # Radiator Fan controller
            if max_sys_temp > 45.0:
                self.state["radiator_fan_speed_percent"] = min(100.0, (max_sys_temp - 45.0) * 10.0)
            else:
                self.state["radiator_fan_speed_percent"] = 0.0
                
            # Active and passive cooling
            pump_flow = self.state["coolant_pump_speed_percent"] / 100.0
            fan_flow = self.state["radiator_fan_speed_percent"] / 100.0
            cooling_power_kw = (pump_flow * 5.0) + (fan_flow * pump_flow * 20.0)
            ambient_cooling = (self.state["coolant_temp_c"] - ambient_c) * 0.1
            
            # Increase thermal mass: coolant takes longer to shed heat
            self.state["coolant_temp_c"] -= ((cooling_power_kw + ambient_cooling) * 0.1 * self.PHYSICS_TICK_S)
            self.state["coolant_temp_c"] = max(ambient_c, self.state["coolant_temp_c"])
            
            # Increase thermal mass of the motor block
            self.state["motor_temp_c"] += (motor_heat_kw * 0.05 * self.PHYSICS_TICK_S)
            self.state["motor_temp_c"] -= (self.state["motor_temp_c"] - self.state["coolant_temp_c"]) * max(0.01, pump_flow) * 0.02 * self.PHYSICS_TICK_S
            self.state["motor_temp_c"] = max(ambient_c, self.state["motor_temp_c"])
            
            if "SensorTimeout" in self.active_faults:
                pass
                
            await asyncio.sleep(self.PHYSICS_TICK_S)
