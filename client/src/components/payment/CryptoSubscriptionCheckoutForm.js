import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
  Skeleton,
  Card,
  CardContent,
  RadioGroup,
  Radio,
  FormControlLabel,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CurrencyBitcoin as CurrencyBitcoinIcon,
  ContentCopy as ContentCopyIcon,
  QrCode as QrCodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useSelector } from 'react-redux';
import api from '../../services/api';

// Styled QR code container
const QRCodeContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: '100%',
  maxWidth: 280,
  margin: '0 auto'
}));

// Styled address container
const AddressContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  overflowX: 'hidden',
  '& .address': {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: theme.spacing(1),
    fontFamily: 'monospace',
    fontSize: '0.875rem'
  }
}));

// Styled crypto option
const CryptoOption = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& .crypto-icon': {
    width: 24,
    height: 24,
    marginRight: theme.spacing(1)
  },
  '& .crypto-info': {
    display: 'flex',
    flexDirection: 'column'
  },
  '& .crypto-name': {
    fontSize: '0.875rem',
    fontWeight: 500
  },
  '& .crypto-code': {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary
  }
}));

// Styled billing period option
const BillingPeriodOption = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  border: selected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[2]
  }
}));

const CryptoSubscriptionCheckoutForm = ({ rental, selectedCrypto = 'BTC', onCryptoChange, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [cryptoCurrencies, setCryptoCurrencies] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exchangeRates, setExchangeRates] = useState({});
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [initialPayment, setInitialPayment] = useState(null);
  const { token } = useSelector((state) => state.auth);

  // Load supported cryptocurrencies
  useEffect(() => {
    const loadCryptoCurrencies = async () => {
      try {
        const response = await api.get('/payments/crypto/currencies');
        setCryptoCurrencies(response.data.data);
      } catch (err) {
        console.error('Failed to load cryptocurrencies', err);
        setError('Failed to load supported cryptocurrencies');
      }
    };

    loadCryptoCurrencies();
  }, []);

  // Load exchange rates
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const response = await api.get('/payments/crypto/rates');
        setExchangeRates(response.data.data);
      } catch (err) {
        console.error('Failed to load exchange rates', err);
      }
    };

    loadExchangeRates();
    // Update rates every 60 seconds
    const ratesInterval = setInterval(loadExchangeRates, 60000);
    
    return () => {
      clearInterval(ratesInterval);
    };
  }, []);

  // Create subscription when component mounts or when crypto currency or billing period changes
  useEffect(() => {
    const createSubscription = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, create a subscription
        const subscriptionResponse = await api.post('/payments/crypto/subscriptions', {
          amount: rental.totalAmount,
          currency: 'USD',
          cryptoCurrency: selectedCrypto,
          billingPeriod: billingPeriod,
          name: `API Key Subscription - ${rental.influencer.username}`,
          description: `Recurring ${billingPeriod} access to ${rental.socialAccount?.platform} API key`,
          influencerId: rental.influencer._id,
          socialAccountId: rental.socialAccount?._id
        });
        
        setSubscription(subscriptionResponse.data.data);
        
        // Then, create the initial payment charge
        const chargeResponse = await api.post('/payments/crypto/charges', {
          amount: rental.totalAmount,
          currency: 'USD',
          cryptoCurrency: selectedCrypto,
          name: `Initial Payment - ${rental.influencer.username}`,
          description: `First payment for ${billingPeriod} subscription to ${rental.socialAccount?.platform} API key`,
          subscriptionId: subscriptionResponse.data.data.id
        });
        
        setInitialPayment(chargeResponse.data.data);
        setInitialLoading(false);
        setLoading(false);
        
        // Start polling for status updates on the initial payment
        startPolling(chargeResponse.data.data.id);
      } catch (err) {
        console.error('Failed to create subscription', err);
        setError('Failed to create subscription. Please try again.');
        setInitialLoading(false);
        setLoading(false);
      }
    };

    if (rental && selectedCrypto && billingPeriod) {
      createSubscription();
    }
    
    return () => {
      // Cleanup: clear polling interval when component unmounts
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [rental, selectedCrypto, billingPeriod]);

  // Start polling for status updates
  const startPolling = (chargeId) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Poll every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/payments/crypto/charges/${chargeId}`);
        const updatedCharge = response.data.data;
        
        setInitialPayment(updatedCharge);
        
        // If payment is complete, stop polling and call onSuccess
        if (updatedCharge.status === 'completed' || 
            updatedCharge.transaction.paymentComplete) {
          clearInterval(interval);
          setPollingInterval(null);
          
          if (onSuccess) {
            onSuccess({
              id: subscription.id,
              status: 'active',
              transactionId: updatedCharge.transaction.id,
              subscriptionId: subscription.id,
              initialPaymentId: updatedCharge.id
            });
          }
        }
        
        // If payment failed, stop polling and show error
        if (updatedCharge.status === 'failed' || 
            updatedCharge.status === 'expired') {
          clearInterval(interval);
          setPollingInterval(null);
          setError(`Initial payment ${updatedCharge.status}. Please try again.`);
        }
      } catch (err) {
        console.error('Failed to get charge status', err);
      }
    }, 5000);
    
    setPollingInterval(interval);
  };

  // Handle crypto currency change
  const handleCryptoChange = (event) => {
    const newCrypto = event.target.value;
    if (onCryptoChange) {
      onCryptoChange(newCrypto);
    }
  };

  // Handle billing period change
  const handleBillingPeriodChange = (period) => {
    setBillingPeriod(period);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Format price with cryptocurrency
  const formatCryptoPrice = (amount, code) => {
    if (!amount) return '0';
    return `${parseFloat(amount).toFixed(8)} ${code}`;
  };

  // Calculate estimated crypto amount
  const calculateEstimatedAmount = () => {
    if (!rental || !exchangeRates || !selectedCrypto) return 0;
    
    const rate = exchangeRates[selectedCrypto];
    if (!rate) return 0;
    
    return rental.totalAmount / parseFloat(rate);
  };
  
  // Get the period display name
  const getPeriodDisplayName = (period) => {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly (Every 3 months)';
      case 'yearly': return 'Yearly';
      default: return 'Monthly';
    }
  };
  
  // Restart the payment process
  const handleRefresh = () => {
    // Clear the current subscription and create a new one
    setSubscription(null);
    setInitialPayment(null);
    setInitialLoading(true);
    
    // Stop current polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    // Create new subscription (will be triggered by useEffect)
    const createSubscription = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, create a subscription
        const subscriptionResponse = await api.post('/payments/crypto/subscriptions', {
          amount: rental.totalAmount,
          currency: 'USD',
          cryptoCurrency: selectedCrypto,
          billingPeriod: billingPeriod,
          name: `API Key Subscription - ${rental.influencer.username}`,
          description: `Recurring ${billingPeriod} access to ${rental.socialAccount?.platform} API key`,
          influencerId: rental.influencer._id,
          socialAccountId: rental.socialAccount?._id
        });
        
        setSubscription(subscriptionResponse.data.data);
        
        // Then, create the initial payment charge
        const chargeResponse = await api.post('/payments/crypto/charges', {
          amount: rental.totalAmount,
          currency: 'USD',
          cryptoCurrency: selectedCrypto,
          name: `Initial Payment - ${rental.influencer.username}`,
          description: `First payment for ${billingPeriod} subscription to ${rental.socialAccount?.platform} API key`,
          subscriptionId: subscriptionResponse.data.data.id
        });
        
        setInitialPayment(chargeResponse.data.data);
        setInitialLoading(false);
        setLoading(false);
        
        // Start polling for status updates on the initial payment
        startPolling(chargeResponse.data.data.id);
      } catch (err) {
        console.error('Failed to create subscription', err);
        setError('Failed to create subscription. Please try again.');
        setInitialLoading(false);
        setLoading(false);
      }
    };
    
    createSubscription();
  };

  if (initialLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1">
          Generating subscription details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{ mr: 1 }}
        >
          Try Again
        </Button>
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Crypto currency selection */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="crypto-select-label">Cryptocurrency</InputLabel>
            <Select
              labelId="crypto-select-label"
              id="crypto-select"
              value={selectedCrypto}
              onChange={handleCryptoChange}
              label="Cryptocurrency"
              disabled={loading}
            >
              {cryptoCurrencies.map((crypto) => (
                <CryptoOption key={crypto.code} value={crypto.code}>
                  <img 
                    src={crypto.logo} 
                    alt={crypto.name} 
                    className="crypto-icon" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text x="0" y="18" font-size="18" fill="%2300aaee">${crypto.code[0]}</text></svg>`;
                    }}
                  />
                  <div className="crypto-info">
                    <span className="crypto-name">{crypto.name}</span>
                    <span className="crypto-code">{crypto.code}</span>
                  </div>
                </CryptoOption>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            <CalendarTodayIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
            Billing Period
          </Typography>
          
          <FormControl component="fieldset">
            <RadioGroup
              value={billingPeriod}
              onChange={(e) => handleBillingPeriodChange(e.target.value)}
            >
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <FormControlLabel
                    value="monthly"
                    control={<Radio />}
                    label="Monthly"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    value="quarterly"
                    control={<Radio />}
                    label="Quarterly"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    value="yearly"
                    control={<Radio />}
                    label="Yearly"
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>
      
      {/* Subscription info */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Subscription Details
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Amount (USD):
            </Typography>
            <Typography variant="subtitle1">
              ${rental.totalAmount.toFixed(2)} / {getPeriodDisplayName(billingPeriod).toLowerCase()}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              First Billing Date:
            </Typography>
            <Typography variant="subtitle1">
              {subscription ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'Today'}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Subscription Status:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              {loading ? (
                <CircularProgress size={14} sx={{ mr: 1 }} />
              ) : (
                <Box 
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: initialPayment?.status === 'completed' ? 'success.main' : 'warning.main',
                    mr: 1
                  }} 
                />
              )}
              <Typography variant="body1">
                {initialPayment?.status === 'completed' ? 'Active' : 'Pending Initial Payment'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Initial payment */}
      {initialPayment && initialPayment.status !== 'completed' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            <QrCodeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Initial Payment Required
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            To activate your subscription, please make the initial payment of {formatCryptoPrice(initialPayment.cryptoAmount, selectedCrypto)} to the address below.
          </Alert>
          
          {/* QR Code */}
          <QRCodeContainer>
            {initialPayment.qrCodes && initialPayment.qrCodes[selectedCrypto.toLowerCase()] ? (
              <img 
                src={initialPayment.qrCodes[selectedCrypto.toLowerCase()]} 
                alt="Payment QR Code" 
                style={{ width: '100%', maxWidth: 200 }}
              />
            ) : (
              <Skeleton variant="rectangular" width={200} height={200} />
            )}
            <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
              Scan with your {selectedCrypto} wallet
            </Typography>
          </QRCodeContainer>
          
          {/* Payment Address */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedCrypto} Address:
            </Typography>
            <AddressContainer>
              <span className="address">{initialPayment.address}</span>
              <Tooltip title="Copy Address">
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(initialPayment.address)}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </AddressContainer>
          </Box>
          
          {/* Amount to send */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Amount to Send:
            </Typography>
            <AddressContainer>
              <span className="address">{formatCryptoPrice(initialPayment.cryptoAmount, selectedCrypto)}</span>
              <Tooltip title="Copy Amount">
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(initialPayment.cryptoAmount)}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </AddressContainer>
          </Box>
          
          {/* Advanced options */}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
            
            <Collapse in={showAdvanced}>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Charge ID: {initialPayment.id}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  Subscription ID: {subscription.id}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  Payment Expires: {new Date(initialPayment.expiresAt).toLocaleString()}
                </Typography>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<RefreshIcon />}
                  sx={{ mt: 1 }}
                  onClick={handleRefresh}
                >
                  Generate New Payment
                </Button>
              </Paper>
            </Collapse>
          </Box>
        </Box>
      )}
      
      {initialPayment && initialPayment.status === 'completed' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Initial payment completed successfully! Your subscription is now active and will renew automatically every {getPeriodDisplayName(billingPeriod).toLowerCase()}.
        </Alert>
      )}
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" color="secondary" onClick={onCancel}>
          Cancel
        </Button>
        
        <Button 
          variant="contained" 
          color="primary"
          disabled={!initialPayment || initialPayment.status !== 'completed'}
          onClick={() => onSuccess && onSuccess({
            id: subscription.id,
            status: 'active',
            transactionId: initialPayment.transaction?.id,
            subscriptionId: subscription.id,
            initialPaymentId: initialPayment.id
          })}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default CryptoSubscriptionCheckoutForm;
