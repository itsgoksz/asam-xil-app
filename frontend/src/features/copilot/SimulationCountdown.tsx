import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface SimulationCountdownProps {
  open: boolean;
  onComplete: () => void;
}

export function SimulationCountdown({ open, onComplete }: SimulationCountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (open) {
      setCount(3);
      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => onComplete(), 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open, onComplete]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Animated SVG Car Loader - Minimalist / Tesla Vibe */}
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1, scale: [1, 1.05, 1] }}
            transition={{ duration: 1, type: "spring", bounce: 0.5 }}
            exit={{ x: 200, opacity: 0, transition: { duration: 0.5 } }}
          >
            <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Car Body */}
              <motion.path 
                d="M30 50 L45 25 Q 55 20 70 20 L 130 20 Q 145 20 160 30 L 175 50 L 185 50 Q 195 50 195 60 L 195 65 Q 195 70 185 70 L 15 70 Q 5 70 5 60 L 5 50 Z" 
                fill="rgba(255,255,255,0.05)" 
                stroke="#60A5FA" 
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              {/* Wheels */}
              <circle cx="45" cy="70" r="12" fill="#0A0E17" stroke="#60A5FA" strokeWidth="2" />
              <circle cx="155" cy="70" r="12" fill="#0A0E17" stroke="#60A5FA" strokeWidth="2" />
              {/* Wheel Spokes (Spinning) */}
              <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ originX: '45px', originY: '70px' }}>
                 <line x1="45" y1="58" x2="45" y2="82" stroke="#60A5FA" strokeWidth="2"/>
                 <line x1="33" y1="70" x2="57" y2="70" stroke="#60A5FA" strokeWidth="2"/>
              </motion.g>
              <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ originX: '155px', originY: '70px' }}>
                 <line x1="155" y1="58" x2="155" y2="82" stroke="#60A5FA" strokeWidth="2"/>
                 <line x1="143" y1="70" x2="167" y2="70" stroke="#60A5FA" strokeWidth="2"/>
              </motion.g>
              {/* Glowing Headlight */}
              <motion.path 
                d="M175 50 L190 50 L185 60 L170 60 Z" 
                fill="#fff" 
                filter="drop-shadow(0px 0px 8px #fff)"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </svg>
          </motion.div>

          <Typography 
            sx={{ 
              mt: 4, 
              color: '#e2e8f0', 
              fontSize: '1.5rem', 
              fontWeight: 300, 
              letterSpacing: '0.1em',
              fontFamily: '"Inter", sans-serif'
            }}
          >
            SIMULATION STARTING IN
          </Typography>
          
          <motion.div
            key={count}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 1.2 }}
            transition={{ duration: 0.3 }}
          >
            <Typography 
              sx={{ 
                color: '#60A5FA', 
                fontSize: '5rem', 
                fontWeight: 700, 
                textShadow: '0 0 40px rgba(96,165,250,0.4)',
                fontFamily: '"JetBrains Mono", monospace'
              }}
            >
              {count > 0 ? count : 'GO'}
            </Typography>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
