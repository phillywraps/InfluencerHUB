import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  Button,
  Chip,
  Divider,
  Paper,
  Rating,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerificationBadge from '../../components/verification/VerificationBadge';
import { getAllInfluencers } from '../../redux/slices/influencerSlice';
import withApiHandler from '../../components/common/withApiHandler';
import ErrorMessage from '../../components/common/ErrorMessage';

// Platform icons
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import PinterestIcon from '@mui/icons-material/Pinterest';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PublicIcon from '@mui/icons-material/Public';
import MusicNoteIcon from '@mui/icons-material/MusicNote'; // For TikTok
import LanguageIcon from '@mui/icons-material/Language';

// Map of platform icons
const PLATFORM_ICONS = {
  instagram: { icon: InstagramIcon, color: '#E1306C' },
  youtube: { icon: YouTubeIcon, color: '#FF0000' },
  tiktok: { icon: MusicNoteIcon, color: '#000000' },
  twitter: { icon: TwitterIcon, color: '#1DA1F2' },
  facebook: { icon: FacebookIcon, color: '#4267B2' },
  pinterest: { icon: PinterestIcon, color: '#E60023' },
  linkedin: { icon: LinkedInIcon, color: '#0077B5' },
  website: { icon: LanguageIcon, color: '#2E7D32' },
  other: { icon: PublicIcon, color: '#757575' },
};

// Categories for filtering
const CATEGORIES = [
  'Fashion',
  'Beauty',
  'Technology',
  'Gaming',
  'Fitness',
  'Food',
  'Travel',
  'Business',
  'Lifestyle',
  'Entertainment',
  'Education',
  'Art & Design',
  'Health & Wellness'
];

// Custom PlatformChip component
const PlatformChip = ({ platform, count }) => {
  const platformInfo = PLATFORM_ICONS[platform.toLowerCase()] || PLATFORM_ICONS.other;
  const IconComponent = platformInfo.icon;
  
  return (
    <Chip
      icon={<IconComponent style={{ color: platformInfo.color }} />}
      label={platform}
      variant="outlined"
      size="small"
      sx={{ 
        borderColor: platformInfo.color,
        '& .MuiChip-label': { color: platformInfo.color, fontWeight: 'medium' }
      }}
    />
  );
};

