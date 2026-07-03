import { useState, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box as DreiBox, Cylinder as DreiCylinder, Edges, Text, Environment, ContactShadows, Torus, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const CoilSpring = ({ position, isFront, isRight, telemetry }: any) => {
  const springRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (springRef.current && telemetry) {
      const accel = telemetry.acceleration_mps2 || 0;
      const lateralAccel = telemetry.lateral_acceleration_mps2 || 0;
      
      const pitchEffect = isFront ? (accel * 0.02) : -(accel * 0.02);
      const rollEffect = isRight ? (lateralAccel * 0.02) : -(lateralAccel * 0.02);
      
      const targetScaleY = 1.0 + THREE.MathUtils.clamp(pitchEffect + rollEffect, -0.4, 0.4);
      springRef.current.scale.y = THREE.MathUtils.lerp(springRef.current.scale.y, targetScaleY, 0.15);
    }
  });

  return (
    <group ref={springRef} position={position}>
      {/* Shock Absorber Strut */}
      <DreiCylinder args={[0.04, 0.04, 0.8, 16]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#d0d0d0" metalness={0.9} roughness={0.2} />
      </DreiCylinder>
      {/* High-Performance Red Spring Coils */}
      {[...Array(8)].map((_, i) => (
        <group key={i} position={[0, 0.15 + (i * 0.08), 0]} rotation={[Math.PI/2, 0.1, 0]}>
           <Torus args={[0.09, 0.025, 8, 32]}>
             <meshStandardMaterial color="#FF3B30" metalness={0.5} roughness={0.3} />
           </Torus>
        </group>
      ))}
      {/* Top Mount */}
      <DreiCylinder args={[0.12, 0.12, 0.05, 16]} position={[0, 0.8, 0]}>
        <meshStandardMaterial color="#222" metalness={0.8} />
      </DreiCylinder>
    </group>
  );
};

const BrakeRotor = ({ brakePressure, isRight }: any) => {
  // Normalize brake pressure to a 0-1 heat multiplier (max glow at 80+ bar)
  // This ensures light braking doesn't cause immediate glowing, requiring hard braking
  const heat = Math.min(brakePressure / 80, 1);

  return (
    <group position={[isRight ? -0.12 : 0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      {/* Outer Bright Silver Friction Ring */}
      <DreiCylinder args={[0.42, 0.42, 0.04, 64]}>
         <meshStandardMaterial 
            color="#D0D0D0" 
            emissive="#FF1100" 
            emissiveIntensity={heat * 2.0} 
            metalness={0.9} 
            roughness={0.2} 
         />
      </DreiCylinder>
      
      {/* Drilled Holes for realism */}
      {[...Array(24)].map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        // Alternate between an outer ring and inner ring of holes
        const radius = i % 2 === 0 ? 0.36 : 0.30; 
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <DreiCylinder key={i} args={[0.012, 0.012, 0.045, 8]} position={[x, 0, z]}>
            <meshBasicMaterial color="#111" />
          </DreiCylinder>
        );
      })}

      {/* Inner Dark Mounting Hat */}
      <DreiCylinder args={[0.22, 0.22, 0.05, 32]} position={[0, isRight ? 0.005 : -0.005, 0]}>
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.6} />
      </DreiCylinder>
    </group>
  );
};

const Wheel = ({ position, rpm, brakePressure, slip, onSelect, telemetry }: any) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      const radPerSec = (rpm * Math.PI) / 30;
      meshRef.current.rotation.x -= radPerSec * delta;
    }
  });

  const isRight = position[0] > 0;
  
  return (
    <group position={position}>
      {/* Suspension Coil (Offset inwards to connect axle to chassis) */}
      <CoilSpring position={[isRight ? -0.4 : 0.4, 0.1, 0]} isFront={position[2] < 0} isRight={isRight} telemetry={telemetry} />

      {/* Brake Caliper (Static, painted Performance Yellow to contrast with the red glow) */}
      <DreiBox 
        args={[0.2, 0.35, 0.15]} 
        position={[isRight ? -0.12 : 0.12, 0.3, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect('Brakes'); }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <meshStandardMaterial 
          color="#FFD700" 
          metalness={0.4} 
          roughness={0.3} 
        />
      </DreiBox>
      
      {/* Rotating Assembly (Tire, Rim, and Brake Rotor) */}
      <group ref={meshRef}>
        
        {/* Photorealistic Drilled Brake Rotor */}
        <BrakeRotor brakePressure={brakePressure} isRight={isRight} />

        {/* Tire (Using Torus to leave the center open!) */}
        <Torus args={[0.55, 0.15, 32, 64]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#111" roughness={0.9} metalness={0.1} />
        </Torus>
        
        {/* Rim Barrel (Inner cylinder for the wheel structure) */}
        <DreiCylinder args={[0.53, 0.53, 0.32, 64, 1, true]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
        </DreiCylinder>
        
        {/* Hub (Small center cap) */}
        <DreiCylinder args={[0.1, 0.1, 0.34, 32]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
        </DreiCylinder>
        
        {/* 5 Thin Spokes on the outside face */}
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation={[Math.PI/2, (i * Math.PI * 2) / 5, 0]}>
             <DreiBox args={[0.04, 1.06, 0.04]} position={[isRight ? 0.15 : -0.15, 0, 0]}>
                <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.2} />
             </DreiBox>
          </group>
        ))}
      </group>
    </group>
  );
};

