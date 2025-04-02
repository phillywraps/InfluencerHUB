import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  Chip,
  Grid,
  useTheme,
  IconButton,
  Rating,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VerifiedIcon from '@mui/icons-material/Verified';
import { getFeaturedInfluencers } from '../../redux/slices/influencerSlice';
import withApiHandler from '../common/withApiHandler';
import ErrorMessage from '../common/ErrorMessage';
import VerificationBadge from '../verification/VerificationBadge';

const CarouselContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2, 1),
  overflow: 'hidden',
}));

const CarouselTrack = styled(Box)(({ theme }) => ({
  display: 'flex',
  transition: 'transform 0.5s ease-in-out',
}));

const CarouselButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.grey[200],
  },
  boxShadow: theme.shadows[3],
}));

const FeaturedInfluencers = ({ handleApiRequest }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  const { featuredInfluencers, loadingFeatured, errorFeatured } = useSelector(
    (state) => state.influencer
  );

  // Calculate items per view based on screen size
  const getItemsPerView = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };
  
  const itemsPerView = getItemsPerView();
  const maxIndex = Math.max(0, featuredInfluencers.length - itemsPerView);

  useEffect(() => {
    loadFeaturedInfluencers();
  }, []);

  const loadFeaturedInfluencers = async () => {
    await handleApiRequest(
      () => {
        const dispatch = useDispatch();
        return dispatch(getFeaturedInfluencers()).unwrap();
      },
      {
        operation: 'loadFeaturedInfluencers',
        errorMessage: 'Failed to load featured influencers'
      }
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Render loading skeleton
  const renderSkeletons = () => {
    return Array(itemsPerView)
      .fill(0)
      .map((_, index) => (
        <Box key={index} sx={{ width: `${100 / itemsPerView}%`, px: 1 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <Skeleton variant="circular" width={60} height={60} />
                <Box sx={{ ml: 2 }}>
                  <Skeleton variant="text" width={120} height={24} />
                  <Skeleton variant="text" width={80} height={20} />
                </Box>
              </Box>
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" width={120} height={24} />
                <Box sx={{ display: 'flex', mt: 1, gap: 0.5 }}>
                  <Skeleton variant="rounded" width={60} height={24} />
                  <Skeleton variant="rounded" width={60} height={24} />
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Skeleton variant="rectangular" width={100} height={36} />
            </CardActions>
          </Card>
        </Box>
      ));
  };

  // Render error message
  if (errorFeatured && !loadingFeatured) {
    return (
      <Box sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Featured Influencers
        </Typography>
        <ErrorMessage
          message="Failed to load featured influencers"
          error={errorFeatured}
          showRetryButton
          onRetry={loadFeaturedInfluencers}
          showHomeButton={false}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Featured Influencers</Typography>
        <Button
          component={RouterLink}
          to="/influencers"
          color="primary"
        >
          View All
        </Button>
      </Box>

      <CarouselContainer>
        {/* Previous button */}
        <CarouselButton
          onClick={handlePrev}
          disabled={currentIndex === 0 || loadingFeatured}
          sx={{ left: theme.spacing(1) }}
        >
          <ChevronLeftIcon />
        </CarouselButton>

        {/* Carousel content */}
        <CarouselTrack
          sx={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            minHeight: 320 // Ensure consistent height
          }}
        >
          {loadingFeatured
            ? renderSkeletons()
            : featuredInfluencers.map((influencer) => (
                <Box
                  key={influencer._id}
                  sx={{ width: `${100 / itemsPerView}%`, px: 1, height: '100%' }}
                >
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={influencer.profile?.avatar}
                          sx={{ width: 60, height: 60, mr: 2 }}
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
                              showDetails={false}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            @{influencer.username}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {influencer.profile?.bio
                          ? (influencer.profile.bio.length > 120
                              ? `${influencer.profile.bio.substring(0, 120)}...`
                              : influencer.profile.bio)
                          : 'No bio provided'}
                      </Typography>
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating
                            value={influencer.rating || 0}
                            precision={0.5}
                            readOnly
                            size="small"
                          />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({influencer.reviewCount || 0})
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {influencer.socialAccounts && 
                          influencer.socialAccounts
                            .slice(0, 3)
                            .map((account) => (
                              <Chip
                                key={account._id}
                                label={account.platform}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                        {influencer.socialAccounts && 
                          influencer.socialAccounts.length > 3 && (
                            <Chip
                              label={`+${influencer.socialAccounts.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/influencers/${influencer._id}`}
                      >
                        View Profile
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              ))}
        </CarouselTrack>

        {/* Next button */}
        <CarouselButton
          onClick={handleNext}
          disabled={currentIndex >= maxIndex || loadingFeatured}
          sx={{ right: theme.spacing(1) }}
        >
          <ChevronRightIcon />
        </CarouselButton>
      </CarouselContainer>
    </Box>
  );
};

export default withApiHandler(FeaturedInfluencers, {
  componentName: 'FeaturedInfluencers'
});
