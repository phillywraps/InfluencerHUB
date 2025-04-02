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
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';

import linkedinService from '../../services/linkedinService';
import { addSocialAccount } from '../../redux/slices/influencerSlice';

const LinkedInAccountConnect = ({ onAccountAdded }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Component state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companyPages, setCompanyPages] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [price, setPrice] = useState('25');
  const [activeStep, setActiveStep] = useState(0);
  const [authUrl, setAuthUrl] = useState('');
  
  // Check if the user already has a LinkedIn account connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const connected = await linkedinService.isConnected();
        setIsConnected(connected);
        
        if (connected) {
          const profileData = await linkedinService.getProfile();
          setProfile(profileData);
          
          // Get company pages if user has access to any
          try {
            const pages = await linkedinService.getCompanyPages();
            setCompanyPages(pages || []);
          } catch (err) {
            console.warn('Could not fetch company pages:', err);
          }
          
          const keys = await linkedinService.getApiKeys();
          if (keys && keys.length > 0) {
            setApiKey(keys[0]);
          }
        } else {
          // Get auth URL for connecting
          const url = await linkedinService.getAuthUrl();
          setAuthUrl(url);
        }
      } catch (err) {
        setError(err.message || 'Failed to check LinkedIn connection');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConnection();
  }, []);
  
  // Handle OAuth callback from LinkedIn
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      // Verify this is a LinkedIn callback
      if (code && state === 'linkedin') {
        try {
          setIsLoading(true);
          setError(null);
          
          // Authenticate with the code
          await linkedinService.authenticate(code);
          
          // Get profile
          const profileData = await linkedinService.getProfile();
          setProfile(profileData);
          
          // Get company pages if user has access to any
          try {
            const pages = await linkedinService.getCompanyPages();
            setCompanyPages(pages || []);
          } catch (err) {
            console.warn('Could not fetch company pages:', err);
          }
          
          setIsConnected(true);
          
          // Remove query params
          navigate(window.location.pathname, { replace: true });
          
          // Move to next step
          setActiveStep(1);
        } catch (err) {
          setError(err.message || 'Failed to authenticate with LinkedIn');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, [navigate]);
  
  // Handle connect LinkedIn account
  const handleConnect = () => {
    window.location.href = authUrl;
  };
  
  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await linkedinService.disconnect();
      setIsConnected(false);
      setProfile(null);
      setCompanyPages([]);
      setApiKey(null);
      setActiveStep(0);
      // Get new auth URL
      const url = await linkedinService.getAuthUrl();
      setAuthUrl(url);
    } catch (err) {
      setError(err.message || 'Failed to disconnect LinkedIn account');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle entity selection (personal profile or company page)
  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    if (entity) {
      setActiveStep(2);
    }
  };
  
  // Handle generate API key
  const handleGenerateApiKey = async () => {
    if (!selectedEntity) {
      setError('Please select an entity (personal profile or company page) first');
      return;
    }
    
    try {
      setIsLoading(true);
      const key = await linkedinService.generateApiKey();
      setApiKey(key);
      setActiveStep(3);
      
      // Add the account to the profile
      if (onAccountAdded) {
        dispatch(addSocialAccount({
          platform: 'linkedin',
          username: selectedEntity.isCompany 
            ? selectedEntity.name 
            : `${profile.firstName} ${profile.lastName}`,
          apiKey: key.key,
          rentalFee: parseFloat(price),
          entityType: selectedEntity.isCompany ? 'company' : 'personal',
          entityId: selectedEntity.id
        }));
        onAccountAdded({
          platform: 'linkedin',
          username: selectedEntity.isCompany 
            ? selectedEntity.name 
            : `${profile.firstName} ${profile.lastName}`,
          apiKey: key.key,
          rentalFee: parseFloat(price),
          entityType: selectedEntity.isCompany ? 'company' : 'personal',
          entityId: selectedEntity.id
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
          <LinkedInIcon sx={{ color: '#0A66C2', mr: 1, fontSize: 28 }} />
          <Typography variant="h6">LinkedIn Integration</Typography>
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
            <StepLabel>Select Profile or Page</StepLabel>
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
              Connect your LinkedIn account to make your LinkedIn API available for advertisers.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<LinkedInIcon />}
              onClick={handleConnect}
              sx={{ mt: 2, bgcolor: '#0A66C2', '&:hover': { bgcolor: '#084482' } }}
              disabled={isLoading || !authUrl}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Connect LinkedIn Account'}
            </Button>
          </Box>
        ) : (
          <Box>
            {profile && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    {profile.profilePicture ? (
                      <Avatar alt={`${profile.firstName} ${profile.lastName}`} src={profile.profilePicture} sx={{ width: 56, height: 56 }} />
                    ) : (
                      <Avatar sx={{ width: 56, height: 56, bgcolor: '#0A66C2' }}>
                        {profile.firstName?.charAt(0).toUpperCase() || 'L'}
                      </Avatar>
                    )}
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h6">{profile.firstName} {profile.lastName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.headline || 'LinkedIn Member'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Chip
                        label={`${profile.connections || 0} connections`}
                        size="small"
                        sx={{ mr: 1 }}
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
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Select which profile you want to make available for API access:
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Personal profile option */}
                  <Grid item xs={12} md={companyPages.length > 0 ? 6 : 12}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: 2 },
                        ...(selectedEntity && !selectedEntity.isCompany ? { 
                          borderColor: 'primary.main',
                          borderWidth: 2,
                          boxShadow: 2
                        } : {})
                      }}
                      onClick={() => handleEntitySelect({ 
                        id: profile.id, 
                        name: `${profile.firstName} ${profile.lastName}`, 
                        isCompany: false 
                      })}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PersonIcon sx={{ color: '#0A66C2', mr: 1 }} />
                          <Typography variant="h6">Personal Profile</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          Make your personal LinkedIn profile API available for advertisers.
                          This is ideal for individual influencers and thought leaders.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {profile.firstName} {profile.lastName}
                          </Typography>
                          {selectedEntity && !selectedEntity.isCompany && (
                            <CheckCircleIcon color="primary" />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Company pages */}
                  {companyPages.length > 0 && (
                    <>
                      {companyPages.map((company) => (
                        <Grid item xs={12} md={6} key={company.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': { transform: 'translateY(-4px)', boxShadow: 2 },
                              ...(selectedEntity && selectedEntity.isCompany && selectedEntity.id === company.id ? { 
                                borderColor: 'primary.main',
                                borderWidth: 2,
                                boxShadow: 2
                              } : {})
                            }}
                            onClick={() => handleEntitySelect({ 
                              id: company.id, 
                              name: company.name, 
                              isCompany: true 
                            })}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <BusinessIcon sx={{ color: '#0A66C2', mr: 1 }} />
                                <Typography variant="h6">Company Page</Typography>
                              </Box>
                              <Typography variant="body2" sx={{ mb: 2 }}>
                                Make your company page API available for advertisers.
                                Ideal for businesses and organizations.
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {company.name}
                                </Typography>
                                {selectedEntity && selectedEntity.isCompany && selectedEntity.id === company.id && (
                                  <CheckCircleIcon color="primary" />
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </>
                  )}
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!selectedEntity}
                    onClick={openPricingDialog}
                  >
                    Next: Set Pricing
                  </Button>
                </Box>
              </Box>
            )}
            
            {activeStep === 2 && !apiKey && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Set a daily rental fee for your LinkedIn API key.
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
                  Your LinkedIn API key is ready to be rented by advertisers!
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
                  <Typography variant="body2" color="text.secondary">
                    Entity: {selectedEntity?.isCompany ? 'Company Page' : 'Personal Profile'} - {selectedEntity?.name}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      
      {/* Pricing Dialog */}
      <Dialog open={pricingOpen} onClose={() => setPricingOpen(false)}>
        <DialogTitle>Set LinkedIn API Key Rental Fee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Set the daily rental fee for your LinkedIn API key. Professional network APIs like LinkedIn often command higher rates due to their B2B focused audience and data.
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

export default LinkedInAccountConnect;