const BatteryCell = ({ x, z, index, powerKw, selectedComponent }: any) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      if (powerKw > 5) {
        const speed = 10 + (powerKw * 0.1);
        const wave = Math.sin(clock.elapsedTime * speed + (index * 0.8));
        const normalizedWave = (wave + 1) / 2;
        matRef.current.emissiveIntensity = 0.1 + (normalizedWave * 1.5 * Math.min(powerKw / 100, 1));
      } else {
        matRef.current.emissiveIntensity = selectedComponent === 'Battery' ? 0.8 : 0;
      }
    }
  });

  return (
    <RoundedBox args={[0.8, 0.08, 0.7]} radius={0.01} position={[x, 0, z]}>
       <meshStandardMaterial 
          ref={matRef}
          color="#444" 
          metalness={0.7} 
          roughness={0.3} 
          emissive="#00E5FF" 
       />
       <Edges color="#555" />
    </RoundedBox>
  );
};

const HVCable = ({ args, position, rotation, powerKw }: any) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      if (powerKw > 5) {
        const speed = 15 + (powerKw * 0.15);
        const wave = Math.sin(clock.elapsedTime * speed);
        const normalizedWave = (wave + 1) / 2; 
        matRef.current.emissiveIntensity = 0.5 + (normalizedWave * 5.0 * Math.min(powerKw / 100, 1));
      } else {
        matRef.current.emissiveIntensity = 0;
      }
    }
  });

  return (
    <DreiCylinder args={args} rotation={rotation} position={position}>
      <meshStandardMaterial ref={matRef} color="#FF9F0A" emissive="#FF9F0A" metalness={0.5} roughness={0.6} />
    </DreiCylinder>
  );
};

const RealisticMotor = ({ position, label, isSelected, rpm, powerKw, motorTemp, onSelect }: any) => {
  const isOverheating = motorTemp > 80;
  const isActive = rpm > 0;
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      if (powerKw > 10) {
        // Vibrate physically based on torque load
        const vibration = Math.min((powerKw / 150), 1) * 0.008; 
        groupRef.current.position.x = position[0] + (Math.random() - 0.5) * vibration;
        groupRef.current.position.y = position[1] + (Math.random() - 0.5) * vibration;
        groupRef.current.position.z = position[2] + (Math.random() - 0.5) * vibration;
      } else {
        groupRef.current.position.set(position[0], position[1], position[2]);
      }
    }
    if (matRef.current && !isOverheating) {
      if (powerKw > 5) {
        const speed = 20 + (powerKw * 0.1);
        const wave = Math.sin(clock.elapsedTime * speed);
        matRef.current.emissiveIntensity = 0.5 + ((wave + 1)/2 * 1.5 * Math.min(powerKw/100, 1));
      } else {
        matRef.current.emissiveIntensity = isSelected ? 1 : (isActive ? 0.2 : 0);
      }
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelect('Motor'); }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      {/* Main Aluminum Casing */}
      <DreiCylinder args={[0.3, 0.3, 1.1, 64]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial 
           ref={matRef}
           color="#e0e0e0" 
           metalness={0.9} 
           roughness={0.2} 
           emissive={isOverheating ? "#FF3B30" : "#00E5FF"} 
           emissiveIntensity={isSelected ? 1 : (isOverheating ? 0.8 : (isActive ? 0.2 : 0))}
        /> 
      </DreiCylinder>
      
      {/* Casing Ribs */}
      {[...Array(11)].map((_, i) => (
        <DreiCylinder key={i} args={[0.32, 0.32, 0.02, 64]} position={[((i - 5) * 0.08), 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.3} />
        </DreiCylinder>
      ))}

      {/* Orange HV Connector Plate */}
      <DreiBox args={[0.2, 0.1, 0.2]} position={[0, 0.32, 0]}>
        <meshStandardMaterial color="#FF9F0A" metalness={0.6} roughness={0.4} />
      </DreiBox>

      {/* End Caps */}
      <DreiCylinder args={[0.25, 0.25, 0.1, 32]} position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.4} />
      </DreiCylinder>
      <DreiCylinder args={[0.25, 0.25, 0.1, 32]} position={[0.6, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.4} />
      </DreiCylinder>
      
      <Text position={[0, 0.5, 0]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.2} color="#FFF" letterSpacing={0.1}>{label}</Text>
    </group>
  );
};

