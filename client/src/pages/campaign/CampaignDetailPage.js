import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignAnalytics,
  addRentalToCampaign,
  removeRentalFromCampaign,
  updateCampaignMetrics,
} from '../../redux/slices/advertiserSlice';
import { getRentals } from '../../redux/slices/rentalSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`campaign-detail-tabpanel-${index}`}
      aria-labelledby={`campaign-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CampaignDetailPage = () => {
  const { campaignId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentCampaign, campaignAnalytics, loading, error } = useSelector(
    (state) => state.advertiser
  );
  const { rentals } = useSelector((state) => state.rental);

  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    objective: 'awareness',
    startDate: '',
    endDate: '',
    status: 'draft',
    budget: {
      total: 0,
      spent: 0,
      currency: 'USD',
    },
    targetAudience: {
      platforms: [],
    },
    tags: [],
  });
  const [openAddRentalDialog, setOpenAddRentalDialog] = useState(false);
  const [openMetricsDialog, setOpenMetricsDialog] = useState(false);
  const [metricsFormData, setMetricsFormData] = useState({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    engagement: 0,
  });

  // Load campaign data
  useEffect(() => {
    if (campaignId) {
      dispatch(getCampaignById(campaignId));
      dispatch(getCampaignAnalytics(campaignId));
      dispatch(getRentals());
    }
  }, [dispatch, campaignId]);

  // Set form data when campaign data is loaded
  useEffect(() => {
    if (currentCampaign) {
      setCampaignFormData({
        name: currentCampaign.name || '',
        description: currentCampaign.description || '',
        objective: currentCampaign.objective || 'awareness',
        startDate: currentCampaign.startDate
          ? new Date(currentCampaign.startDate).toISOString().split('T')[0]
          : '',
        endDate: currentCampaign.endDate
          ? new Date(currentCampaign.endDate).toISOString().split('T')[0]
          : '',
        status: currentCampaign.status || 'draft',
        budget: {
          total: currentCampaign.budget?.total || 0,
          spent: currentCampaign.budget?.spent || 0,
          currency: currentCampaign.budget?.currency || 'USD',
        },
        targetAudience: {
          platforms: currentCampaign.targetAudience?.platforms || [],
        },
        tags: currentCampaign.tags || [],
      });

      setMetricsFormData({
        impressions: currentCampaign.metrics?.impressions || 0,
        clicks: currentCampaign.metrics?.clicks || 0,
        conversions: currentCampaign.metrics?.conversions || 0,
        engagement: currentCampaign.metrics?.engagement || 0,
      });
    }
  }, [currentCampaign]);

  // Redirect if not authenticated or not an advertiser
  useEffect(() => {
    if (user && user.userType !== 'advertiser') {
      navigate('/dashboard/influencer');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCampaignFormData({
        ...campaignFormData,
        [parent]: {
          ...campaignFormData[parent],
          [child]: value,
        },
      });
    } else {
      setCampaignFormData({
        ...campaignFormData,
        [name]: value,
      });
    }
  };

  const handleMetricsInputChange = (e) => {
    const { name, value } = e.target;
    setMetricsFormData({
      ...metricsFormData,
      [name]: parseInt(value, 10) || 0,
    });
  };

  const handlePlatformsChange = (event) => {
    setCampaignFormData({
      ...campaignFormData,
      targetAudience: {
        ...campaignFormData.targetAudience,
        platforms: event.target.value,
      },
    });
  };

  const handleTagsChange = (event) => {
    const tagsString = event.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setCampaignFormData({
      ...campaignFormData,
      tags: tagsArray,
    });
  };

  const handleSaveCampaign = () => {
    dispatch(updateCampaign({
      campaignId,
      campaignData: campaignFormData,
    }));
    setEditMode(false);
  };

  const handleDeleteCampaign = () => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      dispatch(deleteCampaign(campaignId));
      navigate('/campaigns');
    }
  };

  const handleStatusChange = (newStatus) => {
    dispatch(updateCampaign({
      campaignId,
      campaignData: { status: newStatus },
    }));
  };

  const handleOpenAddRentalDialog = () => {
    setOpenAddRentalDialog(true);
  };

  const handleCloseAddRentalDialog = () => {
    setOpenAddRentalDialog(false);
  };

  const handleAddRentalToCampaign = (rentalId) => {
    dispatch(addRentalToCampaign({ campaignId, rentalId }));
    handleCloseAddRentalDialog();
  };

  const handleRemoveRentalFromCampaign = (rentalId) => {
    if (window.confirm('Are you sure you want to remove this rental from the campaign?')) {
      dispatch(removeRentalFromCampaign({ campaignId, rentalId }));
    }
  };

  const handleOpenMetricsDialog = () => {
    setOpenMetricsDialog(true);
  };

  const handleCloseMetricsDialog = () => {
    setOpenMetricsDialog(false);
  };

  const handleUpdateMetrics = () => {
    dispatch(updateCampaignMetrics({
      campaignId,
      metricsData: metricsFormData,
    }));
    handleCloseMetricsDialog();
  };

  // Get available rentals (not already in this campaign)
  const getAvailableRentals = () => {
    if (!rentals || !currentCampaign) return [];
    return rentals.filter(
      (rental) =>
        rental.status === 'active' &&
        (!currentCampaign.rentals || !currentCampaign.rentals.includes(rental._id))
    );
  };

  // Get campaign rentals
  const getCampaignRentals = () => {
    if (!rentals || !currentCampaign || !currentCampaign.rentals) return [];
    return rentals.filter((rental) => currentCampaign.rentals.includes(rental._id));
  };

  // Show loading spinner if data is being loaded
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (error) {
    return (
      <ErrorMessage
        message="Failed to load campaign data"
        error={error}
        showRetryButton
        onRetry={() => {
          dispatch(getCampaignById(campaignId));
        }}
      />
    );
  }

  // Show not found message if campaign doesn't exist
  if (!currentCampaign) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Campaign Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The campaign you're looking for doesn't exist or you don't have permission to view it.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/campaigns')}
          >
            Back to Campaigns
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/campaigns')}
          sx={{ mb: 2 }}
        >
          Back to Campaigns
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editMode ? (
            <TextField
              fullWidth
              label="Campaign Name"
              name="name"
              value={campaignFormData.name}
              onChange={handleInputChange}
              sx={{ mr: 2 }}
            />
          ) : (
            <Typography variant="h4" component="h1">
              {currentCampaign.name}
            </Typography>
          )}

          <Box>
            {editMode ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCampaign}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteCampaign}
                >
                  Delete
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          <Chip
            label={currentCampaign.status}
            color={
              currentCampaign.status === 'active'
                ? 'success'
                : currentCampaign.status === 'draft'
                ? 'default'
                : currentCampaign.status === 'paused'
                ? 'warning'
                : 'error'
            }
            sx={{ mr: 1 }}
          />
          {!editMode && (
            <Box sx={{ ml: 2 }}>
              {currentCampaign.status === 'draft' && (
                <Tooltip title="Activate Campaign">
                  <IconButton
                    color="success"
                    onClick={() => handleStatusChange('active')}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </Tooltip>
              )}
              {currentCampaign.status === 'active' && (
                <Tooltip title="Pause Campaign">
                  <IconButton
                    color="warning"
                    onClick={() => handleStatusChange('paused')}
                  >
                    <PauseIcon />
                  </IconButton>
                </Tooltip>
              )}
              {currentCampaign.status === 'paused' && (
                <Tooltip title="Resume Campaign">
                  <IconButton
                    color="success"
                    onClick={() => handleStatusChange('active')}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </Tooltip>
              )}
              {(currentCampaign.status === 'active' || currentCampaign.status === 'paused') && (
                <Tooltip title="Complete Campaign">
                  <IconButton
                    color="info"
                    onClick={() => handleStatusChange('completed')}
                  >
                    <StopIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Campaign Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Overview" />
          <Tab label="Rentals" />
          <Tab label="Analytics" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardHeader title="Campaign Details" />
                <CardContent>
                  {editMode ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          name="description"
                          value={campaignFormData.description}
                          onChange={handleInputChange}
                          multiline
                          rows={3}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Campaign Objective</InputLabel>
                          <Select
                            name="objective"
                            value={campaignFormData.objective}
                            onChange={handleInputChange}
                            label="Campaign Objective"
                          >
                            <MenuItem value="awareness">Brand Awareness</MenuItem>
                            <MenuItem value="consideration">Consideration</MenuItem>
                            <MenuItem value="conversion">Conversion</MenuItem>
                            <MenuItem value="engagement">Engagement</MenuItem>
                            <MenuItem value="traffic">Traffic</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Status</InputLabel>
                          <Select
                            name="status"
                            value={campaignFormData.status}
                            onChange={handleInputChange}
                            label="Status"
                          >
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="paused">Paused</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  ) : (
                    <Box>
                      <Typography variant="body1" paragraph>
                        {currentCampaign.description || 'No description provided.'}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Objective
                          </Typography>
                          <Typography variant="body2">
                            {currentCampaign.objective || 'Not specified'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="body2">
                            {currentCampaign.status || 'Not specified'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardHeader title="Budget" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Budget
                      </Typography>
                      <Typography variant="h6">
                        {currentCampaign.budget?.total
                          ? `${currentCampaign.budget.currency} ${currentCampaign.budget.total}`
                          : 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Spent
                      </Typography>
                      <Typography variant="h6">
                        {currentCampaign.budget?.spent
                          ? `${currentCampaign.budget.currency} ${currentCampaign.budget.spent}`
                          : '0'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {currentCampaign.budget?.total > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Budget Usage
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              (currentCampaign.budget.spent / currentCampaign.budget.total) * 100,
                              100
                            )}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(
                              (currentCampaign.budget.spent / currentCampaign.budget.total) * 100
                            )}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Rentals Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Campaign Rentals</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddRentalDialog}
              disabled={getAvailableRentals().length === 0}
            >
              Add Rental
            </Button>
          </Box>

          {getCampaignRentals().length > 0 ? (
            <List>
              {getCampaignRentals().map((rental) => (
                <ListItem key={rental._id} sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={rental.influencerName || 'Influencer'}
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          Platform: {rental.platform || 'Not specified'}
                        </Typography>
                        <Typography variant="body2" component="span" display="block">
                          Status: {rental.status || 'Not specified'}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="remove"
                      onClick={() => handleRemoveRentalFromCampaign(rental._id)}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No rentals added to this campaign yet.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddRentalDialog}
                sx={{ mt: 2 }}
                disabled={getAvailableRentals().length === 0}
              >
                Add Rental
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Campaign Analytics</Typography>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenMetricsDialog}
            >
              Update Metrics
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Performance Metrics" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Impressions
                        </Typography>
                        <Typography variant="h6">
                          {currentCampaign.metrics?.impressions?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Clicks
                        </Typography>
                        <Typography variant="h6">
                          {currentCampaign.metrics?.clicks?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Conversions
                        </Typography>
                        <Typography variant="h6">
                          {currentCampaign.metrics?.conversions?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Engagement
                        </Typography>
                        <Typography variant="h6">
                          {currentCampaign.metrics?.engagement?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Add Rental Dialog */}
      <Dialog open={openAddRentalDialog} onClose={handleCloseAddRentalDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Rental to Campaign</DialogTitle>
        <DialogContent>
          {getAvailableRentals().length > 0 ? (
            <List>
              {getAvailableRentals().map((rental) => (
                <ListItem
                  key={rental._id}
                  button
                  onClick={() => handleAddRentalToCampaign(rental._id)}
                  sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={rental.influencerName || 'Influencer'}
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          Platform: {rental.platform || 'Not specified'}
                        </Typography>
                        <Typography variant="body2" component="span" display="block">
                          Status: {rental.status || 'Not specified'}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No available rentals found. Create new rentals first.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddRentalDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Update Metrics Dialog */}
      <Dialog open={openMetricsDialog} onClose={handleCloseMetricsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Campaign Metrics</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Impressions"
                name="impressions"
                type="number"
                value={metricsFormData.impressions}
                onChange={handleMetricsInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Clicks"
                name="clicks"
                type="number"
                value={metricsFormData.clicks}
                onChange={handleMetricsInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Conversions"
                name="conversions"
                type="number"
                value={metricsFormData.conversions}
                onChange={handleMetricsInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Engagement"
                name="engagement"
                type="number"
                value={metricsFormData.engagement}
                onChange={handleMetricsInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMetricsDialog}>Cancel</Button>
          <Button onClick={handleUpdateMetrics} variant="contained" color="primary">
            Update Metrics
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CampaignDetailPage;
