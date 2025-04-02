import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { addPaymentMethod } from '../../redux/slices/paymentSlice';

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

const PaymentMethodForm = ({ onSuccess }) => {
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const { loading, error: paymentError } = useSelector((state) => state.payment);

  useEffect(() => {
    if (paymentError) {
      setError(paymentError);
      setProcessing(false);
    }
  }, [paymentError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card information.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create a payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      // Add payment method to the database
      await dispatch(addPaymentMethod({
        paymentMethodId: paymentMethod.id,
        isDefault
      })).unwrap();

      // Clear the form
      elements.getElement(CardElement).clear();
      setCardComplete(false);
      setIsDefault(false);
      setProcessing(false);

      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'An error occurred while adding your payment method.');
      setProcessing(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add Payment Method
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <form onSubmit={handleSubmit}>
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

        <FormControlLabel
          control={
            <Checkbox
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              color="primary"
            />
          }
          label="Set as default payment method"
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!stripe || processing || !cardComplete}
          >
            {processing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Add Payment Method'
            )}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default PaymentMethodForm;
