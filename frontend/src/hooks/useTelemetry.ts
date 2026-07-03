import { useState, useEffect, useRef } from 'react';

export interface TelemetryData {
  vehicle_speed_kmh: number;
  rpm: number;
  battery_soc: number;
  battery_voltage: number;
  motor_temp_c: number;
  brake_pressure_bar: number;
  steering_angle_deg: number;
  throttle_pos_percent: number;
  gear: number;
  motor_current_a: number;
  power_consumption_kw: number;
  coolant_temp_c: number;
  coolant_pump_speed_percent: number;
  radiator_fan_speed_percent: number;
  acceleration_mps2: number;
  lateral_acceleration_mps2: number;
  domain: number;
  altitude_ft: number;
  airspeed_kts: number;
  mach_number: number;
  pitch_deg: number;
  roll_deg: number;
  heading_deg: number;
  engine1_n1_percent: number;
  engine2_n1_percent: number;
  engine1_egt_c: number;
  engine2_egt_c: number;
  thrust_kn: number;
  fuel_remaining_kg: number;
}

export function useTelemetry(url: string = 'ws://localhost:8000/ws/telemetry') {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: any;

    const connect = () => {
      if (!isMounted) return;
      setStatus('connecting');
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        if (isMounted) setStatus('connected');
      };

      ws.current.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'telemetry') {
            setData(parsed.data);
          }
        } catch (e) {
          console.error("Failed to parse telemetry:", e);
        }
      };

      ws.current.onclose = () => {
        if (isMounted) {
          setStatus('disconnected');
          // Auto-reconnect after 2 seconds
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
      
      ws.current.onerror = (error) => {
        if (!isMounted) return;
        console.error("WebSocket Error:", error);
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  return { data, status };
}
