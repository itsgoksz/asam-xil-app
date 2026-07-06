import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import { useTelemetry } from './hooks/useTelemetry';
import { useSimulation } from './hooks/useSimulation';
import { TelemetryChart } from './components/TelemetryChart';
import { VariableExplorer } from './features/explorer/VariableExplorer';
import { VehicleTwin } from './features/twin/VehicleTwin';
import { EventConsole, type ConsoleEvent } from './components/console/EventConsole';

import { Scenarios } from './features/scenarios/Scenarios';
import { FaultInjection } from './features/faults/FaultInjection';
import { Copilot } from './features/copilot/Copilot';
import { DriveControls } from './features/controls/DriveControls';
import { RobotFramework } from './features/robot/RobotFramework';
import { ValidationReports } from './features/reports/ValidationReports';
import { DigitalTwinConfig } from './features/twin/DigitalTwinConfig';
import { SystemDiagnostics } from './components/SystemDiagnostics';
function App() {
  const { data, status: wsStatus } = useTelemetry();
  const [events, setEvents] = useState<ConsoleEvent[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleEvent = (time: string, severity: 'INFO' | 'WARNING' | 'ERROR' | 'PASS', message: string) => {
    setEvents(prev => [...prev, { time, severity, message }]);
  };

  const { startSimulation, stopSimulation, writeSignal, loadScenario, injectFault, runRobotTest, runCustomRobotTest, configureEnvironment } = useSimulation(handleEvent);
  const [activeWorkspace, setActiveWorkspace] = useState('Simulation Console');
  const [isSimRunning, setIsSimRunning] = useState(false);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      handleEvent('09:10:00', 'INFO', 'Engineering Platform Initialized');
      handleEvent('09:10:01', 'PASS', 'Backend Services Connected');
      initialized.current = true;
    }
  }, []);

  const handleTestComplete = (report: any) => {
    setReports(prev => [report, ...prev]);
  };

  const handleToggleSim = () => {
    if (isSimRunning) {
      stopSimulation();
      setIsSimRunning(false);
    } else {
      startSimulation();
      setIsSimRunning(true);
    }
  };

  const renderWorkspace = () => {
    switch (activeWorkspace) {
      case 'Telemetry':
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, height: '100%' }}>
            <TelemetryChart title="Vehicle Speed" value={data?.vehicle_speed_kmh || 0} unit="km/h" max={200} />
            <TelemetryChart title="Motor RPM" value={data?.rpm || 800} unit="RPM" color="#FBBF24" max={12000} />
            <TelemetryChart title="Battery SOC" value={data?.battery_soc || 100} unit="%" color="#34D399" min={0} max={100} />
            <TelemetryChart title="Motor Temp" value={data?.motor_temp_c || 35} unit="°C" color="#F87171" min={20} max={150} />
          </Box>
        );
      case 'Variable Explorer':
        return <VariableExplorer telemetry={data} writeSignal={writeSignal} />;
      case 'Vehicle Twin':
        return <VehicleTwin telemetry={data} />;
      case 'Scenarios':
        return <Scenarios loadScenario={loadScenario} />;
      case 'Fault Injection':
        return <FaultInjection injectFault={injectFault} />;
      case 'Validation Reports':
        return <ValidationReports reports={reports} />;
      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', p: 1.5, gap: 1.5 }}>

            {/* Main Grid: Left Sidebar | Center Stage (Twin) | Right Sidebar */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', width: '100%', gap: 1.5, flexGrow: 1, minHeight: 0 }}>

              {/* --- LEFT SIDEBAR (Controls) --- */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
                <Paper sx={{ p: 2.5, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, bgcolor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ mb: 2, fontWeight: 700, color: '#8E8E93', letterSpacing: '1.5px' }}>MOTOR START / STOP</Typography>
                  <Box
                    onClick={handleToggleSim}
                    sx={{
                      width: 90, height: 90, borderRadius: '50%',
                      background: isSimRunning ? 'linear-gradient(135deg, #FF3B30, #990000)' : 'linear-gradient(135deg, #32D74B, #006611)',
                      border: '4px solid #1C1C1E',
                      boxShadow: isSimRunning ? '0 0 25px rgba(255, 59, 48, 0.5), inset 0 2px 5px rgba(255,255,255,0.4)' : '0 0 25px rgba(50, 215, 75, 0.4), inset 0 2px 5px rgba(255,255,255,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:active': { transform: 'scale(0.9)', boxShadow: 'inset 0 6px 15px rgba(0,0,0,0.8)' }
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#FFF', letterSpacing: '1px' }}>
                      {isSimRunning ? 'STOP' : 'START'}
                    </Typography>
                  </Box>
                </Paper>

                <Box sx={{ flexShrink: 0, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
                  <DriveControls telemetry={data} writeSignal={writeSignal} />
                </Box>
              </Box>

              {/* --- CENTER STAGE (3D Twin ONLY) --- */}
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                {/* 3D Digital Twin with HUD */}
                <Box sx={{ flexGrow: 1, minHeight: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <VehicleTwin telemetry={data} />
                </Box>
              </Box>

              {/* --- RIGHT SIDEBAR (Configuration & Diagnostics) --- */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflowY: 'auto', pl: 0.5 }}>
                <Box sx={{ flexShrink: 0, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
                  <DigitalTwinConfig onConfigure={configureEnvironment} />
                </Box>

                <Box sx={{ flexShrink: 0 }}>
                  <SystemDiagnostics telemetry={data} />
                </Box>
              </Box>

            </Box>

            {/* --- BOTTOM ROW (Full Width Telemetry Graphs) --- */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, height: 160, flexShrink: 0 }}>
              <TelemetryChart title="Vehicle Speed" value={data?.vehicle_speed_kmh || 0} unit="km/h" max={200} />
              <TelemetryChart title="Motor RPM" value={data?.rpm || 0} unit="RPM" color="#FFD700" max={12000} />
              <TelemetryChart title="Battery SOC" value={data?.battery_soc || 100} unit="%" color="#32D74B" min={0} max={100} />
              <TelemetryChart title="Motor Temp" value={data?.motor_temp_c || 25} unit="°C" color="#FF3B30" min={20} max={150} />
            </Box>

          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{
        height: 52,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        bgcolor: 'rgba(10, 10, 12, 0.8)',
        backdropFilter: 'blur(20px)',
        zIndex: 100
      }}>
        <Button onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ minWidth: 40, mr: 2, color: 'text.primary', fontSize: 18 }}>
          {sidebarOpen ? '◀' : '▶'}
        </Button>
        <Typography variant="body1" sx={{ fontWeight: 700, mr: 4, letterSpacing: '0.5px' }}>EV Engineering Platform</Typography>
        <Typography variant="body2" color="success.main" sx={{ mr: 2, fontWeight: 500 }}>● Backend Healthy</Typography>
        <Typography variant="body2" color={wsStatus === 'connected' ? "success.main" : "error.main"} sx={{ mr: 2, fontWeight: 500 }}>
          ● WSS {wsStatus === 'connected' ? 'Streaming' : 'Disconnected'}
        </Typography>
        {/* <Typography variant="body2" color="warning.main" sx={{ mr: 2, fontWeight: 500 }}></Typography> */}
        {wsStatus === 'connected' && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontWeight: 500 }}>Signal Rate: 250ms</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{
          width: sidebarOpen ? 260 : 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRight: sidebarOpen ? '1px solid rgba(255, 255, 255, 0.08)' : 0,
          bgcolor: 'rgba(15, 15, 20, 0.4)',
          backdropFilter: 'blur(10px)',
          p: sidebarOpen ? 2 : 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          <Typography variant="h6" sx={{ mb: 2, opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>Workspaces</Typography>
          {['Simulation Console', 'Scenarios', 'Vehicle Twin', 'Telemetry', 'Variable Explorer', 'Fault Injection', 'Robot Automation', 'Validation Reports', 'Copilot'].map(ws => (
            <Typography
              key={ws}
              variant="body2"
              onClick={() => setActiveWorkspace(ws)}
              sx={{
                mb: 1.5,
                cursor: 'pointer',
                color: activeWorkspace === ws ? 'primary.main' : 'text.primary',
                fontWeight: activeWorkspace === ws ? 600 : 400,
                opacity: sidebarOpen ? 1 : 0,
                transition: 'opacity 0.2s',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {ws}
            </Typography>
          ))}
        </Box>

        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
          <Box sx={{ display: activeWorkspace === 'Robot Automation' ? 'block' : 'none', height: '100%' }}>
            <RobotFramework runRobotTest={runRobotTest} runCustomRobotTest={runCustomRobotTest} onTestComplete={handleTestComplete} onLogEvent={handleEvent} isActive={activeWorkspace === 'Robot Automation'} />
          </Box>
          <Box sx={{ display: activeWorkspace === 'Copilot' ? 'block' : 'none', height: '100%' }}>
            <Copilot telemetry={data} onNavigate={(ws: string) => setActiveWorkspace(ws)} />
          </Box>
          {activeWorkspace !== 'Robot Automation' && activeWorkspace !== 'Copilot' && renderWorkspace()}
        </Box>
      </Box>

      <EventConsole events={events} />
    </Box>
  )
}

export default App
