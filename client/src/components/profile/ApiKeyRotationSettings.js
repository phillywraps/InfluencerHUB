import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  CircularProgress,
  InputLabel,
  Tooltip,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  AlertTitle,
  Card,
  CardContent,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import SecurityIcon from '@mui/icons-material/Security';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import KeyIcon from '@mui/icons-material/Key';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShieldIcon from '@mui/icons-material/Shield';

/**
 * Component for managing API key rotation settings and security
 * 
 * Features:
 * - Scheduled key rotation
 * - IP restrictions
 * - Usage audit logs
 * - Breach detection
 * - Secure confirmation for critical actions
 */
const ApiKeyRotationSettings = ({ 
  onSave, 
  initialSettings, 
  platformId, 
  platformName,
  onRotate,
  auditLogs = [] 
}) => {
  // Theme for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Default settings
  const defaultSettings = {
    enabled: false,
    frequency: 30, // days
    notifyBefore: 7, // days
    autoRotate: false,
    notifyOnRotation: true,
    ipRestriction: false,
    allowedIps: [],
    breachDetection: false,
    logRetention: 90, // days
    lastRotated: null,
  };

  // Component state
  const [settings, setSettings] = useState(initialSettings || defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSecurityTab, setShowSecurityTab] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  
  // IP restriction state
  const [newIp, setNewIp] = useState('');

  // Update settings when initialSettings change
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  // Handle toggle for enabling rotation
  const handleEnableToggle = (event) => {
    setSettings({
      ...settings,
      enabled: event.target.checked,
    });
  };

  // Handle toggle for auto-rotation
  const handleAutoRotateToggle = (event) => {
    setSettings({
      ...settings,
      autoRotate: event.target.checked,
    });
  };

  // Handle toggle for rotation notifications
  const handleNotifyToggle = (event) => {
    setSettings({
      ...settings,
      notifyOnRotation: event.target.checked,
    });
  };
  
  // Handle toggle for IP restriction
  const handleIpRestrictionToggle = (event) => {
    setSettings({
      ...settings,
      ipRestriction: event.target.checked,
    });
  };
  
  // Handle toggle for breach detection
  const handleBreachDetectionToggle = (event) => {
    setSettings({
      ...settings,
      breachDetection: event.target.checked,
    });
  };

  // Handle frequency change
  const handleFrequencyChange = (event) => {
    setSettings({
      ...settings,
      frequency: event.target.value,
    });
  };

  // Handle notification days change
  const handleNotifyBeforeChange = (event) => {
    let value = parseInt(event.target.value);
    
    // Ensure value is a positive number and less than frequency
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value >= settings.frequency) {
      value = settings.frequency - 1;
    }
    
    setSettings({
      ...settings,
      notifyBefore: value,
    });
  };
  
  // Handle log retention change
  const handleLogRetentionChange = (event) => {
    setSettings({
      ...settings,
      logRetention: parseInt(event.target.value),
    });
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Check if security settings have changed
    const hasSecurityChanges = 
      settings.ipRestriction !== (initialSettings?.ipRestriction || defaultSettings.ipRestriction) ||
      settings.breachDetection !== (initialSettings?.breachDetection || defaultSettings.breachDetection);
    
    // If security settings have changed, confirm with password
    if (hasSecurityChanges) {
      setConfirmAction('save');
      setConfirmDialogOpen(true);
      return;
    }
    
    // Otherwise proceed with normal save
    executeSubmit();
  };
  
  // Execute the save operation (after confirmation if needed)
  const executeSubmit = async () => {
    setLoading(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      // Call the onSave callback with the current settings
      if (onSave) {
        await onSave(platformId, settings);
      }
      
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to save rotation settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual rotation with confirmation
  const handleManualRotate = () => {
    setConfirmAction('rotate');
    setConfirmDialogOpen(true);
  };
  
  // Execute confirmed rotation
  const executeManualRotate = async () => {
    setLoading(true);
    try {
      if (onRotate) {
        await onRotate(platformId);
      }
      
      // Update last rotated date
      setSettings({
        ...settings,
        lastRotated: new Date().toISOString(),
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to rotate API key');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle IP address operations
  const addIpAddress = () => {
    if (!newIp || !validateIpAddress(newIp)) return;
    
    if (!settings.allowedIps.includes(newIp)) {
      setSettings({
        ...settings,
        allowedIps: [...settings.allowedIps, newIp],
      });
    }
    
    setNewIp('');
  };
  
  const removeIpAddress = (ip) => {
    setSettings({
      ...settings,
      allowedIps: settings.allowedIps.filter(item => item !== ip),
    });
  };
  
  // IP address validation
  const validateIpAddress = (ip) => {
    // Basic IPv4 validation
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);
    
    if (!match) return false;
    
    // Validate each octet
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i]);
      if (octet < 0 || octet > 255) return false;
    }
    
    return true;
  };

  // Toggle advanced settings
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };
  
  // Toggle security tab
  const toggleSecurityTab = () => {
    setShowSecurityTab(!showSecurityTab);
  };
  
  // Toggle audit log
  const toggleAuditLog = () => {
    setShowAuditLog(!showAuditLog);
  };
  
  // Handle confirmation dialog actions
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmPassword('');
    setConfirmError('');
  };
  
  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  };
  
  const handleConfirmAction = () => {
    // In a real app, you would validate the password properly
    if (confirmPassword.length < 1) {
      setConfirmError('Please enter your password to confirm');
      return;
    }
    
    // Close dialog
    setConfirmDialogOpen(false);
    setConfirmPassword('');
    
    // Execute the confirmed action
    if (confirmAction === 'rotate') {
      executeManualRotate();
    } else if (confirmAction === 'save') {
      executeSubmit();
    }
  };

  // Format last rotation date
  const formatLastRotated = () => {
    if (!settings.lastRotated) {
      return 'Never';
    }
    
    return new Date(settings.lastRotated).toLocaleDateString();
  };

  // Calculate next rotation date
  const calculateNextRotation = () => {
    if (!settings.enabled || !settings.lastRotated) {
      return 'Not scheduled';
    }
    
    const lastRotated = new Date(settings.lastRotated);
    const nextRotation = new Date(lastRotated);
    nextRotation.setDate(lastRotated.getDate() + settings.frequency);
    
    return nextRotation.toLocaleDateString();
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          API Key Security Settings
          {platformName && (
            <Chip 
              label={platformName} 
              size="small" 
              color="primary" 
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
      </Box>
      
      {/* Tabs for Rotation and Security */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={1}>
          <Grid item>
            <Button 
              variant={!showSecurityTab ? "contained" : "outlined"}
              startIcon={<AutorenewIcon />}
              onClick={() => setShowSecurityTab(false)}
              size="small"
            >
              Key Rotation
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={showSecurityTab ? "contained" : "outlined"}
              startIcon={<ShieldIcon />}
              onClick={() => setShowSecurityTab(true)}
              size="small"
            >
              Access Security
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={showAuditLog ? "contained" : "outlined"}
              startIcon={<ListAltIcon />}
              onClick={toggleAuditLog}
              size="small"
            >
              Audit Log
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Key Information - always visible */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <KeyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Key Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Last Rotated:</strong> {formatLastRotated()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Next Rotation:</strong> {calculateNextRotation()}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Rotation Settings Tab */}
          {!showSecurityTab && !showAuditLog && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AutorenewIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Rotation Settings
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enabled}
                          onChange={handleEnableToggle}
                          color="primary"
                        />
                      }
                      label="Enable API Key Rotation"
                    />
                    <Tooltip title="When enabled, your API key will be rotated according to the specified frequency">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  
                  {settings.enabled && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="frequency-select-label">Rotation Frequency</InputLabel>
                          <Select
                            labelId="frequency-select-label"
                            id="frequency-select"
                            value={settings.frequency}
                            label="Rotation Frequency"
                            onChange={handleFrequencyChange}
                          >
                            <MenuItem value={7}>Weekly (7 days)</MenuItem>
                            <MenuItem value={14}>Bi-weekly (14 days)</MenuItem>
                            <MenuItem value={30}>Monthly (30 days)</MenuItem>
                            <MenuItem value={90}>Quarterly (90 days)</MenuItem>
                            <MenuItem value={180}>Semi-annually (180 days)</MenuItem>
                            <MenuItem value={365}>Annually (365 days)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Notify Before (days)"
                          type="number"
                          value={settings.notifyBefore}
                          onChange={handleNotifyBeforeChange}
                          InputProps={{ inputProps: { min: 1, max: settings.frequency - 1 } }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Button variant="outlined" size="small" onClick={toggleAdvanced}>
                          {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                        </Button>
                      </Grid>
                      
                      {showAdvanced && (
                        <>
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <NotificationsIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                Advanced Settings
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.autoRotate}
                                  onChange={handleAutoRotateToggle}
                                  color="primary"
                                />
                              }
                              label="Automatically Rotate Keys"
                            />
                            <Tooltip title="When enabled, keys will be rotated automatically without manual approval">
                              <IconButton size="small">
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.notifyOnRotation}
                                  onChange={handleNotifyToggle}
                                  color="primary"
                                />
                              }
                              label="Notify on Rotation"
                            />
                            <Tooltip title="You'll receive notifications when your key is rotated">
                              <IconButton size="small">
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                        </>
                      )}
                    </>
                  )}
                </Grid>
              </Box>
            </Grid>
          )}
          
          {/* Security Settings Tab */}
          {showSecurityTab && !showAuditLog && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VpnLockIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Access Security
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>Security Settings</AlertTitle>
                      Adding security restrictions helps protect your API key from unauthorized access.
                      These settings require password confirmation to modify.
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <VpnLockIcon fontSize="small" sx={{ mr: 1 }} />
                          IP Address Restrictions
                        </Typography>
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.ipRestriction}
                              onChange={handleIpRestrictionToggle}
                              color="primary"
                            />
                          }
                          label="Only allow specific IP addresses to use this API key"
                        />
                        
                        {settings.ipRestriction && (
                          <Box sx={{ mt: 2 }}>
                            <Grid container spacing={1}>
                              <Grid item xs={12} sm={8}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="IP Address"
                                  placeholder="e.g. 192.168.1.1"
                                  value={newIp}
                                  onChange={(e) => setNewIp(e.target.value)}
                                  error={newIp !== '' && !validateIpAddress(newIp)}
                                  helperText={newIp !== '' && !validateIpAddress(newIp) ? 'Invalid IP address format' : ''}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Button
                                  variant="outlined"
                                  onClick={addIpAddress}
                                  disabled={!validateIpAddress(newIp)}
                                  sx={{ height: '40px' }}
                                  fullWidth={isMobile}
                                >
                                  Add IP
                                </Button>
                              </Grid>
                            </Grid>
                            
                            {settings.allowedIps.length > 0 ? (
                              <TableContainer sx={{ mt: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Allowed IP Address</TableCell>
                                      <TableCell align="right">Action</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {settings.allowedIps.map((ip) => (
                                      <TableRow key={ip}>
                                        <TableCell>{ip}</TableCell>
                                        <TableCell align="right">
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => removeIpAddress(ip)}
                                          >
                                            <InfoIcon fontSize="small" />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                No IP addresses added yet. Add IPs to restrict API key usage.
                              </Typography>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <VerifiedUserIcon fontSize="small" sx={{ mr: 1 }} />
                          Breach Detection
                        </Typography>
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.breachDetection}
                              onChange={handleBreachDetectionToggle}
                              color="primary"
                            />
                          }
                          label="Enable automated breach detection"
                        />
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                          We'll monitor for unusual access patterns and automatically revoke keys
                          if suspicious activity is detected.
                        </Typography>
                        
                        {settings.breachDetection && (
                          <Box sx={{ mt: 2 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel id="log-retention-label">Log Retention Period</InputLabel>
                              <Select
                                labelId="log-retention-label"
                                value={settings.logRetention}
                                label="Log Retention Period"
                                onChange={handleLogRetentionChange}
                              >
                                <MenuItem value={30}>30 days</MenuItem>
                                <MenuItem value={60}>60 days</MenuItem>
                                <MenuItem value={90}>90 days</MenuItem>
                                <MenuItem value={180}>180 days</MenuItem>
                                <MenuItem value={365}>365 days</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}
          
          {/* Audit Log Tab */}
          {showAuditLog && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ListAltIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    API Key Audit Log
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date/Time</TableCell>
                        <TableCell>Event</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>IP Address</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{log.event}</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>{log.ipAddress}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No audit logs available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>
          )}
          
          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RotateLeftIcon />}
                onClick={handleManualRotate}
                disabled={loading}
              >
                Rotate Now
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Settings'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose}>
        <DialogTitle>
          {confirmAction === 'rotate' ? 'Confirm Key Rotation' : 'Confirm Security Changes'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'rotate'
              ? 'This action will immediately rotate your API key. All applications using this key will need to be updated with the new key.'
              : 'You are changing security settings for your API key. Please confirm with your password.'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            error={!!confirmError}
            helperText={confirmError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ApiKeyRotationSettings;
