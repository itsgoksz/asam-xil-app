import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Slider } from '@mui/material';
import { useState, useEffect } from 'react';

const VEHICLES = ['Generic EV', 'Tata Nexon EV', 'Tata Curvv EV', 'Tata Harrier EV'];
const ROADS = ['Dry Asphalt', 'Wet Road', 'Gravel', 'Snow', 'Ice'];
const WEATHER = ['Clear (25°C)', 'Hot (40°C)', 'Cold (-10°C)', 'Rain (20°C)'];

interface DigitalTwinConfigProps {
  onConfigure: (config: { vehicle: string, road: string, weather: string, initial_soc: number }) => void;
}

export function DigitalTwinConfig({ onConfigure }: DigitalTwinConfigProps) {
  const [vehicle, setVehicle] = useState('Generic EV');
  const [road, setRoad] = useState('Dry Asphalt');
  const [weather, setWeather] = useState('Clear (25°C)');
  const [initialSoc, setInitialSoc] = useState(100);

  const handleChange = (type: string, val: any) => {
    let newV = vehicle;
    let newR = road;
    let newW = weather;
    let newSoc = initialSoc;
    
    if (type === 'vehicle') { setVehicle(val); newV = val; }
    if (type === 'road') { setRoad(val); newR = val; }
    if (type === 'weather') { setWeather(val); newW = val; }
    if (type === 'soc') { setInitialSoc(val); newSoc = val; }
    
    onConfigure({ vehicle: newV, road: newR, weather: newW, initial_soc: newSoc });
  };

  useEffect(() => {
    onConfigure({ vehicle, road, weather, initial_soc: initialSoc });
  }, []); // Trigger initial sync on mount

  return (
    <Box sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
        DIGITAL TWIN CONFIGURATION
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { color: '#F3F4F6', bgcolor: 'rgba(0,0,0,0.2)' }}}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Vehicle Model</InputLabel>
          <Select value={vehicle} label="Vehicle Model" onChange={(e) => handleChange('vehicle', e.target.value)}>
            {VEHICLES.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { color: '#F3F4F6', bgcolor: 'rgba(0,0,0,0.2)' }}}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Road Condition</InputLabel>
          <Select value={road} label="Road Condition" onChange={(e) => handleChange('road', e.target.value)}>
            {ROADS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { color: '#F3F4F6', bgcolor: 'rgba(0,0,0,0.2)' }}}>
          <InputLabel sx={{ color: '#9CA3AF' }}>Weather Profile</InputLabel>
          <Select value={weather} label="Weather Profile" onChange={(e) => handleChange('weather', e.target.value)}>
            {WEATHER.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', mb: 1, display: 'block' }}>Initial Battery SOC: {initialSoc}%</Typography>
          <Slider 
            value={initialSoc} 
            min={5} 
            max={100} 
            onChange={(e, val) => handleChange('soc', val)} 
            sx={{
              color: '#32D74B',
              '& .MuiSlider-thumb': {
                width: 16, height: 16,
                backgroundColor: '#32D74B',
                boxShadow: '0 0 10px rgba(50, 215, 75, 0.5)'
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
