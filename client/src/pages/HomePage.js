import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import KeyIcon from '@mui/icons-material/Key';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SecurityIcon from '@mui/icons-material/Security';
import MessageIcon from '@mui/icons-material/Message';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Marketplace components
import FeaturedInfluencers from '../components/marketplace/FeaturedInfluencers';
import PlatformCategories from '../components/marketplace/PlatformCategories';
import MarketplaceStats from '../components/marketplace/MarketplaceStats';
import TrendingInfluencers from '../components/marketplace/TrendingInfluencers';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box>
      {/* Enhanced Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.900',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(https://source.unsplash.com/random?social-media)',
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.6)',
          }}
        />
        <Container maxWidth="lg">
          <Grid container>
            <Grid item md={6}>
            <Box
              sx={{
                position: 'relative',
                p: { xs: 4, md: 8 },
                pr: { md: 0 },
                minHeight: { xs: '500px', md: '600px' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography 
                component="h1" 
                variant={isMobile ? "h3" : "h2"} 
                color="inherit" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  mb: 3 
                }}
              >
                Monetize Your Social Media API Keys
              </Typography>
              <Typography 
                variant="h5" 
                color="inherit" 
                sx={{ 
                  maxWidth: { md: '80%' },
                  mb: 3,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                Connect with advertisers and rent out your social media API keys. 
                Turn your online presence into a consistent revenue stream with 
                our secure API key marketplace.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/register"
                  sx={{ 
                    fontWeight: 'bold', 
                    py: 1.5, 
                    px: 4,
                    borderRadius: 2,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  color="inherit"
                  component={RouterLink}
                  to="/influencers"
                  sx={{ 
                    borderWidth: 2,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      borderWidth: 2,
                    }
                  }}
                >
                  Browse Influencers
                </Button>
              </Box>
            </Box>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      <Container maxWidth="lg">
      
        {/* Marketplace Stats Section */}
        <MarketplaceStats />
        
        {/* Featured Influencers Carousel */}
        <FeaturedInfluencers />
        
        {/* Platform Categories */}
        <PlatformCategories />
        
        {/* Trending Influencers */}
        <TrendingInfluencers />
      
        {/* How It Works Section (improved) */}
        <Box sx={{ mt: 6, mb: 6 }}>
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
            Our platform connects influencers with advertisers for API key rentals
          </Typography>
          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 3, position: 'relative', overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    height: '100%', 
                    width: '5px', 
                    bgcolor: 'primary.main' 
                  }} 
                />
                <CardContent sx={{ pl: 3 }}>
                  <Typography variant="h5" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon color="primary" sx={{ mr: 1 }} /> For Influencers
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        1
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Create your profile
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Connect your social media accounts securely
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        2
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Set your rental terms
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Create custom pricing for your API keys
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        3
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Approve rental requests
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Review and accept requests from advertisers
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        4
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Get paid automatically
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Receive payments for your API key rentals
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 2 }}>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/register"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Register as Influencer
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 3, position: 'relative', overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    height: '100%', 
                    width: '5px', 
                    bgcolor: 'secondary.main' 
                  }} 
                />
                <CardContent sx={{ pl: 3 }}>
                  <Typography variant="h5" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon color="secondary" sx={{ mr: 1 }} /> For Advertisers
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'secondary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        1
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Create your company profile
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Set up your business account and preferences
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'secondary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        2
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Browse influencer marketplace
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Find the perfect match for your campaigns
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'secondary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        3
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Request API key rentals
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Choose rental duration and submit requests
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'secondary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        4
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Boost your marketing campaigns
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Use API keys to enhance your digital marketing
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 2 }}>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/register"
                    color="secondary"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Register as Advertiser
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>

        {/* Enhanced Features Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8, mt: 4, borderRadius: 2, boxShadow: 1 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" component="h2" align="center" gutterBottom>
              Platform Features
            </Typography>
            <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
              Everything you need to connect, rent, and monetize API keys
            </Typography>
            <Divider sx={{ width: '80px', mx: 'auto', my: 3, borderColor: theme.palette.primary.main, borderWidth: 2 }} />

            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: 4 } }}>
                  <CardContent>
                    <KeyIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" component="div" gutterBottom>
                      API Key Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Securely store and manage your API keys. Control who has access and for how long with our advanced security features.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: 4 } }}>
                  <CardContent>
                    <MonetizationOnIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" component="div" gutterBottom>
                      Flexible Pricing
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Set hourly, daily, or weekly rates for your API keys. Create subscription tiers and maximize your earning potential.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: 4 } }}>
                  <CardContent>
                    <SecurityIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" component="div" gutterBottom>
                      Secure Transactions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All API keys are encrypted and securely transmitted. Key rotation and revocation features ensure your data is always protected.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: 4 } }}>
                  <CardContent>
                    <MessageIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" component="div" gutterBottom>
                      Real-time Messaging
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Communicate directly with influencers or advertisers to discuss terms and details through our secure messaging system.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: 4 } }}>
                  <CardContent>
                    <PersonIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" component="div" gutterBottom>
                      Verified Profiles
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All users undergo identity and social media verification to ensure a safe and trustworthy marketplace environment.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: 4 } }}>
                  <CardContent>
                    <WhatshotIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" component="div" gutterBottom>
                      Analytics Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track performance metrics, monitor API usage, and gain insights into your revenue streams with detailed analytics.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ my: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Ready to Get Started?
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Join our platform today and start monetizing your social media presence or find the perfect
          influencer for your next campaign.
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to="/register"
          sx={{ mt: 2 }}
        >
          Create an Account
        </Button>
      </Container>
    </Box>
  );
};

export default HomePage;
