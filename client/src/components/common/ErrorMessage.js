import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ErrorMessage = ({ 
  message = 'Something went wrong', 
  error = null, 
  showHomeButton = true,
  showRetryButton = false,
  onRetry = null
}) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        minHeight: '300px',
        textAlign: 'center',
      }}
    >
      <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
      <Typography variant="h5" color="error" sx={{ mt: 2 }}>
        {message}
      </Typography>
      
      {error && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {typeof error === 'string' ? error : error.message || JSON.stringify(error)}
        </Typography>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        {showHomeButton && (
          <Button variant="outlined" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        )}
        
        {showRetryButton && onRetry && (
          <Button variant="contained" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ErrorMessage;
