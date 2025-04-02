import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocketIo } from '../../services/socketIoService';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Divider,
  Chip,
  Card,
  CardContent,
  useTheme,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Alert,
  CircularProgress,
  Collapse,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GppGoodIcon from '@mui/icons-material/GppGood';
import GppBadIcon from '@mui/icons-material/GppBad';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SpeedIcon from '@mui/icons-material/Speed';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

// Import Recharts for real-time charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

/**
 * Formats a timestamp into a readable time
 */
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/**
 * Component for displaying individual API key health
 */
const ApiKeyHealthCard = ({ apiKey, expanded, onToggleExpand }) => {
  const theme = useTheme();
  
  // Determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  };
  
  // Determine status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <GppGoodIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'critical':
        return <GppBadIcon />;
      default:
        return <SecurityIcon />;
    }
  };
  
  // Format usage percentage
  const formatUsage = (current, limit) => {
    if (!limit) return '0%';
    return `${Math.round((current / limit) * 100)}%`;
  };
  
  // Determine progress color
  const getProgressColor = (percentage) => {
    if (percentage < 60) return theme.palette.success.main;
    if (percentage < 80) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  const usagePercentage = apiKey.limits?.daily 
    ? Math.round((apiKey.usage.daily / apiKey.limits.daily) * 100)
    : 0;
    
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        borderLeft: 3,
        borderColor: `${getStatusColor(apiKey.status)}.main`, 
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <KeyIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              {apiKey.name}
            </Typography>
            {apiKey.isActive ? (
              <Chip
                label="Active"
                color="success"
                size="small"
                sx={{ ml: 1, height: 20 }}
              />
            ) : (
              <Chip
                label="Inactive"
                color="default"
                size="small"
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              icon={getStatusIcon(apiKey.status)}
              label={apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
              color={getStatusColor(apiKey.status)}
              size="small"
              sx={{ mr: 1 }}
            />
            <Tooltip title={expanded ? "Show less" : "Show details"}>
              <IconButton size="small" onClick={onToggleExpand}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Daily API Usage ({formatUsage(apiKey.usage.daily, apiKey.limits.daily)})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={usagePercentage > 100 ? 100 : usagePercentage}
              sx={{
                my: 1,
                height: 8,
                borderRadius: 1,
                bgcolor: theme.palette.background.paper,
                '& .MuiLinearProgress-bar': {
                  bgcolor: getProgressColor(usagePercentage),
                },
              }}
            />
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Platform
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {apiKey.platform}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Version
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {apiKey.version}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Last Used
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {apiKey.lastUsed ? formatTime(apiKey.lastUsed) : 'Never'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Active Rentals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {apiKey.activeRentals} / {apiKey.maxRentals}
                </Typography>
              </Grid>
            </Grid>
            
            {apiKey.recentAlerts && apiKey.recentAlerts.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Recent Alerts
                </Typography>
                <List dense disablePadding>
                  {apiKey.recentAlerts.map((alert, idx) => (
                    <ListItem 
                      key={idx} 
                      sx={{ 
                        py: 0.5, 
                        px: 1,
                        bgcolor: idx === 0 ? 'warning.light' : 'transparent',
                        borderRadius: 1
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <WarningIcon 
                          fontSize="small" 
                          color={alert.severity === 'high' ? 'error' : 'warning'} 
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={alert.message}
                        secondary={formatTime(alert.timestamp)}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          fontWeight: idx === 0 ? 'medium' : 'regular'
                        }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

/**
 * Component for real-time display of API key usage
 */
const ApiKeyUsageChart = ({ data, title, isLoading }) => {
  const theme = useTheme();
  
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="medium">
            {title}
          </Typography>
          <Tooltip title="Last 30 minutes">
            <Chip
              label="Real-time"
              color="primary"
              size="small"
              icon={<SpeedIcon fontSize="small" />}
            />
          </Tooltip>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : (
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  tickFormatter={(val) => val.slice(-5)}
                />
                <YAxis 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                />
                <RechartsTooltip
                  formatter={(value, name) => [`${value} requests`, 'Requests']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke={theme.palette.primary.main}
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Component for displaying real-time security alerts
 */
const SecurityAlertsList = ({ alerts, isLoading }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="medium">
            Security Alerts
          </Typography>
          <Badge badgeContent={alerts.filter(a => a.isNew).length} color="error">
            <NotificationsActiveIcon color="action" />
          </Badge>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : alerts.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 250, 
              color: 'success.main' 
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 40, mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No security alerts detected
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 250, overflow: 'auto' }}>
            {alerts.map((alert, idx) => (
              <ListItem 
                key={idx} 
                alignItems="flex-start"
                sx={{ 
                  py: 1,
                  px: 2,
                  mb: 1,
                  bgcolor: alert.isNew ? 'error.light' : alert.severity === 'low' ? 'info.light' : 'warning.light',
                  borderRadius: 1
                }}
              >
                <ListItemIcon>
                  {alert.severity === 'high' ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">
                        {alert.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(alert.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {alert.message}
                      </Typography>
                      <Chip
                        size="small"
                        label={alert.apiKey}
                        icon={<KeyIcon fontSize="small" />}
                        variant="outlined"
                      />
                    </>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Main API Key Real-Time Monitor component
 */
const ApiKeyRealTimeMonitor = ({ userType }) => {
  const theme = useTheme();
  const isInfluencer = userType === 'influencer';
  
  // State for expanded API keys
  const [expandedKeys, setExpandedKeys] = useState({});
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState({
    apiKeys: true,
    usage: true,
    alerts: true
  });
  
  // Dummy data for development - this will be replaced with real data from the WebSocket
  const [apiKeys, setApiKeys] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  
  // Toggle expanded state for a key
  const toggleKeyExpand = useCallback((keyId) => {
    setExpandedKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  }, []);
  
  // Define the WebSocket event types to listen for
  const eventTypes = [
    'api_key_status_update',
    'api_key_usage_update',
    'api_key_security_alert',
    'api_key_metrics'
  ];
  
  // Event handlers for WebSocket events
  const websocketHandlers = {
    'api_key_status_update': (data) => {
      // Update the status of individual API keys
      setApiKeys(prev => {
        const updatedKeys = [...prev];
        const keyIndex = updatedKeys.findIndex(k => k.id === data.keyId);
        
        if (keyIndex >= 0) {
          updatedKeys[keyIndex] = {
            ...updatedKeys[keyIndex],
            ...data
          };
        }
        
        return updatedKeys;
      });
    },
    
    'api_key_usage_update': (data) => {
      // Update usage data for charts
      setUsageData(prev => {
        // Add the new data point to the chart data
        const newData = [...prev, {
          time: formatTime(data.timestamp),
          requests: data.requests,
          timestamp: data.timestamp
        }];
        
        // Keep only the last 30 data points (represents 30 minutes in real-time)
        if (newData.length > 30) {
          return newData.slice(newData.length - 30);
        }
        
        return newData;
      });
      
      // Update usage counts in API keys
      setApiKeys(prev => {
        return prev.map(key => {
          if (key.id === data.keyId) {
            return {
              ...key,
              usage: {
                ...key.usage,
                daily: key.usage.daily + data.requests,
                monthly: key.usage.monthly + data.requests,
                lastUpdated: data.timestamp
              },
              lastUsed: data.timestamp
            };
          }
          return key;
        });
      });
    },
    
    'api_key_security_alert': (data) => {
      // Add new security alert
      setSecurityAlerts(prev => {
        const newAlert = {
          ...data,
          isNew: true,
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        // Add to beginning of list and keep only the 50 most recent alerts
        return [newAlert, ...prev.slice(0, 49)];
      });
      
      // Add alert to the specific API key
      setApiKeys(prev => {
        return prev.map(key => {
          if (key.id === data.keyId) {
            const keyAlert = {
              severity: data.severity,
              message: data.title,
              timestamp: data.timestamp
            };
            
            return {
              ...key,
              recentAlerts: [keyAlert, ...(key.recentAlerts || []).slice(0, 4)],
              status: data.severity === 'high' ? 'critical' : 'warning'
            };
          }
          return key;
        });
      });
    },
    
    'api_key_metrics': (data) => {
      // Comprehensive update of API key metrics
      if (data.keys) {
        setApiKeys(data.keys);
        setIsLoading(prev => ({ ...prev, apiKeys: false }));
      }
      
      if (data.usageData) {
        setUsageData(data.usageData);
        setIsLoading(prev => ({ ...prev, usage: false }));
      }
      
      if (data.alerts) {
        setSecurityAlerts(data.alerts);
        setIsLoading(prev => ({ ...prev, alerts: false }));
      }
    }
  };
  
  // Initialize WebSocket connection
  const { 
    isConnected, 
    sendMessage,
    requestData
  } = useSocketIo(eventTypes, websocketHandlers);
  
  // Request initial data when component mounts
  useEffect(() => {
    if (isConnected) {
      requestData('api_key_metrics', { 
        userType,
        includeHistory: true 
      });
    }
  }, [isConnected, requestData, userType]);
  
  // Function to refresh data
  const refreshData = useCallback(() => {
    if (isConnected) {
      setIsLoading({
        apiKeys: true,
        usage: true,
        alerts: true
      });
      
      requestData('api_key_metrics', { 
        userType,
        includeHistory: true,
        forceRefresh: true
      });
    }
  }, [isConnected, requestData, userType]);
  
  // Mark all alerts as read
  const markAlertsAsRead = useCallback(() => {
    setSecurityAlerts(prev => 
      prev.map(alert => ({ ...alert, isNew: false }))
    );
    
    // Notify server that alerts were read
    if (isConnected) {
      sendMessage('mark_alerts_read', {});
    }
  }, [isConnected, sendMessage]);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          API Key Monitoring
          {isConnected && (
            <Chip 
              label="Real-Time"
              color="primary"
              size="small"
              icon={<SpeedIcon fontSize="small" />}
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Mark all alerts as read">
            <IconButton 
              onClick={markAlertsAsRead}
              disabled={securityAlerts.filter(a => a.isNew).length === 0}
            >
              <Badge 
                badgeContent={securityAlerts.filter(a => a.isNew).length} 
                color="error"
              >
                <NotificationsActiveIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh all data">
            <IconButton onClick={refreshData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Not connected to real-time monitoring. Data may not be current.
          </Typography>
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* API Key Health Section */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">
                  API Key Health
                </Typography>
                <Tooltip title="Configure alerts">
                  <IconButton size="small">
                    <TuneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {isLoading.apiKeys ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : apiKeys.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No API keys found. Add social accounts to get started.
                </Alert>
              ) : (
                <Box sx={{ maxHeight: 500, overflow: 'auto', pr: 1 }}>
                  {apiKeys.map((apiKey) => (
                    <ApiKeyHealthCard
                      key={apiKey.id}
                      apiKey={apiKey}
                      expanded={expandedKeys[apiKey.id] || false}
                      onToggleExpand={() => toggleKeyExpand(apiKey.id)}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right column - Usage and Alerts */}
        <Grid item xs={12} md={7}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Usage Chart */}
            <Grid item xs={12}>
              <ApiKeyUsageChart
                data={usageData}
                title="Real-Time API Requests"
                isLoading={isLoading.usage}
              />
            </Grid>
            
            {/* Security Alerts */}
            <Grid item xs={12}>
              <SecurityAlertsList
                alerts={securityAlerts}
                isLoading={isLoading.alerts}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* Summary Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'success.light',
                      color: 'success.dark',
                      p: 1.5,
                      borderRadius: '50%',
                      mr: 2,
                    }}
                  >
                    <SecurityIcon />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      API Key Security Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {securityAlerts.filter(a => a.isNew).length === 0
                        ? 'All systems secure. No active alerts.'
                        : `${securityAlerts.filter(a => a.isNew).length} active security alerts.`
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'info.light',
                      color: 'info.dark',
                      p: 1.5,
                      borderRadius: '50%',
                      mr: 2,
                    }}
                  >
                    <SpeedIcon />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      API Usage Efficiency
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isInfluencer
                        ? 'Your API keys are operating at optimal capacity.'
                        : 'Your API usage is within optimal limits.'
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'warning.light',
                      color: 'warning.dark',
                      p: 1.5,
                      borderRadius: '50%',
                      mr: 2,
                    }}
                  >
                    <LockIcon />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Suggested Actions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {apiKeys.filter(k => k.status === 'critical').length > 0 
                        ? 'Attention needed on critical API keys.' 
                        : 'No immediate actions needed at this time.'
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApiKeyRealTimeMonitor;
