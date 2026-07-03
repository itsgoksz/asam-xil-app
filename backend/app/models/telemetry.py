from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class TelemetryRecord(Base):
    __tablename__ = "telemetry_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    vehicle_speed_kmh = Column(Float)
    rpm = Column(Float)
    battery_soc = Column(Float)
    battery_voltage = Column(Float)
    motor_temp_c = Column(Float)
    brake_pressure_bar = Column(Float)
    steering_angle_deg = Column(Float)
    throttle_pos_percent = Column(Float)
    gear = Column(Integer)
    motor_current_a = Column(Float)
    power_consumption_kw = Column(Float)
    wheel_slip_percent = Column(Float, default=0.0)
    abs_active = Column(Integer, default=0)
    esc_active = Column(Integer, default=0)
    
    coolant_temp_c = Column(Float, default=25.0)
    coolant_pump_speed_percent = Column(Float, default=0.0)
    radiator_fan_speed_percent = Column(Float, default=0.0)
    acceleration_mps2 = Column(Float, default=0.0)
    lateral_acceleration_mps2 = Column(Float, default=0.0)
