import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Link,
  Tabs,
  Tab
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { setAlert } from '../../redux/slices/alertSlice';
import { login } from '../../redux/slices/authSlice';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`two-factor-tabpanel-${index}`}
      aria-labelledby={`two-factor-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TwoFactorVerification = ({ tempToken, onCancel }) => {
  const dispatch = useDispatch();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };
  
  const handleVerifyCode = async () => {
    if (!verificationCode && tabValue === 0) {
      setError('Please enter the verification code');
      return;
    }
    
    if (!recoveryCode && tabValue === 1) {
      setError('Please enter a recovery code');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/api/users/verify-2fa', {
        tempToken,
        twoFactorCode: tabValue === 0 ? verificationCode : undefined,
        recoveryCode: tabValue === 1 ? recoveryCode : undefined
      });
      
      if (response.data.success) {
        // Update auth state with the user data and token
        dispatch(login(response.data.data));
        
        dispatch(setAlert({
          type: 'success',
          message: 'Two-factor authentication successful'
        }));
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <SecurityIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Two-Factor Authentication
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your account is protected with two-factor authentication.
          Please enter the verification code from your authenticator app.
        </Typography>
      </Box>
      
      <Divider />
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Authenticator App" icon={<SecurityIcon />} iconPosition="start" />
        <Tab label="Recovery Code" icon={<KeyIcon />} iconPosition="start" />
      </Tabs>
      
      {error && (
        <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
          {error}
        </Alert>
      )}
      
      <TabPanel value={tabValue} index={0}>
        <Typography variant="subtitle1" gutterBottom>
          Enter the 6-digit code from your authenticator app
        </Typography>
        
        <TextField
          fullWidth
          label="Verification Code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter 6-digit code"
          variant="outlined"
          sx={{ mb: 3 }}
          autoFocus
          inputProps={{ maxLength: 6 }}
        />
        
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleVerifyCode}
          disabled={loading || !verificationCode}
        >
          {loading ? <CircularProgress size={24} /> : 'Verify'}
        </Button>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="subtitle1" gutterBottom>
          Enter one of your recovery codes
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          If you've lost access to your authenticator app, you can use one of the recovery codes
          you saved when setting up two-factor authentication.
        </Typography>
        
        <TextField
          fullWidth
          label="Recovery Code"
          value={recoveryCode}
          onChange={(e) => setRecoveryCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX"
          variant="outlined"
          sx={{ mb: 3 }}
          autoFocus
        />
        
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleVerifyCode}
          disabled={loading || !recoveryCode}
        >
          {loading ? <CircularProgress size={24} /> : 'Verify'}
        </Button>
      </TabPanel>
      
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Link
          component="button"
          variant="body2"
          onClick={onCancel}
          sx={{ textDecoration: 'none' }}
        >
          Cancel and return to login
        </Link>
      </Box>
    </Paper>
  );
};

export default TwoFactorVerification;
