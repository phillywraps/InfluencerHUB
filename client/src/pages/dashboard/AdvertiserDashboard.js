import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AnalyticsDashboard from '../../components/dashboard/AnalyticsDashboard';
import RealTimeAnalyticsDashboard from '../../components/dashboard/RealTimeAnalyticsDashboard';
import ApiKeyRealTimeMonitor from '../../components/dashboard/ApiKeyRealTimeMonitor';
import PaymentDashboard from '../../components/dashboard/PaymentDashboard';
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
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import MessageIcon from '@mui/icons-material/Message';
import PersonIcon from '@mui/icons-material/Person';
import CampaignIcon from '@mui/icons-material/Campaign';
import SyncIcon from '@mui/icons-material/Sync';
import { getAdvertiserProfile } from '../../redux/slices/advertiserSlice';
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

const AdvertiserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { profile, loading: profileLoading, error: profileError } = useSelector(
    (state) => state.advertiser
  );
  const { rentals, loading: rentalsLoading, error: rentalsError } = useSelector(
    (state) => state.rental
  );

  // Separate tab states for different tab groups
  const [analyticsTabValue, setAnalyticsTabValue] = useState(0);
  const [rentalTabValue, setRentalTabValue] = useState(0);
  const [useRealTimeAnalytics, setUseRealTimeAnalytics] = useState(false);

  // Load advertiser profile and rentals
  useEffect(() => {
    dispatch(getAdvertiserProfile());
    dispatch(getRentals());
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

  // Redirect if not authenticated or not an advertiser
  useEffect(() => {
    if (user && user.userType !== 'advertiser') {
      navigate('/dashboard/influencer');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter rentals by status
  const activeRentals = rentals.filter((rental) => rental.status === 'active');
  const pendingRentals = rentals.filter((rental) => rental.status === 'pending');
  const completedRentals = rentals.filter((rental) => rental.status === 'completed');

  // Calculate total spent
  const totalSpent = rentals
    .filter((rental) => rental.status === 'completed' || rental.status === 'active')
    .reduce((total, rental) => total + rental.rentalFee, 0);

  // Show loading spinner if data is being loaded
  if (profileLoading || rentalsLoading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (profileError || rentalsError) {
    return (
      <ErrorMessage
        message="Failed to load dashboard data"
        error={profileError || rentalsError}
        showRetryButton
        onRetry={() => {
          dispatch(getAdvertiserProfile());
          dispatch(getRentals());
        }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Advertiser Dashboard
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
              Total Spent
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              ${totalSpent.toFixed(2)}
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
              Campaigns
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {profile?.campaigns?.length || 0}
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
            <Tab label="Payment Dashboard" />
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
        
        {/* Analytics Overview Tab */}
        <TabPanel value={analyticsTabValue} index={0}>
          {useRealTimeAnalytics ? (
            <RealTimeAnalyticsDashboard 
              userType="advertiser"
              initialData={{
                totalAmount: totalSpent.toFixed(2),
                activeRentals: activeRentals.length,
                avgDuration: activeRentals.length > 0 
                  ? Math.round(activeRentals.reduce((sum, rental) => sum + rental.duration, 0) / activeRentals.length) 
                  : 0,
                totalUsers: [...new Set(rentals.map(rental => rental.influencer._id))].length,
                // Generate mock data for spending over time
                earningsData: [
                  { label: 'Jan', value: Math.round(totalSpent * 0.1) },
                  { label: 'Feb', value: Math.round(totalSpent * 0.15) },
                  { label: 'Mar', value: Math.round(totalSpent * 0.2) },
                  { label: 'Apr', value: Math.round(totalSpent * 0.25) },
                  { label: 'May', value: Math.round(totalSpent * 0.3) },
                  { label: 'Jun', value: Math.round(totalSpent * 0.35) },
                ],
                // Generate mock data for platform distribution
                platformData: [
                  { label: 'Instagram', value: 40, color: 'primary' },
                  { label: 'TikTok', value: 30, color: 'secondary' },
                  { label: 'YouTube', value: 20, color: 'success' },
                  { label: 'Twitter', value: 10, color: 'info' },
                ],
                // Generate mock data for rental duration
                rentalDurationData: [
                  { label: '1 Day', value: 10 },
                  { label: '3 Days', value: 25 },
                  { label: '7 Days', value: 40 },
                  { label: '14 Days', value: 20 },
                  { label: '30 Days', value: 5 },
                ],
              }}
            />
          ) : (
            <AnalyticsDashboard 
              userType="advertiser"
              data={{
                totalAmount: totalSpent.toFixed(2),
                activeRentals: activeRentals.length,
                avgDuration: activeRentals.length > 0 
                  ? Math.round(activeRentals.reduce((sum, rental) => sum + rental.duration, 0) / activeRentals.length) 
                  : 0,
                totalUsers: [...new Set(rentals.map(rental => rental.influencer._id))].length,
                // Generate mock data for spending over time
                earningsData: [
                  { label: 'Jan', value: Math.round(totalSpent * 0.1) },
                  { label: 'Feb', value: Math.round(totalSpent * 0.15) },
                  { label: 'Mar', value: Math.round(totalSpent * 0.2) },
                  { label: 'Apr', value: Math.round(totalSpent * 0.25) },
                  { label: 'May', value: Math.round(totalSpent * 0.3) },
                  { label: 'Jun', value: Math.round(totalSpent * 0.35) },
                ],
                // Generate mock data for platform distribution
                platformData: [
                  { label: 'Instagram', value: 40, color: 'primary' },
                  { label: 'TikTok', value: 30, color: 'secondary' },
                  { label: 'YouTube', value: 20, color: 'success' },
                  { label: 'Twitter', value: 10, color: 'info' },
                ],
                // Generate mock data for rental duration
                rentalDurationData: [
                  { label: '1 Day', value: 10 },
                  { label: '3 Days', value: 25 },
                  { label: '7 Days', value: 40 },
                  { label: '14 Days', value: 20 },
                  { label: '30 Days', value: 5 },
                ],
              }}
            />
          )}
        </TabPanel>
        
        {/* API Key Monitor Tab */}
        <TabPanel value={analyticsTabValue} index={1}>
          <ApiKeyRealTimeMonitor userType="advertiser" />
        </TabPanel>
        
        {/* Payment Dashboard Tab */}
        <TabPanel value={analyticsTabValue} index={2}>
          <PaymentDashboard />
        </TabPanel>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Campaigns Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Your Campaigns
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate('/campaigns')}
              >
                Manage Campaigns
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {profile?.campaigns?.length > 0 ? (
              <List>
                {profile.campaigns.map((campaign) => (
                  <ListItem
                    key={campaign._id}
                    button
                    onClick={() => navigate(`/campaigns/${campaign._id}`)}
                    secondaryAction={
                      <Box>
                        <IconButton edge="end" aria-label="edit" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/campaigns/${campaign._id}`);
                        }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this campaign?')) {
                            // Delete campaign logic would go here
                          }
                        }}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <CampaignIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={campaign.name}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {campaign.description}
                          </Typography>
                          <br />
                          <Chip
                            label={`${campaign.status}`}
                            size="small"
                            color={campaign.status === 'active' ? 'success' : 'default'}
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
                  You haven't created any campaigns yet.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/campaigns')}
                  sx={{ mt: 2 }}
                >
                  Create Your First Campaign
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* API Key Rentals Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={rentalTabValue}
              onChange={handleRentalTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Active Rentals" />
              <Tab label="Pending Requests" />
              <Tab label="Completed" />
            </Tabs>

            {/* Active Rentals Tab */}
            <TabPanel value={rentalTabValue} index={0}>
              {activeRentals.length > 0 ? (
                <List>
                  {activeRentals.map((rental) => (
                    <ListItem key={rental._id}>
                      <ListItemAvatar>
                        <Avatar>
                          <KeyIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${rental.influencer.username} - ${rental.socialAccount.platform}`}
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
                      <Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<KeyIcon />}
                          sx={{ mr: 1 }}
                          onClick={() => navigate(`/rentals/${rental._id}`)}
                        >
                          View Key
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<MessageIcon />}
                          onClick={() => navigate(`/messages/${rental.influencer._id}`)}
                        >
                          Message
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No active rentals.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/browse-influencers')}
                    >
                      Browse Influencers
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Use our advanced filtering to find the perfect match
                    </Typography>
                  </Box>
                </Box>
              )}
            </TabPanel>

            {/* Pending Requests Tab */}
            <TabPanel value={rentalTabValue} index={1}>
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
                        primary={`Request to ${rental.influencer.username}`}
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
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/rentals/${rental._id}`)}
                      >
                        View Details
                      </Button>
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
                        primary={`${rental.influencer.username} - ${rental.socialAccount.platform}`}
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

        {/* Recommended Influencers Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recommended Influencers
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>J</Avatar>
                      <Typography variant="h6" component="div">
                        JaneSmith
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Platform: Instagram
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Followers: 250K
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Specializes in fashion and lifestyle content with high engagement rates.
                    </Typography>
                    <Chip
                      label="$50/day"
                      size="small"
                      color="primary"
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/influencers/1')}>
                      View Profile
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>M</Avatar>
                      <Typography variant="h6" component="div">
                        MikeTech
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Platform: YouTube
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Subscribers: 500K
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tech reviewer with a focus on smartphones, laptops, and gadgets.
                    </Typography>
                    <Chip
                      label="$75/day"
                      size="small"
                      color="primary"
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/influencers/2')}>
                      View Profile
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>S</Avatar>
                      <Typography variant="h6" component="div">
                        SarahFit
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Platform: TikTok
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Followers: 1M
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fitness influencer sharing workout tips, nutrition advice, and wellness content.
                    </Typography>
                    <Chip
                      label="$100/day"
                      size="small"
                      color="primary"
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/influencers/3')}>
                      View Profile
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/influencers')}
                  >
                    Standard Browser
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/browse-influencers')}
                  >
                    Advanced Marketplace
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Try our new advanced marketplace with improved filtering and search capabilities
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdvertiserDashboard;
