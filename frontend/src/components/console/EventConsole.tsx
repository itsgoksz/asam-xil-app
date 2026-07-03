import { Box, Typography, IconButton } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';

export interface ConsoleEvent {
  time: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'PASS';
  message: string;
}

interface EventConsoleProps {
  events: ConsoleEvent[];
}

export function EventConsole({ events }: EventConsoleProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'INFO': return '#3B82F6'; // primary
      case 'WARNING': return '#FBBF24'; // warning
      case 'ERROR': return '#F87171'; // error
      case 'PASS': return '#34D399'; // success
      default: return '#9CA3AF';
    }
  };

  return (
    <Box sx={{ 
      height: isMinimized ? 40 : 200, 
      borderTop: 1, 
      borderColor: 'divider',
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      transition: 'height 0.2s'
    }}>
      {/* Header / Handle */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          px: 2, 
          py: 0.5, 
          borderBottom: isMinimized ? 0 : 1, 
          borderColor: 'divider',
          bgcolor: '#1E293B',
          cursor: 'pointer'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: 1 }}>EVENT CONSOLE</Typography>
        <IconButton size="small" sx={{ p: 0 }}>
          {isMinimized ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
        </IconButton>
      </Box>

      {/* Content */}
      {!isMinimized && (
        <Box ref={scrollRef} sx={{ flexGrow: 1, p: 1, overflowY: 'auto', fontFamily: 'monospace' }}>
          {/* Table Header */}
          <Box sx={{ display: 'flex', gap: 2, px: 2, py: 1, borderBottom: 1, borderColor: '#252C36' }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 80, fontSize: '0.75rem' }}>TIME</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: 80, fontSize: '0.75rem' }}>SEVERITY</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, fontSize: '0.75rem' }}>MESSAGE</Typography>
          </Box>
          
          {/* Event Rows */}
          {events.map((evt, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, px: 2, py: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 80, fontSize: '0.8rem' }}>{evt.time}</Typography>
              <Typography variant="body2" sx={{ width: 80, fontSize: '0.8rem', color: getSeverityColor(evt.severity) }}>
                {evt.severity}
              </Typography>
              <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '0.8rem' }}>{evt.message}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
