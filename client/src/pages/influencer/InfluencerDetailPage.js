import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import SubscriptionTierDisplay from '../../components/influencer/SubscriptionTierDisplay';
import VerificationBadge from '../../components/verification/VerificationBadge';
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
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Rating,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import MessageIcon from '@mui/icons-material/Message';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import { getInfluencerById, clearCurrentInfluencer } from '../../redux/slices/influencerSlice';
import { createRentalRequest } from '../../redux/slices/rentalSlice';
import { getUserReviews } from '../../redux/slices/reviewSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`influencer-tabpanel-${index}`}
      aria-labelledby={`influencer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const InfluencerDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentInfluencer, loading: influencerLoading, error: influencerError } = useSelector(
    (state) => state.influencer
  );
  const { userReviews, loading: reviewsLoading } = useSelector((state) => state.review);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { loading: rentalLoading, error: rentalError } = useSelector((state) => state.rental);

  const [tabValue, setTabValue] = useState(0);
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [rentalDuration, setRentalDuration] = useState(1);
  const [rentalNote, setRentalNote] = useState('');

  // Load influencer data and reviews on component mount
  useEffect(() => {
    dispatch(getInfluencerById(id));
    dispatch(getUserReviews({ userId: id, params: { limit: 10, page: 1 } }));

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentInfluencer());
    };
  }, [dispatch, id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle rental dialog open
  const handleRentalDialogOpen = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setRentalDialogOpen(true);
  };

  // Handle rental dialog close
  const handleRentalDialogClose = () => {
    setRentalDialogOpen(false);
  };

  // Handle rental request submission
  const handleRentalSubmit = () => {
    if (!selectedAccount) {
      return;
    }

    const rentalData = {
      influencerId: id,
      socialAccountId: selectedAccount,
      duration: rentalDuration,
      note: rentalNote,
    };

    dispatch(createRentalRequest(rentalData))
      .unwrap()
      .then(() => {
        setRentalDialogOpen(false);
        // Reset form
        setSelectedAccount('');
        setRentalDuration(1);
        setRentalNote('');
      })
      .catch((error) => {
        console.error('Failed to create rental request:', error);
      });
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedAccount || !currentInfluencer) {
      return 0;
    }

    const account = currentInfluencer.socialAccounts.find((acc) => acc._id === selectedAccount);
    return account ? account.rentalFee * rentalDuration : 0;
  };

  // Show loading spinner if data is being loaded
  if (influencerLoading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (influencerError) {
    return (
      <ErrorMessage
        message="Failed to load influencer details"
        error={influencerError}
        showRetryButton
        onRetry={() => {
          dispatch(getInfluencerById(id));
        }}
      />
    );
  }

  // If influencer not found
  if (!currentInfluencer) {
    return (
      <ErrorMessage
        message="Influencer not found"
        error="The influencer you're looking for doesn't exist or has been removed."
        showHomeButton
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Influencer Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar
              src={currentInfluencer.profile?.avatar}
              sx={{ width: 150, height: 150 }}
            >
              {currentInfluencer.username.charAt(0).toUpperCase()}
            </Avatar>
          </Grid>
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4" component="h1" sx={{ mr: 1 }}>
                    {currentInfluencer.profile?.name || currentInfluencer.username}
                  </Typography>
                  <VerificationBadge 
                    isVerified={currentInfluencer.isVerified}
                    isIdentityVerified={currentInfluencer.isIdentityVerified}
                    verifiedSocialAccounts={currentInfluencer.verifiedSocialAccounts || 0}
                    totalSocialAccounts={currentInfluencer.socialAccounts?.length || 0}
                    size="large"
                    showDetails={true}
                  />
                </Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  @{currentInfluencer.username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating
                    value={currentInfluencer.rating || 0}
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({currentInfluencer.reviewCount || 0} reviews)
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  {currentInfluencer.profile?.bio || 'No bio provided'}
                </Typography>
                {currentInfluencer.profile?.location && (
                  <Typography variant="body2" color="text.secondary">
                    Location: {currentInfluencer.profile.location}
                  </Typography>
                )}
              </Box>
              <Box>
                {isAuthenticated && user.userType === 'advertiser' && (
                  <Button
                    variant="contained"
                    startIcon={<MessageIcon />}
                    onClick={() => navigate(`/messages/${currentInfluencer._id}`)}
                    sx={{ mb: 2 }}
                  >
                    Message
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Section */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="API Keys" />
          <Tab label="Subscription Plans" />
          <Tab label="Reviews" />
        </Tabs>

        {/* API Keys Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Available API Keys
          </Typography>
          <Grid container spacing={3}>
            {currentInfluencer.socialAccounts?.length > 0 ? (
              currentInfluencer.socialAccounts.map((account) => (
                <Grid item key={account._id} xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <KeyIcon />
                        </Avatar>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" component="div" sx={{ mr: 1 }}>
                          {account.platform}
                        </Typography>
                        {account.isVerified && (
                          <VerificationBadge 
                            isVerified={true}
                            size="small"
                            showDetails={false}
                          />
                        )}
                      </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Username: {account.username}
                      </Typography>
                      {account.description && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {account.description}
                        </Typography>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" color="primary" fontWeight="bold">
                          ${account.rentalFee}/day
                        </Typography>
                        <Chip
                          label={account.isAvailable ? 'Available' : 'Unavailable'}
                          color={account.isAvailable ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      {isAuthenticated && user.userType === 'advertiser' && account.isAvailable && (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => {
                            setSelectedAccount(account._id);
                            handleRentalDialogOpen();
                          }}
                        >
                          Rent Now
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <KeyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No API Keys Available
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    This influencer hasn't added any API keys yet.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Subscription Plans Tab */}
        <TabPanel value={tabValue} index={1}>
          <SubscriptionTierDisplay 
            influencerId={id}
            platforms={currentInfluencer.platforms || []}
            onSelectTier={(tier) => {
              // Handle tier selection - could open a dialog or navigate to checkout
              console.log('Selected tier:', tier);
              // For now, just show the rental dialog
              setRentalDialogOpen(true);
            }}
          />
        </TabPanel>

        {/* Reviews Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Reviews
          </Typography>
          {reviewsLoading ? (
            <LoadingSpinner />
          ) : userReviews.length > 0 ? (
            <List>
              {userReviews.map((review) => (
                <ListItem key={review._id} alignItems="flex-start" divider>
                  <ListItemAvatar>
                    <Avatar src={review.reviewer.profile?.avatar}>
                      {review.reviewer.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">
                          {review.reviewer.profile?.name || review.reviewer.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Box sx={{ mb: 1, mt: 0.5 }}>
                          <Rating value={review.rating} readOnly size="small" />
                        </Box>
                        <Typography variant="body2" color="text.primary" component="span">
                          {review.comment}
                        </Typography>
                        {review.response && (
                          <Box sx={{ mt: 1, ml: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Response from {currentInfluencer.username}:
                            </Typography>
                            <Typography variant="body2">{review.response}</Typography>
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <StarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Reviews Yet
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This influencer hasn't received any reviews yet.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Rental Dialog */}
      <Dialog open={rentalDialogOpen} onClose={handleRentalDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Rent API Key</DialogTitle>
        <DialogContent>
          {rentalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {rentalError}
            </Alert>
          )}
          <Typography variant="subtitle1" gutterBottom>
            You are about to rent an API key from {currentInfluencer.username}
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel id="account-select-label">Select Platform</InputLabel>
            <Select
              labelId="account-select-label"
              id="account-select"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              label="Select Platform"
            >
              {currentInfluencer.socialAccounts
                ?.filter((account) => account.isAvailable)
                .map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.platform} - ${account.rentalFee}/day
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="duration-select-label">Rental Duration (Days)</InputLabel>
            <Select
              labelId="duration-select-label"
              id="duration-select"
              value={rentalDuration}
              onChange={(e) => setRentalDuration(e.target.value)}
              label="Rental Duration (Days)"
            >
              {[1, 3, 7, 14, 30].map((days) => (
                <MenuItem key={days} value={days}>
                  {days} {days === 1 ? 'day' : 'days'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Note to Influencer (Optional)"
            multiline
            rows={3}
            value={rentalNote}
            onChange={(e) => setRentalNote(e.target.value)}
          />
          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Total Price: ${calculateTotalPrice().toFixed(2)}
            </Typography>
            <Typography variant="body2">
              You will be charged once the influencer approves your request.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRentalDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRentalSubmit}
            disabled={!selectedAccount || rentalLoading}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InfluencerDetailPage;
