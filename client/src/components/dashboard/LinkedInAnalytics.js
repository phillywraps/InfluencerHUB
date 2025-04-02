import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  useTheme,
} from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

/**
 * LinkedIn Analytics Dashboard Component
 * Displays analytics data from LinkedIn API
 */
const LinkedInAnalytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(false);
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LinkedInIcon sx={{ color: '#0A66C2', mr: 1, fontSize: 28 }} />
        <Typography variant="h5">LinkedIn Analytics</Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ my: 3 }}>
          <Typography variant="body1" paragraph>
            LinkedIn Analytics provides insights into your LinkedIn profile and company pages performance,
            including engagement metrics, audience demographics, and content performance.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Connect your LinkedIn account through the profile settings to access detailed analytics
            for your professional network presence.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary"
            sx={{ 
              bgcolor: '#0A66C2', 
              '&:hover': { bgcolor: '#084482' } 
            }}
          >
            Connect LinkedIn Account
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default LinkedInAnalytics;
