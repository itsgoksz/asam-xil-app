import { Box, Typography, Slider, Stack, FormControlLabel, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';

const PrettoSlider = styled(Slider)({
  color: '#0A84FF',
  height: 8,
  '& .MuiSlider-track': { border: 'none' },
  '& .MuiSlider-thumb': {
    height: 24, width: 24, backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&::before': { display: 'none' },
  },
});

interface AeroControlsProps {
  telemetry: any;
  writeSignal: (signal: string, value: number) => void;
}

export function AeroControls({ telemetry, writeSignal }: AeroControlsProps) {
  const [throttle, setThrottle] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [autoPilot, setAutoPilot] = useState(false);

  useEffect(() => {
    if (telemetry?.throttle_pos_percent !== undefined) setThrottle(telemetry.throttle_pos_percent);
    if (telemetry?.pitch_deg !== undefined) setPitch(telemetry.pitch_deg);
    if (telemetry?.roll_deg !== undefined) setRoll(telemetry.roll_deg);
  }, [telemetry]);

  const handleThrottle = (_: any, val: number | number[]) => {
    setThrottle(val as number);
    writeSignal('throttle_pos_percent', val as number);
  };

  const handlePitch = (_: any, val: number | number[]) => {
    setPitch(val as number);
    writeSignal('pitch_deg', val as number);
  };

  const handleRoll = (_: any, val: number | number[]) => {
    setRoll(val as number);
    writeSignal('roll_deg', val as number);
  };

  // Yoke springs back to center if autopilot is off
  const handlePitchCommit = (_: any, val: number | number[]) => {
    if (!autoPilot) { setPitch(0); writeSignal('pitch_deg', 0); }
  };
  const handleRollCommit = (_: any, val: number | number[]) => {
    if (!autoPilot) { setRoll(0); writeSignal('roll_deg', 0); }
  };

  return (
    <Box sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#F3F4F6' }}>Flight Controls (Boeing 787)</Typography>
        <FormControlLabel
          control={<Switch size="small" checked={autoPilot} onChange={(e) => setAutoPilot(e.target.checked)} color="primary" />}
          label={<Typography variant="caption" color="text.secondary">AutoPilot Lock</Typography>}
        />
      </Box>
      
      <Stack spacing={4}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Master Thrust Lever</Typography>
            <Typography variant="caption" sx={{ color: '#0A84FF', fontWeight: 700 }}>{throttle.toFixed(1)}%</Typography>
          </Box>
          <PrettoSlider value={throttle} onChange={handleThrottle} min={0} max={100} />
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Yoke Pitch (Nose Up/Down)</Typography>
            <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>{pitch.toFixed(1)}°</Typography>
          </Box>
          <PrettoSlider 
            value={pitch} onChange={handlePitch} onChangeCommitted={handlePitchCommit} 
            min={-30} max={30} 
            sx={{ color: '#F59E0B', '& .MuiSlider-thumb': { backgroundColor: '#F59E0B' } }}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Yoke Roll (Bank L/R)</Typography>
            <Typography variant="caption" sx={{ color: '#A855F7', fontWeight: 700 }}>{roll.toFixed(1)}°</Typography>
          </Box>
          <PrettoSlider 
            value={roll} onChange={handleRoll} onChangeCommitted={handleRollCommit} 
            min={-45} max={45} 
            sx={{ color: '#A855F7', '& .MuiSlider-thumb': { backgroundColor: '#A855F7' } }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
