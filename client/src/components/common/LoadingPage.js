import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * LoadingPage component
 * 
 * A full-page loading indicator to display when lazy-loading components
 */
const LoadingPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Loading...
      </Typography>
    </Box>
  );
};

export default LoadingPage;