const InfluencerBrowsePage = ({ handleApiRequest }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query params
  const queryParams = new URLSearchParams(location.search);
  const initialPlatform = queryParams.get('platform') || '';
  
  // Redux state
  const { influencers, totalCount, loading, error } = useSelector((state) => state.influencer);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [platform, setPlatform] = useState(initialPlatform);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'list'
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);
  const [availableOnly, setAvailableOnly] = useState(true);
  
  // Load influencers on mount and when filters change
  useEffect(() => {
    loadInfluencers();
  }, [dispatch, page, itemsPerPage, platform, sortBy, availableOnly, verificationStatus]);
  
  // Advanced search when user clicks search button
  const handleSearch = () => {
    setPage(1); // Reset to first page
    loadInfluencers();
  };
  
  // Load influencers with current filters
  const loadInfluencers = async () => {
    const params = {
      page,
      limit: itemsPerPage,
      searchTerm,
      platform,
      categories: selectedCategories.join(','),
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      verificationStatus,
      sortBy,
      availableOnly
    };
    
    await handleApiRequest(
      () => dispatch(getAllInfluencers(params)),
      {
        operation: 'loadInfluencers',
        errorMessage: 'Failed to load influencers'
      }
    );
  };
  
  // Handle search input change
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle price range change
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };
  
  // Handle category selection
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setPlatform('');
    setSelectedCategories([]);
    setPriceRange([0, 500]);
    setVerificationStatus('');
    setSortBy('rating');
    setPage(1);
    setAvailableOnly(true);
  };
  
  // Handle pagination change
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Browse Influencers
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Find the perfect influencer for your next marketing campaign
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Filters Panel */}
        <Grid item xs={12} md={3} lg={3}>
          <Paper 
            sx={{ 
              p: 0, 
              position: { md: 'sticky' }, 
              top: { md: 24 },
              maxHeight: { md: 'calc(100vh - 48px)' },
              overflow: 'auto'
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Filters
              </Typography>
              <Button 
                size="small" 
                startIcon={<ClearIcon />} 
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Box>
            <Divider />
            
            {/* Search Filter */}
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                label="Search Influencers"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchTermChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={availableOnly} 
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    color="primary"
                  />
                }
                label="Available for rental only"
              />
            </Box>
            <Divider />
            
            {/* Platform Filter */}
            <Accordion 
              disableGutters 
              elevation={0} 
              defaultExpanded
              sx={{ 
                '&:before': { display: 'none' },
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">Platform</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="platform-label">Select Platform</InputLabel>
                  <Select
                    labelId="platform-label"
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    label="Select Platform"
                  >
                    <MenuItem value="">All Platforms</MenuItem>
                    <MenuItem value="instagram">Instagram</MenuItem>
                    <MenuItem value="youtube">YouTube</MenuItem>
                    <MenuItem value="tiktok">TikTok</MenuItem>
                    <MenuItem value="twitter">Twitter</MenuItem>
                    <MenuItem value="facebook">Facebook</MenuItem>
                    <MenuItem value="pinterest">Pinterest</MenuItem>
                    <MenuItem value="linkedin">LinkedIn</MenuItem>
                    <MenuItem value="website">Website</MenuItem>
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>
            
            {/* Price Range Filter */}
            <Accordion 
              disableGutters 
              elevation={0} 
              defaultExpanded
              sx={{ 
                '&:before': { display: 'none' },
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">Price Range ($/day)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={priceRange}
                    onChange={handlePriceRangeChange}
                    onChangeCommitted={() => loadInfluencers()}
                    valueLabelDisplay="auto"
                    min={0}
                    max={500}
                    step={10}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      ${priceRange[0]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${priceRange[1] === 500 ? '500+' : priceRange[1]}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
            
            {/* Verification Filter */}
            <Accordion 
              disableGutters 
              elevation={0} 
              defaultExpanded
              sx={{ 
                '&:before': { display: 'none' },
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">Verification</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="verification-status-label">Verification Level</InputLabel>
                  <Select
                    labelId="verification-status-label"
                    id="verification-status"
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value)}
                    label="Verification Level"
                  >
                    <MenuItem value="">Any Status</MenuItem>
                    <MenuItem value="verified">Fully Verified</MenuItem>
                    <MenuItem value="identity_verified">Identity Verified</MenuItem>
                    <MenuItem value="social_verified">Social Verified</MenuItem>
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>
            
            {/* Category Filter */}
            <Accordion 
              disableGutters 
              elevation={0} 
              defaultExpanded
              sx={{ 
                '&:before': { display: 'none' },
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">Categories</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {CATEGORIES.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      clickable
                      color={selectedCategories.includes(category) ? "primary" : "default"}
                      onClick={() => handleCategoryToggle(category)}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
            
            {/* Sort By Filter */}
            <Accordion 
              disableGutters 
              elevation={0} 
              defaultExpanded
              sx={{ 
                '&:before': { display: 'none' },
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">Sort By</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="sort-by-label">Sort Results</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort Results"
                  >
                    <MenuItem value="rating">Rating (High to Low)</MenuItem>
                    <MenuItem value="reviews">Review Count</MenuItem>
                    <MenuItem value="price_low">Price (Low to High)</MenuItem>
                    <MenuItem value="price_high">Price (High to Low)</MenuItem>
                    <MenuItem value="followers">Followers Count</MenuItem>
                    <MenuItem value="newest">Recently Joined</MenuItem>
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>
            
            {/* Apply Filters Button (Mobile Only) */}
            {isMobile && (
              <Box sx={{ p: 2 }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={loadInfluencers}
                >
                  Apply Filters
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Results Section */}
        <Grid item xs={12} md={9} lg={9}>
          {/* Results Controls */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 1 
            }}
          >
            <Typography variant="subtitle1">
              {loading ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : (
                `Showing ${Math.min(totalCount, (page - 1) * itemsPerPage + 1)} - ${Math.min(page * itemsPerPage, totalCount)} of ${totalCount} results`
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="page-size-label">Results per page</InputLabel>
                <Select
                  labelId="page-size-label"
                  id="page-size"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(e.target.value);
                    setPage(1);
                  }}
                  label="Results per page"
                >
                  <MenuItem value={12}>12</MenuItem>
                  <MenuItem value={24}>24</MenuItem>
                  <MenuItem value={48}>48</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          {/* Active Filters Display */}
          {(searchTerm || platform || selectedCategories.length > 0 || 
            verificationStatus || priceRange[0] > 0 || priceRange[1] < 500) && (
            <Box sx={{ mb: 2 }}>
              <Paper sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>Active Filters:</Typography>
                  
                  {searchTerm && (
                    <Chip 
                      label={`Search: ${searchTerm}`} 
                      onDelete={() => setSearchTerm('')}
                      size="small"
                    />
                  )}
                  
                  {platform && (
                    <PlatformChip 
                      platform={platform} 
                      onDelete={() => setPlatform('')}
                    />
                  )}
                  
                  {selectedCategories.map(category => (
                    <Chip 
                      key={category}
                      label={category} 
                      onDelete={() => handleCategoryToggle(category)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                  
                  {verificationStatus && (
                    <Chip 
                      label={`Verification: ${verificationStatus.replace('_', ' ')}`} 
                      onDelete={() => setVerificationStatus('')}
                      size="small"
                    />
                  )}
                  
                  {(priceRange[0] > 0 || priceRange[1] < 500) && (
                    <Chip 
                      label={`Price: $${priceRange[0]} - $${priceRange[1]}`} 
                      onDelete={() => setPriceRange([0, 500])}
                      size="small"
                    />
                  )}
                  
                  <Button 
                    size="small" 
                    variant="outlined" 
                    startIcon={<ClearIcon />} 
                    onClick={handleResetFilters}
                  >
                    Clear All
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
          
          {/* Error Message */}
          {error && !loading && (
            <ErrorMessage
              message="Failed to load influencers"
              error={error}
              showRetryButton
              onRetry={loadInfluencers}
              showHomeButton={false}
            />
          )}
          
          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Influencer Grid */}
          {!loading && !error && influencers.length > 0 && (
            <Grid container spacing={3}>
              {influencers.map((influencer) => (
                <Grid item key={influencer._id} xs={12} sm={6} md={6} lg={4}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={influencer.profile?.avatar}
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            mr: 2,
                            bgcolor: theme.palette.primary.main
                          }}
                        >
                          {influencer.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="h6" component="div" sx={{ mr: 1 }}>
                              {influencer.profile?.name || influencer.username}
                            </Typography>
                            <VerificationBadge 
                              isVerified={influencer.isVerified}
                              isIdentityVerified={influencer.isIdentityVerified}
                              verifiedSocialAccounts={influencer.verifiedSocialAccounts || 0}
                              totalSocialAccounts={influencer.socialAccounts?.length || 0}
                              size="small"
                              showDetails={false}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            @{influencer.username}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Bio */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '3em'
                        }}
                      >
                        {influencer.profile?.bio || 'No bio provided'}
                      </Typography>
                      
                      {/* Ratings */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Rating
                          value={influencer.rating || 0}
                          precision={0.5}
                          readOnly
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({influencer.reviewCount || 0})
                        </Typography>
                      </Box>
                      
                      {/* Social Platforms */}
                      <Typography variant="subtitle2" gutterBottom>
                        Platforms:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {influencer.socialAccounts?.slice(0, 4).map((account) => {
                          const platformKey = account.platform.toLowerCase();
                          const PlatformIcon = PLATFORM_ICONS[platformKey]?.icon || PLATFORM_ICONS.other.icon;
                          const iconColor = PLATFORM_ICONS[platformKey]?.color || PLATFORM_ICONS.other.color;
                          
                          return (
                            <Tooltip 
                              key={account._id} 
                              title={`${account.platform}${account.isVerified ? ' (Verified)' : ''}`}
                            >
                              <Chip
                                icon={<PlatformIcon style={{ color: iconColor }} />}
                                label={account.platform}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  borderColor: iconColor,
                                  '& .MuiChip-label': { color: iconColor }
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                        {influencer.socialAccounts && influencer.socialAccounts.length > 4 && (
                          <Chip
                            label={`+${influencer.socialAccounts.length - 4} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {(!influencer.socialAccounts || influencer.socialAccounts.length === 0) && (
                          <Typography variant="body2" color="text.secondary">
                            No platforms available
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Price Range */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Price Range:
                          </Typography>
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
                        
                        {/* Available indicator */}
                        {influencer.hasAvailableAccounts && (
                          <Chip 
                            label="Available" 
                            color="success" 
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ pt: 1, pb: 1 }}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/influencers/${influencer._id}`)}
                      >
                        View Profile
                      </Button>
                      {isAuthenticated && user?.userType === 'advertiser' && influencer.hasAvailableAccounts && (
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
          )}
          
          {/* Empty State */}
          {!loading && !error && influencers.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ p: 3, color: 'text.secondary' }}>
                <SearchIcon sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Influencers Found
                </Typography>
                <Typography variant="body1" paragraph>
                  We couldn't find any influencers matching your search criteria.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
              </Box>
            </Paper>
          )}
          
          {/* Pagination */}
          {!loading && !error && influencers.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default withApiHandler(InfluencerBrowsePage, {
  componentName: 'InfluencerBrowsePage'
});
