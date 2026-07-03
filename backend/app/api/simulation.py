import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from app.services.simulation_service import simulation_service

router = APIRouter()

class SignalWriteRequest(BaseModel):
    signal_name: str
    value: Any

@router.post("/start")
async def start_simulation():
    await simulation_service.adapter.start_simulation()
    return {"status": "started"}

@router.post("/stop")
async def stop_simulation():
    await simulation_service.adapter.stop_simulation()
    return {"status": "stopped"}

@router.get("/status")
async def get_status():
    status = await simulation_service.adapter.get_status()
    return {"status": status}

@router.post("/write")
async def write_signal(req: SignalWriteRequest):
    await simulation_service.adapter.write_signal(req.signal_name, req.value)
    return {"status": "success", "signal": req.signal_name, "value": req.value}

class ScenarioRequest(BaseModel):
    scenario_id: str

@router.post("/scenario")
async def load_scenario(req: ScenarioRequest):
    if hasattr(simulation_service.adapter, 'load_scenario'):
        await simulation_service.adapter.load_scenario(req.scenario_id)
    return {"status": "success", "scenario": req.scenario_id}

class FaultRequest(BaseModel):
    fault_id: str

@router.post("/fault")
async def inject_fault(req: FaultRequest):
    await simulation_service.adapter.inject_fault(req.fault_id)
    return {"status": "success", "fault": req.fault_id}

class EnvironmentConfig(BaseModel):
    vehicle: str
    road: str
    weather: str
    initial_soc: float = 100.0
    domain: int = 0

@router.post("/configure")
async def configure_environment(req: EnvironmentConfig):
    await simulation_service.switch_domain(req.domain)
    if hasattr(simulation_service.adapter, 'configure_environment'):
        if req.domain == 1:
            # For aerospace, we use the initial_soc param as initial_fuel_kg
            await simulation_service.adapter.configure_environment(req.vehicle, req.road, req.weather, req.initial_soc, req.domain)
        else:
            await simulation_service.adapter.configure_environment(req.vehicle, req.road, req.weather, req.initial_soc)
    return {"status": "success", "config": req.dict()}

class TestRequest(BaseModel):
    test_id: str

@router.post("/run-test")
async def run_robot_test(req: TestRequest):
    adapter = simulation_service.adapter
    await adapter.start_simulation()
    
    test_id = req.test_id
    passed = False
    details = ""
    
    if test_id == "highway":
        await adapter.write_signal("throttle_pos_percent", 65.0)
        await asyncio.sleep(8) # Realistic physics takes longer to reach 80kmh
        speed = adapter.state.get("vehicle_speed_kmh", 0)
        passed = speed > 80
        details = f"Target throttle 65%. Reached speed: {speed:.1f} km/h. Expected: > 80 km/h."
        
    elif test_id == "city":
        await adapter.write_signal("throttle_pos_percent", 25.0)
        await asyncio.sleep(6) # Realistic physics
        speed = adapter.state.get("vehicle_speed_kmh", 0)
        passed = 20 <= speed <= 50
        details = f"Target throttle 25%. Reached speed: {speed:.1f} km/h. Expected: 20-50 km/h."
        
    elif test_id == "emergency_brake":
        # First accelerate
        await adapter.write_signal("throttle_pos_percent", 80.0)
        await asyncio.sleep(5)
        # Then brake
        await adapter.write_signal("throttle_pos_percent", 0.0)
        await adapter.write_signal("brake_pressure_bar", 100.0)
        await asyncio.sleep(3)
        speed = adapter.state.get("vehicle_speed_kmh", 0)
        passed = speed < 2.0  # Allow tiny margin
        details = f"Full brake applied. Final speed: {speed:.1f} km/h. Expected: ~0 km/h."
        await adapter.write_signal("brake_pressure_bar", 0.0)
        
    else:
        # Default fallback
        await adapter.write_signal("throttle_pos_percent", 50.0)
        await asyncio.sleep(4)
        speed = adapter.state.get("vehicle_speed_kmh", 0)
        passed = speed > 10
        details = f"Target throttle 50%. Reached speed: {speed:.1f} km/h. Expected: > 10 km/h."

    # Clean up
    await adapter.write_signal("throttle_pos_percent", 0.0)
    await adapter.stop_simulation()
    
    test_names = {
        "highway": "Highway Acceleration Test",
        "city": "City Speed Limit Test",
        "emergency_brake": "Emergency Brake Effectiveness Test",
        "default": "Basic Acceleration Test"
    }
    
    return {
        "status": "success",
        "report": {
            "test_name": test_names.get(test_id, test_names["default"]),
            "timestamp": asyncio.get_event_loop().time(),
            "passed": passed,
            "details": details
        }
    }

