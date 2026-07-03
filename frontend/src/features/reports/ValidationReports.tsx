import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';

interface ValidationReportsProps {
  reports: any[];
}

export function ValidationReports({ reports }: ValidationReportsProps) {
  return (
    <Box sx={{ p: 4, height: '100%', maxWidth: 1000, margin: '0 auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
        Validation Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Immutable audit log of all automated test executions against the digital twin.
      </Typography>

      <Paper sx={{ bgcolor: '#111827', border: '1px solid #1f2937', borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1f2937' }}>
            <TableRow>
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>Test Name</TableCell>
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>Timestamp</TableCell>
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: '#9ca3af', fontWeight: 600 }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No test reports generated yet. Run the Robot Framework pipeline.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((r, i) => (
                <TableRow key={i} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: '#1e293b' } }}>
                  <TableCell sx={{ color: '#f3f4f6', fontWeight: 500 }}>{r.test_name}</TableCell>
                  <TableCell sx={{ color: '#9ca3af' }}>{r.timestamp.toFixed(2)}s</TableCell>
                  <TableCell>
                    <Chip 
                      label={r.passed ? 'PASS' : 'FAIL'} 
                      color={r.passed ? 'success' : 'error'} 
                      size="small" 
                      sx={{ fontWeight: 700, borderRadius: 1 }} 
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontSize: 13 }}>{r.details}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
