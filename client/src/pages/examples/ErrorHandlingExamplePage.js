import React from 'react';
import { Box, Typography, Container, Paper, Button, Link } from '@mui/material';
import ProfileUpdateExample from '../../components/examples/ProfileUpdateExample';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useDispatch } from 'react-redux';
import { 
  setSuccessAlert, 
  setErrorAlert, 
  setInfoAlert, 
  setWarningAlert,
  setPersistentAlert,
  setAlertWithAction
} from '../../redux/slices/alertSlice';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Example page demonstrating the error handling and feedback system
 */
const ErrorHandlingExamplePage = () => {
  const dispatch = useDispatch();
  
  const showSuccessAlert = () => {
    dispatch(setSuccessAlert('This is a success message'));
  };
  
  const showErrorAlert = () => {
    dispatch(setErrorAlert('This is an error message'));
  };
  
  const showInfoAlert = () => {
    dispatch(setInfoAlert({
      title: 'Information',
      message: 'This is an informational message with a title'
    }));
  };
  
  const showWarningAlert = () => {
    dispatch(setWarningAlert('This is a warning message', 10000)); // 10s timeout
  };
  
  const showPersistentAlert = () => {
    dispatch(setPersistentAlert({
      type: 'error',
      title: 'Connection Lost',
      message: 'Your internet connection appears to be offline.'
    }));
  };
  
  const showActionAlert = () => {
    dispatch(setAlertWithAction(
      {
        type: 'info',
        title: 'New Feature Available',
        message: 'Would you like to try our new dashboard?'
      },
      {
        label: 'Try Now',
        onClick: () => alert('Feature would be enabled here'),
      }
    ));
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Error Handling & User Feedback Example
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page demonstrates our comprehensive error handling and user feedback system.
          You can test different alerts, simulate errors, and see how the system responds.
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Alert Examples
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            <Button variant="contained" color="success" onClick={showSuccessAlert}>
              Success Alert
            </Button>
            
            <Button variant="contained" color="error" onClick={showErrorAlert}>
              Error Alert
            </Button>
            
            <Button variant="contained" color="info" onClick={showInfoAlert}>
              Info Alert with Title
            </Button>
            
            <Button variant="contained" color="warning" onClick={showWarningAlert}>
              Warning Alert (10s)
            </Button>
            
            <Button variant="contained" onClick={showPersistentAlert}>
              Persistent Alert
            </Button>
            
            <Button variant="contained" color="secondary" onClick={showActionAlert}>
              Alert with Action
            </Button>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Documentation
          </Typography>
          
          <Typography variant="body2" paragraph>
            The full error handling and feedback system is documented in{' '}
            <Link component={RouterLink} to="/docs/error-handling" target="_blank">
              the error handling documentation
            </Link>.
          </Typography>
        </Paper>
        
        <ErrorBoundary fallbackMessage="Error in the example page">
          <ProfileUpdateExample />
        </ErrorBoundary>
      </Box>
    </Container>
  );
};

export default ErrorHandlingExamplePage;
