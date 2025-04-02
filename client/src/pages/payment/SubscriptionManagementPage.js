import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Paper,
  Divider,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getTransactionHistory, cancelSubscription } from '../../redux/slices/paymentSlice';
import { getRentals } from '../../redux/slices/rentalSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const SubscriptionManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { transactions, loading: paymentLoading, error: paymentError } = useSelector((state) => state.payment);
  const { rentals, loading: rentalLoading, error: rentalError } = useSelector((state) => state.rental);
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Load transactions and rentals
    dispatch(getTransactionHistory());
    dispatch(getRentals());
  }, [dispatch]);

  // Filter rentals with active subscriptions
  const subscriptionRentals = rentals.filter(rental => 
    rental.payment.isSubscription && 
    rental.payment.subscriptionStatus !== 'canceled' &&
    rental.status === 'active'
  );

  const handleCancelSubscription = (rental) => {
    setSelectedRental(rental);
    setCancelDialogOpen(true);
  };

  const confirmCancelSubscription = async () => {
    if (!selectedRental) return;
    
    setCancellingSubscription(true);
    setErrorMessage(null);
    
    try {
      await dispatch(cancelSubscription(selectedRental._id)).unwrap();
      setSuccess(`Subscription for ${selectedRental.platform} API key has been canceled successfully.`);
      
      // Refresh rentals
      dispatch(getRentals());
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel subscription. Please try again.');
    } finally {
      setCancellingSubscription(false);
      setCancelDialogOpen(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getSubscriptionPeriodText = (period) => {
    switch (period) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly (Every 3 Months)';
      case 'yearly':
        return 'Yearly';
      default:
        return period;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'past_due':
        return 'warning';
      case 'canceled':
        return 'error';
      case 'incomplete':
      case 'incomplete_expired':
        return 'error';
      case 'trialing':
        return 'info';
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  const loading = paymentLoading || rentalLoading;

  if (loading && !subscriptionRentals.length) {
    return <LoadingSpinner />;
  }

  const apiError = paymentError || rentalError;
  if (apiError && !subscriptionRentals.length) {
    return (
      <ErrorMessage
        message="Failed to load subscriptions"
        error={apiError}
        showRetryButton
        onRetry={() => {
          dispatch(getTransactionHistory());
          dispatch(getRentals());
        }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subscription Management
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="body1" paragraph>
          Manage your active API key rental subscriptions. You can view details and cancel subscriptions from this page.
        </Typography>
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {subscriptionRentals.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have any active subscriptions.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/influencers')}
          >
            Browse Influencers
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {subscriptionRentals.map((rental) => (
            <Grid item xs={12} md={6} lg={4} key={rental._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {rental.platform} API Key
                    </Typography>
                    <Chip
                      label={rental.payment.subscriptionStatus}
                      color={getStatusColor(rental.payment.subscriptionStatus)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Rented from: {rental.influencer?.username || 'Unknown'}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Subscription Details
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Billing Frequency:
                        </Typography>
                        <Typography variant="body2">
                          {getSubscriptionPeriodText(rental.payment.subscriptionPeriod)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Amount:
                        </Typography>
                        <Typography variant="body2">
                          ${rental.payment.amount} {rental.payment.currency}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Start Date:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(rental.duration.startDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Next Billing:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(rental.payment.nextBillingDate)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/rentals/${rental._id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleCancelSubscription(rental)}
                  >
                    Cancel Subscription
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your subscription for the {selectedRental?.platform} API key?
            You will still have access until the end of the current billing period.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancellingSubscription}>
            No, Keep Subscription
          </Button>
          <Button
            onClick={confirmCancelSubscription}
            color="error"
            disabled={cancellingSubscription}
            startIcon={cancellingSubscription ? <CircularProgress size={20} /> : null}
          >
            {cancellingSubscription ? 'Cancelling...' : 'Yes, Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionManagementPage;
