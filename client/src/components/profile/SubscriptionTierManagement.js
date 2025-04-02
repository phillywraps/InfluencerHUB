import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Tooltip,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { 
  getSubscriptionTiers, 
  createSubscriptionTier, 
  updateSubscriptionTier, 
  deleteSubscriptionTier, 
  setDefaultSubscriptionTier,
  createDefaultSubscriptionTiers
} from '../../redux/slices/subscriptionTierSlice';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

const SubscriptionTierManagement = ({ platforms }) => {
  const dispatch = useDispatch();
  const { tiers, loading, error } = useSelector((state) => state.subscriptionTier);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({
    platform: '',
    name: 'Basic',
    description: '',
    features: [''],
    priceMonthly: 9.99,
    priceQuarterly: 26.99,
    priceYearly: 99.99,
    apiRateLimit: 1000,
    supportLevel: 'Basic',
    analyticsLevel: 'Basic',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [tierToDelete, setTierToDelete] = useState(null);
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  
  // Fetch subscription tiers on component mount
  useEffect(() => {
    dispatch(getSubscriptionTiers());
  }, [dispatch]);
  
  // Group tiers by platform
  const tiersByPlatform = tiers.reduce((acc, tier) => {
    if (!acc[tier.platform]) {
      acc[tier.platform] = [];
    }
    acc[tier.platform].push(tier);
    return acc;
  }, {});
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Handle price input changes (ensure they are numbers)
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData({
        ...formData,
        [name]: numValue
      });
      
      // Clear error for this field
      if (formErrors[name]) {
        setFormErrors({
          ...formErrors,
          [name]: null
        });
      }
    }
  };
  
  // Handle feature list changes
  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    
    setFormData({
      ...formData,
      features: newFeatures
    });
  };
  
  // Add a new feature field
  const addFeatureField = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };
  
  // Remove a feature field
  const removeFeatureField = (index) => {
    const newFeatures = [...formData.features];
    newFeatures.splice(index, 1);
    
    setFormData({
      ...formData,
      features: newFeatures.length > 0 ? newFeatures : ['']
    });
  };
  
  // Toggle active status
  const handleToggleActive = (e) => {
    setFormData({
      ...formData,
      isActive: e.target.checked
    });
  };
  
  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.platform) {
      errors.platform = 'Platform is required';
    }
    
    if (!formData.name) {
      errors.name = 'Name is required';
    }
    
    if (!formData.description) {
      errors.description = 'Description is required';
    }
    
    if (formData.priceMonthly < 0) {
      errors.priceMonthly = 'Price must be a positive number';
    }
    
    if (formData.priceQuarterly < 0) {
      errors.priceQuarterly = 'Price must be a positive number';
    }
    
    if (formData.priceYearly < 0) {
      errors.priceYearly = 'Price must be a positive number';
    }
    
    if (formData.apiRateLimit < 0) {
      errors.apiRateLimit = 'API rate limit must be a positive number';
    }
    
    // Check if at least one feature is provided
    if (formData.features.length === 0 || (formData.features.length === 1 && !formData.features[0])) {
      errors.features = 'At least one feature is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Open dialog to add a new tier
  const handleAddTier = () => {
    setEditingTier(null);
    setFormData({
      platform: platforms.length === 1 ? platforms[0] : '',
      name: 'Basic',
      description: '',
      features: [''],
      priceMonthly: 9.99,
      priceQuarterly: 26.99,
      priceYearly: 99.99,
      apiRateLimit: 1000,
      supportLevel: 'Basic',
      analyticsLevel: 'Basic',
      isActive: true
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  // Open dialog to edit an existing tier
  const handleEditTier = (tier) => {
    setEditingTier(tier);
    setFormData({
      platform: tier.platform,
      name: tier.name,
      description: tier.description,
      features: tier.features.length > 0 ? tier.features : [''],
      priceMonthly: tier.priceMonthly,
      priceQuarterly: tier.priceQuarterly,
      priceYearly: tier.priceYearly,
      apiRateLimit: tier.apiRateLimit,
      supportLevel: tier.supportLevel,
      analyticsLevel: tier.analyticsLevel,
      isActive: tier.isActive
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  // Close the dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Submit the form
  const handleSubmit = () => {
    if (validateForm()) {
      if (editingTier) {
        // Update existing tier
        dispatch(updateSubscriptionTier({
          id: editingTier._id,
          tierData: formData
        }));
      } else {
        // Create new tier
        dispatch(createSubscriptionTier(formData));
      }
      
      setOpenDialog(false);
    }
  };
  
  // Open confirm delete dialog
  const handleConfirmDelete = (tier) => {
    setTierToDelete(tier);
    setConfirmDeleteDialog(true);
  };
  
  // Close confirm delete dialog
  const handleCloseConfirmDelete = () => {
    setConfirmDeleteDialog(false);
    setTierToDelete(null);
  };
  
  // Delete a tier
  const handleDeleteTier = () => {
    if (tierToDelete) {
      dispatch(deleteSubscriptionTier(tierToDelete._id));
      setConfirmDeleteDialog(false);
      setTierToDelete(null);
    }
  };
  
  // Set a tier as default
  const handleSetDefault = (tier) => {
    if (!tier.isDefault) {
      dispatch(setDefaultSubscriptionTier(tier._id));
    }
  };
  
  // Create default tiers for all platforms
  const handleCreateDefaultTiers = () => {
    setCreatingDefaults(true);
    dispatch(createDefaultSubscriptionTiers())
      .finally(() => {
        setCreatingDefaults(false);
      });
  };
  
  // Render tier card
  const renderTierCard = (tier) => {
    return (
      <Card 
        key={tier._id} 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          border: tier.isDefault ? '2px solid #2196f3' : 'none',
          opacity: tier.isActive ? 1 : 0.6
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="div">
              {tier.name}
              {tier.isDefault && (
                <Tooltip title="Default tier">
                  <StarIcon color="primary" sx={{ ml: 1 }} />
                </Tooltip>
              )}
            </Typography>
            {!tier.isActive && (
              <Chip label="Inactive" color="default" size="small" />
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {tier.description}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
            ${tier.priceMonthly}/month
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ${tier.priceQuarterly}/quarter | ${tier.priceYearly}/year
          </Typography>
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Features:
          </Typography>
          
          <List dense>
            {tier.features.map((feature, index) => (
              <ListItem key={index} disableGutters>
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
        
        <CardActions>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => handleEditTier(tier)}
            aria-label="Edit tier"
          >
            <EditIcon />
          </IconButton>
          
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => handleConfirmDelete(tier)}
            aria-label="Delete tier"
          >
            <DeleteIcon />
          </IconButton>
          
          {!tier.isDefault && (
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => handleSetDefault(tier)}
              aria-label="Set as default tier"
            >
              <StarBorderIcon />
            </IconButton>
          )}
        </CardActions>
      </Card>
    );
  };
  
  if (loading && tiers.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Subscription Tiers
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddTier}
            sx={{ mr: 2 }}
          >
            Add Tier
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleCreateDefaultTiers}
            disabled={creatingDefaults || platforms.length === 0}
          >
            {creatingDefaults ? (
              <CircularProgress size={24} />
            ) : (
              'Create Default Tiers'
            )}
          </Button>
        </Box>
      </Box>
      
      {error && (
        <ErrorMessage
          message="Failed to load subscription tiers"
          error={error}
          showRetryButton
          onRetry={() => dispatch(getSubscriptionTiers())}
        />
      )}
      
      {platforms.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          You need to connect at least one platform before creating subscription tiers.
        </Typography>
      ) : tiers.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          You haven't created any subscription tiers yet. Click "Add Tier" to create your first tier,
          or "Create Default Tiers" to automatically generate a set of tiers for each platform.
        </Typography>
      ) : (
        Object.entries(tiersByPlatform).map(([platform, platformTiers]) => (
          <Box key={platform} sx={{ mb: 4 }}>
            <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
              {platform}
            </Typography>
            
            <Grid container spacing={3}>
              {platformTiers.map((tier) => (
                <Grid item xs={12} sm={6} md={4} key={tier._id}>
                  {renderTierCard(tier)}
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
      
      {/* Add/Edit Tier Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTier ? 'Edit Subscription Tier' : 'Add Subscription Tier'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.platform} disabled={!!editingTier}>
                <InputLabel id="platform-label">Platform</InputLabel>
                <Select
                  labelId="platform-label"
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  label="Platform"
                >
                  {platforms.map((platform) => (
                    <MenuItem key={platform} value={platform}>
                      {platform}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.platform && (
                  <FormHelperText>{formErrors.platform}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.name}>
                <InputLabel id="name-label">Tier Name</InputLabel>
                <Select
                  labelId="name-label"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  label="Tier Name"
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                  <MenuItem value="Enterprise">Enterprise</MenuItem>
                  <MenuItem value="Custom">Custom</MenuItem>
                </Select>
                {formErrors.name && (
                  <FormHelperText>{formErrors.name}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="priceMonthly"
                name="priceMonthly"
                label="Monthly Price ($)"
                type="number"
                value={formData.priceMonthly}
                onChange={handlePriceChange}
                error={!!formErrors.priceMonthly}
                helperText={formErrors.priceMonthly}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="priceQuarterly"
                name="priceQuarterly"
                label="Quarterly Price ($)"
                type="number"
                value={formData.priceQuarterly}
                onChange={handlePriceChange}
                error={!!formErrors.priceQuarterly}
                helperText={formErrors.priceQuarterly}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="priceYearly"
                name="priceYearly"
                label="Yearly Price ($)"
                type="number"
                value={formData.priceYearly}
                onChange={handlePriceChange}
                error={!!formErrors.priceYearly}
                helperText={formErrors.priceYearly}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="apiRateLimit"
                name="apiRateLimit"
                label="API Rate Limit"
                type="number"
                value={formData.apiRateLimit}
                onChange={handleInputChange}
                error={!!formErrors.apiRateLimit}
                helperText={formErrors.apiRateLimit}
                inputProps={{ min: 0, step: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="supportLevel-label">Support Level</InputLabel>
                <Select
                  labelId="supportLevel-label"
                  id="supportLevel"
                  name="supportLevel"
                  value={formData.supportLevel}
                  onChange={handleInputChange}
                  label="Support Level"
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Priority">Priority</MenuItem>
                  <MenuItem value="Dedicated">Dedicated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="analyticsLevel-label">Analytics Level</InputLabel>
                <Select
                  labelId="analyticsLevel-label"
                  id="analyticsLevel"
                  name="analyticsLevel"
                  value={formData.analyticsLevel}
                  onChange={handleInputChange}
                  label="Analytics Level"
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Advanced">Advanced</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Features
              </Typography>
              
              {formErrors.features && (
                <FormHelperText error>{formErrors.features}</FormHelperText>
              )}
              
              {formData.features.map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                  <TextField
                    fullWidth
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                    size="small"
                  />
                  
                  <IconButton
                    color="error"
                    onClick={() => removeFeatureField(index)}
                    disabled={formData.features.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={addFeatureField}
                sx={{ mt: 1 }}
              >
                Add Feature
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Active
                </Typography>
                <Switch
                  checked={formData.isActive}
                  onChange={handleToggleActive}
                  color="primary"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingTier ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteDialog} onClose={handleCloseConfirmDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the "{tierToDelete?.name}" tier for {tierToDelete?.platform}?
            {tierToDelete?.isDefault && (
              <Typography color="error" sx={{ mt: 1 }}>
                Warning: This is your default tier for {tierToDelete.platform}.
                Deleting it will set another tier as default.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDelete}>Cancel</Button>
          <Button onClick={handleDeleteTier} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionTierManagement;
