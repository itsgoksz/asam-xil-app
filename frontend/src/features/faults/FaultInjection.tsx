import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { useState } from 'react';

interface FaultInjectionProps {
  injectFault: (id: string) => void;
}

const faults = [
  { id: 'BrakeFailure', label: 'Brake Failure', severity: 'error.main', activeBg: 'rgba(239, 68, 68, 0.15)' },
  { id: 'BatteryOverheating', label: 'Battery Overheating', severity: 'error.main', activeBg: 'rgba(239, 68, 68, 0.15)' },
  { id: 'SensorTimeout', label: 'Speed Sensor Timeout', severity: 'warning.main', activeBg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'MotorFailure', label: 'Motor Inverter Failure', severity: 'error.main', activeBg: 'rgba(239, 68, 68, 0.15)' },
];

export function FaultInjection({ injectFault }: FaultInjectionProps) {
  const [activeFaults, setActiveFaults] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setActiveFaults(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    injectFault(id);
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Engineering Fault Console</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Inject faults into the simulation to observe telemetry behavior, test safety protocols, and validate robot framework assertions.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {faults.map((f) => {
          const isActive = activeFaults.includes(f.id);
          return (
            <Box 
              key={f.id} 
              sx={{ 
                p: 3, 
                bgcolor: isActive ? f.activeBg : 'background.paper', 
                border: 1, 
                borderColor: isActive ? f.severity : 'divider', 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s',
                boxShadow: isActive ? `0 0 15px ${f.activeBg}` : 'none',
                '&:hover': {
                  borderColor: f.severity,
                  bgcolor: isActive ? f.activeBg : 'rgba(255,255,255,0.01)'
                }
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, color: isActive ? f.severity : 'text.primary' }}>{f.label}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {f.id}</Typography>
              </Box>
              <FormControlLabel
                control={<Switch color="error" checked={isActive} onChange={() => handleToggle(f.id)} />}
                label=""
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
