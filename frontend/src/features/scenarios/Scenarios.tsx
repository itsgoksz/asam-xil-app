import { Box, Typography, Card, CardActionArea, CardContent } from '@mui/material';
import { motion } from 'framer-motion';

interface ScenariosProps {
  loadScenario: (id: string) => void;
}

const scenarios = [
  { id: 'Highway', title: 'Highway Driving', speed: '80-120 km/h', duration: '15 min', battery: 'Medium' },
  { id: 'City', title: 'City Driving', speed: '20-50 km/h', duration: '30 min', battery: 'Low' },
  { id: 'EmergencyBrake', title: 'Emergency Brake', speed: '0 km/h', duration: '1 min', battery: 'High' }
];

export function Scenarios({ loadScenario }: ScenariosProps) {
  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Scenario Profiles</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Select a predefined simulation profile to instantly apply state transitions to the digital twin.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {scenarios.map((s) => (
          <motion.div key={s.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card 
              sx={{ 
                bgcolor: '#1E293B', 
                border: '1px solid #252C36',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)' }
              }}
            >
              <CardActionArea onClick={() => loadScenario(s.id)} sx={{ p: 2 }}>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                    {s.title}
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Expected Speed</Typography>
                      <Typography variant="body2">{s.speed}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Duration</Typography>
                      <Typography variant="body2">{s.duration}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Battery Usage</Typography>
                      <Typography variant="body2">{s.battery}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
}
