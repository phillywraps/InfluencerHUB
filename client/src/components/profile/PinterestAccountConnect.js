import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
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
  Link,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyIcon from '@mui/icons-material/Key';
import PinterestIcon from '@mui/icons-material/Pinterest';

import pinterestService from '../../services/pinterestService';
import { addSocialAccount } from '../../redux/slices/influencerSlice';

const PinterestAccountConnect = ({ onAccountAdded }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Component state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [price, setPrice] = useState('10');
  const [activeStep, setActiveStep] = useState(0);
  const [authUrl, setAuthUrl] = useState('');
  
  // Check if the user already has a Pinterest account connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const connected = await pinterestService.isConnected();
        setIsConnected(connected);
        
        if (connected) {
          const profileData = await pinterestService.getProfile();
          setProfile(profileData);
          const keys = await pinterestService.getApiKeys();
          if (keys && keys.length > 0) {
            setApiKey(keys[0]);
          }
        } else {
          // Get auth URL for connecting
          const url = await pinterestService.getAuthUrl();
          setAuthUrl(url);
        }
      } catch (err) {
        setError(err.message || 'Failed to check Pinterest connection');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConnection();
  }, []);
  
  // Handle OAuth callback from Pinterest
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      // Verify this is a Pinterest callback
      if (code && state === 'pinterest') {
        try {
          setIsLoading(true);
          setError(null);
          
          // Authenticate with the code
          await pinterestService.authenticate(code);
          
          // Get profile
          const profileData = await pinterestService.getProfile();
          setProfile(profileData);
          setIsConnected(true);
          
          // Remove query params
          navigate(window.location.pathname, { replace: true });
          
          // Move to next step
          setActiveStep(1);
        } catch (err) {
          setError(err.message || 'Failed to authenticate with Pinterest');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, [navigate]);
  
  // Handle connect Pinterest account
  const handleConnect = () => {
    window.location.href = authUrl;
  };
  
  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await pinterestService.disconnect();
      setIsConnected(false);
      setProfile(null);
      setApiKey(null);
      setActiveStep(0);
      // Get new auth URL
      const url = await pinterestService.getAuthUrl();
      setAuthUrl(url);
    } catch (err) {
      setError(err.message || 'Failed to disconnect Pinterest account');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle generate API key
  const handleGenerateApiKey = async () => {
    try {
      setIsLoading(true);
      const key = await pinterestService.generateApiKey();
      setApiKey(key);
      setActiveStep(2);
      
      // Add the account to the profile
      if (onAccountAdded) {
        dispatch(addSocialAccount({
          platform: 'pinterest',
          username: profile.username,
          apiKey: key.key,
          rentalFee: parseFloat(price)
        }));
        onAccountAdded({
          platform: 'pinterest',
          username: profile.username,
          apiKey: key.key,
          rentalFee: parseFloat(price)
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to generate API key');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle set pricing and generate key
  const handleSetPricing = () => {
    setPricingOpen(false);
    handleGenerateApiKey();
  };
  
  // Open pricing dialog
  const openPricingDialog = () => {
    setPricingOpen(true);
  };
  
  if (isLoading && !profile) {
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
          <PinterestIcon sx={{ color: '#E60023', mr: 1, fontSize: 28 }} />
          <Typography variant="h6">Pinterest Integration</Typography>
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
            <StepLabel>Set Pricing</StepLabel>
          </Step>
          <Step>
            <StepLabel>Generate API Key</StepLabel>
          </Step>
        </Stepper>
        
        {!isConnected ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Connect your Pinterest account to make your Pinterest API available for advertisers.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PinterestIcon />}
              onClick={handleConnect}
              sx={{ mt: 2, bgcolor: '#E60023', '&:hover': { bgcolor: '#ad001b' } }}
              disabled={isLoading || !authUrl}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Connect Pinterest Account'}
            </Button>
          </Box>
        ) : (
          <Box>
            {profile && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    {profile.image ? (
                      <Avatar alt={profile.username} src={profile.image} sx={{ width: 56, height: 56 }} />
                    ) : (
                      <Avatar sx={{ width: 56, height: 56, bgcolor: '#E60023' }}>
                        {profile.username?.charAt(0).toUpperCase() || 'P'}
                      </Avatar>
                    )}
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h6">{profile.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.bio ? profile.bio : 'No bio available'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Chip
                        label={`${profile.followers || 0} followers`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`${profile.boards || 0} boards`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`${profile.pins || 0} pins`}
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
            
            {activeStep === 1 && !apiKey && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Set a daily rental fee for your Pinterest API key.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={openPricingDialog}
                  sx={{ mt: 2 }}
                >
                  Set Pricing
                </Button>
              </Box>
            )}
            
            {apiKey && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                  Your Pinterest API key is ready to be rented by advertisers!
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
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      
      {/* Pricing Dialog */}
      <Dialog open={pricingOpen} onClose={() => setPricingOpen(false)}>
        <DialogTitle>Set Pinterest API Key Rental Fee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Set the daily rental fee for your Pinterest API key. Consider your follower count, engagement rate, and niche when setting your price.
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

export default PinterestAccountConnect;
