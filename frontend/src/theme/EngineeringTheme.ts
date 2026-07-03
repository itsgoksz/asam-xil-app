import { createTheme } from '@mui/material/styles';

export const engineeringTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000', // Pitch black for OLED / sleek tech feel
      paper: 'rgba(15, 15, 20, 0.6)', // Glassmorphic frosted dark
    },
    primary: {
      main: '#00E5FF', // Electric neon blue for a futuristic touch
    },
    error: {
      main: '#FF3B30', // Apple-esque bright red
    },
    warning: {
      main: '#FF9F0A', // Apple-esque amber
    },
    success: {
      main: '#32D74B', // Apple-esque green
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.2rem',
      letterSpacing: '-0.02em',
    },
    body2: {
      fontSize: '0.85rem',
      letterSpacing: '0.01em',
    }
  },
  shape: {
    borderRadius: 12, // Smooth, modern rounded corners like iOS
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)', // Glassmorphism!
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)', 
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #252C36',
          boxShadow: 'none',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #252C36',
          padding: '8px 16px',
        }
      }
    }
  },
});
