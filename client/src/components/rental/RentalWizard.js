import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Checkbox,
  FormGroup,
  styled,
  Collapse,
  Slider,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Key as KeyIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as MonetizationOnIcon,
  CurrencyBitcoin as CurrencyBitcoinIcon,
} from '@mui/icons-material';
import { createRentalRequest } from '../../redux/slices/rentalSlice';
import VerificationBadge from '../verification/VerificationBadge';
import PayPalCheckoutForm from '../payment/PayPalCheckoutForm';
import PayPalSubscriptionCheckoutForm from '../payment/PayPalSubscriptionCheckoutForm';
import AlipayCheckoutForm from '../payment/AlipayCheckoutForm';
import CryptoCheckoutForm from '../payment/CryptoCheckoutForm';
import CryptoSubscriptionCheckoutForm from '../payment/CryptoSubscriptionCheckoutForm';

// Styled divider with text
const OrDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(2, 0),
  '&::before, &::after': {
    content: '""',
    flex: 1,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& > span': {
    padding: theme.spacing(0, 1),
    color: theme.palette.text.secondary,
  },
}));

// Styled box with a label at the top
const LabeledBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
  paddingTop: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  '& .label': {
    position: 'absolute',
    top: '-12px',
    left: theme.spacing(2),
    padding: theme.spacing(0, 1),
    backgroundColor: theme.palette.background.paper,
    fontSize: '0.85rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
}));

// Step content wrapper
const StepContentWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  minHeight: '300px',
}));

const STEPS = [
  'Select API Key',
  'Choose Rental Period',
  'Review Terms',
  'Payment Method',
  'Confirmation'
];

