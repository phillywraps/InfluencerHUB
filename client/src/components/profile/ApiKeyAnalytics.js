import React, { useState, useEffect } from 'react';
import ApiKeyRotationSettings from './ApiKeyRotationSettings';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import HttpIcon from '@mui/icons-material/Http';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import KeyIcon from '@mui/icons-material/Key';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import { useDispatch, useSelector } from 'react-redux';
import { getApiKeyUsage, getApiKeyRentals, rotateApiKey } from '../../redux/slices/influencerSlice';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ApiKeyAnalytics = ({ socialAccount }) => {
  const dispatch = useDispatch();
  const { apiKeyUsage, apiKeyRentals, loading, error } = useSelector((state) => state.influencer);
  const [tabValue, setTabValue] = useState(0);
  
  const usageData = apiKeyUsage[socialAccount._id];
  const rentals = apiKeyRentals[socialAccount._id];
  
  useEffect(() => {
    if (socialAccount && !usageData) {
      dispatch(getApiKeyUsage(socialAccount._id));
    }
    
    if (socialAccount && !rentals) {
      dispatch(getApiKeyRentals(socialAccount._id));
    }
  }, [dispatch, socialAccount, usageData, rentals]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleRefresh = () => {
    dispatch(getApiKeyUsage(socialAccount._id));
    dispatch(getApiKeyRentals(socialAccount._id));
  };
  
  const handleRotateApiKey = () => {
    if (window.confirm('Are you sure you want to rotate this API key? This will invalidate the current key and generate a new one. All active rentals will continue to work, but new rentals will use the new key.')) {
      dispatch(rotateApiKey(socialAccount._id));
    }
  };
  
  // Format data for charts
  const formatDailyUsageData = () => {
    if (!usageData || !usageData.dailyUsage) return [];
    
    return usageData.dailyUsage.slice(-7).map(day => ({
      date: new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }),
      requests: day.count,
    }));
  };
  
  const formatStatusData = () => {
    if (!rentals) return [];
    
    const statusCounts = {
      active: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0,
    };
    
    rentals.forEach(rental => {
      if (statusCounts[rental.status] !== undefined) {
        statusCounts[rental.status]++;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    })).filter(item => item.value > 0);
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          API Key Analytics: {socialAccount.platform} (@{socialAccount.username})
        </Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<KeyIcon />}
            onClick={handleRotateApiKey}
            disabled={loading}
            sx={{ ml: 1 }}
          >
            Rotate API Key
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="API key analytics tabs">
          <Tab icon={<BarChartIcon />} label="Usage" id="analytics-tab-0" aria-controls="analytics-tabpanel-0" />
          <Tab icon={<PieChartIcon />} label="Rentals" id="analytics-tab-1" aria-controls="analytics-tabpanel-1" />
          <Tab icon={<SecurityIcon />} label="Security" id="analytics-tab-2" aria-controls="analytics-tabpanel-2" />
        </Tabs>
      </Box>
      
      {/* Usage Tab */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : !usageData ? (
          <Alert severity="info">
            No usage data available for this API key yet. Usage data will appear once the API key is rented and used.
          </Alert>
        ) : (
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Daily Usage" />
                  <CardContent>
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
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Monthly Usage" />
                  <CardContent>
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
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Card sx={{ mb: 4 }}>
              <CardHeader title="Daily Usage Trend (Last 7 Days)" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formatDailyUsageData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="requests" fill="#8884d8" name="API Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader title="Recent API Calls" />
              <CardContent>
                {usageData.recentHistory && usageData.recentHistory.length > 0 ? (
                  <List>
                    {usageData.recentHistory.slice(0, 10).map((item, index) => (
                      <ListItem key={index} divider={index < Math.min(9, usageData.recentHistory.length - 1)}>
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
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent API calls recorded.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </TabPanel>
      
      {/* Rentals Tab */}
      <TabPanel value={tabValue} index={1}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : !rentals || rentals.length === 0 ? (
          <Alert severity="info">
            No rental data available for this API key yet. Rental data will appear once advertisers rent your API key.
          </Alert>
        ) : (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 3 }}>
                  <CardHeader title="Rental Status Distribution" />
                  <CardContent>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formatStatusData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {formatStatusData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 3 }}>
                  <CardHeader title="Rental Statistics" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Rentals:
                        </Typography>
                        <Typography variant="h6">
                          {rentals.length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Active Rentals:
                        </Typography>
                        <Typography variant="h6">
                          {rentals.filter(rental => rental.status === 'active').length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Revenue:
                        </Typography>
                        <Typography variant="h6">
                          ${rentals.reduce((sum, rental) => sum + (rental.payment?.amount || 0), 0).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Pending Payments:
                        </Typography>
                        <Typography variant="h6">
                          ${rentals.filter(rental => rental.payment?.status === 'pending').reduce((sum, rental) => sum + (rental.payment?.amount || 0), 0).toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Card>
              <CardHeader title="Recent Rentals" />
              <CardContent>
                <List>
                  {rentals.slice(0, 5).map((rental, index) => (
                    <ListItem key={rental._id} divider={index < Math.min(4, rentals.length - 1)}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Advertiser: ${rental.advertiserUsername || 'Unknown'}`}
                        secondary={`${new Date(rental.duration?.startDate).toLocaleDateString()} - ${new Date(rental.duration?.endDate).toLocaleDateString()} • $${rental.payment?.amount || 0}`}
                      />
                      <Chip
                        label={rental.status}
                        color={
                          rental.status === 'active' ? 'success' :
                          rental.status === 'pending' ? 'warning' :
                          rental.status === 'completed' ? 'info' :
                          'error'
                        }
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}
      </TabPanel>
      
      {/* Security Tab */}
      <TabPanel value={tabValue} index={2}>
        <ApiKeyRotationSettings 
          socialAccount={socialAccount} 
          onRefresh={handleRefresh} 
        />
        
        <Card>
          <CardHeader title="API Key Security Information" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Key ID:
                </Typography>
                <Typography variant="body1">
                  {socialAccount?.apiKey?.keyId || 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Version:
                </Typography>
                <Typography variant="body1">
                  {socialAccount?.apiKey?.version || 1}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Created:
                </Typography>
                <Typography variant="body1">
                  {socialAccount?.apiKey?.createdAt 
                    ? new Date(socialAccount.apiKey.createdAt).toLocaleDateString() 
                    : 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Expires:
                </Typography>
                <Typography variant="body1">
                  {socialAccount?.apiKey?.expiresAt 
                    ? new Date(socialAccount.apiKey.expiresAt).toLocaleDateString() 
                    : 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <AlertTitle>Security Best Practices</AlertTitle>
                  <Typography variant="body2">
                    • Regularly rotate your API keys to minimize security risks
                  </Typography>
                  <Typography variant="body2">
                    • Never share your API keys in public repositories or forums
                  </Typography>
                  <Typography variant="body2">
                    • Monitor API key usage for any suspicious activity
                  </Typography>
                  <Typography variant="body2">
                    • Set appropriate usage limits to prevent abuse
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
    </Paper>
  );
};

export default ApiKeyAnalytics;
