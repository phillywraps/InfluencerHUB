import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import PersonIcon from '@mui/icons-material/Person';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import MessageIcon from '@mui/icons-material/Message';
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
      id={`rental-tabpanel-${index}`}
      aria-labelledby={`rental-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RentalListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { rentals, loading, error } = useSelector((state) => state.rental);
  const { user } = useSelector((state) => state.auth);

  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState('date_desc');

  // Load rentals on component mount
  useEffect(() => {
    dispatch(getRentals());
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle sort by change
  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  // Filter rentals by status
  const activeRentals = rentals.filter((rental) => rental.status === 'active');
  const pendingRentals = rentals.filter((rental) => rental.status === 'pending');
  const completedRentals = rentals.filter((rental) => rental.status === 'completed');
  const cancelledRentals = rentals.filter((rental) => rental.status === 'cancelled');

  // Sort rentals based on selected option
  const sortRentals = (rentalsToSort) => {
    switch (sortBy) {
      case 'date_asc':
        return [...rentalsToSort].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      case 'date_desc':
        return [...rentalsToSort].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case 'price_asc':
        return [...rentalsToSort].sort((a, b) => a.rentalFee - b.rentalFee);
      case 'price_desc':
        return [...rentalsToSort].sort((a, b) => b.rentalFee - a.rentalFee);
      default:
        return rentalsToSort;
    }
  };

  // Get the appropriate rentals based on the selected tab
  const getTabRentals = () => {
    switch (tabValue) {
      case 0:
        return sortRentals(activeRentals);
      case 1:
        return sortRentals(pendingRentals);
      case 2:
        return sortRentals(completedRentals);
      case 3:
        return sortRentals(cancelledRentals);
      default:
        return [];
    }
  };

  // Show loading spinner if data is being loaded
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (error) {
    return (
      <ErrorMessage
        message="Failed to load rentals"
        error={error}
        showRetryButton
        onRetry={() => {
          dispatch(getRentals());
        }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Rentals
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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
              Active Rentals
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {activeRentals.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Pending Requests
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {pendingRentals.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Completed Rentals
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {completedRentals.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Cancelled Rentals
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {cancelledRentals.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Rentals List */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Active" />
            <Tab label="Pending" />
            <Tab label="Completed" />
            <Tab label="Cancelled" />
          </Tabs>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by"
              value={sortBy}
              onChange={handleSortByChange}
              label="Sort By"
            >
              <MenuItem value="date_desc">Date: Newest First</MenuItem>
              <MenuItem value="date_asc">Date: Oldest First</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Divider />

        {/* Active Rentals Tab */}
        <TabPanel value={tabValue} index={0}>
          {activeRentals.length > 0 ? (
            <List>
              {getTabRentals().map((rental) => (
                <ListItem
                  key={rental._id}
                  alignItems="flex-start"
                  divider
                  button
                  onClick={() => navigate(`/rentals/${rental._id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <KeyIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">
                          {user.userType === 'influencer'
                            ? `${rental.advertiser.username} - ${rental.socialAccount.platform}`
                            : `${rental.influencer.username} - ${rental.socialAccount.platform}`}
                        </Typography>
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          Started: {new Date(rental.startDate).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Ends: {new Date(rental.endDate).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Fee: ${rental.rentalFee}
                        </Typography>
                      </>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {user.userType === 'advertiser' && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<KeyIcon />}
                        sx={{ mr: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rentals/${rental._id}`);
                        }}
                      >
                        View Key
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MessageIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/messages/${
                            user.userType === 'influencer'
                              ? rental.advertiser._id
                              : rental.influencer._id
                          }`
                        );
                      }}
                    >
                      Message
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No Active Rentals
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You don't have any active rentals at the moment.
              </Typography>
              {user.userType === 'advertiser' && (
                <Button
                  variant="contained"
                  onClick={() => navigate('/influencers')}
                >
                  Browse Influencers
                </Button>
              )}
            </Box>
          )}
        </TabPanel>

        {/* Pending Rentals Tab */}
        <TabPanel value={tabValue} index={1}>
          {pendingRentals.length > 0 ? (
            <List>
              {getTabRentals().map((rental) => (
                <ListItem
                  key={rental._id}
                  alignItems="flex-start"
                  divider
                  button
                  onClick={() => navigate(`/rentals/${rental._id}`)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">
                          {user.userType === 'influencer'
                            ? `Request from ${rental.advertiser.username}`
                            : `Request to ${rental.influencer.username}`}
                        </Typography>
                        <Chip
                          label="Pending"
                          color="warning"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          Platform: {rental.socialAccount.platform}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Duration: {rental.duration} days
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Fee: ${rental.rentalFee}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Requested: {new Date(rental.createdAt).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  {user.userType === 'influencer' && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        sx={{ mr: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rentals/${rental._id}`);
                        }}
                      >
                        Review
                      </Button>
                    </Box>
                  )}
                  {user.userType === 'advertiser' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/rentals/${rental._id}`);
                      }}
                    >
                      View Details
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No Pending Requests
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You don't have any pending rental requests at the moment.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Completed Rentals Tab */}
        <TabPanel value={tabValue} index={2}>
          {completedRentals.length > 0 ? (
            <List>
              {getTabRentals().map((rental) => (
                <ListItem
                  key={rental._id}
                  alignItems="flex-start"
                  divider
                  button
                  onClick={() => navigate(`/rentals/${rental._id}`)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <MonetizationOnIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">
                          {user.userType === 'influencer'
                            ? `${rental.advertiser.username} - ${rental.socialAccount.platform}`
                            : `${rental.influencer.username} - ${rental.socialAccount.platform}`}
                        </Typography>
                        <Chip
                          label="Completed"
                          color="default"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          Period: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Fee: ${rental.rentalFee}
                        </Typography>
                      </>
                    }
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/rentals/${rental._id}`);
                    }}
                  >
                    View Details
                  </Button>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No Completed Rentals
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You don't have any completed rentals yet.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Cancelled Rentals Tab */}
        <TabPanel value={tabValue} index={3}>
          {cancelledRentals.length > 0 ? (
            <List>
              {getTabRentals().map((rental) => (
                <ListItem
                  key={rental._id}
                  alignItems="flex-start"
                  divider
                  button
                  onClick={() => navigate(`/rentals/${rental._id}`)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">
                          {user.userType === 'influencer'
                            ? `${rental.advertiser.username} - ${rental.socialAccount.platform}`
                            : `${rental.influencer.username} - ${rental.socialAccount.platform}`}
                        </Typography>
                        <Chip
                          label="Cancelled"
                          color="error"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          Requested: {new Date(rental.createdAt).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Cancelled: {new Date(rental.updatedAt).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Fee: ${rental.rentalFee}
                        </Typography>
                      </>
                    }
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/rentals/${rental._id}`);
                    }}
                  >
                    View Details
                  </Button>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No Cancelled Rentals
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You don't have any cancelled rentals.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default RentalListPage;
