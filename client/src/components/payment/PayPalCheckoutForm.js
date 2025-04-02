import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Typography, CircularProgress, Paper, Alert, Stepper, Step, StepLabel, Link } from '@mui/material';
import { createPayPalOrder, capturePayPalPayment } from '../../redux/slices/paymentSlice';

const PayPalCheckoutForm = ({ rental, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [paymentExecuted, setPaymentExecuted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const { user } = useSelector((state) => state.auth);
  
  // Get stored payment state from localStorage on component mount
  useEffect(() => {
    try {
      const storedPaymentState = localStorage.getItem(`paypal_payment_${rental._id}`);
      if (storedPaymentState) {
        const parsedState = JSON.parse(storedPaymentState);
        setOrderData(parsedState.orderData);
        setActiveStep(parsedState.activeStep);
        
        // If we have a stored order with APPROVED status, update the UI accordingly
        if (parsedState.orderData && parsedState.orderData.status === 'APPROVED') {
          setActiveStep(1);
        }
      }
    } catch (err) {
      console.error('Error restoring payment state:', err);
    }
  }, [rental._id]);
  
  // Reset state when rental changes
  useEffect(() => {
    setLoading(false);
    setError(null);
    if (!localStorage.getItem(`paypal_payment_${rental._id}`)) {
      setOrderData(null);
      setActiveStep(0);
    }
    setPaymentExecuted(false);
  }, [rental]);
  
  // Save current payment state to localStorage
  const savePaymentState = (orderData, step) => {
    try {
      localStorage.setItem(
        `paypal_payment_${rental._id}`,
        JSON.stringify({
          orderData,
          activeStep: step
        })
      );
    } catch (err) {
      console.error('Error saving payment state:', err);
    }
  };
  
  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const resultAction = await dispatch(createPayPalOrder({ rentalId: rental._id }));
      
      if (createPayPalOrder.fulfilled.match(resultAction)) {
        const data = resultAction.payload.data;
        setOrderData(data);
        setActiveStep(1);
        
        // Save payment state to localStorage
        savePaymentState(data, 1);
        
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
          setError('Payment authorization failed. Please check your account settings.');
        } else if (resultAction.error.message.includes('not available')) {
          setError('PayPal service is temporarily unavailable. Please try again later.');
        } else if (resultAction.error.message.includes('rate limit')) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(resultAction.error.message || 'Failed to create PayPal order');
        }
      }
    } catch (err) {
      if (err.message.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCapturePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!orderData || !orderData.id) {
        setError('Order data is missing. Please restart the payment process.');
        setLoading(false);
        return;
      }
      
      const resultAction = await dispatch(capturePayPalPayment({ 
        orderId: orderData.id,
        rentalId: rental._id
      }));
      
      if (capturePayPalPayment.fulfilled.match(resultAction)) {
        setPaymentExecuted(true);
        setActiveStep(2);
        
        // Clear saved payment state as payment is complete
        localStorage.removeItem(`paypal_payment_${rental._id}`);
        
        // Call onSuccess callback
        if (onSuccess) {
          onSuccess(resultAction.payload.data);
        }
      } else {
        // Handle different error cases with more specific messages
        if (resultAction.error.message.includes('already captured')) {
          setError('This payment has already been processed. Please refresh the page.');
        } else if (resultAction.error.message.includes('expired')) {
          setError('The payment session has expired. Please start a new payment.');
        } else {
          setError(resultAction.error.message || 'Failed to complete the PayPal payment');
        }
      }
    } catch (err) {
      if (err.message.includes('network')) {
        setError('Network error during payment capture. Your payment may still be successful. Please check your PayPal account.');
      } else {
        setError(err.message || 'An error occurred during payment completion');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setError('Payment was canceled');
    setOrderData(null);
    setActiveStep(0);
    
    // Clear saved payment state
    localStorage.removeItem(`paypal_payment_${rental._id}`);
    
    // Call onCancel callback
    if (onCancel) {
      onCancel();
    }
  };
  
  // Handle retry for order creation if it failed
  const handleRetry = () => {
    setError(null);
    handleCreateOrder();
  };
  
  // If payment is already executed, show success message
  if (paymentExecuted) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Alert severity="success">
          Payment successful! Your rental is now active.
        </Alert>
      </Paper>
    );
  }
  
  // PayPal payment steps
  const steps = [
    'Create Payment',
    'Approve Payment',
    'Complete Payment'
  ];
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Pay with PayPal
      </Typography>
      
      {/* Payment progress stepper */}
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
      
      {!orderData ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
            You'll be redirected to PayPal to complete your payment securely.
            No PayPal account? No problem - you can pay with a credit card too.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateOrder}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
            sx={{ 
              bgcolor: '#0070ba', 
              '&:hover': { bgcolor: '#003087' },
              minWidth: '200px',
              py: 1.5
            }}
          >
            {loading ? 'Processing...' : 'Proceed to PayPal'}
          </Button>
          
          <Typography variant="caption" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <img 
              src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" 
              alt="PayPal" 
              style={{ height: '20px', marginRight: '8px' }}
            />
            Secure payment processing
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Order Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Amount:</Typography>
              <Typography variant="body2" fontWeight="medium">
                ${orderData.amount} {orderData.currency}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Order ID:</Typography>
              <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                {orderData.id}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Status:</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: orderData.status === 'APPROVED' ? 'success.main' : 'text.primary',
                  fontWeight: orderData.status === 'APPROVED' ? 'bold' : 'regular'
                }}
              >
                {orderData.status}
              </Typography>
            </Box>
          </Box>
          
          {orderData.status === 'APPROVED' ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              PayPal payment approved! Please click "Complete Payment" to finalize your order.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              Please complete the payment approval in the PayPal window.
              <Link 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  const paypalLink = orderData.links.find(link => link.rel === 'approve');
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
              onClick={handleCapturePayment}
              disabled={loading || orderData.status !== 'APPROVED'}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
              sx={{ 
                bgcolor: orderData.status === 'APPROVED' ? '#0070ba' : undefined,
                '&:hover': { bgcolor: orderData.status === 'APPROVED' ? '#003087' : undefined }
              }}
            >
              {loading ? 'Processing...' : 'Complete Payment'}
            </Button>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                Payment Steps:
              </Typography>
              <ol style={{ marginTop: 0, paddingLeft: '20px' }}>
                <li>Click "Proceed to PayPal" to open PayPal in a new window.</li>
                <li>Log in to your PayPal account and approve the payment.</li>
                <li>After approval, return to this window and click "Complete Payment".</li>
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

export default PayPalCheckoutForm;
