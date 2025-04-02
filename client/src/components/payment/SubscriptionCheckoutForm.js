import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { createSubscription, getPaymentMethods } from '../../redux/slices/paymentSlice';
import { updateRentalStatus } from '../../redux/slices/rentalSlice';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

const SubscriptionCheckoutForm = ({ rental, onSuccess, onCancel }) => {
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('new');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [subscriptionPeriod, setSubscriptionPeriod] = useState('monthly');
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  
  const { paymentMethods, subscription, loading, error: paymentError, success } = useSelector((state) => state.payment);

  useEffect(() => {
    // Load saved payment methods
    dispatch(getPaymentMethods());
  }, [dispatch]);

  useEffect(() => {
    if (paymentError) {
      setError(paymentError);
      setProcessing(false);
    }
  }, [paymentError]);

  useEffect(() => {
    if (success) {
      // Update rental status after successful subscription
      dispatch(updateRentalStatus({
        id: rental._id,
        statusData: { paymentStatus: 'completed' }
      }));
      
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [success, dispatch, rental, onSuccess]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    if (paymentMethod === 'new' && !cardComplete) {
      setError('Please complete your card information.');
      return;
    }

    if (paymentMethod === 'saved' && !selectedPaymentMethodId) {
      setError('Please select a payment method.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      let paymentMethodId;
      
      if (paymentMethod === 'new') {
        // Create a payment method for the new card
        const { error: stripeError, paymentMethod: newPaymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: elements.getElement(CardElement)
        });

        if (stripeError) {
          setError(stripeError.message);
          setProcessing(false);
          return;
        }
        
        paymentMethodId = newPaymentMethod.id;
      } else {
        // Use the selected saved payment method
        paymentMethodId = selectedPaymentMethodId;
      }
      
      // Create subscription
      await dispatch(createSubscription({
        rentalId: rental._id,
        paymentMethodId,
        subscriptionPeriod
      })).unwrap();
    } catch (err) {
      setError(err.message || 'An error occurred during subscription setup.');
      setProcessing(false);
    }
  };

  const formatCardBrand = (brand) => {
    switch (brand) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      case 'discover':
        return 'Discover';
      case 'diners':
        return 'Diners Club';
      case 'jcb':
        return 'JCB';
      case 'unionpay':
        return 'UnionPay';
      default:
        return brand;
    }
  };

  const getSubscriptionPriceText = () => {
    const baseAmount = rental.payment.amount;
    
    switch (subscriptionPeriod) {
      case 'monthly':
        return `$${baseAmount} per month`;
      case 'quarterly':
        return `$${baseAmount} every 3 months`;
      case 'yearly':
        return `$${baseAmount} per year`;
      default:
        return `$${baseAmount}`;
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Set Up Subscription
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Rental Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Platform
            </Typography>
            <Typography variant="body1" gutterBottom>
              {rental.platform}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body1" gutterBottom>
              {new Date(rental.duration.startDate).toLocaleDateString()} - {new Date(rental.duration.endDate).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="subscription-period-label">Billing Frequency</InputLabel>
          <Select
            labelId="subscription-period-label"
            id="subscription-period"
            value={subscriptionPeriod}
            label="Billing Frequency"
            onChange={(e) => setSubscriptionPeriod(e.target.value)}
          >
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly (Every 3 Months)</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            {getSubscriptionPriceText()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can cancel your subscription at any time.
          </Typography>
        </Box>
        
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Payment Method</FormLabel>
          <RadioGroup
            aria-label="payment-method"
            name="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <FormControlLabel value="new" control={<Radio />} label="Use a new card" />
            {paymentMethods.length > 0 && (
              <FormControlLabel value="saved" control={<Radio />} label="Use a saved card" />
            )}
          </RadioGroup>
        </FormControl>

        {paymentMethod === 'new' ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Card Information
            </Typography>
            <Box
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                backgroundColor: '#f9f9f9'
              }}
            >
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={(e) => {
                  setCardComplete(e.complete);
                  if (e.error) {
                    setError(e.error.message);
                  } else {
                    setError(null);
                  }
                }}
              />
            </Box>
          </Box>
        ) : (
          paymentMethods.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Select a Card
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="saved-payment-method"
                  name="saved-payment-method"
                  value={selectedPaymentMethodId}
                  onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <FormControlLabel
                      key={method.id}
                      value={method.id}
                      control={<Radio />}
                      label={`${formatCardBrand(method.card.brand)} •••• ${method.card.last4} (Expires ${method.card.expMonth}/${method.card.expYear})`}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          )
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={
              !stripe ||
              processing ||
              (paymentMethod === 'new' && !cardComplete) ||
              (paymentMethod === 'saved' && !selectedPaymentMethodId)
            }
          >
            {processing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Subscribe (${getSubscriptionPriceText()})`
            )}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default SubscriptionCheckoutForm;
