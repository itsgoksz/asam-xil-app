import { useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Stack, Chip } from '@mui/material';
import { PlayArrow, BugReport } from '@mui/icons-material';

interface RobotFrameworkProps {
  runRobotTest: (testId: string) => Promise<any>;
  onTestComplete: (report: any) => void;
}

const TEST_SUITE = [
  { id: 'highway', name: 'Highway Acceleration Test', desc: 'Asserts speed > 80km/h at 65% throttle' },
  { id: 'city', name: 'City Speed Limit Test', desc: 'Asserts speed 20-50km/h at 25% throttle' },
  { id: 'emergency_brake', name: 'Emergency Brake Test', desc: 'Asserts speed hits 0km/h on full brake' },
];

export function RobotFramework({ runRobotTest, onTestComplete }: RobotFrameworkProps) {
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleRun = async (testId: string, testName: string) => {
    setActiveTestId(testId);
    setLogs([
      `[ROBOT] Connecting to XIL Mock Adapter...`, 
      `[ROBOT] Initializing Test: ${testName}`, 
      `[ROBOT] Injecting physical signals...`, 
      `[ROBOT] Waiting for state settlement...`
    ]);
    
    const report = await runRobotTest(testId);
    
    if (report) {
      setLogs(prev => [...prev, `[ROBOT] Observation: ${report.details}`, `[ROBOT] Result: ${report.passed ? 'PASS' : 'FAIL'}`, '[ROBOT] Disconnecting...']);
      onTestComplete(report);
    }
    setActiveTestId(null);
  };

  return (
    <Box sx={{ p: 4, height: '100%', maxWidth: 900, margin: '0 auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReport /> Robot Framework Execution
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Automated CI/CD Validation Pipeline integration.</Typography>
          
          <Stack direction="row" spacing={2}>
            {TEST_SUITE.map(test => {
              const isThisTestRunning = activeTestId === test.id;
              const isAnyTestRunning = activeTestId !== null;
              return (
                <Button 
                  key={test.id}
                  variant={isThisTestRunning ? "contained" : "outlined"} 
                  color="primary" 
                  startIcon={isThisTestRunning ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
                  onClick={() => handleRun(test.id, test.name)}
                  disabled={isAnyTestRunning && !isThisTestRunning}
                  sx={{ py: 1, px: 2, textTransform: 'none', borderColor: '#1e293b' }}
                >
                  {isThisTestRunning ? 'EXECUTING...' : test.name}
                </Button>
              );
            })}
          </Stack>
        </Box>
      </Box>

      <Paper sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b', p: 2, height: 400, overflowY: 'auto', borderRadius: 2, fontFamily: 'monospace' }}>
        {logs.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>Ready to execute test suite. Select a scenario above.</Typography>
        ) : (
          logs.map((log, i) => (
            <Typography key={i} sx={{ color: log.includes('PASS') ? '#34d399' : log.includes('FAIL') ? '#f87171' : '#94a3b8', mb: 1, fontSize: 13 }}>
              {`> ${log}`}
            </Typography>
          ))
        )}
      </Paper>
    </Box>
  );
}
