import { Box, Typography, Paper, Stack } from '@mui/material';

interface SystemDiagnosticsProps {
  telemetry: any;
}

export function SystemDiagnostics({ telemetry }: SystemDiagnosticsProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* BATTERY */}
      <Paper sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Typography sx={{ color: '#00E5FF', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', mb: 2 }}>BATTERY DIAGNOSTICS</Typography>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>State of Charge</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{(telemetry?.battery_soc || 100).toFixed(1)}%</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>High Voltage</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{(telemetry?.battery_voltage || 400).toFixed(1)} V</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>Power Draw</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{(telemetry?.power_consumption_kw || 0).toFixed(1)} kW</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* MOTOR */}
      <Paper sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Typography sx={{ color: '#FFD700', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', mb: 2 }}>MOTOR DIAGNOSTICS</Typography>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>Speed</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{Math.round(telemetry?.rpm || 0)} RPM</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>Inverter Temp</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{(telemetry?.motor_temp_c || 25).toFixed(1)} °C</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>Phase Current</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{(telemetry?.motor_current_a || 0).toFixed(1)} A</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* BRAKES */}
      <Paper sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Typography sx={{ color: '#FF3B30', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', mb: 2 }}>BRAKE SYSTEM</Typography>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>Line Pressure</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{(telemetry?.brake_pressure_bar || 0).toFixed(1)} bar</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>ABS Active</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: telemetry?.abs_active ? '#FF3B30' : '#32D74B' }}>
              {telemetry?.abs_active ? 'YES' : 'NO'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>Wheel Slip</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{(telemetry?.wheel_slip_percent || 0).toFixed(1)}%</Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
