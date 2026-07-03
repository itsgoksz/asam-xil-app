import { Box, Typography, Slider, Stack, FormControlLabel, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';

const PrettoSlider = styled(Slider)({
  color: '#3b82f6',
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
    '&::before': {
      display: 'none',
    },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: '#3b82f6',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
    '&::before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
    },
    '& > *': {
      transform: 'rotate(45deg)',
    },
  },
});

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DriveControlsProps {
  telemetry: any;
  writeSignal: (signal: string, value: number) => void;
}

const Pedal = ({ type, value }: { type: 'throttle' | 'brake', value: number }) => {
  const isThrottle = type === 'throttle';
  // Map value (0-100 or 0-150) to a tilt angle (0 to 25 degrees)
  const maxVal = isThrottle ? 100 : 150;
  const tilt = (value / maxVal) * 25; 

  return (
    <Box sx={{ perspective: 800, width: 80, height: 140, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotateX: tilt }}
        style={{
          width: isThrottle ? 40 : 60,
          height: 120,
          backgroundColor: '#1e293b',
          border: `2px solid ${isThrottle ? (value > 0 ? '#3b82f6' : '#334155') : (value > 0 ? '#EF4444' : '#334155')}`,
          borderRadius: 8,
          boxShadow: value > 0 
            ? `0 10px 20px ${isThrottle ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}, inset 0 -5px 15px rgba(0,0,0,0.5)` 
            : 'inset 0 -5px 15px rgba(0,0,0,0.5)',
          transformOrigin: 'bottom center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          overflow: 'hidden'
        }}
      >
        {/* Pedal Grips */}
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{ width: '80%', height: 4, bgcolor: '#334155', borderRadius: 2 }} />
        ))}
      </motion.div>
    </Box>
  );
};

export function DriveControls({ telemetry, writeSignal }: DriveControlsProps) {
  const [throttle, setThrottle] = useState(0);
  const [brake, setBrake] = useState(0);
  const [steering, setSteering] = useState(0);
  const [isDraggingThrottle, setIsDraggingThrottle] = useState(false);
  const [isDraggingBrake, setIsDraggingBrake] = useState(false);
  const [isDraggingSteering, setIsDraggingSteering] = useState(false);
  const [cruiseControl, setCruiseControl] = useState(false);

  useEffect(() => {
    if (!isDraggingThrottle && telemetry?.throttle_pos_percent !== undefined) {
      setThrottle(telemetry.throttle_pos_percent);
    }
  }, [telemetry?.throttle_pos_percent, isDraggingThrottle]);

  useEffect(() => {
    if (!isDraggingBrake && telemetry?.brake_pressure_bar !== undefined) {
      setBrake(telemetry.brake_pressure_bar);
    }
  }, [telemetry?.brake_pressure_bar, isDraggingBrake]);

  useEffect(() => {
    if (!isDraggingSteering && telemetry?.steering_angle_deg !== undefined) {
      setSteering(telemetry.steering_angle_deg);
    }
  }, [telemetry?.steering_angle_deg, isDraggingSteering]);

  const handleThrottleChange = (_: any, val: number | number[]) => {
    setThrottle(val as number);
    writeSignal('throttle_pos_percent', val as number);
  };

  const handleThrottleCommit = (_: any, val: number | number[]) => {
    setIsDraggingThrottle(false);
    if (!cruiseControl) {
      setThrottle(0);
      writeSignal('throttle_pos_percent', 0);
    } else {
      writeSignal('throttle_pos_percent', val as number);
    }
  };

  const handleBrakeChange = (_: any, val: number | number[]) => {
    setBrake(val as number);
    writeSignal('brake_pressure_bar', val as number);
  };

  const handleBrakeCommit = (_: any, val: number | number[]) => {
    setIsDraggingBrake(false);
    // Brakes always spring back to 0
    setBrake(0);
    writeSignal('brake_pressure_bar', 0);
  };

  const handleSteeringChange = (_: any, val: number | number[]) => {
    setSteering(val as number);
    writeSignal('steering_angle_deg', val as number);
  };

  const handleSteeringCommit = (_: any, val: number | number[]) => {
    setIsDraggingSteering(false);
    if (!cruiseControl) {
      setSteering(0);
      writeSignal('steering_angle_deg', 0);
    } else {
      writeSignal('steering_angle_deg', val as number);
    }
  };

  return (
    <Box sx={{ 
      p: 2.5, 
      bgcolor: 'background.paper', 
      borderRadius: 3, 
      border: '1px solid rgba(255, 255, 255, 0.05)',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#F3F4F6' }}>Manual Drive Control Overrides</Typography>
        <FormControlLabel
          control={<Switch size="small" checked={cruiseControl} onChange={(e) => setCruiseControl(e.target.checked)} />}
          label={<Typography variant="caption" color="text.secondary">Cruise Lock</Typography>}
        />
      </Box>
      
      <Stack spacing={4}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Accelerator</Typography>
              <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700 }}>{throttle.toFixed(1)}%</Typography>
            </Box>
            <PrettoSlider
              valueLabelDisplay="auto"
              value={throttle}
              onMouseDown={() => setIsDraggingThrottle(true)}
              onChange={handleThrottleChange}
              onChangeCommitted={handleThrottleCommit}
              step={1}
              min={0}
              max={100}
            />
          </Box>
          <Pedal type="throttle" value={throttle} />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Brake</Typography>
              <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700 }}>{brake.toFixed(1)} bar</Typography>
            </Box>
            <PrettoSlider
              valueLabelDisplay="auto"
              value={brake}
              onMouseDown={() => setIsDraggingBrake(true)}
              onChange={handleBrakeChange}
              onChangeCommitted={handleBrakeCommit}
              step={1}
              min={0}
              max={150}
              sx={{
                color: '#EF4444',
                '& .MuiSlider-valueLabel': { backgroundColor: '#EF4444' }
              }}
            />
          </Box>
          <Pedal type="brake" value={brake} />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Steering</Typography>
              <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>{steering.toFixed(1)}°</Typography>
            </Box>
            <PrettoSlider
              valueLabelDisplay="auto"
              value={steering}
              onMouseDown={() => setIsDraggingSteering(true)}
              onChange={handleSteeringChange}
              onChangeCommitted={handleSteeringCommit}
              step={1}
              min={-45}
              max={45}
              sx={{
                color: '#F59E0B',
                '& .MuiSlider-valueLabel': { backgroundColor: '#F59E0B' }
              }}
            />
          </Box>
          <Box sx={{ width: 80 }} /> {/* Spacer to align with pedals */}
        </Box>
      </Stack>
    </Box>
  );
}
