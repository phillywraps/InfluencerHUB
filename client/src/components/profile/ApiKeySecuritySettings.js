import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { 
  getApiKeySecuritySettings, 
  updateApiKeyRotationSettings, 
  rotateApiKey 
} from '../../redux/slices/influencerSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ApiKeySecuritySettings = ({ socialAccountId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    apiKeySecuritySettings, 
    loading, 
    error,
    rotationSuccess,
    updateSuccess
  } = useSelector((state) => state.influencer);

  // Local state
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [intervalDays, setIntervalDays] = useState(90);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(7);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load API key security settings
  useEffect(() => {
    if (socialAccountId && user) {
      dispatch(getApiKeySecuritySettings({ socialAccountId }));
    }
  }, [dispatch, socialAccountId, user]);

  // Update local state when settings are loaded
  useEffect(() => {
    if (apiKeySecuritySettings && apiKeySecuritySettings.rotationSchedule) {
      const { rotationSchedule } = apiKeySecuritySettings;
      setRotationEnabled(rotationSchedule.isEnabled);
      setAutoRotate(rotationSchedule.autoRotate);
      setIntervalDays(rotationSchedule.intervalDays);
      setNotifyDaysBefore(rotationSchedule.notifyDaysBefore);
    }
  }, [apiKeySecuritySettings]);

  // Show success message when rotation or update is successful
  useEffect(() => {
    if (rotationSuccess) {
      setSuccessMessage('API key has been successfully rotated.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } else if (updateSuccess) {
      setSuccessMessage('API key rotation settings have been updated.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [rotationSuccess, updateSuccess]);

  // Handle save settings
  const handleSaveSettings = () => {
    dispatch(updateApiKeyRotationSettings({
      socialAccountId,
      settings: {
        isEnabled: rotationEnabled,
        autoRotate,
        intervalDays,
        notifyDaysBefore
      }
    }));
  };

  // Handle manual rotation
  const handleRotateApiKey = () => {
    dispatch(rotateApiKey({ socialAccountId }));
    setRotateDialogOpen(false);
  };

  // Calculate next rotation date
  const getNextRotationDate = () => {
    if (!apiKeySecuritySettings || !apiKeySecuritySettings.rotationSchedule) {
      return 'Not scheduled';
    }
    
    const { nextRotationDate } = apiKeySecuritySettings.rotationSchedule;
    if (!nextRotationDate) return 'Not scheduled';
    
    return new Date(nextRotationDate).toLocaleDateString();
  };

  // Get days until next rotation
  const getDaysUntilRotation = () => {
    if (!apiKeySecuritySettings || !apiKeySecuritySettings.rotationSchedule || !apiKeySecuritySettings.rotationSchedule.nextRotationDate) {
      return null;
    }
    
    const now = new Date();
    const nextRotation = new Date(apiKeySecuritySettings.rotationSchedule.nextRotationDate);
    const diffTime = nextRotation - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get rotation status chip
  const getRotationStatusChip = () => {
    const daysUntil = getDaysUntilRotation();
    
    if (daysUntil === null) {
      return <Chip label="Not Scheduled" color="default" />;
    } else if (daysUntil <= 0) {
      return <Chip label="Rotation Due" color="error" icon={<WarningIcon />} />;
    } else if (daysUntil <= 7) {
      return <Chip label={`Due in ${daysUntil} days`} color="warning" />;
    } else {
      return <Chip label={`Due in ${daysUntil} days`} color="success" icon={<CheckCircleIcon />} />;
    }
  };

  if (loading && !apiKeySecuritySettings) {
    return <LoadingSpinner />;
  }

  if (error && !apiKeySecuritySettings) {
    return (
      <ErrorMessage
        message="Failed to load API key security settings"
        error={error}
        showRetryButton
        onRetry={() => dispatch(getApiKeySecuritySettings({ socialAccountId }))}
      />
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SecurityIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">API Key Security Settings</Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Current API Key Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Current API Key Information
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Key ID
            </Typography>
            <Typography variant="body1">
              {apiKeySecuritySettings?.keyId || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Version
            </Typography>
            <Typography variant="body1">
              {apiKeySecuritySettings?.version || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Last Rotated
            </Typography>
            <Typography variant="body1">
              {apiKeySecuritySettings?.lastRotatedAt 
                ? new Date(apiKeySecuritySettings.lastRotatedAt).toLocaleDateString() 
                : 'Never'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Expires On
            </Typography>
            <Typography variant="body1">
              {apiKeySecuritySettings?.expiresAt 
                ? new Date(apiKeySecuritySettings.expiresAt).toLocaleDateString() 
                : 'N/A'}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => setRotateDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Rotate API Key Now
          </Button>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Rotating your API key will invalidate the old key and generate a new one.
            All active rentals will be updated automatically.
          </Typography>
        </Grid>
        
        {/* Rotation Settings */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Automatic Rotation Settings
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={rotationEnabled}
                  onChange={(e) => setRotationEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Enable automatic key rotation"
            />
            
            <Typography variant="body2" color="text.secondary">
              Regularly rotating your API keys is a security best practice.
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth disabled={!rotationEnabled}>
              <InputLabel id="interval-days-label">Rotation Interval</InputLabel>
              <Select
                labelId="interval-days-label"
                id="interval-days"
                value={intervalDays}
                label="Rotation Interval"
                onChange={(e) => setIntervalDays(e.target.value)}
              >
                <MenuItem value={30}>Every 30 days</MenuItem>
                <MenuItem value={60}>Every 60 days</MenuItem>
                <MenuItem value={90}>Every 90 days</MenuItem>
                <MenuItem value={180}>Every 180 days</MenuItem>
                <MenuItem value={365}>Every 365 days</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth disabled={!rotationEnabled}>
              <InputLabel id="notify-days-label">Notification Days Before</InputLabel>
              <Select
                labelId="notify-days-label"
                id="notify-days"
                value={notifyDaysBefore}
                label="Notification Days Before"
                onChange={(e) => setNotifyDaysBefore(e.target.value)}
              >
                <MenuItem value={1}>1 day before</MenuItem>
                <MenuItem value={3}>3 days before</MenuItem>
                <MenuItem value={7}>7 days before</MenuItem>
                <MenuItem value={14}>14 days before</MenuItem>
                <MenuItem value={30}>30 days before</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                  color="primary"
                  disabled={!rotationEnabled}
                />
              }
              label="Automatically rotate key on schedule"
            />
            
            <Typography variant="body2" color="text.secondary">
              If disabled, you'll receive a notification but will need to manually rotate the key.
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Next scheduled rotation:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                {getNextRotationDate()}
              </Typography>
              {getRotationStatusChip()}
            </Box>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSettings}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Settings'}
          </Button>
        </Grid>
      </Grid>
      
      {/* Rotate API Key Dialog */}
      <Dialog
        open={rotateDialogOpen}
        onClose={() => setRotateDialogOpen(false)}
      >
        <DialogTitle>Rotate API Key</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to rotate your API key? This will invalidate the current key and generate a new one.
            All active rentals will be updated automatically to use the new key.
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. Make sure all your systems are prepared for this change.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRotateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRotateApiKey} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Rotate Key'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ApiKeySecuritySettings;
