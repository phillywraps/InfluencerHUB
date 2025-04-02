import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Paper,
  Grid,
  Divider,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  Info as InfoIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import { createAlipayOrder, checkAlipayStatus, cancelAlipayOrder } from '../../redux/slices/paymentSlice';
import QRCode from 'qrcode.react';

/**
 * AlipayCheckoutForm component for handling Alipay payments
 * 
 * @param {Object} props - Component props
 * @param {Object} props.rental - The rental object containing details about the API key rental
 * @param {Function} props.onSuccess - Callback function to be called when payment is successful
 * @param {Function} props.onCancel - Callback function to be called when payment is cancelled
 */
const AlipayCheckoutForm = ({ rental, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const { loading, error, alipayOrder, alipayQRCode, alipayOrderStatus, success } = useSelector((state) => state.payment);
  
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [expired, setExpired] = useState(false);
  
  const timerRef = useRef(null);
  const statusIntervalRef = useRef(null);
  
  // Create Alipay order when component mounts
  useEffect(() => {
    handleCreateOrder();
    
    // Clean up on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, []);
  
  // Watch for status changes
  useEffect(() => {
    if (alipayOrderStatus === 'COMPLETE' && alipayOrder) {
      handlePaymentSuccess();
    }
  }, [alipayOrderStatus, alipayOrder]);
  
  // Watch for success state from Redux
  useEffect(() => {
    if (success && alipayOrder) {
      handlePaymentSuccess();
    }
  }, [success]);
  
  // Start countdown timer when order is created
  useEffect(() => {
    if (alipayOrder && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [alipayOrder]);
  
  // Start status checking when order is created
  useEffect(() => {
    if (alipayOrder && !statusIntervalRef.current) {
      // Check status immediately
      checkStatus();
      
      // Then set up interval (every 5 seconds)
      statusIntervalRef.current = setInterval(() => {
        checkStatus();
      }, 5000);
    }
    
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [alipayOrder]);
  
  // Handle creating Alipay order
  const handleCreateOrder = async () => {
    try {
      await dispatch(createAlipayOrder({ rentalId: rental._id })).unwrap();
    } catch (err) {
      console.error('Failed to create Alipay order:', err);
    }
  };
  
  // Check payment status
  const checkStatus = async () => {
    if (!alipayOrder) return;
    
    try {
      await dispatch(checkAlipayStatus({ orderNumber: alipayOrder.orderNumber })).unwrap();
    } catch (err) {
      console.error('Failed to check Alipay status:', err);
    }
  };
  
  // Handle payment success
  const handlePaymentSuccess = () => {
    // Clear intervals
    if (timerRef.current) clearInterval(timerRef.current);
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    
    // Close QR dialog if open
    setShowQRDialog(false);
    
    // Call success callback
    if (onSuccess) {
      onSuccess(alipayOrder);
    }
  };
  
  // Handle cancel payment
  const handleCancelPayment = async () => {
    if (!alipayOrder) {
      if (onCancel) onCancel();
      return;
    }
    
    try {
      await dispatch(cancelAlipayOrder({ orderNumber: alipayOrder.orderNumber })).unwrap();
      
      // Clear intervals
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      
      // Close QR dialog if open
      setShowQRDialog(false);
      
      // Call cancel callback
      if (onCancel) onCancel();
    } catch (err) {
      console.error('Failed to cancel Alipay order:', err);
    }
  };
  
  // Format remaining time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Show QR code in dialog
  const handleShowQRCode = () => {
    setShowQRDialog(true);
  };
  
  // Close QR code dialog
  const handleCloseQRDialog = () => {
    setShowQRDialog(false);
  };
  
  // Retry creating order (after expiration)
  const handleRetry = () => {
    setExpired(false);
    setTimeRemaining(900);
    handleCreateOrder();
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && !alipayOrder ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {alipayOrder && !expired ? (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Order Summary
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Amount: ${rental.totalAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Order Number: {alipayOrder.orderNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {alipayOrderStatus || 'Pending'}
                    </Typography>
                    
                    {!success && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color={timeRemaining < 60 ? 'error.main' : 'text.secondary'}>
                          Time remaining: {formatTime(timeRemaining)}
                        </Typography>
                        <IconButton size="small" onClick={checkStatus} sx={{ ml: 1 }}>
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                    {alipayQRCode && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 1,
                            borderRadius: 1,
                            display: 'inline-block',
                            mb: 1,
                            cursor: 'pointer',
                          }}
                          onClick={handleShowQRCode}
                        >
                          <QRCode value={alipayQRCode} size={120} />
                        </Box>
                        <Typography variant="caption" display="block">
                          Tap to enlarge
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                    Scan the QR code with your Alipay app to complete the payment.
                  </Alert>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancelPayment}
                      disabled={loading}
                    >
                      Cancel Payment
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={handleShowQRCode}
                      startIcon={<QrCodeIcon />}
                      disabled={loading || !alipayQRCode}
                    >
                      Show QR Code
                    </Button>
                  </Box>
                </Box>
              </Paper>
              
              {success && (
                <Alert
                  severity="success"
                  icon={<CheckIcon />}
                  sx={{ mb: 2 }}
                >
                  Payment completed successfully!
                </Alert>
              )}
            </Box>
          ) : (
            <Box>
              {expired && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  The payment session has expired. Please try again.
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleRetry}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
                  {expired ? 'Try Again' : 'Create Alipay Payment'}
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
      
      {/* QR Code Dialog */}
      <Dialog
        open={showQRDialog}
        onClose={handleCloseQRDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Scan with Alipay App
            <IconButton edge="end" color="inherit" onClick={handleCloseQRDialog} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 2 }}>
            {alipayQRCode && (
              <Box sx={{ p: 2 }}>
                <QRCode value={alipayQRCode} size={250} />
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" align="center">
              Open your Alipay app and use the scan feature to scan this QR code
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
              Amount: ${rental.totalAmount.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Time remaining: {formatTime(timeRemaining)}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AlipayCheckoutForm;
