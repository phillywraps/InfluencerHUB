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
  TextField,
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
  Refresh as RefreshIcon
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

const CryptoCheckoutForm = ({ rental, selectedCrypto = 'BTC', onCryptoChange, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [charge, setCharge] = useState(null);
  const [cryptoCurrencies, setCryptoCurrencies] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exchangeRates, setExchangeRates] = useState({});
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

  // Create charge when component mounts or when crypto currency changes
  useEffect(() => {
    const createCharge = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.post('/payments/crypto/charges', {
          amount: rental.totalAmount,
          currency: 'USD',
          cryptoCurrency: selectedCrypto,
          name: `API Key Rental - ${rental.influencer.username}`,
          description: `${rental.duration} day access to ${rental.socialAccount?.platform} API key`,
          rentalId: rental._id !== `temp-${Date.now()}` ? rental._id : null
        });
        
        setCharge(response.data.data);
        setInitialLoading(false);
        setLoading(false);
        
        // Start polling for status updates
        startPolling(response.data.data.id);
      } catch (err) {
        console.error('Failed to create charge', err);
        setError('Failed to create payment request. Please try again.');
        setInitialLoading(false);
        setLoading(false);
      }
    };

    if (rental && selectedCrypto) {
      createCharge();
    }
    
    return () => {
      // Cleanup: clear polling interval when component unmounts
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [rental, selectedCrypto]);

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
        
        setCharge(updatedCharge);
        
        // If payment is complete, stop polling and call onSuccess
        if (updatedCharge.status === 'completed' || 
            updatedCharge.transaction.paymentComplete) {
          clearInterval(interval);
          setPollingInterval(null);
          
          if (onSuccess) {
            onSuccess({
              id: updatedCharge.id,
              status: updatedCharge.status,
              transactionId: updatedCharge.transaction.id
            });
          }
        }
        
        // If payment failed, stop polling and show error
        if (updatedCharge.status === 'failed' || 
            updatedCharge.status === 'expired') {
          clearInterval(interval);
          setPollingInterval(null);
          setError(`Payment ${updatedCharge.status}. Please try again.`);
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
  
  // Restart the payment process
  const handleRefresh = () => {
    // Clear the current charge and create a new one
    setCharge(null);
    setInitialLoading(true);
    
    // Stop current polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    // Create new charge (will be triggered by useEffect when charge is null)
    const createCharge = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.post('/payments/crypto/charges', {
          amount: rental.totalAmount,
          currency: 'USD',
          cryptoCurrency: selectedCrypto,
          name: `API Key Rental - ${rental.influencer.username}`,
          description: `${rental.duration} day access to ${rental.socialAccount?.platform} API key`,
          rentalId: rental._id !== `temp-${Date.now()}` ? rental._id : null
        });
        
        setCharge(response.data.data);
        setInitialLoading(false);
        setLoading(false);
        
        // Start polling for status updates
        startPolling(response.data.data.id);
      } catch (err) {
        console.error('Failed to create charge', err);
        setError('Failed to create payment request. Please try again.');
        setInitialLoading(false);
        setLoading(false);
      }
    };
    
    createCharge();
  };

  if (initialLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1">
          Generating payment details...
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
      <FormControl fullWidth sx={{ mb: 2 }}>
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
      
      {/* Payment amount info */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Details
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Amount (USD):
            </Typography>
            <Typography variant="subtitle1">
              ${rental.totalAmount.toFixed(2)}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Estimated {selectedCrypto}:
            </Typography>
            {charge ? (
              <Typography variant="subtitle1">
                {formatCryptoPrice(charge.cryptoAmount, selectedCrypto)}
              </Typography>
            ) : (
              <Typography variant="subtitle1">
                {formatCryptoPrice(calculateEstimatedAmount(), selectedCrypto)}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Status:
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
                    bgcolor: charge?.status === 'completed' ? 'success.main' : 
                             charge?.status === 'pending' ? 'warning.main' : 'error.main',
                    mr: 1
                  }} 
                />
              )}
              <Typography variant="body1">
                {charge?.status === 'completed' ? 'Payment Completed' : 
                 charge?.status === 'pending' ? 'Waiting for Payment' : 
                 charge?.status || 'Unknown'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {charge && charge.status !== 'completed' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            <QrCodeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Scan QR Code or Copy Address
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Please send exactly {formatCryptoPrice(charge.cryptoAmount, selectedCrypto)} to the address below. The payment will be confirmed automatically.
          </Alert>
          
          {/* QR Code */}
          <QRCodeContainer>
            {charge.qrCodes && charge.qrCodes[selectedCrypto.toLowerCase()] ? (
              <img 
                src={charge.qrCodes[selectedCrypto.toLowerCase()]} 
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
              <span className="address">{charge.address}</span>
              <Tooltip title="Copy Address">
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(charge.address)}
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
              <span className="address">{formatCryptoPrice(charge.cryptoAmount, selectedCrypto)}</span>
              <Tooltip title="Copy Amount">
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(charge.cryptoAmount)}
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
                  Charge ID: {charge.id}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  Expires: {new Date(charge.expiresAt).toLocaleString()}
                </Typography>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<RefreshIcon />}
                  sx={{ mt: 1 }}
                  onClick={handleRefresh}
                >
                  Generate New Address
                </Button>
              </Paper>
            </Collapse>
          </Box>
        </Box>
      )}
      
      {charge && charge.status === 'completed' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Payment completed successfully! The system has received your payment and your rental request is being processed.
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
          disabled={!charge || charge.status !== 'completed'}
          onClick={() => onSuccess && onSuccess({
            id: charge?.id,
            status: charge?.status,
            transactionId: charge?.transaction?.id
          })}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default CryptoCheckoutForm;
