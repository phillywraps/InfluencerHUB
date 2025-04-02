import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import SettingsIcon from '@mui/icons-material/Settings';
import HttpIcon from '@mui/icons-material/Http';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useDispatch } from 'react-redux';
import { getRentalApiKey, getApiKeyUsage, trackApiKeyUsage } from '../../redux/slices/rentalSlice';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-key-tabpanel-${index}`}
      aria-labelledby={`api-key-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ApiKeyViewer = ({ rental }) => {
  const dispatch = useDispatch();
  const [apiKeyData, setApiKeyData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usageError, setUsageError] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Calculate time remaining
  const calculateTimeRemaining = () => {
    if (!rental.duration?.endDate) return { days: 0, hours: 0, minutes: 0 };

    const now = new Date();
    const endDate = new Date(rental.duration.endDate);
    const diffMs = endDate - now;

    // If expired
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, expired: false };
  };

  const timeRemaining = calculateTimeRemaining();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Load usage data when switching to the Usage tab
    if (newValue === 1 && !usageData && !usageLoading) {
      loadUsageData();
    }
  };
  
  const loadUsageData = async () => {
    setUsageLoading(true);
    setUsageError(null);
    
    try {
      const result = await dispatch(getApiKeyUsage(rental._id)).unwrap();
      setUsageData(result);
    } catch (err) {
      setUsageError(err || 'Failed to retrieve API key usage data');
    } finally {
      setUsageLoading(false);
    }
  };

  const handleOpenDialog = async () => {
    setOpenDialog(true);
    setLoading(true);
    setError(null);
    setApiKeyData(null);
    setShowApiKey(false);
    setTabValue(0);

    try {
      const result = await dispatch(getRentalApiKey(rental._id)).unwrap();
      setApiKeyData(result);
    } catch (err) {
      setError(err || 'Failed to retrieve API key');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setApiKeyData(null);
    setUsageData(null);
    setShowApiKey(false);
    setCopied(false);
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      },
      () => {
        setError('Failed to copy to clipboard');
      }
    );
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // Check if API key is accessible
  const isApiKeyAccessible = () => {
    return (
      rental.status === 'active' &&
      rental.payment?.status === 'completed' &&
      !timeRemaining.expired
    );
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" component="h3">
            {rental.platform} API Key
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Influencer: {rental.influencerUsername || 'Unknown'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Chip
              label={rental.status}
              color={getStatusColor(rental.status)}
              size="small"
              sx={{ mr: 1 }}
            />
            {rental.payment && (
              <Chip
                label={`Payment: ${rental.payment.status}`}
                color={rental.payment.status === 'completed' ? 'success' : 'warning'}
                size="small"
              />
            )}
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {timeRemaining.expired
                ? 'Expired'
                : `Expires in: ${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<KeyIcon />}
            onClick={handleOpenDialog}
            disabled={!isApiKeyAccessible()}
            sx={{ mt: 'auto' }}
          >
            {isApiKeyAccessible() ? 'View API Key' : 'API Key Unavailable'}
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Rental Period:
          </Typography>
          <Typography variant="body1">
            {new Date(rental.duration?.startDate).toLocaleDateString()} - {new Date(rental.duration?.endDate).toLocaleDateString()}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Rental Fee:
          </Typography>
          <Typography variant="body1">
            ${rental.payment?.amount || 0}
          </Typography>
        </Grid>
      </Grid>

      {/* API Key Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>API Key Details</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          ) : apiKeyData ? (
            <Box sx={{ width: '100%' }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                This API key will expire on {new Date(rental.duration?.endDate).toLocaleString()}. Please ensure you update your applications before expiration.
              </Alert>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="API key tabs">
                  <Tab icon={<KeyIcon />} label="API Key" id="api-key-tab-0" aria-controls="api-key-tabpanel-0" />
                  <Tab icon={<BarChartIcon />} label="Usage" id="api-key-tab-1" aria-controls="api-key-tabpanel-1" />
                  <Tab icon={<SettingsIcon />} label="Settings" id="api-key-tab-2" aria-controls="api-key-tabpanel-2" />
                </Tabs>
              </Box>
              
              {/* API Key Tab */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="subtitle1" gutterBottom>
                  Platform: {apiKeyData.platform}
                </Typography>

                <TextField
                  fullWidth
                  label="API Key"
                  value={apiKeyData.apiKey || ''}
                  type={showApiKey ? 'text' : 'password'}
                  sx={{ mb: 3, mt: 1 }}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={showApiKey ? "Hide API Key" : "Show API Key"}>
                          <IconButton onClick={toggleApiKeyVisibility} edge="end">
                            {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy to Clipboard">
                          <IconButton
                            onClick={() => copyToClipboard(apiKeyData.apiKey)}
                            edge="end"
                            sx={{ ml: 1 }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />

                {copied && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    API key copied to clipboard!
                  </Alert>
                )}

                <Typography variant="subtitle1" gutterBottom>
                  Usage Instructions
                </Typography>
                <Typography variant="body2" paragraph>
                  This API key grants you access to the {apiKeyData.platform} API. Here's how to use it:
                </Typography>
                <Box component="ol" sx={{ pl: 2 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Include this API key in your requests to the {apiKeyData.platform} API using the
                      Authorization header:
                    </Typography>
                    <Paper
                      sx={{
                        p: 1,
                        my: 1,
                        bgcolor: 'grey.100',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      Authorization: Bearer [API_KEY]
                    </Paper>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Follow the {apiKeyData.platform} API documentation for specific endpoints and
                      request formats.
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      Remember that this key will expire on{' '}
                      {new Date(rental.duration?.endDate).toLocaleString()}.
                    </Typography>
                  </Box>
                </Box>
              </TabPanel>
              
              {/* Usage Tab */}
              <TabPanel value={tabValue} index={1}>
                {usageLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : usageError ? (
                  <Alert severity="error" sx={{ my: 2 }}>
                    {usageError}
                  </Alert>
                ) : usageData ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      API Key Usage Statistics
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Daily Usage
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              {usageData.usageLimits.dailyUsage.used} / {usageData.usageLimits.dailyUsage.limit} requests
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {usageData.usageLimits.dailyUsage.remaining} remaining
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(usageData.usageLimits.dailyUsage.used / usageData.usageLimits.dailyUsage.limit) * 100}
                            color={usageData.usageLimits.dailyUsage.isExceeded ? "error" : "primary"}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                          {usageData.usageLimits.dailyUsage.isExceeded && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                              Daily limit exceeded
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Monthly Usage
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              {usageData.usageLimits.monthlyUsage.used} / {usageData.usageLimits.monthlyUsage.limit} requests
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {usageData.usageLimits.monthlyUsage.remaining} remaining
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(usageData.usageLimits.monthlyUsage.used / usageData.usageLimits.monthlyUsage.limit) * 100}
                            color={usageData.usageLimits.monthlyUsage.isExceeded ? "error" : "primary"}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                          {usageData.usageLimits.monthlyUsage.isExceeded && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                              Monthly limit exceeded
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Recent API Calls
                    </Typography>
                    
                    {usageData.recentHistory && usageData.recentHistory.length > 0 ? (
                      <Paper sx={{ mb: 3 }}>
                        <List>
                          {usageData.recentHistory.slice(0, 5).map((item, index) => (
                            <ListItem key={index} divider={index < Math.min(4, usageData.recentHistory.length - 1)}>
                              <ListItemIcon>
                                <HttpIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={item.endpoint}
                                secondary={`${new Date(item.date).toLocaleString()} • Status: ${item.statusCode}`}
                              />
                              {item.statusCode >= 200 && item.statusCode < 300 ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <ErrorIcon color="error" />
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No recent API calls recorded.
                      </Typography>
                    )}
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Daily Usage Trend
                    </Typography>
                    
                    {usageData.dailyUsage && usageData.dailyUsage.length > 0 ? (
                      <Paper sx={{ p: 2 }}>
                        <Grid container spacing={1}>
                          {usageData.dailyUsage.slice(-7).map((day, index) => (
                            <Grid item xs={12} sm={6} md={3} lg={1.7} key={index}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                </Typography>
                                <Box
                                  sx={{
                                    height: 100,
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    my: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 30,
                                      bgcolor: 'primary.main',
                                      height: `${Math.min(100, (day.count / (usageData.usageLimits.dailyUsage.limit || 1)) * 100)}%`,
                                      minHeight: day.count > 0 ? 5 : 0,
                                      borderRadius: '4px 4px 0 0',
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" fontWeight="bold">
                                  {day.count}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No usage data available for the past days.
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ my: 2 }}>
                    Loading API key usage information...
                  </Typography>
                )}
              </TabPanel>
              
              {/* Settings Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>
                  API Key Settings
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Key Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Key ID" 
                            secondary={apiKeyData.keyId || 'N/A'} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Version" 
                            secondary={apiKeyData.version || '1'} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Expiration Date" 
                            secondary={new Date(apiKeyData.expiresAt).toLocaleString()} 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Access Scopes
                      </Typography>
                      {apiKeyData.accessScopes && apiKeyData.accessScopes.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {apiKeyData.accessScopes.map((scope, index) => (
                            <Chip 
                              key={index} 
                              label={scope} 
                              color="primary" 
                              variant="outlined" 
                              size="small" 
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          This API key has full access to all endpoints.
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ my: 2 }}>
              Loading API key information...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ApiKeyViewer;
