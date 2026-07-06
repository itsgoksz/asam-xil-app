import { Typography, Button, Dialog, Box } from '@mui/material';
import { CheckCircleOutlined, Navigation } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface SimulationCompleteModalProps {
  open: boolean;
  onReturn: () => void;
}

export function SimulationCompleteModal({ open, onReturn }: SimulationCompleteModalProps) {
  return (
    <Dialog 
      open={open}
      sx={{ '& .MuiDialog-paper': { backgroundColor: 'transparent', boxShadow: 'none' } }}
    >
      <Box sx={{
        background: 'rgba(13, 17, 23, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        p: 4,
        minWidth: 400,
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <CheckCircleOutlined sx={{ fontSize: 64, color: '#34d399', mb: 2 }} />
          
          <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 600, mb: 1, letterSpacing: '0.02em' }}>
            Simulation Complete
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>
            The autonomous script has finished executing against the physical digital twin.
          </Typography>
          
          <Button
            fullWidth
            variant="contained"
            onClick={onReturn}
            endIcon={<Navigation />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              bgcolor: '#2563EB',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': { bgcolor: '#1D4ED8' }
            }}
          >
            Return to Copilot
          </Button>
        </motion.div>
      </Box>
    </Dialog>
  );
}
