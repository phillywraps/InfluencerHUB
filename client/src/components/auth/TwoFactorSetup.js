import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { setAlert } from '../../redux/slices/alertSlice';

const TwoFactorSetup = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodesDialogOpen, setRecoveryCodesDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  
  const steps = ['Generate Secret', 'Verify Code', 'Save Recovery Codes'];
  
  useEffect(() => {
    // Reset state when component mounts
    setActiveStep(0);
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setRecoveryCodes([]);
  }, []);
  
  const handleGenerateSecret = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/users/enable-2fa');
      
      if (response.data.success) {
        setQrCode(response.data.data.qrCode);
        setSecret(response.data.data.secret);
        setActiveStep(1);
      }
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to generate 2FA secret'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      dispatch(setAlert({
        type: 'error',
        message: 'Please enter the verification code'
      }));
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/api/users/verify-2fa-setup', {
        token: verificationCode
      });
      
      if (response.data.success) {
        setRecoveryCodes(response.data.data.recoveryCodes);
        setActiveStep(2);
        // Show recovery codes dialog
        setRecoveryCodesDialogOpen(true);
      }
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to verify code'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    dispatch(setAlert({
      type: 'success',
      message: 'Secret copied to clipboard'
    }));
  };
  
  const handleCopyRecoveryCodes = () => {
    const formattedCodes = recoveryCodes.join('\n');
    navigator.clipboard.writeText(formattedCodes);
    dispatch(setAlert({
      type: 'success',
      message: 'Recovery codes copied to clipboard'
    }));
  };
  
  const handleDisable2FA = async () => {
    if (!password) {
      dispatch(setAlert({
        type: 'error',
        message: 'Please enter your password'
      }));
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/api/users/disable-2fa', {
        password,
        token: disableCode // Optional
      });
      
      if (response.data.success) {
        dispatch(setAlert({
          type: 'success',
          message: 'Two-factor authentication disabled successfully'
        }));
        
        // Close dialog and reset state
        setDisableDialogOpen(false);
        setPassword('');
        setDisableCode('');
        
        // Refresh user data
        // This would typically be handled by updating the auth state
        // For simplicity, we'll just reload the page
        window.location.reload();
      }
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to disable 2FA'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateNewRecoveryCodes = async () => {
    if (!password || !verificationCode) {
      dispatch(setAlert({
        type: 'error',
        message: 'Please enter your password and verification code'
      }));
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/api/users/generate-recovery-codes', {
        password,
        token: verificationCode
      });
      
      if (response.data.success) {
        setRecoveryCodes(response.data.data.recoveryCodes);
        setRecoveryCodesDialogOpen(true);
        setVerificationCode('');
        setPassword('');
        
        dispatch(setAlert({
          type: 'success',
          message: 'New recovery codes generated successfully'
        }));
      }
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to generate new recovery codes'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // Render setup stepper
  const renderSetupStepper = () => (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {activeStep === 0 && (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Set Up Two-Factor Authentication
          </Typography>
          <Typography variant="body1" paragraph>
            Two-factor authentication adds an extra layer of security to your account.
            Once enabled, you'll need to provide a verification code from your authenticator app
            in addition to your password when logging in.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateSecret}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
          >
            Begin Setup
          </Button>
        </Box>
      )}
      
      {activeStep === 1 && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Scan QR Code
          </Typography>
          <Typography variant="body1" paragraph>
            Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator).
            Alternatively, you can manually enter the secret key.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {qrCode && (
                <Box sx={{ textAlign: 'center' }}>
                  <img src={qrCode} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Manual Entry
                </Typography>
                <Typography variant="body2" paragraph>
                  If you can't scan the QR code, enter this key manually in your app:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    value={secret}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    size="small"
                  />
                  <IconButton onClick={handleCopySecret} color="primary">
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>
                Verify Setup
              </Typography>
              <Typography variant="body2" paragraph>
                Enter the 6-digit verification code from your authenticator app:
              </Typography>
              <TextField
                fullWidth
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleVerifyCode}
                disabled={loading || !verificationCode}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Verify & Enable'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {activeStep === 2 && (
        <Box sx={{ p: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Two-factor authentication has been successfully enabled for your account!
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Recovery Codes
          </Typography>
          <Typography variant="body1" paragraph>
            Save these recovery codes in a secure place. If you lose access to your authenticator app,
            you can use one of these one-time codes to sign in.
          </Typography>
          
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Recovery Codes
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyRecoveryCodes}
              >
                Copy All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
              <Grid container spacing={1}>
                {recoveryCodes.map((code, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Typography variant="mono" sx={{ fontFamily: 'monospace' }}>
                      {code}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            Each code can only be used once. Keep these codes safe and accessible, but separate from your
            authenticator app.
          </Alert>
          
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setRecoveryCodesDialogOpen(true)}
            startIcon={<VisibilityIcon />}
            sx={{ mr: 1 }}
          >
            View Recovery Codes
          </Button>
        </Box>
      )}
    </Box>
  );
  
  // Render manage 2FA section
  const renderManage2FA = () => (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Manage Two-Factor Authentication
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Two-factor authentication is currently enabled for your account.
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Generate New Recovery Codes
            </Typography>
            <Typography variant="body2" paragraph>
              If you've used up your recovery codes or want to generate new ones for security reasons,
              you can create a new set. This will invalidate all previous recovery codes.
            </Typography>
            
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              size="small"
            />
            
            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              margin="normal"
              variant="outlined"
              size="small"
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateNewRecoveryCodes}
              disabled={loading || !password || !verificationCode}
              sx={{ mt: 2 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Generate New Codes'}
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Disable Two-Factor Authentication
            </Typography>
            <Typography variant="body2" paragraph>
              Disabling two-factor authentication will remove this additional security layer from your account.
              You'll only need your password to log in.
            </Typography>
            <Typography variant="body2" paragraph color="error">
              Warning: This will make your account less secure.
            </Typography>
            
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDisableDialogOpen(true)}
              sx={{ mt: 2 }}
              fullWidth
            >
              Disable 2FA
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
  
  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        {user?.twoFactorEnabled ? renderManage2FA() : renderSetupStepper()}
      </Paper>
      
      {/* Recovery Codes Dialog */}
      <Dialog
        open={recoveryCodesDialogOpen}
        onClose={() => setRecoveryCodesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Recovery Codes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Save these recovery codes in a secure place. Each code can only be used once.
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyRecoveryCodes}
              >
                Copy All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              {recoveryCodes.map((code, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Typography variant="mono" sx={{ fontFamily: 'monospace' }}>
                        {code}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecoveryCodesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Disable 2FA Dialog */}
      <Dialog
        open={disableDialogOpen}
        onClose={() => setDisableDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Disabling two-factor authentication will make your account less secure.
          </Alert>
          
          <Typography variant="body2" paragraph>
            To confirm, please enter your password:
          </Typography>
          
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Current Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Typography variant="body2" paragraph sx={{ mt: 2 }}>
            Optionally, enter a verification code from your authenticator app:
          </Typography>
          
          <TextField
            fullWidth
            label="Verification Code (Optional)"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="Enter 6-digit code"
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDisable2FA}
            color="error"
            disabled={loading || !password}
          >
            {loading ? <CircularProgress size={24} /> : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TwoFactorSetup;