const RentalWizard = ({ influencer, onComplete, onCancel }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.rental);
  const { user } = useSelector((state) => state.auth);
  
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [rentalDuration, setRentalDuration] = useState(1);
  const [customDuration, setCustomDuration] = useState(false);
  const [rentalNote, setRentalNote] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [paymentType, setPaymentType] = useState('one-time');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');

  // Check if the user can proceed to the next step
  const canProceedToNext = () => {
    switch (activeStep) {
      case 0: // Select API Key
        return !!selectedAccount;
      case 1: // Choose Rental Period
        return true; // Any rental duration is valid
      case 2: // Review Terms
        return agreeToTerms;
      case 3: // Payment Method
        if (!paymentMethod) return false;
        
        if (paymentMethod === 'paypal' && !paymentComplete) return false;
        if (paymentMethod === 'crypto' && !paymentComplete) return false;
        if (paymentMethod === 'alipay' && !paymentComplete) return false;
        
        return true;
      default:
        return true;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (!canProceedToNext()) {
      // Show errors for each step
      switch (activeStep) {
        case 0:
          setFormErrors({ ...formErrors, selectedAccount: 'Please select an API key' });
          break;
        case 2:
          setFormErrors({ ...formErrors, agreeToTerms: 'You must agree to the terms to continue' });
          break;
        case 3:
          if (!paymentMethod) {
            setFormErrors({ ...formErrors, paymentMethod: 'Please select a payment method' });
          } else if (paymentMethod === 'paypal' && !paymentComplete) {
            setFormErrors({ ...formErrors, paymentMethod: 'Please complete the PayPal payment process' });
          } else if (paymentMethod === 'crypto' && !paymentComplete) {
            setFormErrors({ ...formErrors, paymentMethod: 'Please complete the cryptocurrency payment process' });
          } else if (paymentMethod === 'alipay' && !paymentComplete) {
            setFormErrors({ ...formErrors, paymentMethod: 'Please complete the Alipay payment process' });
          }
          break;
        default:
          break;
      }
      return;
    }

    setFormErrors({});
    
    if (activeStep === STEPS.length - 1) {
      // Final step - submit rental request
      handleSubmitRental();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Handle back button
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    // Reset payment state if going back from payment step
    if (activeStep === 3) {
      setPaymentComplete(false);
      setPaymentResult(null);
    }
  };

  // Handle API key selection
  const handleApiKeySelect = (accountId) => {
    setSelectedAccount(accountId);
    setFormErrors({ ...formErrors, selectedAccount: undefined });
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setFormErrors({ ...formErrors, paymentMethod: undefined });
    // Reset payment completion state when changing payment method
    setPaymentComplete(false);
    setPaymentResult(null);
  };

  // Handle payment type selection (one-time or subscription)
  const handlePaymentTypeChange = (event, newType) => {
    setPaymentType(newType);
    // Reset payment completion state when changing payment type
    setPaymentComplete(false);
    setPaymentResult(null);
  };

  // Handle cryptocurrency selection
  const handleCryptoChange = (crypto) => {
    setSelectedCrypto(crypto);
    // Reset payment completion state when changing crypto
    setPaymentComplete(false);
    setPaymentResult(null);
  };

  // Handle payment success
  const handlePaymentSuccess = (result) => {
    setPaymentComplete(true);
    setPaymentResult(result);
    setFormErrors({ ...formErrors, paymentMethod: undefined });
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setPaymentComplete(false);
    setPaymentResult(null);
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedAccount || !influencer) {
      return 0;
    }

    const account = influencer.socialAccounts.find((acc) => acc._id === selectedAccount);
    return account ? account.rentalFee * rentalDuration : 0;
  };

  // Handle submitting the rental request
  const handleSubmitRental = async () => {
    const rentalData = {
      influencerId: influencer._id,
      socialAccountId: selectedAccount,
      duration: rentalDuration,
      note: rentalNote,
      paymentMethod: paymentMethod,
      paymentType: paymentMethod === 'paypal' || paymentMethod === 'crypto' 
        ? paymentType 
        : undefined,
      paymentResultId: paymentResult?.id,
      cryptoCurrency: paymentMethod === 'crypto' ? selectedCrypto : undefined,
      savePaymentMethod: savePaymentMethod,
      specialRequirements: specialRequirements,
      receiveNotifications: receiveNotifications
    };

    try {
      const result = await dispatch(createRentalRequest(rentalData)).unwrap();
      setCompleted(true);
      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Failed to create rental request:', error);
    }
  };

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Get selected account details
  const getSelectedAccount = () => {
    if (!selectedAccount || !influencer || !influencer.socialAccounts) {
      return null;
    }
    return influencer.socialAccounts.find((acc) => acc._id === selectedAccount);
  };

  // Create a rental object for payment components
  const getRentalForPayment = () => {
    const selectedAccountDetails = getSelectedAccount();
    return {
      _id: `temp-${Date.now()}`, // Temporary ID for the rental
      rentalFee: selectedAccountDetails ? selectedAccountDetails.rentalFee : 0,
      duration: rentalDuration,
      totalAmount: calculateTotalPrice(),
      influencer: {
        username: influencer.username,
        _id: influencer._id
      },
      socialAccount: selectedAccountDetails
    };
  };

  // Selected account
  const selectedAccountDetails = getSelectedAccount();

  // Render Payment Method Options UI
  const renderPaymentMethodOptions = () => {
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: paymentMethod === 'stripe' ? '2px solid' : '1px solid',
                borderColor: paymentMethod === 'stripe' ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 1
                }
              }}
              onClick={() => handlePaymentMethodChange('stripe')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CreditCardIcon sx={{ mr: 2, color: paymentMethod === 'stripe' ? 'primary.main' : 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle1">Credit Card</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pay with Visa, Mastercard, etc.
                  </Typography>
                </Box>
                {paymentMethod === 'stripe' && (
                  <CheckIcon color="primary" sx={{ ml: 'auto' }} />
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: paymentMethod === 'paypal' ? '2px solid' : '1px solid',
                borderColor: paymentMethod === 'paypal' ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 1
                }
              }}
              onClick={() => handlePaymentMethodChange('paypal')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 2, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" style={{ width: '100%' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1">PayPal</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pay with PayPal or credit card
                  </Typography>
                </Box>
                {paymentMethod === 'paypal' && (
                  <CheckIcon color="primary" sx={{ ml: 'auto' }} />
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: paymentMethod === 'alipay' ? '2px solid' : '1px solid',
                borderColor: paymentMethod === 'alipay' ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 1
                }
              }}
              onClick={() => handlePaymentMethodChange('alipay')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 2, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/assets/alipay-logo.png" alt="Alipay" style={{ width: '100%' }} onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text x="0" y="18" font-size="18" fill="%2300aaee">A</text></svg>';
                  }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1">Alipay</Typography>
                  <Typography variant="body2" color="text.secondary">
                    China's leading payment platform
                  </Typography>
                </Box>
                {paymentMethod === 'alipay' && (
                  <CheckIcon color="primary" sx={{ ml: 'auto' }} />
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: paymentMethod === 'crypto' ? '2px solid' : '1px solid',
                borderColor: paymentMethod === 'crypto' ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 1
                }
              }}
              onClick={() => handlePaymentMethodChange('crypto')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CurrencyBitcoinIcon sx={{ mr: 2, color: paymentMethod === 'crypto' ? 'primary.main' : 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle1">Cryptocurrency</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pay with Bitcoin, Ethereum, etc.
                  </Typography>
                </Box>
                {paymentMethod === 'crypto' && (
                  <CheckIcon color="primary" sx={{ ml: 'auto' }} />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Show PayPal options if PayPal is selected */}
        {paymentMethod === 'paypal' && (
          <>
            <Box sx={{ mt: 3 }}>
              <Tabs
                value={paymentType}
                onChange={handlePaymentTypeChange}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab 
                  value="one-time" 
                  label="One-Time Payment" 
                  icon={<PaymentIcon />} 
                  iconPosition="start"
                />
                <Tab 
                  value="subscription" 
                  label="Subscription" 
                  icon={<MonetizationOnIcon />} 
                  iconPosition="start"
                />
              </Tabs>
              
              {paymentType === 'one-time' ? (
                <PayPalCheckoutForm
                  rental={getRentalForPayment()}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              ) : (
                <PayPalSubscriptionCheckoutForm
                  rental={getRentalForPayment()}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              )}
            </Box>
          </>
        )}
        
        {/* Show Alipay options if Alipay is selected */}
        {paymentMethod === 'alipay' && (
          <Box sx={{ mt: 3 }}>
            <AlipayCheckoutForm
              rental={getRentalForPayment()}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Box>
        )}
        
        {/* Show Crypto options if Crypto is selected */}
        {paymentMethod === 'crypto' && (
          <>
            <Box sx={{ mt: 3 }}>
              <Tabs
                value={paymentType}
                onChange={handlePaymentTypeChange}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab 
                  value="one-time" 
                  label="One-Time Payment" 
                  icon={<PaymentIcon />} 
                  iconPosition="start"
                />
                <Tab 
                  value="subscription" 
                  label="Subscription" 
                  icon={<MonetizationOnIcon />} 
                  iconPosition="start"
                />
              </Tabs>
              
              {paymentType === 'one-time' ? (
                <CryptoCheckoutForm
                  rental={getRentalForPayment()}
                  selectedCrypto={selectedCrypto}
                  onCryptoChange={handleCryptoChange}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              ) : (
                <CryptoSubscriptionCheckoutForm
                  rental={getRentalForPayment()}
                  selectedCrypto={selectedCrypto}
                  onCryptoChange={handleCryptoChange}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              )}
            </Box>
          </>
        )}
        
        {/* Show Stripe UI if Stripe is selected */}
        {paymentMethod === 'stripe' && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              Credit card payment will be processed once the rental request is approved.
            </Alert>
            
            <FormGroup sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={savePaymentMethod}
                    onChange={(e) => setSavePaymentMethod(e.target.checked)}
                    color="primary"
                  />
                }
                label="Save this payment method for future rentals"
              />
            </FormGroup>
          </Box>
        )}
      </>
    );
  };

  // Render Confirmation Step UI
  const renderConfirmationStep = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Confirm Your Rental
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Please review your rental details below before submitting.
        </Alert>
        
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Rental Summary
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Influencer:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {influencer.username}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Platform:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedAccountDetails?.platform}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Duration:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {rentalDuration} {rentalDuration === 1 ? 'day' : 'days'}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Payment Method:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {paymentMethod === 'stripe' ? 'Credit Card' : 
                 paymentMethod === 'paypal' ? 'PayPal' : 
                 paymentMethod === 'alipay' ? 'Alipay' : 
                 `Cryptocurrency (${selectedCrypto})`}
                {(paymentMethod === 'paypal' || paymentMethod === 'crypto') && 
                 paymentType === 'subscription' && ' (Subscription)'}
              </Typography>
            </Grid>
            
            {rentalNote && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Additional Notes:
                </Typography>
                <Typography variant="body1" paragraph>
                  {rentalNote}
                </Typography>
              </Grid>
            )}
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              Total Price:
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatPrice(calculateTotalPrice())}
            </Typography>
          </Box>
        </Paper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {!completed ? (
        <>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {STEPS.map((label, index) => (
              <Step key={label} completed={index < activeStep}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <StepContentWrapper>
            {/* All other step UI components omitted for brevity */}
            
            {/* Step 4: Payment Method */}
            {activeStep === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select Payment Method
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Choose how you'd like to pay for this API key rental.
                </Typography>
                
                <Box sx={{ my: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Amount to Pay: {formatPrice(calculateTotalPrice())}
                  </Typography>
                </Box>
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  {renderPaymentMethodOptions()}
                </FormControl>
                
                {formErrors.paymentMethod && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {formErrors.paymentMethod}
                  </Alert>
                )}
              </Box>
            )}
            
            {/* Step 5: Confirmation */}
            {activeStep === 4 && renderConfirmationStep()}
          </StepContentWrapper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={activeStep === 0 ? onCancel : handleBack}
              startIcon={activeStep === 0 ? null : <KeyboardArrowLeftIcon />}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={activeStep === STEPS.length - 1 ? null : <KeyboardArrowRightIcon />}
              disabled={loading || !canProceedToNext()}
            >
              {activeStep === STEPS.length - 1 ? (
                loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Submit Rental Request'
                )
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Rental Request Submitted!
            </Typography>
            <Typography variant="body1" paragraph>
              Your request to rent API key from {influencer.username} has been submitted successfully.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The influencer will review your request and you'll be notified once it's approved.
              You'll receive access to the API key immediately after approval.
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/dashboard')}
              sx={{ mt: 2 }}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default RentalWizard;
