import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Sky } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { Box, Typography } from '@mui/material';

interface AeroTwinProps {
  telemetry: any;
}

const N1Fan = ({ rpm }: { rpm: number }) => {
  const fanRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (fanRef.current) {
      const rps = (rpm * 30) * delta;
      fanRef.current.rotation.x += rps; // X axis for fan rotation relative to engine cylinder
    }
  });

  return (
    <group ref={fanRef} rotation={[0, Math.PI / 2, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.05, 24]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Realistic 18 Blades for GEnx */}
      {[...Array(18)].map((_, i) => (
        <mesh key={i} rotation={[0, 0, (Math.PI / 9) * i]}>
          <boxGeometry args={[0.74, 0.03, 0.01]} />
          <meshStandardMaterial color="#999" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {/* Spinner Cone */}
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
         <coneGeometry args={[0.1, 0.2, 16]} />
         <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};

const Engine = ({ position, n1_percent, egt_c }: { position: [number, number, number], n1_percent: number, egt_c: number }) => {
  const engineRef = useRef<THREE.Group>(null);
  const exhaustRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    if (engineRef.current) {
      if (n1_percent > 60) {
        engineRef.current.position.y = position[1] + (Math.random() - 0.5) * 0.015;
      } else {
        engineRef.current.position.y = position[1];
      }
    }
    
    if (exhaustRef.current) {
       if (egt_c > 300) {
         const intensity = Math.min((egt_c - 300) / 500, 1);
         exhaustRef.current.emissiveIntensity = intensity * 3.0;
       } else {
         exhaustRef.current.emissiveIntensity = 0;
       }
    }
  });

  return (
    <group ref={engineRef} position={position}>
      {/* Cowling */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.4, 1.5, 32]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.3} />
      </mesh>
      {/* Exhaust Cone Exterior */}
      <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.25, 0.5, 32]} />
        <meshStandardMaterial color="#4B5563" roughness={0.6} metalness={0.8} />
      </mesh>
      {/* Inner Glowing Turbine / Exhaust */}
      <mesh position={[0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.38, 0.23, 0.5, 32]} />
        <meshStandardMaterial ref={exhaustRef} color="#111" emissive="#FF4500" emissiveIntensity={0} />
      </mesh>
      {/* Fan inlet */}
      <group position={[-0.72, 0, 0]}>
         <N1Fan rpm={n1_percent} />
      </group>
    </group>
  );
};

const LandingGear = ({ position, airspeed, isFlying }: { position: [number, number, number], airspeed: number, isFlying: boolean }) => {
  const wheelRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (wheelRef.current && !isFlying) {
      // 1 knot = 0.514 m/s. Wheel radius = 0.2. Circumference = 1.25m
      const rps = (airspeed * 0.514) / 1.25;
      wheelRef.current.rotation.x -= rps * delta * Math.PI * 2;
    }
  });

  if (isFlying) return null;

  return (
    <group position={position}>
      {/* Strut */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.2]} />
        <meshStandardMaterial color="#999" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Bogie / Wheels */}
      <group ref={wheelRef} position={[0, -1.2, 0]}>
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.15]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

