import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Paper,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyIcon from '@mui/icons-material/Key';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FilterFramesIcon from '@mui/icons-material/FilterFrames';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import snapchatService from '../../services/snapchatService';
import { addSocialAccount } from '../../redux/slices/influencerSlice';

/**
 * Component for connecting a Snapchat account
 * @param {Object} props - Component props
 * @param {Function} props.onAccountAdded - Callback when account is added
 */
const SnapchatAccountConnect = ({ onAccountAdded }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Component state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [price, setPrice] = useState('30');
  const [activeStep, setActiveStep] = useState(0);
  const [authUrl, setAuthUrl] = useState('');
  
  // Check if the user already has a Snapchat account connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const connected = await snapchatService.isConnected();
        setIsConnected(connected);
        
        if (connected) {
          const profileData = await snapchatService.getProfile();
          setProfile(profileData);
          
          const keys = await snapchatService.getApiKeys();
          if (keys && keys.length > 0) {
            setApiKey(keys[0]);
          }
          
          setActiveStep(3);
        } else {
          // Get auth URL for connecting
          const url = await snapchatService.getAuthUrl();
          setAuthUrl(url);
        }
      } catch (err) {
        setError(err.message || 'Failed to check Snapchat connection');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConnection();
  }, []);
  
  // Handle OAuth callback from Snapchat
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      // Verify this is a Snapchat callback
      if (code && state === 'snapchat') {
        try {
          setIsLoading(true);
          setError(null);
          
          // Authenticate with the code
          await snapchatService.authenticate(code);
          
          // Get profile
          const profileData = await snapchatService.getProfile();
          setProfile(profileData);
          
          setIsConnected(true);
          
          // Remove query params
          navigate(window.location.pathname, { replace: true });
          
          // Move to next step
          setActiveStep(1);
        } catch (err) {
          setError(err.message || 'Failed to authenticate with Snapchat');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, [navigate]);
  
  // Handle connect Snapchat account
  const handleConnect = () => {
    window.location.href = authUrl;
  };
  
  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await snapchatService.disconnect();
      setIsConnected(false);
      setProfile(null);
      setApiKey(null);
      setActiveStep(0);
      // Get new auth URL
      const url = await snapchatService.getAuthUrl();
      setAuthUrl(url);
    } catch (err) {
      setError(err.message || 'Failed to disconnect Snapchat account');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle API key generation
  const handleGenerateApiKey = async () => {
    try {
      setIsLoading(true);
      const key = await snapchatService.generateApiKey();
      setApiKey(key);
      setActiveStep(3);
      
      // Add the account to the profile
      if (onAccountAdded) {
        dispatch(addSocialAccount({
          platform: 'snapchat',
          username: profile.username,
          apiKey: key.key,
          rentalFee: parseFloat(price),
        }));
        onAccountAdded({
          platform: 'snapchat',
          username: profile.username,
          apiKey: key.key,
          rentalFee: parseFloat(price),
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to generate API key');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open pricing dialog
  const openPricingDialog = () => {
    setPricingOpen(true);
    setActiveStep(2);
  };
  
  // Handle set pricing
  const handleSetPricing = () => {
    setPricingOpen(false);
    handleGenerateApiKey();
  };
  
  // If loading and no data yet
  if (isLoading && !profile && !isConnected) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Card variant="outlined" sx={{ marginBottom: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: '#FFFC00', 
              color: '#000', 
              mr: 1, 
              fontSize: 28,
              width: 36,
              height: 36
            }}
          >
            👻
          </Avatar>
          <Typography variant="h6">Snapchat Integration</Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Connect Account</StepLabel>
          </Step>
          <Step>
            <StepLabel>Verify Account</StepLabel>
          </Step>
          <Step>
            <StepLabel>Set Pricing</StepLabel>
          </Step>
          <Step>
            <StepLabel>Generate API Key</StepLabel>
          </Step>
        </Stepper>
        
        {!isConnected ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Connect your Snapchat account to make your Snapchat API available for advertisers.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Allowing advertisers to access your Snapchat API enables them to post sponsored content,
              create branded filters, and generate engagement with your audience.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleConnect}
              sx={{ 
                mt: 2, 
                bgcolor: '#FFFC00', 
                color: '#000', 
                '&:hover': { 
                  bgcolor: '#E5E300' 
                } 
              }}
              disabled={isLoading || !authUrl}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Connect Snapchat Account'}
            </Button>
          </Box>
        ) : (
          <Box>
            {profile && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    {profile.bitmoji ? (
                      <Avatar alt={profile.displayName} src={profile.bitmoji} sx={{ width: 56, height: 56 }} />
                    ) : (
                      <Avatar sx={{ width: 56, height: 56, bgcolor: '#FFFC00', color: '#000' }}>
                        👻
                      </Avatar>
                    )}
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h6">{profile.displayName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{profile.username}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Chip
                        icon={<PeopleIcon fontSize="small" />}
                        label={`${profile.followerCount.toLocaleString()} followers`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        icon={<VisibilityIcon fontSize="small" />}
                        label={`${profile.averageViews.toLocaleString()} avg. views`}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}
            
            {activeStep === 1 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Your Snapchat account has been successfully connected!
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={openPricingDialog}
                  sx={{ mt: 2 }}
                >
                  Next: Set Pricing
                </Button>
              </Box>
            )}
            
            {apiKey && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                  Your Snapchat API key is ready to be rented by advertisers!
                </Alert>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">API Key Information</Typography>
                    <Chip
                      label={`$${apiKey.rentalFee || price}/day`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Key ID: {apiKey.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    API Key Features
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FilterFramesIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">Story Publishing</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOnIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">Geo-filters</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VisibilityIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">View Analytics</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ThumbUpIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">Engagement Data</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      
      {/* Pricing Dialog */}
      <Dialog open={pricingOpen} onClose={() => setPricingOpen(false)}>
        <DialogTitle>Set Snapchat API Key Rental Fee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Set the daily rental fee for your Snapchat API key. Snapchat APIs typically command higher rates due to their high engagement rates and younger audience demographics.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Daily Rental Fee ($)"
            type="number"
            fullWidth
            variant="outlined"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            InputProps={{ inputProps: { min: 1 } }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPricingOpen(false)}>Cancel</Button>
          <Button onClick={handleSetPricing} variant="contained" color="primary">
            Confirm & Generate API Key
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SnapchatAccountConnect;
