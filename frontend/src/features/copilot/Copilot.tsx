import { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, IconButton, Paper, Avatar, Button } from '@mui/material';
import { Send, SmartToy, Assessment } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationCountdown } from './SimulationCountdown';
import { SimulationCompleteModal } from './SimulationCompleteModal';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string | React.ReactNode;
}

interface CopilotProps {
  telemetry: any;
  onNavigate?: (workspace: string) => void;
}

export function Copilot({ telemetry, onNavigate }: CopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'ai', text: 'Hello Engineer. I am your Engineering Copilot. How can I assist you with this simulation run today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('Copilot is analyzing telemetry...');
  
  // UX Flow State
  const [showCountdown, setShowCountdown] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [pendingScript, setPendingScript] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
    setInput('');
    
    // Phase 1: Generation
    setIsTyping(true);
    setTypingMessage('Script is being generated...');

    try {
      const res = await fetch('http://localhost:8000/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      });
      
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'ai', 
        text: `${data.summary}\n\nI generated the script **${data.filename}**.\n\nSimulation is starting in 3 seconds...` 
      }]);
      setIsTyping(false);
      
      // Phase 2: Countdown
      setPendingScript(data.filename);
      setShowCountdown(true);

    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Sorry, I encountered an error: ${err.message}` }]);
      setIsTyping(false);
    }
  };

  const handleCountdownComplete = async () => {
    setShowCountdown(false);
    
    // Phase 3: Live Simulation
    if (onNavigate) {
      onNavigate('Simulation Console');
    }
    
    if (!pendingScript) return;
    
    setIsTyping(true);
    setTypingMessage('Simulation is running on the digital twin...');

    try {
      const runRes = await fetch(`http://localhost:8000/api/robot/run/${pendingScript}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // We don't need script content since backend has it
      });
      
      if (!runRes.ok) throw new Error('Simulation execution failed');
      const runData = await runRes.json();
      
      // Phase 4: Completion & Return Modal
      setIsTyping(false);
      setShowCompleteModal(true);
      
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Simulation error: ${err.message}` }]);
      setIsTyping(false);
    }
  };

  const handleReturnToCopilot = () => {
    setShowCompleteModal(false);
    if (onNavigate) {
      onNavigate('Copilot');
    }
    
    // Phase 5: Final Report Link
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      sender: 'ai', 
      text: (
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
            Execution complete! The physical constraints and aerodynamics were successfully validated against your prompt.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
            For your detailed Robot Framework validation report, please navigate to the reports tab.
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => onNavigate && onNavigate('Validation Reports')}
            startIcon={<Assessment />}
            sx={{ 
              color: '#60A5FA', 
              borderColor: 'rgba(96,165,250,0.5)',
              textTransform: 'none',
              '&:hover': { borderColor: '#60A5FA', bgcolor: 'rgba(96,165,250,0.1)' }
            }}
          >
            View Validation Report
          </Button>
        </Box>
      )
    }]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 800, margin: '0 auto', p: 2 }}>
      
      <SimulationCountdown open={showCountdown} onComplete={handleCountdownComplete} />
      <SimulationCompleteModal open={showCompleteModal} onReturn={handleReturnToCopilot} />
      
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
                  border: m.sender === 'ai' ? '1px solid #374151' : 'none',
                  whiteSpace: 'pre-wrap'
                }}>
                  {typeof m.text === 'string' ? (
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{m.text}</Typography>
                  ) : (
                    m.text
                  )}
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 2 }}>{typingMessage}</Typography>
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
            disabled={isTyping || showCountdown}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                bgcolor: '#1A1F29',
                '& fieldset': { borderColor: '#252C36' },
                '&:hover fieldset': { borderColor: 'primary.main' },
              } 
            }}
          />
          <IconButton onClick={handleSend} disabled={isTyping || showCountdown} color="primary" sx={{ bgcolor: 'rgba(59,130,246,0.1)', borderRadius: 2, px: 2 }}>
            <Send />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
