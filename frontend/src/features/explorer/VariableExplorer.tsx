import { Box, Typography, Collapse, IconButton, Slider, Divider } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { useState } from 'react';

interface ScadaNodeProps {
  label: string;
  value?: string | number;
  unit?: string;
  isWritable?: boolean;
  onWrite?: (val: number) => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export function ScadaNode({ label, value, unit, isWritable, onWrite, children, defaultOpen = true }: ScadaNodeProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isLeaf = !children;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          py: 0.5,
          cursor: isLeaf ? 'default' : 'pointer',
          '&:hover': { bgcolor: isLeaf ? 'transparent' : 'rgba(255,255,255,0.02)' }
        }}
        onClick={() => !isLeaf && setOpen(!open)}
      >
        <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
          {!isLeaf && (
            <IconButton size="small" sx={{ p: 0, color: 'text.secondary' }}>
              {open ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: isLeaf ? 400 : 600, color: isLeaf ? 'text.primary' : 'primary.main' }}>
          {label}
        </Typography>
        
        {value !== undefined && (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {typeof value === 'number' ? value.toFixed(2) : value} {unit}
          </Typography>
        )}
      </Box>

      {isWritable && onWrite && (
        <Box sx={{ pl: 4, pr: 2, pb: 1 }}>
           <Slider 
              value={Number(value) || 0} 
              onChange={(_, val) => onWrite(val as number)}
              max={100}
              size="small"
              sx={{ py: 1 }}
            />
        </Box>
      )}

      {!isLeaf && (
        <Collapse in={open}>
          <Box sx={{ pl: 2, borderLeft: 1, borderColor: 'divider', ml: 1.5, mt: 0.5 }}>
            {children}
          </Box>
        </Collapse>
      )}
      <Divider sx={{ my: 0.5 }} />
    </Box>
  );
}

interface VariableExplorerProps {
  telemetry: any;
  writeSignal: (name: string, val: any) => void;
}

export function VariableExplorer({ telemetry, writeSignal }: VariableExplorerProps) {
  if (!telemetry) {
    return <Typography variant="body2" color="text.secondary">Waiting for simulation data...</Typography>;
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider', height: '100%', overflowY: 'auto' }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>Variable Explorer</Typography>
      
      <ScadaNode label="Powertrain">
        <ScadaNode label="Motor RPM" value={telemetry.rpm} unit="RPM" />
        <ScadaNode label="Vehicle Speed" value={telemetry.vehicle_speed_kmh} unit="km/h" />
        <ScadaNode label="Throttle Position" value={telemetry.throttle_pos_percent} unit="%" isWritable onWrite={(v) => writeSignal('throttle_pos_percent', v)} />
        <ScadaNode label="Motor Temperature" value={telemetry.motor_temp_c} unit="°C" />
        <ScadaNode label="Motor Current" value={telemetry.motor_current_a} unit="A" />
      </ScadaNode>
      
      <ScadaNode label="Energy System">
        <ScadaNode label="Battery SOC" value={telemetry.battery_soc} unit="%" />
        <ScadaNode label="Battery Voltage" value={telemetry.battery_voltage} unit="V" />
        <ScadaNode label="Power Consumption" value={telemetry.power_consumption_kw} unit="kW" />
      </ScadaNode>

      <ScadaNode label="Chassis">
        <ScadaNode label="Brake Pressure" value={telemetry.brake_pressure_bar} unit="bar" isWritable onWrite={(v) => writeSignal('brake_pressure_bar', v)} />
        <ScadaNode label="Steering Angle" value={telemetry.steering_angle_deg} unit="deg" isWritable onWrite={(v) => writeSignal('steering_angle_deg', v)} />
        <ScadaNode label="Selected Gear" value={telemetry.gear} unit="" />
      </ScadaNode>
    </Box>
  );
}
