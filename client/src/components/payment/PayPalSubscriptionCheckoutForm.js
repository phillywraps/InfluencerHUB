import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Paper, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Stepper, 
  Step, 
  StepLabel,
  Link,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { createPayPalSubscription, executePayPalSubscription } from '../../redux/slices/paymentSlice';

const PayPalSubscriptionCheckoutForm = ({ rental, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionExecuted, setSubscriptionExecuted] = useState(false);
  const [subscriptionPeriod, setSubscriptionPeriod] = useState('monthly');
  const [activeStep, setActiveStep] = useState(0);
  
  const { user } = useSelector((state) => state.auth);
  
  // Get stored subscription state from localStorage on component mount
  useEffect(() => {
    try {
      const storedSubscriptionState = localStorage.getItem(`paypal_subscription_${rental._id}`);
      if (storedSubscriptionState) {
        const parsedState = JSON.parse(storedSubscriptionState);
        setSubscriptionData(parsedState.subscriptionData);
        setSubscriptionPeriod(parsedState.subscriptionPeriod);
        setActiveStep(parsedState.activeStep);
        
        // If we have a stored subscription with APPROVED status, update the UI accordingly
        if (parsedState.subscriptionData && parsedState.subscriptionData.status === 'APPROVED') {
          setActiveStep(1);
        }
      }
    } catch (err) {
      console.error('Error restoring subscription state:', err);
    }
  }, [rental._id]);
  
  // Reset state when rental changes
  useEffect(() => {
    setLoading(false);
    setError(null);
    if (!localStorage.getItem(`paypal_subscription_${rental._id}`)) {
      setSubscriptionData(null);
      setSubscriptionExecuted(false);
      setSubscriptionPeriod('monthly');
      setActiveStep(0);
    }
  }, [rental]);
  
  // Save current subscription state to localStorage
  const saveSubscriptionState = (subscriptionData, period, step) => {
    try {
      localStorage.setItem(
        `paypal_subscription_${rental._id}`,
        JSON.stringify({
          subscriptionData,
          subscriptionPeriod: period,
          activeStep: step
        })
      );
    } catch (err) {
      console.error('Error saving subscription state:', err);
    }
  };
  
  const handleCreateSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const resultAction = await dispatch(createPayPalSubscription({ 
        rentalId: rental._id,
        subscriptionPeriod
      }));
      
      if (createPayPalSubscription.fulfilled.match(resultAction)) {
        const data = resultAction.payload.data;
        setSubscriptionData(data);
        setActiveStep(1);
        
        // Save subscription state to localStorage
        saveSubscriptionState(data, subscriptionPeriod, 1);
        
        // Open PayPal in a new window
        const paypalLink = data.links.find(link => link.rel === 'approve');
        if (paypalLink) {
          window.open(paypalLink.href, '_blank');
        } else {
          setError('PayPal approval link not found in the response');
        }
      } else {
        // Handle different error cases with more specific messages
        if (resultAction.error.message.includes('unauthorized')) {
          setError('Subscription authorization failed. Please check your account settings.');
        } else if (resultAction.error.message.includes('not available')) {
          setError('PayPal subscription service is temporarily unavailable. Please try again later.');
        } else if (resultAction.error.message.includes('rate limit')) {
          setError('Too many requests. Please wait a moment and try again.');
        } else if (resultAction.error.message.includes('billing agreement')) {
          setError('There was an issue setting up the recurring billing agreement. Please try again.');
        } else {
          setError(resultAction.error.message || 'Failed to create PayPal subscription');
        }
      }
    } catch (err) {
      if (err.message.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred while creating the subscription. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleExecuteSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!subscriptionData || !subscriptionData.id) {
        setError('Subscription data is missing. Please restart the subscription process.');
        setLoading(false);
        return;
      }
      
      const resultAction = await dispatch(executePayPalSubscription({ 
        token: subscriptionData.id,
        rentalId: rental._id
      }));
      
      if (executePayPalSubscription.fulfilled.match(resultAction)) {
        setSubscriptionExecuted(true);
        setActiveStep(2);
        
        // Clear saved subscription state as subscription is complete
        localStorage.removeItem(`paypal_subscription_${rental._id}`);
        
        // Call onSuccess callback
        if (onSuccess) {
          onSuccess(resultAction.payload.data);
        }
      } else {
        // Handle different error cases with more specific messages
        if (resultAction.error.message.includes('already executed')) {
          setError('This subscription has already been processed. Please refresh the page.');
        } else if (resultAction.error.message.includes('expired')) {
          setError('The subscription session has expired. Please start a new subscription.');
        } else if (resultAction.error.message.includes('not approved')) {
          setError('The subscription has not been approved in PayPal. Please complete the approval process first.');
        } else {
          setError(resultAction.error.message || 'Failed to complete the PayPal subscription');
        }
      }
    } catch (err) {
      if (err.message.includes('network')) {
        setError('Network error during subscription completion. Your subscription may still have been set up. Please check your PayPal account.');
      } else {
        setError(err.message || 'An error occurred during subscription completion');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setError('Subscription was canceled');
    setSubscriptionData(null);
    setActiveStep(0);
    
    // Clear saved subscription state
    localStorage.removeItem(`paypal_subscription_${rental._id}`);
    
    // Call onCancel callback
    if (onCancel) {
      onCancel();
    }
  };
  
  // Handle retry for subscription creation if it failed
  const handleRetry = () => {
    setError(null);
    handleCreateSubscription();
  };
  
  // Calculate subscription amount based on period
  const getSubscriptionAmount = () => {
    let amount = rental.rentalFee;
    if (subscriptionPeriod === 'quarterly') {
      amount = (rental.rentalFee * 3 * 0.9).toFixed(2); // 10% discount for quarterly
    } else if (subscriptionPeriod === 'yearly') {
      amount = (rental.rentalFee * 12 * 0.8).toFixed(2); // 20% discount for yearly
    }
    return amount;
  };
  
  // Calculate total savings
  const getSavings = () => {
    if (subscriptionPeriod === 'quarterly') {
      return (rental.rentalFee * 3 * 0.1).toFixed(2); // 10% off quarterly
    } else if (subscriptionPeriod === 'yearly') {
      return (rental.rentalFee * 12 * 0.2).toFixed(2); // 20% off yearly
    }
    return 0;
  };
  
  // If subscription is already executed, show success message
  if (subscriptionExecuted) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Alert severity="success">
          Subscription successful! Your rental is now active.
        </Alert>
      </Paper>
    );
  }
  
  // PayPal subscription steps
  const steps = [
    'Choose Plan',
    'Approve Subscription',
    'Complete Setup'
  ];
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Subscribe with PayPal
      </Typography>
      
      {/* Subscription progress stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            error.includes('network') || error.includes('try again') ? (
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      )}
      
      {!subscriptionData ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Choose a subscription plan that works for you:
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="subscription-period-label">Subscription Plan</InputLabel>
            <Select
              labelId="subscription-period-label"
              id="subscription-period"
              value={subscriptionPeriod}
              label="Subscription Plan"
              onChange={(e) => setSubscriptionPeriod(e.target.value)}
            >
              <MenuItem value="monthly">Monthly - ${rental.rentalFee}/month</MenuItem>
              <MenuItem value="quarterly">Quarterly - ${(rental.rentalFee * 3 * 0.9).toFixed(2)}/quarter (Save 10%)</MenuItem>
              <MenuItem value="yearly">Yearly - ${(rental.rentalFee * 12 * 0.8).toFixed(2)}/year (Save 20%)</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">
                Selected Plan: {subscriptionPeriod.charAt(0).toUpperCase() + subscriptionPeriod.slice(1)}
              </Typography>
              <Tooltip title="You can cancel your subscription at any time from your PayPal account">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2">Price:</Typography>
              <Typography variant="body2" fontWeight="medium">
                ${getSubscriptionAmount()} {subscriptionPeriod !== 'monthly' && `(${subscriptionPeriod})`}
              </Typography>
            </Box>
            {subscriptionPeriod !== 'monthly' && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2">You save:</Typography>
                <Typography variant="body2" fontWeight="medium" color="success.main">
                  ${getSavings()}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
              You'll be redirected to PayPal to set up your subscription securely.
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateSubscription}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
              sx={{ 
                bgcolor: '#0070ba', 
                '&:hover': { bgcolor: '#003087' },
                minWidth: '200px',
                py: 1.5
              }}
            >
              {loading ? 'Processing...' : 'Set Up Subscription'}
            </Button>
            
            <Typography variant="caption" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <img 
                src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" 
                alt="PayPal" 
                style={{ height: '20px', marginRight: '8px' }}
              />
              Secure subscription processing
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Subscription Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Plan:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {subscriptionData.subscriptionPeriod.charAt(0).toUpperCase() + subscriptionData.subscriptionPeriod.slice(1)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Amount:</Typography>
              <Typography variant="body2" fontWeight="medium">
                ${subscriptionData.amount} {subscriptionData.currency}/{subscriptionData.subscriptionPeriod}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Subscription ID:</Typography>
              <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                {subscriptionData.id}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Status:</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: subscriptionData.status === 'APPROVED' ? 'success.main' : 'text.primary',
                  fontWeight: subscriptionData.status === 'APPROVED' ? 'bold' : 'regular'
                }}
              >
                {subscriptionData.status}
              </Typography>
            </Box>
          </Box>
          
          {subscriptionData.status === 'APPROVED' ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              PayPal subscription approved! Please click "Complete Subscription" to finalize your subscription.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              Please complete the subscription approval in the PayPal window.
              <Link 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  const paypalLink = subscriptionData.links.find(link => link.rel === 'approve');
                  if (paypalLink) {
                    window.open(paypalLink.href, '_blank');
                  }
                }}
                sx={{ display: 'block', mt: 1 }}
              >
                Reopen PayPal window
              </Link>
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleExecuteSubscription}
              disabled={loading || subscriptionData.status !== 'APPROVED'}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
              sx={{ 
                bgcolor: subscriptionData.status === 'APPROVED' ? '#0070ba' : undefined,
                '&:hover': { bgcolor: subscriptionData.status === 'APPROVED' ? '#003087' : undefined }
              }}
            >
              {loading ? 'Processing...' : 'Complete Subscription'}
            </Button>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                Subscription Steps:
              </Typography>
              <ol style={{ marginTop: 0, paddingLeft: '20px' }}>
                <li>Click "Set Up Subscription" to open PayPal in a new window.</li>
                <li>Log in to your PayPal account and approve the subscription.</li>
                <li>After approval, return to this window and click "Complete Subscription".</li>
              </ol>
              <Typography variant="body2" sx={{ mt: 1 }}>
                If your PayPal window was closed or you need to restart, use the "Reopen PayPal window" link above.
              </Typography>
            </Alert>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default PayPalSubscriptionCheckoutForm;
