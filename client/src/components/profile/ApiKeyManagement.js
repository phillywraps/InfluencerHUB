import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import InfoIcon from '@mui/icons-material/Info';
import { useDispatch, useSelector } from 'react-redux';
import {
  addSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
} from '../../redux/slices/influencerSlice';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'other', label: 'Other' },
];

const ApiKeyManagement = () => {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.influencer);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    platform: '',
    username: '',
    followers: 0,
    apiKey: '',
    isAvailable: true,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimits: {
      dailyRequests: 1000,
      monthlyRequests: 30000,
      concurrentRentals: 1
    },
    accessScopes: ['all'],
    rentalFee: {
      hourly: 0,
      daily: 0,
      weekly: 0,
    },
    rotationSchedule: {
      isEnabled: true,
      intervalDays: 90,
      notifyDaysBefore: 7,
      autoRotate: true
    }
  });

  // Available access scopes
  const ACCESS_SCOPES = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'content', label: 'Content' },
    { value: 'messaging', label: 'Messaging' },
    { value: 'all', label: 'All Access' },
  ];

  // Reset form when dialog closes
  useEffect(() => {
    if (!openDialog) {
      setFormData({
        platform: '',
        username: '',
        followers: 0,
        apiKey: '',
        isAvailable: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimits: {
          dailyRequests: 1000,
          monthlyRequests: 30000,
          concurrentRentals: 1
        },
        accessScopes: ['all'],
        rentalFee: {
          hourly: 0,
          daily: 0,
          weekly: 0,
        },
      });
      setEditMode(false);
      setCurrentAccount(null);
      setShowApiKey(false);
      setFormErrors({});
    }
  }, [openDialog]);

  const handleOpenDialog = (account = null) => {
    if (account) {
      // Edit mode
      setEditMode(true);
      setCurrentAccount(account);
      
      // Format expiration date for the date input
      const expiresAt = account.apiKey?.expiresAt 
        ? new Date(account.apiKey.expiresAt).toISOString().split('T')[0]
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      setFormData({
        platform: account.platform,
        username: account.username,
        followers: account.followers || 0,
        apiKey: '', // API key is not returned from the server for security
        isAvailable: account.apiKey?.isAvailable ?? true,
        expiresAt,
        usageLimits: {
          dailyRequests: account.apiKey?.usageLimits?.dailyRequests || 1000,
          monthlyRequests: account.apiKey?.usageLimits?.monthlyRequests || 30000,
          concurrentRentals: account.apiKey?.usageLimits?.concurrentRentals || 1
        },
        accessScopes: account.apiKey?.accessScopes || ['all'],
        rentalFee: {
          hourly: account.apiKey?.rentalFee?.hourly || 0,
          daily: account.apiKey?.rentalFee?.daily || 0,
          weekly: account.apiKey?.rentalFee?.weekly || 0,
        },
        rotationSchedule: {
          isEnabled: account.apiKey?.rotationSchedule?.isEnabled ?? true,
          intervalDays: account.apiKey?.rotationSchedule?.intervalDays || 90,
          notifyDaysBefore: account.apiKey?.rotationSchedule?.notifyDaysBefore || 7,
          autoRotate: account.apiKey?.rotationSchedule?.autoRotate ?? true
        }
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('rentalFee.')) {
      const feeType = name.split('.')[1];
      setFormData({
        ...formData,
        rentalFee: {
          ...formData.rentalFee,
          [feeType]: parseFloat(value) || 0,
        },
      });
    } else if (name.startsWith('usageLimits.')) {
      const limitType = name.split('.')[1];
      setFormData({
        ...formData,
        usageLimits: {
          ...formData.usageLimits,
          [limitType]: parseInt(value) || 0,
        },
      });
    } else if (name.startsWith('rotationSchedule.')) {
      const scheduleType = name.split('.')[1];
      setFormData({
        ...formData,
        rotationSchedule: {
          ...formData.rotationSchedule,
          [scheduleType]: name === 'rotationSchedule.intervalDays' || name === 'rotationSchedule.notifyDaysBefore' 
            ? parseInt(value) || 0 
            : value,
        },
      });
    } else if (name === 'followers') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const handleAvailabilityChange = (e) => {
    setFormData({
      ...formData,
      isAvailable: e.target.checked,
    });
  };
  
  const handleRotationToggle = (e) => {
    setFormData({
      ...formData,
      rotationSchedule: {
        ...formData.rotationSchedule,
        isEnabled: e.target.checked,
      },
    });
  };
  
  const handleAutoRotateToggle = (e) => {
    setFormData({
      ...formData,
      rotationSchedule: {
        ...formData.rotationSchedule,
        autoRotate: e.target.checked,
      },
    });
  };
  
  const handleAccessScopesChange = (e) => {
    const { value } = e.target;
    
    // If 'all' is selected, remove other scopes
    if (value.includes('all') && !formData.accessScopes.includes('all')) {
      setFormData({
        ...formData,
        accessScopes: ['all'],
      });
    } 
    // If another scope is selected and 'all' was previously selected, remove 'all'
    else if (value.includes('all') && value.length > 1) {
      setFormData({
        ...formData,
        accessScopes: value.filter(scope => scope !== 'all'),
      });
    } 
    // Otherwise, just update the scopes
    else {
      setFormData({
        ...formData,
        accessScopes: value,
      });
    }
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.platform) {
      errors.platform = 'Platform is required';
    }
    
    if (!formData.username) {
      errors.username = 'Username is required';
    }
    
    if (!editMode && !formData.apiKey) {
      errors.apiKey = 'API Key is required';
    }
    
    if (!formData.expiresAt) {
      errors.expiresAt = 'Expiration date is required';
    } else {
      const expirationDate = new Date(formData.expiresAt);
      if (expirationDate <= new Date()) {
        errors.expiresAt = 'Expiration date must be in the future';
      }
    }
    
    if (formData.usageLimits.dailyRequests <= 0) {
      errors['usageLimits.dailyRequests'] = 'Daily requests must be greater than 0';
    }
    
    if (formData.usageLimits.monthlyRequests <= 0) {
      errors['usageLimits.monthlyRequests'] = 'Monthly requests must be greater than 0';
    }
    
    if (formData.usageLimits.concurrentRentals <= 0) {
      errors['usageLimits.concurrentRentals'] = 'Concurrent rentals must be greater than 0';
    }
    
    if (formData.accessScopes.length === 0) {
      errors.accessScopes = 'At least one access scope is required';
    }
    
    if (formData.rotationSchedule.intervalDays <= 0) {
      errors['rotationSchedule.intervalDays'] = 'Rotation interval must be greater than 0';
    }
    
    if (formData.rotationSchedule.notifyDaysBefore <= 0) {
      errors['rotationSchedule.notifyDaysBefore'] = 'Notification days must be greater than 0';
    }
    
    if (formData.rotationSchedule.notifyDaysBefore >= formData.rotationSchedule.intervalDays) {
      errors['rotationSchedule.notifyDaysBefore'] = 'Notification days must be less than rotation interval';
    }
    
    if (formData.rentalFee.hourly < 0) {
      errors['rentalFee.hourly'] = 'Hourly rate cannot be negative';
    }
    
    if (formData.rentalFee.daily < 0) {
      errors['rentalFee.daily'] = 'Daily rate cannot be negative';
    }
    
    if (formData.rentalFee.weekly < 0) {
      errors['rentalFee.weekly'] = 'Weekly rate cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    if (editMode && currentAccount) {
      // Update existing account
      dispatch(
        updateSocialAccount({
          accountId: currentAccount._id,
          username: formData.username,
          followers: formData.followers,
          apiKey: formData.apiKey || undefined, // Only send if provided
          isAvailable: formData.isAvailable,
          expiresAt: formData.expiresAt,
          usageLimits: formData.usageLimits,
          accessScopes: formData.accessScopes,
          rentalFee: formData.rentalFee,
          rotationSchedule: formData.rotationSchedule,
        })
      );
    } else {
      // Add new account
      dispatch(
        addSocialAccount({
          platform: formData.platform,
          username: formData.username,
          followers: formData.followers,
          apiKey: formData.apiKey,
          expiresAt: formData.expiresAt,
          usageLimits: formData.usageLimits,
          accessScopes: formData.accessScopes,
          rentalFee: formData.rentalFee,
          rotationSchedule: formData.rotationSchedule,
        })
      );
    }
    
    handleCloseDialog();
  };

  const handleDelete = (accountId) => {
    if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      dispatch(deleteSocialAccount(accountId));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">API Key Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New API Key
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {profile?.socialAccounts?.length > 0 ? (
        <Grid container spacing={3}>
          {profile.socialAccounts.map((account) => (
            <Grid item xs={12} md={6} key={account._id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" component="h3">
                      {PLATFORMS.find((p) => p.value === account.platform)?.label || account.platform}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{account.username}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(account)}
                      aria-label="edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(account._id)}
                      aria-label="delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Followers:
                    </Typography>
                    <Typography variant="body1">
                      {account.followers?.toLocaleString() || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    <Typography
                      variant="body1"
                      color={
                        account.apiKey?.status === 'active' && account.apiKey?.isAvailable
                          ? 'success.main'
                          : account.apiKey?.status === 'suspended' || account.apiKey?.status === 'revoked'
                          ? 'error.main'
                          : account.apiKey?.status === 'expired'
                          ? 'warning.main'
                          : 'text.secondary'
                      }
                    >
                      {account.apiKey?.status === 'active' && account.apiKey?.isAvailable
                        ? 'Available'
                        : account.apiKey?.status === 'active' && !account.apiKey?.isAvailable
                        ? 'In Use'
                        : account.apiKey?.status || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Expires:
                    </Typography>
                    <Typography variant="body1">
                      {account.apiKey?.expiresAt
                        ? new Date(account.apiKey.expiresAt).toLocaleDateString()
                        : 'Never'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Key Rotation:
                    </Typography>
                    <Typography variant="body1">
                      {account.apiKey?.rotationSchedule?.isEnabled
                        ? account.apiKey?.rotationSchedule?.autoRotate
                          ? 'Auto every ' + (account.apiKey?.rotationSchedule?.intervalDays || 90) + ' days'
                          : 'Manual every ' + (account.apiKey?.rotationSchedule?.intervalDays || 90) + ' days'
                        : 'Disabled'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Usage Limits:
                    </Typography>
                    <Typography variant="body1">
                      {account.apiKey?.usageLimits?.dailyRequests || 1000}/day
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Rental Fees:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="body2">
                        Hourly: ${account.apiKey?.rentalFee?.hourly || 0}
                      </Typography>
                      <Typography variant="body2">
                        Daily: ${account.apiKey?.rentalFee?.daily || 0}
                      </Typography>
                      <Typography variant="body2">
                        Weekly: ${account.apiKey?.rentalFee?.weekly || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            You haven't added any API keys yet. Add your first API key to start renting it to advertisers.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Your First API Key
          </Button>
        </Paper>
      )}

      {/* Add/Edit API Key Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit API Key' : 'Add New API Key'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.platform} disabled={editMode}>
                <InputLabel>Platform</InputLabel>
                <Select
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  label="Platform"
                >
                  {PLATFORMS.map((platform) => (
                    <MenuItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.platform && (
                  <FormHelperText>{formErrors.platform}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                error={!!formErrors.username}
                helperText={formErrors.username}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Followers"
                name="followers"
                type="number"
                value={formData.followers}
                onChange={handleInputChange}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAvailable}
                    onChange={handleAvailabilityChange}
                    color="primary"
                  />
                }
                label="Available for Rental"
              />
              <Tooltip title="When enabled, advertisers can request to rent this API key">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                name="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={handleInputChange}
                error={!!formErrors.apiKey}
                helperText={
                  formErrors.apiKey ||
                  (editMode
                    ? 'Leave blank to keep the current API key'
                    : 'This will be encrypted and securely stored')
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleApiKeyVisibility} edge="end">
                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiration Date"
                name="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={handleInputChange}
                error={!!formErrors.expiresAt}
                helperText={formErrors.expiresAt || 'When this API key will expire'}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.accessScopes}>
                <InputLabel id="access-scopes-label">Access Scopes</InputLabel>
                <Select
                  labelId="access-scopes-label"
                  multiple
                  name="accessScopes"
                  value={formData.accessScopes}
                  onChange={handleAccessScopesChange}
                  label="Access Scopes"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={ACCESS_SCOPES.find(scope => scope.value === value)?.label || value} 
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {ACCESS_SCOPES.map((scope) => (
                    <MenuItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.accessScopes && (
                  <FormHelperText>{formErrors.accessScopes}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Usage Limits
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Daily Requests"
                    name="usageLimits.dailyRequests"
                    type="number"
                    value={formData.usageLimits.dailyRequests}
                    onChange={handleInputChange}
                    error={!!formErrors['usageLimits.dailyRequests']}
                    helperText={formErrors['usageLimits.dailyRequests']}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Monthly Requests"
                    name="usageLimits.monthlyRequests"
                    type="number"
                    value={formData.usageLimits.monthlyRequests}
                    onChange={handleInputChange}
                    error={!!formErrors['usageLimits.monthlyRequests']}
                    helperText={formErrors['usageLimits.monthlyRequests']}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Concurrent Rentals"
                    name="usageLimits.concurrentRentals"
                    type="number"
                    value={formData.usageLimits.concurrentRentals}
                    onChange={handleInputChange}
                    error={!!formErrors['usageLimits.concurrentRentals']}
                    helperText={formErrors['usageLimits.concurrentRentals'] || 'Maximum number of simultaneous rentals'}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Security Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.rotationSchedule.isEnabled}
                        onChange={handleRotationToggle}
                        color="primary"
                      />
                    }
                    label="Enable API Key Rotation"
                  />
                  <Tooltip title="Regularly rotating API keys enhances security by limiting the impact of potential key leaks">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.rotationSchedule.autoRotate}
                        onChange={handleAutoRotateToggle}
                        disabled={!formData.rotationSchedule.isEnabled}
                        color="primary"
                      />
                    }
                    label="Automatic Rotation"
                  />
                  <Tooltip title="When enabled, the system will automatically rotate your API key on the scheduled interval">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rotation Interval (days)"
                    name="rotationSchedule.intervalDays"
                    type="number"
                    value={formData.rotationSchedule.intervalDays}
                    onChange={handleInputChange}
                    disabled={!formData.rotationSchedule.isEnabled}
                    error={!!formErrors['rotationSchedule.intervalDays']}
                    helperText={formErrors['rotationSchedule.intervalDays'] || 'How often to rotate the API key'}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Notify Days Before"
                    name="rotationSchedule.notifyDaysBefore"
                    type="number"
                    value={formData.rotationSchedule.notifyDaysBefore}
                    onChange={handleInputChange}
                    disabled={!formData.rotationSchedule.isEnabled}
                    error={!!formErrors['rotationSchedule.notifyDaysBefore']}
                    helperText={formErrors['rotationSchedule.notifyDaysBefore'] || 'Days before rotation to send notification'}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Rental Fees
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Hourly Rate ($)"
                    name="rentalFee.hourly"
                    type="number"
                    value={formData.rentalFee.hourly}
                    onChange={handleInputChange}
                    error={!!formErrors['rentalFee.hourly']}
                    helperText={formErrors['rentalFee.hourly']}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Daily Rate ($)"
                    name="rentalFee.daily"
                    type="number"
                    value={formData.rentalFee.daily}
                    onChange={handleInputChange}
                    error={!!formErrors['rentalFee.daily']}
                    helperText={formErrors['rentalFee.daily']}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Weekly Rate ($)"
                    name="rentalFee.weekly"
                    type="number"
                    value={formData.rentalFee.weekly}
                    onChange={handleInputChange}
                    error={!!formErrors['rentalFee.weekly']}
                    helperText={formErrors['rentalFee.weekly']}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {editMode ? 'Update' : 'Add'} API Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiKeyManagement;