const Boeing787 = ({ telemetry }: { telemetry: any }) => {
  const aircraftRef = useRef<THREE.Group>(null);
  const isFlying = (telemetry?.altitude_ft || 0) > 10;
  
  useFrame(() => {
    if (aircraftRef.current) {
      const pitch = THREE.MathUtils.degToRad(telemetry?.pitch_deg || 0);
      const roll = THREE.MathUtils.degToRad(telemetry?.roll_deg || 0);
      const heading = THREE.MathUtils.degToRad(-(telemetry?.heading_deg || 0));

      // Apply rotations smoothly
      aircraftRef.current.rotation.set(roll, heading, pitch, 'ZYX');
      
      const n1 = (telemetry?.engine1_n1_percent || 0) + (telemetry?.engine2_n1_percent || 0);
      if (n1 > 40 && !isFlying) {
        aircraftRef.current.position.y = (Math.random() - 0.5) * 0.005;
      } else {
        aircraftRef.current.position.y = 0;
      }
    }
  });

  return (
    <group ref={aircraftRef} position={[0, isFlying ? 0 : 1.4, 0]}>
      {/* Fuselage */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.2, 1.2, 14, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      
      <mesh position={[-7.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <sphereGeometry args={[1.2, 32, 32, 0, Math.PI, 0, Math.PI/2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      
      <mesh position={[7.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[1.2, 2.5, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Wings */}
      <mesh position={[0.5, -0.4, 0]}>
        <boxGeometry args={[3, 0.15, 14]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.3} />
      </mesh>

      {/* Vertical Stabilizer */}
      <mesh position={[7, 1.5, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[1.5, 3, 0.15]} />
        <meshStandardMaterial color="#1E3A8A" roughness={0.3} />
      </mesh>

      {/* Horizontal Stabilizer */}
      <mesh position={[7.5, 0.2, 0]}>
        <boxGeometry args={[1.2, 0.1, 4.5]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.3} />
      </mesh>

      {/* Landing Gear (Retracts when flying) */}
      <LandingGear position={[-6.0, -0.2, 0]} airspeed={telemetry?.airspeed_kts || 0} isFlying={isFlying} />
      <LandingGear position={[1.0, -0.2, 2.0]} airspeed={telemetry?.airspeed_kts || 0} isFlying={isFlying} />
      <LandingGear position={[1.0, -0.2, -2.0]} airspeed={telemetry?.airspeed_kts || 0} isFlying={isFlying} />

      {/* GEnx-1B Engines */}
      <Engine position={[-0.5, -0.9, -3.5]} n1_percent={telemetry?.engine1_n1_percent || 0} egt_c={telemetry?.engine1_egt_c || 0} />
      <Engine position={[-0.5, -0.9, 3.5]} n1_percent={telemetry?.engine2_n1_percent || 0} egt_c={telemetry?.engine2_egt_c || 0} />
    </group>
  );
};

const Airport = ({ airspeed, isFlying }: { airspeed: number, isFlying: boolean }) => {
  const centerlinesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (centerlinesRef.current && !isFlying) {
      // Move centerlines to simulate forward movement
      const speedMps = airspeed * 0.514;
      centerlinesRef.current.position.x += speedMps * delta;
      
      // Reset position to loop the texture/lines seamlessly
      if (centerlinesRef.current.position.x > 20) {
        centerlinesRef.current.position.x %= 20;
      }
    }
  });

  return (
    <group position={[0, -1.6, 0]}>
      {/* Main Runway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 40]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      
      {/* Runway Centerlines */}
      <group ref={centerlinesRef}>
        {[...Array(35)].map((_, i) => (
          <mesh key={i} position={[(i - 17) * 20, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 0.8]} />
            <meshStandardMaterial color="#fff" roughness={1} />
          </mesh>
        ))}
      </group>

      {/* Runway Edge Lines */}
      <mesh position={[0, 0.05, 19]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 0.4]} />
        <meshStandardMaterial color="#fff" roughness={1} />
      </mesh>
      <mesh position={[0, 0.05, -19]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 0.4]} />
        <meshStandardMaterial color="#fff" roughness={1} />
      </mesh>

      {/* Distant Terminal Building */}
      <mesh position={[0, 5, -80]}>
        <boxGeometry args={[150, 10, 30]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Control Tower */}
      <mesh position={[30, 20, -70]}>
        <cylinderGeometry args={[2.5, 2.5, 40, 12]} />
        <meshStandardMaterial color="#6B7280" />
      </mesh>
      <mesh position={[30, 42, -70]}>
        <boxGeometry args={[8, 5, 8]} />
        <meshStandardMaterial color="#3B82F6" opacity={0.6} transparent />
      </mesh>
    </group>
  );
};

export function AeroTwin({ telemetry }: AeroTwinProps) {
  const isFlying = (telemetry?.altitude_ft || 0) > 10;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#87CEEB' }}>
      
      {/* HUD Overlay */}
      <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="h6" sx={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontWeight: 700, fontFamily: 'monospace' }}>
          SPD: {Math.round(telemetry?.airspeed_kts || 0)} kts
        </Typography>
        <Typography variant="h6" sx={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontWeight: 700, fontFamily: 'monospace' }}>
          ALT: {Math.round(telemetry?.altitude_ft || 0)} ft
        </Typography>
        <Typography variant="h6" sx={{ color: '#F59E0B', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontWeight: 700, fontFamily: 'monospace' }}>
          THR: {Math.round(telemetry?.thrust_kn || 0)} kN
        </Typography>
      </Box>

      <Canvas camera={{ position: [25, 10, -25], fov: 45 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
        
        <Boeing787 telemetry={telemetry} />
        
        {/* Render runway only if on ground */}
        {!isFlying && <Airport airspeed={telemetry?.airspeed_kts || 0} isFlying={isFlying} />}
        
        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={40} blur={2} far={10} />
        <OrbitControls enablePan={true} enableZoom={true} minDistance={10} maxDistance={80} />
      </Canvas>
    </Box>
  );
}
