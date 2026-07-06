import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, Stack, IconButton, Collapse } from '@mui/material';
import { OpenInNew, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

interface ValidationReportsProps {
  reports?: any[];
}

function Row({ row }: { row: any }) {
  const [open, setOpen] = useState(false);

  const openReport = (suiteName: string, reportType: 'log.html' | 'report.html') => {
    window.open(`http://localhost:8000/api/robot/results/${suiteName}/${reportType}`, '_blank');
  };

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, '&:hover': { bgcolor: '#1e293b' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)} sx={{ color: '#94a3b8' }}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ color: '#f3f4f6', fontWeight: 600, fontSize: 13 }}>{row.suite_name}</TableCell>
        <TableCell sx={{ color: '#9ca3af', fontSize: 13 }}>
          {new Date(row.timestamp).toLocaleString()}
        </TableCell>
        <TableCell>
          <Chip 
            label={row.passed ? 'PASS' : 'FAIL'} 
            color={row.passed ? 'success' : 'error'} 
            size="small" 
            sx={{ fontWeight: 700, borderRadius: 1 }} 
          />
        </TableCell>
        <TableCell sx={{ color: '#9ca3af', fontSize: 12 }}>
          {row.tests?.length || 0} Test(s)
        </TableCell>
        <TableCell align="center">
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
              <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => openReport(row.suite_name, 'log.html')}
                  sx={{ textTransform: 'none', fontSize: 11, borderColor: '#374151', color: '#9ca3af' }}
                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
              >
                  Log
              </Button>
              <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => openReport(row.suite_name, 'report.html')}
                  sx={{ textTransform: 'none', fontSize: 11, borderColor: '#374151', color: '#9ca3af' }}
                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
              >
                  Report
              </Button>
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: '#0d1117', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                Test Cases
              </Typography>
              <Table size="small" aria-label="tests">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Test Name</TableCell>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Status</TableCell>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.tests?.map((testRow: any, i: number) => (
                    <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ color: '#cbd5e1', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {testRow.test_name}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Chip 
                          label={testRow.passed ? 'PASS' : 'FAIL'} 
                          size="small" 
                          sx={{ 
                            height: 20, fontSize: 10, fontWeight: 700, borderRadius: 1,
                            bgcolor: testRow.passed ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                            color: testRow.passed ? '#34d399' : '#f87171',
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.05)', maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {testRow.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export function ValidationReports({}: ValidationReportsProps) {
  const [backendReports, setBackendReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/robot/results?t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setBackendReports(data.reports || []);
        }
      } catch (e) {
        console.error("Failed to fetch reports", e);
      }
    };
    
    // Fetch initially
    fetchReports();
    
    // Optional: poll every 10 seconds or rely on manual refresh
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 4, height: '100%', maxWidth: 1200, margin: '0 auto', overflowY: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#f1f5f9', mb: 1 }}>
        Validation Reports
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>
        Immutable audit log of all automated test executions against the digital twin.
      </Typography>

      <Paper sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
            <TableRow>
              <TableCell sx={{ width: 40 }} />
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>Suite Name</TableCell>
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>Timestamp</TableCell>
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>Total Tests</TableCell>
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {backendReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No test reports generated yet. Run the Robot Framework pipeline.
                </TableCell>
              </TableRow>
            ) : (
              backendReports.map((row, i) => (
                <Row key={i} row={row} />
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