const CoolingSystem = ({ motorTemp, coolantTemp, pumpSpeed, fanSpeed, powerKw }: any) => {
  const fanRef1 = useRef<THREE.Mesh>(null);
  const fanRef2 = useRef<THREE.Mesh>(null);
  const pipeMatRef1 = useRef<THREE.MeshStandardMaterial>(null);
  const pipeMatRef2 = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const fanRps = (fanSpeed / 100) * 30; 
    if (fanRef1.current) fanRef1.current.rotation.y += fanRps * 0.1;
    if (fanRef2.current) fanRef2.current.rotation.y += fanRps * 0.1;

    if (pipeMatRef1.current && pipeMatRef2.current) {
      if (pumpSpeed > 1) {
        const speed = 5 + (pumpSpeed * 0.2);
        const wave = Math.sin(clock.elapsedTime * speed);
        const normalizedWave = (wave + 1) / 2;
        const glow = 0.5 + (normalizedWave * 2.0 * (pumpSpeed / 100));
        pipeMatRef1.current.emissiveIntensity = glow;
        pipeMatRef2.current.emissiveIntensity = glow;
      } else {
        pipeMatRef1.current.emissiveIntensity = 0.3;
        pipeMatRef2.current.emissiveIntensity = 0.3;
      }
    }
  });

  return (
    <group position={[0, 0.2, -3.2]}>
      {/* Radiator Core */}
      <DreiBox args={[1.6, 0.6, 0.1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.6} />
        <Edges color="#555" />
      </DreiBox>
      
      {/* Radiator Fans */}
      <group position={[-0.4, 0, 0.1]}>
        <DreiCylinder args={[0.25, 0.25, 0.05, 16]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color="#222" />
        </DreiCylinder>
        <DreiBox ref={fanRef1} args={[0.48, 0.02, 0.04]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color="#666" />
        </DreiBox>
      </group>
      
      <group position={[0.4, 0, 0.1]}>
        <DreiCylinder args={[0.25, 0.25, 0.05, 16]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color="#222" />
        </DreiCylinder>
        <DreiBox ref={fanRef2} args={[0.48, 0.02, 0.04]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color="#666" />
        </DreiBox>
      </group>

      {/* Coolant Pipes */}
      <DreiCylinder args={[0.04, 0.04, 3.5]} rotation={[Math.PI/2, 0, 0]} position={[-0.7, -0.1, 1.5]}>
        <meshStandardMaterial ref={pipeMatRef1} color="#00E5FF" emissive="#00E5FF" metalness={0.5} roughness={0.3} />
      </DreiCylinder>
      <DreiCylinder args={[0.04, 0.04, 3.5]} rotation={[Math.PI/2, 0, 0]} position={[0.7, -0.1, 1.5]}>
        <meshStandardMaterial ref={pipeMatRef2} color="#00E5FF" emissive="#00E5FF" metalness={0.5} roughness={0.3} />
      </DreiCylinder>
    </group>
  );
};

const VehicleModel = ({ telemetry, selectedComponent, onSelect }: any) => {
  const rpm = telemetry?.rpm || 0;
  const motorTemp = telemetry?.motor_temp_c || 25;
  const powerKw = telemetry?.power_consumption_kw || 0;
  const brakePressure = telemetry?.brake_pressure_bar || 0;
  const slip = telemetry?.wheel_slip_percent || 0;
  
  const accel = telemetry?.acceleration_mps2 || 0;
  const lateralAccel = telemetry?.lateral_acceleration_mps2 || 0;
  const coolantTemp = telemetry?.coolant_temp_c || 25;
  const pumpSpeed = telemetry?.coolant_pump_speed_percent || 0;
  const fanSpeed = telemetry?.radiator_fan_speed_percent || 0;

  const sprungMassRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (sprungMassRef.current) {
      const targetPitch = THREE.MathUtils.clamp(accel * 0.005, -0.06, 0.06);
      const targetRoll = THREE.MathUtils.clamp(lateralAccel * 0.005, -0.06, 0.06);
      
      sprungMassRef.current.rotation.x = THREE.MathUtils.lerp(sprungMassRef.current.rotation.x, targetPitch, 0.1);
      sprungMassRef.current.rotation.z = THREE.MathUtils.lerp(sprungMassRef.current.rotation.z, targetRoll, 0.1);
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      
      {/* SPRUNG MASS (Chassis, Battery, Motors, Cooling) */}
      <group ref={sprungMassRef}>
      {/* Structural Frame Rails */}
      <DreiBox args={[0.1, 0.1, 6.4]} position={[-0.8, 0, 0]}>
        <meshStandardMaterial color="#222" metalness={0.8} />
      </DreiBox>
      <DreiBox args={[0.1, 0.1, 6.4]} position={[0.8, 0, 0]}>
        <meshStandardMaterial color="#222" metalness={0.8} />
      </DreiBox>
      <DreiBox args={[1.7, 0.1, 0.1]} position={[0, 0, -2.6]}>
        <meshStandardMaterial color="#222" metalness={0.8} />
      </DreiBox>
      <DreiBox args={[1.7, 0.1, 0.1]} position={[0, 0, 2.6]}>
        <meshStandardMaterial color="#222" metalness={0.8} />
      </DreiBox>

      {/* Realistic Battery Tray */}
      <group position={[0, 0.1, 0]} onClick={(e) => { e.stopPropagation(); onSelect('Battery'); }}>
        {/* Main Tray Base */}
        <RoundedBox args={[2.2, 0.15, 3.8]} radius={0.02} smoothness={4} position={[0, 0, 0]} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.4} />
          <Edges color="#333" />
        </RoundedBox>
        
        {/* Inner Battery Modules */}
        <group position={[0, 0.08, 0]}>
          {[-0.5, 0.5].map((x, xIndex) => 
            [-1.2, -0.4, 0.4, 1.2].map((z, zIndex) => {
              const cellIndex = xIndex * 4 + zIndex;
              return (
                <BatteryCell key={cellIndex} x={x} z={z} index={cellIndex} powerKw={powerKw} selectedComponent={selectedComponent} />
              );
            })
          )}
        </group>
        <Text position={[0, 0.2, 0]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.2} color="#888" letterSpacing={0.2}>HIGH VOLTAGE</Text>
      </group>

      {/* High Voltage (HV) Orange Cables */}
      <group position={[0, 0.05, 0]}>
        <HVCable args={[0.03, 0.03, 1.8]} rotation={[Math.PI/2, 0, 0]} position={[-0.2, 0.05, -2.1]} powerKw={powerKw} />
        <HVCable args={[0.03, 0.03, 1.8]} rotation={[Math.PI/2, 0, 0]} position={[0.2, 0.05, -2.1]} powerKw={powerKw} />
        <HVCable args={[0.03, 0.03, 1.8]} rotation={[Math.PI/2, 0, 0]} position={[-0.2, 0.05, 2.1]} powerKw={powerKw} />
        <HVCable args={[0.03, 0.03, 1.8]} rotation={[Math.PI/2, 0, 0]} position={[0.2, 0.05, 2.1]} powerKw={powerKw} />
      </group>

      {/* Motors */}
      <RealisticMotor position={[0, 0.1, -2.6]} label="FRONT MOTOR" isSelected={selectedComponent === 'Motor'} rpm={rpm} powerKw={powerKw} motorTemp={motorTemp} onSelect={onSelect} />
      <RealisticMotor position={[0, 0.1, 2.6]} label="REAR MOTOR" isSelected={selectedComponent === 'Motor'} rpm={rpm} powerKw={powerKw} motorTemp={motorTemp} onSelect={onSelect} />

      <CoolingSystem motorTemp={motorTemp} coolantTemp={coolantTemp} pumpSpeed={pumpSpeed} fanSpeed={fanSpeed} powerKw={powerKw} />

      {/* Axles */}
      <DreiCylinder args={[0.08, 0.08, 3.8]} rotation={[0, 0, Math.PI/2]} position={[0, 0.1, -2.6]}>
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.4} />
      </DreiCylinder>
      <DreiCylinder args={[0.08, 0.08, 3.8]} rotation={[0, 0, Math.PI/2]} position={[0, 0.1, 2.6]}>
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.4} />
      </DreiCylinder>
      </group>

      {/* Wheels (Unsprung Mass) */}
      <Wheel position={[-2.0, 0.1, -2.6]} rpm={rpm} brakePressure={brakePressure} slip={slip} onSelect={onSelect} telemetry={telemetry} />
      <Wheel position={[2.0, 0.1, -2.6]} rpm={rpm} brakePressure={brakePressure} slip={slip} onSelect={onSelect} telemetry={telemetry} />
      <Wheel position={[-2.0, 0.1, 2.6]} rpm={rpm} brakePressure={brakePressure} slip={slip} onSelect={onSelect} telemetry={telemetry} />
      <Wheel position={[2.0, 0.1, 2.6]} rpm={rpm} brakePressure={brakePressure} slip={slip} onSelect={onSelect} telemetry={telemetry} />
    </group>
  );
};

export function VehicleTwin({ telemetry }: { telemetry: any }) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%', background: '#111111', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      
      {/* HUD Overlay - Live Telemetry directly on the Twin */}
      <Box sx={{ position: 'absolute', top: 24, left: 28, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'none' }}>
        <Box>
           <Typography sx={{ color: '#888', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1.5px', mb: 0.5 }}>VEHICLE SPEED</Typography>
           <Typography sx={{ color: '#00E5FF', fontSize: '3.2rem', fontWeight: 700, lineHeight: 1, textShadow: '0 0 20px rgba(0, 229, 255, 0.4)' }}>
             {Math.round(telemetry?.vehicle_speed_kmh || 0)} <span style={{ fontSize: '1.2rem', color: '#fff', textShadow: 'none', marginLeft: 4 }}>km/h</span>
           </Typography>
        </Box>
        <Box>
           <Typography sx={{ color: '#888', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1.5px', mb: 0.5 }}>MOTOR RPM</Typography>
           <Typography sx={{ color: '#FFD700', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1, textShadow: '0 0 15px rgba(255, 215, 0, 0.3)' }}>
             {Math.round(telemetry?.rpm || 0)}
           </Typography>
        </Box>
      </Box>

      <Box sx={{ position: 'absolute', top: 24, right: 28, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, pointerEvents: 'none' }}>
        <Box sx={{ textAlign: 'right' }}>
           <Typography sx={{ color: '#888', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1.5px', mb: 0.5 }}>BATTERY SOC</Typography>
           <Typography sx={{ color: '#32D74B', fontSize: '3.2rem', fontWeight: 700, lineHeight: 1, textShadow: '0 0 20px rgba(50, 215, 75, 0.4)' }}>
             {(telemetry?.battery_soc || 100).toFixed(1)} <span style={{ fontSize: '1.2rem', color: '#fff', textShadow: 'none', marginLeft: 4 }}>%</span>
           </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
           <Typography sx={{ color: '#888', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1.5px', mb: 0.5 }}>MOTOR TEMP</Typography>
           <Typography sx={{ color: telemetry?.motor_temp_c > 80 ? '#FF3B30' : '#FFF', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1, textShadow: telemetry?.motor_temp_c > 80 ? '0 0 15px rgba(255, 59, 48, 0.4)' : 'none' }}>
             {(telemetry?.motor_temp_c || 25).toFixed(1)} <span style={{ fontSize: '1.2rem', color: '#fff', marginLeft: 4 }}>°C</span>
           </Typography>
        </Box>
      </Box>

      {/* 3D Environment */}
      <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <Canvas camera={{ position: [-5, 3, 6], fov: 45 }}>
          <color attach="background" args={['#111111']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={2.0} color="#ffffff" />
          <pointLight position={[0, 3, 0]} intensity={3} color="#ffffff" distance={15} />
          
          <Environment preset="night" />

          <VehicleModel telemetry={telemetry} selectedComponent={selectedComponent} onSelect={setSelectedComponent} />
          
          {/* Ground reflection shadow */}
          <ContactShadows resolution={1024} scale={30} blur={2.5} opacity={0.6} far={10} color="#00E5FF" />
          
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going strictly below the ground
            minDistance={4}
            maxDistance={15}
          />
        </Canvas>
      </Box>
    </Box>
  );
}
