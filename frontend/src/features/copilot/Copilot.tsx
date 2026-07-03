import { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, IconButton, Paper, Avatar } from '@mui/material';
import { Send, SmartToy } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

interface CopilotProps {
  telemetry: any;
}

export function Copilot({ telemetry }: CopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'ai', text: 'Hello Engineer. I am your Engineering Copilot. How can I assist you with this simulation run today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response generation based on context
    setTimeout(() => {
      let response = "I'm analyzing the telemetry...";
      const lower = userMsg.toLowerCase();
      
      if (lower.includes('speed') || lower.includes('rpm')) {
        response = `The vehicle is currently travelling at ${telemetry?.vehicle_speed_kmh?.toFixed(1) || 0} km/h with a motor speed of ${telemetry?.rpm?.toFixed(0) || 0} RPM.`;
      } else if (lower.includes('fault') || lower.includes('brake')) {
        if (telemetry?.brake_pressure_bar === 0 && telemetry?.vehicle_speed_kmh > 0) {
          response = `It appears brake pressure is at 0 bar while the vehicle is moving. If a brake command was issued, this indicates a potential brake line failure or hydraulic leak.`;
        } else {
          response = `Brake system pressure is currently at ${telemetry?.brake_pressure_bar?.toFixed(1) || 0} bar.`;
        }
      } else if (lower.includes('summarize')) {
        response = `Current run summary: SOC is at ${telemetry?.battery_soc?.toFixed(1) || 100}%, Motor Temp is stable at ${telemetry?.motor_temp_c?.toFixed(1) || 35}°C. No critical thresholds crossed.`;
      } else {
        response = "I have correlated your query with the current ASAM XIL simulation data. Everything appears to be operating within defined safety margins.";
      }

      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 800, margin: '0 auto', p: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <SmartToy />
        </Avatar>
        <Box>
          <Typography variant="h6">Engineering Copilot</Typography>
          <Typography variant="body2" color="text.secondary">Context-Aware AI Assistant</Typography>
        </Box>
      </Box>

      <Paper sx={{ flexGrow: 1, bgcolor: '#1A1F29', border: '1px solid #252C36', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}
              >
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: m.sender === 'user' ? 'primary.main' : '#252C36',
                  color: '#F3F4F6',
                  boxShadow: m.sender === 'user' ? '0 4px 14px rgba(59, 130, 246, 0.2)' : 'none',
                  border: m.sender === 'ai' ? '1px solid #374151' : 'none'
                }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{m.text}</Typography>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 2 }}>Copilot is analyzing telemetry...</Typography>
            </motion.div>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid #252C36', display: 'flex', gap: 2, bgcolor: '#111827' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about RPM spikes, summarize the run, or explain a fault..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                bgcolor: '#1A1F29',
                '& fieldset': { borderColor: '#252C36' },
                '&:hover fieldset': { borderColor: 'primary.main' },
              } 
            }}
          />
          <IconButton onClick={handleSend} color="primary" sx={{ bgcolor: 'rgba(59,130,246,0.1)', borderRadius: 2, px: 2 }}>
            <Send />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
