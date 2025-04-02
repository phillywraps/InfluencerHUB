import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Campaign as CampaignIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material';
import { getCampaigns, addCampaign, updateCampaign, deleteCampaign } from '../../redux/slices/advertiserSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`campaign-tabpanel-${index}`}
      aria-labelledby={`campaign-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CampaignManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { profile, loading, error } = useSelector((state) => state.advertiser);

  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    objective: 'awareness',
    startDate: '',
    endDate: '',
    budget: {
      total: 0,
      currency: 'USD',
    },
    targetAudience: {
      platforms: [],
    },
    tags: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');

  // Load campaigns
  useEffect(() => {
    dispatch(getCampaigns());
  }, [dispatch]);

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

  const handleOpenDialog = () => {
    setCampaignFormData({
      name: '',
      description: '',
      objective: 'awareness',
      startDate: '',
      endDate: '',
      budget: {
        total: 0,
        currency: 'USD',
      },
      targetAudience: {
        platforms: [],
      },
      tags: [],
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
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

  const handleCreateCampaign = () => {
    dispatch(addCampaign(campaignFormData));
    handleCloseDialog();
  };

  const handleEditCampaign = (campaign) => {
    navigate(`/campaigns/${campaign._id}`);
  };

  const handleDeleteCampaign = (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      dispatch(deleteCampaign(campaignId));
    }
  };

  const handleViewCampaign = (campaign) => {
    navigate(`/campaigns/${campaign._id}`);
  };

  // Filter and sort campaigns
  const getFilteredCampaigns = () => {
    if (!profile || !profile.campaigns) return [];

    let filteredCampaigns = [...profile.campaigns];

    // Filter by status
    if (filterStatus !== 'all') {
      filteredCampaigns = filteredCampaigns.filter(
        (campaign) => campaign.status === filterStatus
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredCampaigns = filteredCampaigns.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(term) ||
          (campaign.description && campaign.description.toLowerCase().includes(term)) ||
          (campaign.tags && campaign.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    // Sort campaigns
    filteredCampaigns.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'budget':
          return (b.budget?.total || 0) - (a.budget?.total || 0);
        default:
          return 0;
      }
    });

    return filteredCampaigns;
  };

  // Get campaigns by status
  const draftCampaigns = profile?.campaigns?.filter(
    (campaign) => campaign.status === 'draft'
  ) || [];
  const activeCampaigns = profile?.campaigns?.filter(
    (campaign) => campaign.status === 'active'
  ) || [];
  const completedCampaigns = profile?.campaigns?.filter(
    (campaign) => campaign.status === 'completed' || campaign.status === 'cancelled'
  ) || [];

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
          dispatch(getCampaigns());
        }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Campaign Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create Campaign
        </Button>
      </Box>

      {/* Campaign Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Total Campaigns
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {profile?.campaigns?.length || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'primary.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Active Campaigns
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {activeCampaigns.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Draft Campaigns
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {draftCampaigns.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search Campaigns"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
                startAdornment={<FilterListIcon sx={{ color: 'text.secondary', mr: 1 }} />}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
                startAdornment={<SortIcon sx={{ color: 'text.secondary', mr: 1 }} />}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="date">Date Created</MenuItem>
                <MenuItem value="budget">Budget</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Campaign Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Campaigns" />
          <Tab label="Active" />
          <Tab label="Drafts" />
          <Tab label="Completed" />
        </Tabs>

        {/* All Campaigns Tab */}
        <TabPanel value={tabValue} index={0}>
          {getFilteredCampaigns().length > 0 ? (
            <List>
              {getFilteredCampaigns().map((campaign) => (
                <ListItem
                  key={campaign._id}
                  button
                  onClick={() => handleViewCampaign(campaign)}
                  sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: campaign.status === 'active' ? 'success.main' : 'grey.500' }}>
                      <CampaignIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {campaign.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {campaign.description || 'No description'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip
                            label={campaign.status}
                            size="small"
                            color={
                              campaign.status === 'active'
                                ? 'success'
                                : campaign.status === 'draft'
                                ? 'default'
                                : campaign.status === 'paused'
                                ? 'warning'
                                : 'error'
                            }
                          />
                          {campaign.objective && (
                            <Chip
                              label={campaign.objective}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {campaign.budget?.total > 0 && (
                            <Chip
                              label={`Budget: ${campaign.budget.currency} ${campaign.budget.total}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {campaign.tags?.map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                        {campaign.budget?.total > 0 && campaign.budget?.spent > 0 && (
                          <Box sx={{ mt: 1, width: '100%' }}>
                            <Typography variant="caption" display="block">
                              Budget Used: {Math.round((campaign.budget.spent / campaign.budget.total) * 100)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((campaign.budget.spent / campaign.budget.total) * 100, 100)}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" onClick={(e) => {
                      e.stopPropagation();
                      handleEditCampaign(campaign);
                    }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampaign(campaign._id);
                    }}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="view">
                      <KeyboardArrowRightIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No campaigns found matching your criteria.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{ mt: 2 }}
              >
                Create Your First Campaign
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Active Campaigns Tab */}
        <TabPanel value={tabValue} index={1}>
          {activeCampaigns.length > 0 ? (
            <List>
              {activeCampaigns.map((campaign) => (
                <ListItem
                  key={campaign._id}
                  button
                  onClick={() => handleViewCampaign(campaign)}
                  sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CampaignIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {campaign.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {campaign.description || 'No description'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip label="Active" size="small" color="success" />
                          {campaign.objective && (
                            <Chip
                              label={campaign.objective}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {campaign.budget?.total > 0 && (
                            <Chip
                              label={`Budget: ${campaign.budget.currency} ${campaign.budget.total}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {campaign.budget?.total > 0 && campaign.budget?.spent > 0 && (
                          <Box sx={{ mt: 1, width: '100%' }}>
                            <Typography variant="caption" display="block">
                              Budget Used: {Math.round((campaign.budget.spent / campaign.budget.total) * 100)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((campaign.budget.spent / campaign.budget.total) * 100, 100)}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" onClick={(e) => {
                      e.stopPropagation();
                      handleEditCampaign(campaign);
                    }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="view">
                      <KeyboardArrowRightIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You don't have any active campaigns.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{ mt: 2 }}
              >
                Create Campaign
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Draft Campaigns Tab */}
        <TabPanel value={tabValue} index={2}>
          {draftCampaigns.length > 0 ? (
            <List>
              {draftCampaigns.map((campaign) => (
                <ListItem
                  key={campaign._id}
                  button
                  onClick={() => handleViewCampaign(campaign)}
                  sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <CampaignIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {campaign.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {campaign.description || 'No description'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip label="Draft" size="small" />
                          {campaign.objective && (
                            <Chip
                              label={campaign.objective}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" onClick={(e) => {
                      e.stopPropagation();
                      handleEditCampaign(campaign);
                    }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampaign(campaign._id);
                    }}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="view">
                      <KeyboardArrowRightIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You don't have any draft campaigns.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{ mt: 2 }}
              >
                Create Campaign
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Completed Campaigns Tab */}
        <TabPanel value={tabValue} index={3}>
          {completedCampaigns.length > 0 ? (
            <List>
              {completedCampaigns.map((campaign) => (
                <ListItem
                  key={campaign._id}
                  button
                  onClick={() => handleViewCampaign(campaign)}
                  sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: campaign.status === 'completed' ? 'info.main' : 'error.main' }}>
                      <CampaignIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {campaign.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {campaign.description || 'No description'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip
                            label={campaign.status}
                            size="small"
                            color={campaign.status === 'completed' ? 'info' : 'error'}
                          />
                          {campaign.objective && (
                            <Chip
                              label={campaign.objective}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {campaign.budget?.total > 0 && (
                            <Chip
                              label={`Budget: ${campaign.budget.currency} ${campaign.budget.total}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {campaign.budget?.total > 0 && campaign.budget?.spent > 0 && (
                          <Box sx={{ mt: 1, width: '100%' }}>
                            <Typography variant="caption" display="block">
                              Budget Used: {Math.round((campaign.budget.spent / campaign.budget.total) * 100)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((campaign.budget.spent / campaign.budget.total) * 100, 100)}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="view">
                      <KeyboardArrowRightIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You don't have any completed campaigns.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Create Campaign Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Campaign</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Name"
                name="name"
                value={campaignFormData.name}
                onChange={handleInputChange}
                required
                helperText="Give your campaign a descriptive name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={campaignFormData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                helperText="Describe the purpose and goals of your campaign"
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
                <FormHelperText>Select the primary goal of your campaign</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget"
                name="budget.total"
                type="number"
                value={campaignFormData.budget.total}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <Select
                      value={campaignFormData.budget.currency}
                      onChange={(e) =>
                        setCampaignFormData({
                          ...campaignFormData,
                          budget: {
                            ...campaignFormData.budget,
                            currency: e.target.value,
                          },
                        })
                      }
                      sx={{ mr: 1, width: 80 }}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                    </Select>
                  ),
                }}
                helperText="Set your total campaign budget"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={campaignFormData.startDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={campaignFormData.endDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Target Platforms</InputLabel>
                <Select
                  multiple
                  value={campaignFormData.targetAudience.platforms}
                  onChange={handlePlatformsChange}
                  label="Target Platforms"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="instagram">Instagram</MenuItem>
                  <MenuItem value="tiktok">TikTok</MenuItem>
                  <MenuItem value="youtube">YouTube</MenuItem>
                  <MenuItem value="twitter">Twitter</MenuItem>
                  <MenuItem value="facebook">Facebook</MenuItem>
                  <MenuItem value="twitch">Twitch</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                <FormHelperText>Select the platforms you want to target</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                name="tags"
                value={campaignFormData.tags.join(', ')}
                onChange={handleTagsChange}
                helperText="Enter tags separated by commas (e.g., summer, promotion, fashion)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateCampaign}
            variant="contained"
            color="primary"
            disabled={!campaignFormData.name}
          >
            Create Campaign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CampaignManagementPage;
