import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import VerificationBadge from '../../components/verification/VerificationBadge';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Divider,
  Rating,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { getAllInfluencers } from '../../redux/slices/influencerSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const InfluencerListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { influencers, totalCount, loading, error } = useSelector((state) => state.influencer);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [platform, setPlatform] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Load influencers on component mount and when filters change
  useEffect(() => {
    const params = {
      page,
      limit: itemsPerPage,
      searchTerm,
      platform,
      priceRange,
      verificationStatus,
      sortBy,
    };
    dispatch(getAllInfluencers(params));
  }, [dispatch, page, itemsPerPage, searchTerm, platform, priceRange, verificationStatus, sortBy]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  // Handle platform filter change
  const handlePlatformChange = (e) => {
    setPlatform(e.target.value);
    setPage(1);
  };

  // Handle price range filter change
  const handlePriceRangeChange = (e) => {
    setPriceRange(e.target.value);
    setPage(1);
  };

  // Handle verification status filter change
  const handleVerificationStatusChange = (e) => {
    setVerificationStatus(e.target.value);
    setPage(1);
  };

  // Handle sort by change
  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  // Handle pagination change
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Show loading spinner if data is being loaded
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (error) {
    return (
      <ErrorMessage
        message="Failed to load influencers"
        error={error}
        showRetryButton
        onRetry={() => {
          const params = {
            page,
            limit: itemsPerPage,
            searchTerm,
            platform,
            priceRange,
            sortBy,
          };
          dispatch(getAllInfluencers(params));
        }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Browse Influencers
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Find the perfect influencer for your marketing campaign
      </Typography>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Influencers"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="platform-label">Platform</InputLabel>
              <Select
                labelId="platform-label"
                id="platform"
                value={platform}
                onChange={handlePlatformChange}
                label="Platform"
              >
                <MenuItem value="">All Platforms</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="tiktok">TikTok</MenuItem>
                <MenuItem value="twitter">Twitter</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="price-range-label">Price Range</InputLabel>
              <Select
                labelId="price-range-label"
                id="price-range"
                value={priceRange}
                onChange={handlePriceRangeChange}
                label="Price Range"
              >
                <MenuItem value="">Any Price</MenuItem>
                <MenuItem value="0-50">$0 - $50 / day</MenuItem>
                <MenuItem value="50-100">$50 - $100 / day</MenuItem>
                <MenuItem value="100-200">$100 - $200 / day</MenuItem>
                <MenuItem value="200+">$200+ / day</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="verification-status-label">Verification</InputLabel>
              <Select
                labelId="verification-status-label"
                id="verification-status"
                value={verificationStatus}
                onChange={handleVerificationStatusChange}
                label="Verification"
              >
                <MenuItem value="">Any Status</MenuItem>
                <MenuItem value="verified">Fully Verified</MenuItem>
                <MenuItem value="identity_verified">Identity Verified</MenuItem>
                <MenuItem value="social_verified">Social Verified</MenuItem>
                <MenuItem value="unverified">Unverified</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                id="sort-by"
                value={sortBy}
                onChange={handleSortByChange}
                label="Sort By"
              >
                <MenuItem value="rating">Rating</MenuItem>
                <MenuItem value="price_low">Price: Low to High</MenuItem>
                <MenuItem value="price_high">Price: High to Low</MenuItem>
                <MenuItem value="followers">Followers</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FilterListIcon />}
              onClick={() => {
                setSearchTerm('');
                setPlatform('');
                setPriceRange('');
                setVerificationStatus('');
                setSortBy('rating');
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Influencers Grid */}
      {influencers.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {influencers.map((influencer) => (
              <Grid item key={influencer._id} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={influencer.profile?.avatar}
                        sx={{ width: 56, height: 56, mr: 2 }}
                      >
                        {influencer.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h6" component="div" sx={{ mr: 1 }}>
                            {influencer.profile?.name || influencer.username}
                          </Typography>
                          <VerificationBadge 
                            isVerified={influencer.isVerified}
                            isIdentityVerified={influencer.isIdentityVerified}
                            verifiedSocialAccounts={influencer.verifiedSocialAccounts || 0}
                            totalSocialAccounts={influencer.socialAccounts?.length || 0}
                            size="small"
                            showDetails={true}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          @{influencer.username}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {influencer.profile?.bio || 'No bio provided'}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                        Rating:
                      </Typography>
                      <Rating
                        value={influencer.rating || 0}
                        precision={0.5}
                        readOnly
                        size="small"
                      />
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        ({influencer.reviewCount || 0})
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Available Platforms:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {influencer.socialAccounts?.map((account) => (
                        <Chip
                          key={account._id}
                          label={account.platform}
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={account.isVerified ? <VerifiedUserIcon fontSize="small" /> : undefined}
                        />
                      ))}
                      {(!influencer.socialAccounts || influencer.socialAccounts.length === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          No platforms available
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Price Range:
                    </Typography>
                    <Box>
                      {influencer.socialAccounts?.length > 0 ? (
                        <Chip
                          label={`$${Math.min(...influencer.socialAccounts.map((a) => a.rentalFee))} - $${Math.max(
                            ...influencer.socialAccounts.map((a) => a.rentalFee)
                          )} / day`}
                          size="small"
                          color="primary"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No pricing available
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/influencers/${influencer._id}`)}
                    >
                      View Profile
                    </Button>
                    {isAuthenticated && user.userType === 'advertiser' && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate(`/influencers/${influencer._id}`)}
                      >
                        Rent API Key
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Influencers Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We couldn't find any influencers matching your search criteria.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setSearchTerm('');
              setPlatform('');
              setPriceRange('');
              setVerificationStatus('');
              setSortBy('rating');
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default InfluencerListPage;
