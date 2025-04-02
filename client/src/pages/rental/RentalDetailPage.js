import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import ApiKeyViewer from '../../components/rental/ApiKeyViewer';
import CheckoutForm from '../../components/payment/CheckoutForm';
import SubscriptionCheckoutForm from '../../components/payment/SubscriptionCheckoutForm';
import PayPalCheckoutForm from '../../components/payment/PayPalCheckoutForm';
import PayPalSubscriptionCheckoutForm from '../../components/payment/PayPalSubscriptionCheckoutForm';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import MessageIcon from '@mui/icons-material/Message';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import { getRentalById, updateRentalStatus, getRentalApiKey } from '../../redux/slices/rentalSlice';
import { clearPaymentState } from '../../redux/slices/paymentSlice';

// Initialize Stripe with your publishable key
// In a real app, this would come from an environment variable
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key');
import { createReview } from '../../redux/slices/reviewSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const RentalDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentRental, apiKey, loading, error } = useSelector((state) => state.rental);
  const { user } = useSelector((state) => state.auth);

  // State for dialogs and forms
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [paypalPaymentDialogOpen, setPaypalPaymentDialogOpen] = useState(false);
  const [paypalSubscriptionDialogOpen, setPaypalSubscriptionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Load rental data on component mount
  useEffect(() => {
    dispatch(getRentalById(id));
    
    // Clear payment state when component mounts
    dispatch(clearPaymentState());
  }, [dispatch, id]);

  // Handle approve rental
  const handleApproveRental = () => {
    dispatch(updateRentalStatus({ id, statusData: { status: 'active' } }))
      .unwrap()
      .then(() => {
        setApproveDialogOpen(false);
      })
      .catch((error) => {
        console.error('Failed to approve rental:', error);
      });
  };

  // Handle reject rental
  const handleRejectRental = () => {
    dispatch(updateRentalStatus({ id, statusData: { status: 'cancelled', reason: rejectionReason } }))
      .unwrap()
      .then(() => {
        setRejectDialogOpen(false);
      })
      .catch((error) => {
        console.error('Failed to reject rental:', error);
      });
  };

  // Handle submit review
  const handleSubmitReview = () => {
    const reviewData = {
      rentalId: id,
      rating: reviewRating,
      comment: reviewComment,
    };

    dispatch(createReview(reviewData))
      .unwrap()
      .then(() => {
        setReviewDialogOpen(false);
        // Reset form
        setReviewRating(5);
        setReviewComment('');
      })
      .catch((error) => {
        console.error('Failed to submit review:', error);
      });
  };

  // Handle view API key
  const handleViewApiKey = () => {
    dispatch(getRentalApiKey(id))
      .unwrap()
      .then(() => {
        setApiKeyDialogOpen(true);
      })
      .catch((error) => {
        console.error('Failed to get API key:', error);
      });
  };

  // Get rental status steps
  const getStatusSteps = () => {
    const steps = [
      { label: 'Requested', completed: true },
      { label: 'Approved', completed: currentRental?.status === 'active' || currentRental?.status === 'completed' },
      { label: 'Completed', completed: currentRental?.status === 'completed' },
    ];

    if (currentRental?.status === 'cancelled') {
      return [
        { label: 'Requested', completed: true },
        { label: 'Cancelled', completed: true },
      ];
    }

    return steps;
  };

  // Get active step for stepper
  const getActiveStep = () => {
    switch (currentRental?.status) {
      case 'pending':
        return 0;
      case 'active':
        return 1;
      case 'completed':
        return 2;
      case 'cancelled':
        return 1;
      default:
        return 0;
    }
  };

  // Show loading spinner if data is being loaded
  if (loading && !currentRental) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (error && !currentRental) {
    return (
      <ErrorMessage
        message="Failed to load rental details"
        error={error}
        showRetryButton
        onRetry={() => {
          dispatch(getRentalById(id));
        }}
      />
    );
  }

  // If rental not found
  if (!currentRental) {
    return (
      <ErrorMessage
        message="Rental not found"
        error="The rental you're looking for doesn't exist or has been removed."
        showHomeButton
      />
    );
  }

  // Determine if the current user is the influencer or advertiser
  const isInfluencer = user.userType === 'influencer';
  const isAdvertiser = user.userType === 'advertiser';

  // Determine the other party in the rental
  const otherParty = isInfluencer ? currentRental.advertiser : currentRental.influencer;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Rental Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {currentRental.socialAccount.platform} API Key Rental
              </Typography>
              <Chip
                label={currentRental.status.charAt(0).toUpperCase() + currentRental.status.slice(1)}
                color={
                  currentRental.status === 'active'
                    ? 'success'
                    : currentRental.status === 'pending'
                    ? 'warning'
                    : currentRental.status === 'completed'
                    ? 'default'
                    : 'error'
                }
                sx={{ ml: 2 }}
              />
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              {isInfluencer
                ? `Rented to ${currentRental.advertiser.username}`
                : `Rented from ${currentRental.influencer.username}`}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(currentRental.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              {currentRental.startDate && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(currentRental.startDate).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
              {currentRental.endDate && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(currentRental.endDate).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1">{currentRental.duration} days</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Fee
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  ${currentRental.rentalFee}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
            <Box>
              {/* Action buttons based on user type and rental status */}
              {isInfluencer && currentRental.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setApproveDialogOpen(true)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    Reject
                  </Button>
                </Box>
              )}
              {/* Payment buttons for advertisers with pending rentals */}
              {isAdvertiser && currentRental.status === 'pending' && currentRental.payment.status === 'pending' && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Pay with Stripe:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setPaymentDialogOpen(true)}
                    >
                      One-Time Payment
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setSubscriptionDialogOpen(true)}
                    >
                      Subscribe
                    </Button>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Pay with PayPal:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setPaypalPaymentDialogOpen(true)}
                      sx={{ bgcolor: '#0070ba', '&:hover': { bgcolor: '#003087' } }}
                    >
                      PayPal One-Time
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setPaypalSubscriptionDialogOpen(true)}
                      sx={{ color: '#0070ba', borderColor: '#0070ba', '&:hover': { borderColor: '#003087' } }}
                    >
                      PayPal Subscribe
                    </Button>
                  </Box>
                </>
              )}
              
              {/* API Key button removed as we'll show the ApiKeyViewer component directly */}
              {currentRental.status === 'completed' && !currentRental.hasReview && (
                <Button
                  variant="contained"
                  startIcon={<StarIcon />}
                  onClick={() => setReviewDialogOpen(true)}
                >
                  Leave Review
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={() => navigate(`/messages/${otherParty._id}`)}
                sx={{ mt: 2 }}
              >
                Message {otherParty.username}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Rental Status Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Rental Status
        </Typography>
        <Stepper activeStep={getActiveStep()} alternativeLabel sx={{ mt: 3 }}>
          {getStatusSteps().map((step, index) => (
            <Step key={index} completed={step.completed}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* API Key Viewer (Only for Advertisers with active rentals) */}
      {isAdvertiser && currentRental.status === 'active' && currentRental.payment.status === 'completed' && (
        <ApiKeyViewer rental={currentRental} />
      )}

      {/* Rental Details */}
      <Grid container spacing={3}>
        {/* Left Column - Rental Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Rental Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Platform
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {currentRental.socialAccount.platform}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {currentRental.socialAccount.username}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {currentRental.socialAccount.description || 'No description provided'}
                </Typography>
              </Grid>
              {currentRental.note && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Note from {isInfluencer ? 'Advertiser' : 'Influencer'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentRental.note}
                  </Typography>
                </Grid>
              )}
              {currentRental.status === 'cancelled' && currentRental.reason && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Cancellation Reason:</Typography>
                    <Typography variant="body2">{currentRental.reason}</Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column - User Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {isInfluencer ? 'Advertiser' : 'Influencer'} Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={otherParty.profile?.avatar}
                sx={{ width: 64, height: 64, mr: 2 }}
              >
                {otherParty.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {otherParty.profile?.name || otherParty.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  @{otherParty.username}
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              {otherParty.profile?.bio && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bio
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {otherParty.profile.bio}
                  </Typography>
                </Grid>
              )}
              {otherParty.profile?.location && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {otherParty.profile.location}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/${isInfluencer ? 'advertisers' : 'influencers'}/${otherParty._id}`)}
                >
                  View Full Profile
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Reviews Section */}
        {currentRental.review && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Review
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={currentRental.review.reviewer.profile?.avatar}>
                      {currentRental.review.reviewer.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">
                          {currentRental.review.reviewer.profile?.name || currentRental.review.reviewer.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(currentRental.review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              sx={{
                                color: i < currentRental.review.rating ? 'primary.main' : 'text.disabled',
                                fontSize: '1.2rem',
                              }}
                            />
                          ))}
                        </Box>
                        <Typography variant="body1" color="text.primary" component="span">
                          {currentRental.review.comment}
                        </Typography>
                        {currentRental.review.response && (
                          <Box sx={{ mt: 2, ml: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Response:
                            </Typography>
                            <Typography variant="body2">{currentRental.review.response}</Typography>
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Rental Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to approve this rental request from {currentRental.advertiser.username}?
          </Typography>
          <Typography variant="body1" paragraph>
            By approving, you agree to provide access to your {currentRental.socialAccount.platform} API key for {currentRental.duration} days.
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            You will receive ${currentRental.rentalFee} for this rental.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApproveRental}
            startIcon={<CheckCircleIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Subscription Dialog */}
      <Dialog 
        open={subscriptionDialogOpen} 
        onClose={() => setSubscriptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Set Up Subscription</DialogTitle>
        <DialogContent>
          <Elements stripe={stripePromise}>
            <SubscriptionCheckoutForm 
              rental={currentRental} 
              onSuccess={() => {
                setSubscriptionDialogOpen(false);
                dispatch(getRentalById(id));
              }}
              onCancel={() => setSubscriptionDialogOpen(false)}
            />
          </Elements>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogContent>
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              rental={currentRental} 
              onSuccess={() => {
                setPaymentDialogOpen(false);
                dispatch(getRentalById(id));
              }}
              onCancel={() => setPaymentDialogOpen(false)}
            />
          </Elements>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Rental Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to reject this rental request from {currentRental.advertiser.username}?
          </Typography>
          <TextField
            fullWidth
            label="Reason for Rejection (Optional)"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectRental}
            startIcon={<CancelIcon />}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            How was your experience with {isInfluencer ? currentRental.advertiser.username : currentRental.influencer.username}?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Rating:
            </Typography>
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                sx={{
                  color: i < reviewRating ? 'primary.main' : 'text.disabled',
                  cursor: 'pointer',
                  fontSize: '2rem',
                }}
                onClick={() => setReviewRating(i + 1)}
              />
            ))}
          </Box>
          <TextField
            fullWidth
            label="Your Review"
            multiline
            rows={4}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitReview}
            disabled={!reviewComment}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* PayPal Payment Dialog */}
      <Dialog 
        open={paypalPaymentDialogOpen} 
        onClose={() => setPaypalPaymentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Payment with PayPal</DialogTitle>
        <DialogContent>
          <PayPalCheckoutForm 
            rental={currentRental} 
            onSuccess={() => {
              setPaypalPaymentDialogOpen(false);
              dispatch(getRentalById(id));
            }}
            onCancel={() => setPaypalPaymentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* PayPal Subscription Dialog */}
      <Dialog 
        open={paypalSubscriptionDialogOpen} 
        onClose={() => setPaypalSubscriptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Set Up PayPal Subscription</DialogTitle>
        <DialogContent>
          <PayPalSubscriptionCheckoutForm 
            rental={currentRental} 
            onSuccess={() => {
              setPaypalSubscriptionDialogOpen(false);
              dispatch(getRentalById(id));
            }}
            onCancel={() => setPaypalSubscriptionDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)}>
        <DialogTitle>API Key</DialogTitle>
        <DialogContent>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This API key is for your use only. Do not share it with anyone else.
              </Alert>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Platform
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentRental.socialAccount.platform}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    API Key
                  </Typography>
                  <Typography
                    variant="body1"
                    component="div"
                    sx={{
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                    }}
                  >
                    {apiKey?.key || 'API key not available'}
                  </Typography>
                  {apiKey?.secret && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                        API Secret
                      </Typography>
                      <Typography
                        variant="body1"
                        component="div"
                        sx={{
                          p: 2,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          wordBreak: 'break-all',
                          fontFamily: 'monospace',
                        }}
                      >
                        {apiKey.secret}
                      </Typography>
                    </>
                  )}
                  {apiKey?.additionalInfo && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                        Additional Information
                      </Typography>
                      <Typography variant="body1">{apiKey.additionalInfo}</Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RentalDetailPage;
