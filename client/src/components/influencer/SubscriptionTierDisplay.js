import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  CircularProgress
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import { 
  getSubscriptionTiersByPlatform, 
  getDefaultSubscriptionTier,
  clearPlatformTiers,
  clearDefaultTier
} from '../../redux/slices/subscriptionTierSlice';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tier-tabpanel-${index}`}
      aria-labelledby={`tier-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const SubscriptionTierDisplay = ({ influencerId, platforms, onSelectTier }) => {
  const dispatch = useDispatch();
  const { platformTiers, defaultTier, loading, error } = useSelector((state) => state.subscriptionTier);
  
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [tabValue, setTabValue] = useState(0);
  
  // Set initial platform if available
  useEffect(() => {
    if (platforms && platforms.length > 0 && !selectedPlatform) {
      setSelectedPlatform(platforms[0]);
    }
  }, [platforms, selectedPlatform]);
  
  // Fetch tiers when platform changes
  useEffect(() => {
    if (selectedPlatform && influencerId) {
      dispatch(getSubscriptionTiersByPlatform({
        platform: selectedPlatform,
        influencerId
      }));
      
      // Also fetch default tier
      dispatch(getDefaultSubscriptionTier({
        platform: selectedPlatform,
        influencerId
      }));
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(clearPlatformTiers());
      dispatch(clearDefaultTier());
    };
  }, [dispatch, selectedPlatform, influencerId]);
  
  // Handle platform tab change
  const handlePlatformChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedPlatform(platforms[newValue]);
  };
  
  // Handle period selection
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };
  
  // Handle tier selection
  const handleSelectTier = (tier) => {
    if (onSelectTier) {
      onSelectTier({
        ...tier,
        period: selectedPeriod,
        price: getPriceForPeriod(tier, selectedPeriod)
      });
    }
  };
  
  // Get price based on selected period
  const getPriceForPeriod = (tier, period) => {
    switch (period) {
      case 'monthly':
        return tier.priceMonthly;
      case 'quarterly':
        return tier.priceQuarterly;
      case 'yearly':
        return tier.priceYearly;
      default:
        return tier.priceMonthly;
    }
  };
  
  // Render tier card
  const renderTierCard = (tier) => {
    const price = getPriceForPeriod(tier, selectedPeriod);
    const isDefault = tier.isDefault;
    
    return (
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          border: isDefault ? '2px solid #2196f3' : 'none',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="div">
              {tier.name}
              {isDefault && (
                <Tooltip title="Default tier">
                  <StarIcon color="primary" sx={{ ml: 1 }} />
                </Tooltip>
              )}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
            {tier.description}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h4" color="primary" sx={{ mb: 1, textAlign: 'center' }}>
            ${price}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            per {selectedPeriod.slice(0, -2)}
            {selectedPeriod === 'monthly' ? 'month' : selectedPeriod === 'quarterly' ? 'quarter' : 'year'}
          </Typography>
          
          <List dense>
            {tier.features.map((feature, index) => (
              <ListItem key={index} disableGutters>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <CheckIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={`API Rate Limit: ${tier.apiRateLimit.toLocaleString()}`} 
              size="small" 
              sx={{ mr: 1, mb: 1 }} 
            />
            <Chip 
              label={`Support: ${tier.supportLevel}`} 
              size="small" 
              sx={{ mr: 1, mb: 1 }} 
            />
            <Chip 
              label={`Analytics: ${tier.analyticsLevel}`} 
              size="small" 
              sx={{ mb: 1 }} 
            />
          </Box>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'center', p: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            onClick={() => handleSelectTier(tier)}
          >
            Select Plan
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  // Render period selector
  const renderPeriodSelector = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Paper sx={{ display: 'inline-flex', borderRadius: 2 }}>
          <Button
            variant={selectedPeriod === 'monthly' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handlePeriodChange('monthly')}
            sx={{ borderRadius: '16px 0 0 16px' }}
          >
            Monthly
          </Button>
          <Button
            variant={selectedPeriod === 'quarterly' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handlePeriodChange('quarterly')}
            sx={{ borderRadius: 0 }}
          >
            Quarterly
          </Button>
          <Button
            variant={selectedPeriod === 'yearly' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handlePeriodChange('yearly')}
            sx={{ borderRadius: '0 16px 16px 0' }}
          >
            Yearly
          </Button>
        </Paper>
      </Box>
    );
  };
  
  // If no platforms available
  if (!platforms || platforms.length === 0) {
    return (
      <Box sx={{ mt: 2, mb: 4 }}>
        <Typography variant="body1" color="text.secondary" align="center">
          No platforms available for subscription.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Subscription Plans
      </Typography>
      
      {/* Platform Tabs */}
      {platforms.length > 1 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handlePlatformChange}
            indicatorColor="primary"
            textColor="primary"
            variant={platforms.length > 3 ? "scrollable" : "standard"}
            scrollButtons={platforms.length > 3 ? "auto" : "disabled"}
          >
            {platforms.map((platform, index) => (
              <Tab key={platform} label={platform} id={`tier-tab-${index}`} />
            ))}
          </Tabs>
        </Box>
      )}
      
      {/* Period Selector */}
      {renderPeriodSelector()}
      
      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <LoadingSpinner />
        </Box>
      )}
      
      {/* Error State */}
      {error && (
        <ErrorMessage
          message="Failed to load subscription tiers"
          error={error}
          showRetryButton
          onRetry={() => {
            if (selectedPlatform && influencerId) {
              dispatch(getSubscriptionTiersByPlatform({
                platform: selectedPlatform,
                influencerId
              }));
            }
          }}
        />
      )}
      
      {/* No Tiers Available */}
      {!loading && !error && platformTiers.length === 0 && (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ my: 4 }}>
          No subscription tiers available for {selectedPlatform}.
        </Typography>
      )}
      
      {/* Tiers Display */}
      {!loading && !error && platformTiers.length > 0 && (
        <Grid container spacing={3}>
          {platformTiers.map((tier) => (
            <Grid item xs={12} sm={6} md={4} key={tier._id}>
              {renderTierCard(tier)}
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SubscriptionTierDisplay;
