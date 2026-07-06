import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Stack, Tooltip, Tabs, Tab, List, ListItemButton, ListItemText, Divider, Snackbar, Alert, Chip } from '@mui/material';
import { PlayArrow, Code, CheckCircle, Cancel } from '@mui/icons-material';
import { RobotFileIcon } from '../../components/icons/RobotFileIcon';
import { RobotCodeEditor } from './RobotCodeEditor';

interface RobotFrameworkProps {
  runRobotTest: (testId: string) => Promise<any>;
  runCustomRobotTest: (scriptContent: string) => Promise<any>;
  onTestComplete: (report: any) => void;
  onLogEvent?: (time: string, severity: 'INFO' | 'WARNING' | 'ERROR' | 'PASS', message: string) => void;
}

const PRESET_TESTS = [
  { id: 'highway', name: 'Highway Acceleration Test', desc: 'Asserts speed > 80km/h at 65% throttle' },
  { id: 'city', name: 'City Speed Limit Test', desc: 'Asserts speed 20-50km/h at 25% throttle' },
  { id: 'emergency_brake', name: 'Emergency Brake Test', desc: 'Asserts speed hits 0km/h on full brake' },
];

export function RobotFramework({ runRobotTest, onTestComplete, onLogEvent }: RobotFrameworkProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [presetLogs, setPresetLogs] = useState<string[]>([]);

  // Custom script state
  const [suites, setSuites] = useState<string[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [scriptContent, setScriptContent] = useState('');
  const [isCustomRunning, setIsCustomRunning] = useState(false);
  const [customResults, setCustomResults] = useState<any>(null);

  // Splitter state
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [editorWidthPct, setEditorWidthPct] = useState(55);
  const isDragging = useRef(false);
  const isEditorDragging = useRef(false);
  const mainAreaRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

  // Fetch available test suites on mount
  useEffect(() => {
    const fetchSuites = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/robot/suites');
        if (response.ok) {
          const data = await response.json();
          setSuites(data.suites || []);
          if (data.suites && data.suites.length > 0) {
            handleSuiteSelect(data.suites[0]);
          }
        }
      } catch (e) {
        console.error('Error fetching suites:', e);
      }
    };
    fetchSuites();
  }, []);

  // Handle Splitter drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        let newWidth = e.clientX - 250; // offset approx for main app sidebar
        if (newWidth < 150) newWidth = 150; // min width
        if (newWidth > 500) newWidth = 500; // max width
        setSidebarWidth(newWidth);
      } else if (isEditorDragging.current && mainAreaRef.current) {
        const rect = mainAreaRef.current.getBoundingClientRect();
        let pct = ((e.clientX - rect.left) / rect.width) * 100;
        if (pct < 20) pct = 20;
        if (pct > 80) pct = 80;
        setEditorWidthPct(pct);
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      isEditorDragging.current = false;
      document.body.style.cursor = 'default';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleSuiteSelect = async (filename: string) => {
    setSelectedSuite(filename);
    setCustomResults(null);
    try {
      const response = await fetch(`http://localhost:8000/api/robot/suites/${filename}`);
      if (response.ok) {
        const data = await response.json();
        setScriptContent(data.content);
      }
    } catch (e) {
      console.error(`Failed to fetch content for ${filename}`, e);
    }
  };

  const getLogTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  // --- Preset test handlers ---
  const handlePresetRun = async (testId: string, testName: string) => {
    setActiveTestId(testId);
    setPresetLogs([
      `[ROBOT] Connecting to XIL Mock Adapter...`,
      `[ROBOT] Initializing Test: ${testName}`,
      `[ROBOT] Injecting physical signals...`,
      `[ROBOT] Waiting for state settlement...`,
    ]);
    const report = await runRobotTest(testId);
    if (report) {
      setPresetLogs(prev => [...prev, `[ROBOT] Observation: ${report.details}`, `[ROBOT] Result: ${report.passed ? 'PASS' : 'FAIL'}`, '[ROBOT] Disconnecting...']);
      onTestComplete(report);
    }
    setActiveTestId(null);
  };

  // --- Custom script handler ---
  const handleCustomRun = async () => {
    if (!selectedSuite || !scriptContent.trim()) return;
    
    if (selectedSuite === 'custom_keywords.robot') {
      if (onLogEvent) {
        onLogEvent(getLogTime(), 'ERROR', 'Cannot run this robot file. Only test suites can be run.');
      }
      return;
    }
    
    setIsCustomRunning(true);
    setCustomResults(null);
    try {
      const response = await fetch(`http://localhost:8000/api/robot/run/${selectedSuite}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_content: scriptContent }),
      });
      if (response.ok) {
        const data = await response.json();
        setCustomResults(data.results);
        setNotification({
          message: data.results?.overall_status === 'PASS' ? 'Test Suite Passed!' : 'Test Suite Failed.',
          severity: data.results?.overall_status === 'PASS' ? 'success' : 'error',
        });
      } else {
        setNotification({ message: 'Server error during execution.', severity: 'error' });
      }
    } catch (e) {
      setNotification({ message: 'Network error during execution.', severity: 'error' });
    } finally {
      setIsCustomRunning(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ─── Header Bar ─── */}
      <Box sx={{ px: 3, pt: 2.5, pb: 0, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(124,58,237,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(96,165,250,0.2)',
            }}>
              {/* Changed icon to RobotFileIcon */}
              <RobotFileIcon size={20} color="#60A5FA" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                Robot Framework Automation
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#64748b', mt: -0.3 }}>
                Execute and validate simulation test suites
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 36, mt: 1,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, color: '#64748b', minHeight: 36, py: 0.5, fontSize: 13 },
            '& .Mui-selected': { color: '#60A5FA !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#60A5FA', height: 2 },
          }}
        >
          <Tab icon={<PlayArrow sx={{ fontSize: 16 }} />} iconPosition="start" label="Preset Tests" />
          <Tab icon={<Code sx={{ fontSize: 16 }} />} iconPosition="start" label="Custom Scripts" />
        </Tabs>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* ─── Tab Content ─── */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

        {/* ─── PRESET TESTS TAB ─── */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, gap: 1.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', flexShrink: 0 }}>
              {PRESET_TESTS.map(test => {
                const isThisRunning = activeTestId === test.id;
                const isAnyRunning = activeTestId !== null;
                return (
                  <Tooltip key={test.id} title={test.desc} arrow>
                    <span>
                      <Button
                        variant={isThisRunning ? 'contained' : 'outlined'}
                        color="primary"
                        startIcon={isThisRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrow sx={{ fontSize: 16 }} />}
                        onClick={() => handlePresetRun(test.id, test.name)}
                        disabled={isAnyRunning && !isThisRunning}
                        sx={{ py: 0.8, px: 2, textTransform: 'none', fontSize: 12, borderColor: 'rgba(96,165,250,0.25)' }}
                      >
                        {isThisRunning ? 'EXECUTING...' : test.name}
                      </Button>
                    </span>
                  </Tooltip>
                );
              })}
            </Stack>
            <Paper sx={{ bgcolor: '#0a0e17', border: '1px solid rgba(96,165,250,0.1)', p: 2, flexGrow: 1, overflowY: 'auto', borderRadius: 2, fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
              {presetLogs.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic', fontSize: 12 }}>Ready to execute. Select a scenario above.</Typography>
              ) : (
                presetLogs.map((log, i) => (
                  <Typography key={i} sx={{ color: log.includes('PASS') ? '#34d399' : log.includes('FAIL') ? '#f87171' : '#94a3b8', mb: 0.3, fontSize: 12 }}>
                    {`> ${log}`}
                  </Typography>
                ))
              )}
            </Paper>
          </Box>
        )}

        {/* ─── CUSTOM SCRIPTS TAB ─── */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

            {/* File Explorer Sidebar */}
            <Box sx={{
              width: sidebarWidth, flexShrink: 0,
              bgcolor: '#0d1117',
              display: 'flex', flexDirection: 'column',
            }}>
              <Box sx={{ px: 1.5, py: 1.2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography sx={{ fontWeight: 600, color: '#64748b', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Test Suites
                </Typography>
                <Chip label={suites.length} size="small" sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(96,165,250,0.1)', color: '#60A5FA', fontWeight: 700 }} />
              </Box>
              <List sx={{ 
                p: 0, overflowY: 'auto', flexGrow: 1, overflowX: 'hidden',
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: '#30363d', borderRadius: '3px' },
              }}>
                {suites.map((filename) => {
                  const isSelected = selectedSuite === filename;
                  return (
                    <ListItemButton
                      key={filename}
                      selected={isSelected}
                      onClick={() => handleSuiteSelect(filename)}
                      sx={{
                        py: 0.8, px: 1.5, gap: 1,
                        borderLeft: isSelected ? '2px solid #60A5FA' : '2px solid transparent',
                        bgcolor: isSelected ? 'rgba(96,165,250,0.08)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(96,165,250,0.05)' },
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <RobotFileIcon size={18} color={isSelected ? '#60A5FA' : '#475569'} />
                      <ListItemText
                        disableTypography
                        primary={
                          <Typography
                            sx={{
                              color: isSelected ? '#e2e8f0' : '#94a3b8',
                              fontSize: 11,
                              fontWeight: isSelected ? 600 : 400,
                              fontFamily: '"JetBrains Mono", monospace',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {filename}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>

            {/* Draggable Splitter */}
            <Box
              onMouseDown={() => {
                isDragging.current = true;
                document.body.style.cursor = 'col-resize';
              }}
              sx={{
                width: 4,
                cursor: 'col-resize',
                bgcolor: 'transparent',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                zIndex: 10,
                '&:hover': { bgcolor: '#60A5FA' },
                '&:active': { bgcolor: '#60A5FA' },
                transition: 'background-color 0.2s',
              }}
            />

            {/* Main Editor + Results Area */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

              {/* Toolbar */}
              <Box sx={{
                px: 2, py: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: '#0d1117',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RobotFileIcon size={16} color="#60A5FA" />
                  <Typography sx={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13, fontFamily: '"JetBrains Mono", monospace' }}>
                    {selectedSuite || 'No file selected'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={isCustomRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrow sx={{ fontSize: 16 }} />}
                  onClick={handleCustomRun}
                  disabled={isCustomRunning || !scriptContent.trim() || !selectedSuite}
                  sx={{
                    textTransform: 'none', fontWeight: 600, fontSize: 12,
                    bgcolor: '#2563EB',
                    color: '#ffffff',
                    '&:hover': { bgcolor: '#1D4ED8' },
                    '&.Mui-disabled': { opacity: 0.6, bgcolor: '#334155', color: '#94a3b8' },
                    px: 2.5, py: 0.6, borderRadius: 1.5,
                  }}
                >
                  {isCustomRunning ? 'Executing...' : 'Run Script'}
                </Button>
              </Box>

              {/* Editor & Results split */}
              <Box ref={mainAreaRef} sx={{ flexGrow: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

                {/* Code Editor */}
                <Box sx={{ flex: customResults ? `0 0 ${editorWidthPct}%` : '1 1 100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: isEditorDragging.current ? 'none' : 'flex 0.3s ease' }}>
                  <Box sx={{
                    px: 2, py: 0.5, bgcolor: '#161b22',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', gap: 1,
                    flexShrink: 0,
                  }}>
                    <Typography sx={{ color: '#475569', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>
                      EDITOR
                    </Typography>
                  </Box>
                  <RobotCodeEditor value={scriptContent} onChange={setScriptContent} />
                </Box>

                {/* Editor Splitter */}
                {customResults && (
                  <Box
                    onMouseDown={() => {
                      isEditorDragging.current = true;
                      document.body.style.cursor = 'col-resize';
                    }}
                    sx={{
                      width: 4,
                      flexShrink: 0,
                      cursor: 'col-resize',
                      bgcolor: 'transparent',
                      borderLeft: '1px solid rgba(255,255,255,0.06)',
                      zIndex: 10,
                      '&:hover': { bgcolor: '#60A5FA' },
                      '&:active': { bgcolor: '#60A5FA' },
                      transition: 'background-color 0.2s',
                    }}
                  />
                )}

                {/* Results Panel */}
                {customResults && (
                  <Box sx={{
                    flex: '1 1 0%',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  }}>
                    <Box sx={{
                      px: 2, py: 0.5, bgcolor: '#161b22',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexShrink: 0,
                    }}>
                      <Typography sx={{ color: '#475569', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>
                        RESULTS
                      </Typography>
                      <Chip
                        icon={customResults.overall_status === 'PASS' ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                        label={customResults.overall_status}
                        size="small"
                        sx={{
                          height: 22, fontSize: 10, fontWeight: 700, borderRadius: 1,
                          bgcolor: customResults.overall_status === 'PASS' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                          color: customResults.overall_status === 'PASS' ? '#34d399' : '#f87171',
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Box>
                    <Box sx={{ 
                      overflow: 'auto', p: 1.5, flexGrow: 1,
                      '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                      '&::-webkit-scrollbar-track': { background: 'transparent' },
                      '&::-webkit-scrollbar-thumb': { background: '#30363d', borderRadius: '4px' },
                      '&::-webkit-scrollbar-thumb:hover': { background: '#484f58' },
                    }}>
                      <Stack spacing={1.5}>
                        {customResults.tests?.map((t: any, i: number) => (
                          <Paper key={i} elevation={0} sx={{ p: 1.5, bgcolor: '#161b22', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                              <Typography sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{t.name}</Typography>
                              <Chip
                                label={t.status}
                                size="small"
                                sx={{
                                  height: 20, fontSize: 10, fontWeight: 700, borderRadius: 1,
                                  bgcolor: t.status === 'PASS' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                                  color: t.status === 'PASS' ? '#34d399' : '#f87171',
                                }}
                              />
                            </Stack>
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mb: 0.5 }} />
                            <Box sx={{ 
                              maxHeight: 180, overflow: 'auto', pr: 1, pb: 0.5,
                              '&::-webkit-scrollbar': { width: '6px', height: '6px' },
                              '&::-webkit-scrollbar-track': { background: 'transparent' },
                              '&::-webkit-scrollbar-thumb': { background: '#475569', borderRadius: '3px' },
                            }}>
                              {t.messages?.map((msg: string, mi: number) => {
                                const isError = msg.includes('[FAIL]') || msg.includes('[ERROR]');
                                return (
                                  <Typography key={mi} sx={{ color: isError ? '#f87171' : '#64748b', fontSize: 11, fontFamily: '"JetBrains Mono", monospace', mb: 0.3, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    {msg}
                                  </Typography>
                                );
                              })}
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Notifications */}
      <Snackbar open={!!notification} autoHideDuration={4000} onClose={() => setNotification(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setNotification(null)} severity={notification?.severity || 'info'} sx={{ width: '100%' }}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
