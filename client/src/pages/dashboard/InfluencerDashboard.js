import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AnalyticsDashboard from '../../components/dashboard/AnalyticsDashboard';
import RealTimeAnalyticsDashboard from '../../components/dashboard/RealTimeAnalyticsDashboard';
import ApiKeyRealTimeMonitor from '../../components/dashboard/ApiKeyRealTimeMonitor';
import ApiKeyAnalytics from '../../components/profile/ApiKeyAnalytics';
import PinterestAccountConnect from '../../components/profile/PinterestAccountConnect';
import PinterestAnalytics from '../../components/dashboard/PinterestAnalytics';
import LinkedInAnalytics from '../../components/dashboard/LinkedInAnalytics';
import SnapchatAnalytics from '../../components/dashboard/SnapchatAnalytics';
import SnapchatAccountConnect from '../../components/profile/SnapchatAccountConnect';
import PaymentDashboard from '../../components/dashboard/PaymentDashboard';
import { getBalance } from '../../redux/slices/payoutSlice';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import MessageIcon from '@mui/icons-material/Message';
import PersonIcon from '@mui/icons-material/Person';
import SyncIcon from '@mui/icons-material/Sync';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getInfluencerProfile } from '../../redux/slices/influencerSlice';
import { getRentals } from '../../redux/slices/rentalSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const InfluencerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { profile, loading: profileLoading, error: profileError } = useSelector(
    (state) => state.influencer
  );
  const { rentals, loading: rentalsLoading, error: rentalsError } = useSelector(
    (state) => state.rental
  );
  const { balance, loading: balanceLoading, error: balanceError } = useSelector(
    (state) => state.payout
  );

  // Separate tab states for different tab groups
  const [analyticsTabValue, setAnalyticsTabValue] = useState(0);
  const [rentalTabValue, setRentalTabValue] = useState(0);
  const [useRealTimeAnalytics, setUseRealTimeAnalytics] = useState(false);

  // Load influencer profile, rentals, and balance
  useEffect(() => {
    dispatch(getInfluencerProfile());
    dispatch(getRentals());
    dispatch(getBalance());
  }, [dispatch]);

  // Separate handlers for different tab groups
  const handleAnalyticsTabChange = (event, newValue) => {
    setAnalyticsTabValue(newValue);
  };
  
  const handleRentalTabChange = (event, newValue) => {
    setRentalTabValue(newValue);
  };

  // Toggle real-time analytics
  const handleRealTimeToggle = (event) => {
    setUseRealTimeAnalytics(event.target.checked);
  };

  // Redirect if not authenticated or not an influencer
  useEffect(() => {
    if (user && user.userType !== 'influencer') {
      navigate('/dashboard/advertiser');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter rentals by status
  const activeRentals = rentals.filter((rental) => rental.status === 'active');
  const pendingRentals = rentals.filter((rental) => rental.status === 'pending');
  const completedRentals = rentals.filter((rental) => rental.status === 'completed');

  // Calculate earnings
  const totalEarnings = rentals
    .filter((rental) => rental.status === 'completed' || rental.status === 'active')
    .reduce((total, rental) => total + rental.rentalFee, 0);

  // Prepare analytics data
  const analyticsData = {
    totalAmount: totalEarnings.toFixed(2),
    activeRentals: activeRentals.length,
    avgDuration: activeRentals.length > 0 
      ? Math.round(activeRentals.reduce((sum, rental) => sum + rental.duration, 0) / activeRentals.length) 
      : 0,
    totalUsers: [...new Set(rentals.map(rental => rental.advertiser?._id || ''))].length,
    // Generate mock data for earnings over time
    earningsData: [
      { label: 'Jan', value: Math.round(totalEarnings * 0.1) },
      { label: 'Feb', value: Math.round(totalEarnings * 0.15) },
      { label: 'Mar', value: Math.round(totalEarnings * 0.2) },
      { label: 'Apr', value: Math.round(totalEarnings * 0.25) },
      { label: 'May', value: Math.round(totalEarnings * 0.3) },
      { label: 'Jun', value: Math.round(totalEarnings * 0.35) },
    ],
    // Generate mock data for platform distribution
    platformData: profile?.socialAccounts 
      ? profile.socialAccounts.map((account, index) => ({
          label: account.platform,
          value: 100 / (profile.socialAccounts.length || 1),
          color: ['primary', 'secondary', 'success', 'info', 'warning'][index % 5]
        }))
      : [{ label: 'No Data', value: 100, color: 'primary' }],
    // Generate mock data for rental duration
    rentalDurationData: [
      { label: '1 Day', value: 10 },
      { label: '3 Days', value: 25 },
      { label: '7 Days', value: 40 },
      { label: '14 Days', value: 20 },
      { label: '30 Days', value: 5 },
    ],
  };

  // Show loading spinner if data is being loaded
  if (profileLoading || rentalsLoading || balanceLoading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (profileError || rentalsError || balanceError) {
    return (
      <ErrorMessage
        message="Failed to load dashboard data"
        error={profileError || rentalsError}
        showRetryButton
        onRetry={() => {
          dispatch(getInfluencerProfile());
          dispatch(getRentals());
        }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Influencer Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'primary.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Total Earnings
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              ${totalEarnings.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'success.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Available Balance
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                color="success"
                onClick={() => navigate('/payouts')}
                sx={{ bgcolor: 'success.dark' }}
              >
                Withdraw
              </Button>
            </Box>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              ${balance?.available ? balance.available.toFixed(2) : '0.00'}
            </Typography>
            {balance?.pending > 0 && (
              <Typography variant="caption">
                ${balance.pending.toFixed(2)} pending
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Active Rentals
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {activeRentals.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Pending Requests
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {pendingRentals.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Analytics Dashboard */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs
            value={analyticsTabValue}
            onChange={handleAnalyticsTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Analytics Overview" />
            <Tab label="API Key Monitor" />
            <Tab label="API Key Analytics" />
            <Tab label="Pinterest Analytics" />
            <Tab label="LinkedIn Analytics" />
            <Tab label="Snapchat Analytics" />
            <Tab label="Earnings Dashboard" />
          </Tabs>
          
          {analyticsTabValue === 0 && (
            <FormControlLabel
              control={
                <Switch
                  checked={useRealTimeAnalytics}
                  onChange={handleRealTimeToggle}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SyncIcon fontSize="small" />
                  <Typography variant="body2">Real-time</Typography>
                </Box>
              }
              labelPlacement="start"
            />
          )}
        </Box>
        
        {/* Overview Tab */}
        <TabPanel value={analyticsTabValue} index={0}>
          {useRealTimeAnalytics ? (
            <RealTimeAnalyticsDashboard 
              userType="influencer"
              initialData={analyticsData}
            />
          ) : (
            <AnalyticsDashboard 
              userType="influencer"
              data={analyticsData}
            />
          )}
        </TabPanel>
        
        {/* API Key Real-Time Monitor Tab */}
        <TabPanel value={analyticsTabValue} index={1}>
          <ApiKeyRealTimeMonitor userType="influencer" />
        </TabPanel>
        
        {/* API Key Analytics Tab */}
        <TabPanel value={analyticsTabValue} index={2}>
          {profile?.socialAccounts?.length > 0 ? (
            <>
              {profile.socialAccounts.map((account) => (
                <ApiKeyAnalytics key={account._id} socialAccount={account} />
              ))}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You haven't added any social media accounts yet.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/profile')}
                sx={{ mt: 2 }}
              >
                Add Your First Account
              </Button>
            </Box>
          )}
        </TabPanel>
        
        {/* Pinterest Analytics Tab */}
        <TabPanel value={analyticsTabValue} index={3}>
          <PinterestAnalytics />
        </TabPanel>
        
        {/* LinkedIn Analytics Tab */}
        <TabPanel value={analyticsTabValue} index={4}>
          <LinkedInAnalytics />
        </TabPanel>
        
        {/* Snapchat Analytics Tab */}
        <TabPanel value={analyticsTabValue} index={5}>
          <SnapchatAnalytics />
        </TabPanel>
        
        {/* Earnings Dashboard Tab */}
        <TabPanel value={analyticsTabValue} index={6}>
          <PaymentDashboard />
        </TabPanel>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Social Accounts Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Your Social Media Accounts
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate('/profile')}
              >
                Add Account
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {/* Pinterest Account Connect */}
            <PinterestAccountConnect onAccountAdded={(account) => {
              // This will be called when a user successfully connects their Pinterest account
              // In a real implementation, this would refresh the profile data
              console.log('Pinterest account added:', account);
            }} />
            
            {/* Snapchat Account Connect */}
            <SnapchatAccountConnect onAccountAdded={(account) => {
              // This will be called when a user successfully connects their Snapchat account
              // In a real implementation, this would refresh the profile data
              console.log('Snapchat account added:', account);
            }} />
            
            <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 2 }}>
              Connected Accounts
            </Typography>
            
            {profile?.socialAccounts?.length > 0 ? (
              <List>
                {profile.socialAccounts.map((account) => (
                  <ListItem
                    key={account._id}
                    secondaryAction={
                      <Box>
                        <IconButton edge="end" aria-label="edit" onClick={() => navigate('/profile')}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <KeyIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={account.platform}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {account.username}
                          </Typography>
                          <br />
                          <Chip
                            label={`$${account.rentalFee}/day`}
                            size="small"
                            color="primary"
                            sx={{ mt: 1 }}
                          />
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  You haven't added any social media accounts yet.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/profile')}
                  sx={{ mt: 2 }}
                >
                  Add Your First Account
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Rental Requests Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={rentalTabValue}
              onChange={handleRentalTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Pending Requests" />
              <Tab label="Active Rentals" />
              <Tab label="Completed" />
            </Tabs>

            {/* Pending Requests Tab */}
            <TabPanel value={rentalTabValue} index={0}>
              {pendingRentals.length > 0 ? (
                <List>
                  {pendingRentals.map((rental) => (
                    <ListItem key={rental._id}>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`Request from ${rental.advertiser.username}`}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Platform: {rental.socialAccount.platform}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Duration: {rental.duration} days
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Fee: ${rental.rentalFee}
                            </Typography>
                          </>
                        }
                      />
                      <Box>
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                          onClick={() => navigate(`/rentals/${rental._id}`)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => navigate(`/rentals/${rental._id}`)}
                        >
                          Decline
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No pending rental requests.
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Active Rentals Tab */}
            <TabPanel value={rentalTabValue} index={1}>
              {activeRentals.length > 0 ? (
                <List>
                  {activeRentals.map((rental) => (
                    <ListItem key={rental._id}>
                      <ListItemAvatar>
                        <Avatar>
                          <MonetizationOnIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${rental.advertiser.username} - ${rental.socialAccount.platform}`}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Started: {new Date(rental.startDate).toLocaleDateString()}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Ends: {new Date(rental.endDate).toLocaleDateString()}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Fee: ${rental.rentalFee}
                            </Typography>
                          </>
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MessageIcon />}
                        onClick={() => navigate(`/messages/${rental.advertiser._id}`)}
                      >
                        Message
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No active rentals.
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Completed Rentals Tab */}
            <TabPanel value={rentalTabValue} index={2}>
              {completedRentals.length > 0 ? (
                <List>
                  {completedRentals.map((rental) => (
                    <ListItem key={rental._id}>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${rental.advertiser.username} - ${rental.socialAccount.platform}`}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Period: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Fee: ${rental.rentalFee}
                            </Typography>
                          </>
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/rentals/${rental._id}`)}
                      >
                        Details
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No completed rentals.
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Grid>

          {/* Security Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  API Key Security
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SecurityIcon />}
                  onClick={() => navigate('/api-key-security')}
                >
                  Manage Key Rotation
                </Button>
              </Box>
              <Typography variant="body1" paragraph>
                Protect your API keys with automatic rotation. Setting up regular key rotation helps prevent unauthorized access and enhances your account security.
              </Typography>
              <Box sx={{ display: 'flex', mt: 2 }}>
                <Chip 
                  icon={<AutorenewIcon />} 
                  label="Automatic Rotation" 
                  color="primary" 
                  variant="outlined" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  icon={<NotificationsIcon />} 
                  label="Rotation Alerts" 
                  color="secondary" 
                  variant="outlined" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  icon={<SecurityIcon />} 
                  label="Enhanced Security" 
                  color="success" 
                  variant="outlined" 
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* Tips Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tips to Maximize Your Earnings
              </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      Complete Your Profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Advertisers are more likely to rent API keys from influencers with complete profiles.
                      Add a bio, profile picture, and detailed information about your social media accounts.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/profile')}>
                      Update Profile
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      Add Multiple Platforms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Diversify your offerings by adding API keys from multiple social media platforms.
                      This increases your visibility and appeal to different advertisers.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/profile')}>
                      Add Platforms
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      Optimize Pricing
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Set competitive prices for your API keys based on your follower count and engagement rates.
                      Consider offering discounts for longer rental periods.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/profile')}>
                      Adjust Pricing
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InfluencerDashboard;
