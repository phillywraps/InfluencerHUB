import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Grid,
  Chip,
  Rating,
  Skeleton,
  Stack,
  Divider,
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import VerificationBadge from '../verification/VerificationBadge';
import { getTrendingInfluencers } from '../../redux/slices/influencerSlice';
import withApiHandler from '../common/withApiHandler';
import ErrorMessage from '../common/ErrorMessage';

const TrendingInfluencers = ({ handleApiRequest }) => {
  const dispatch = useDispatch();
  const { trendingInfluencers, loadingTrending, errorTrending } = useSelector(
    (state) => state.influencer
  );

  useEffect(() => {
    loadTrendingInfluencers();
  }, []);

  const loadTrendingInfluencers = async () => {
    await handleApiRequest(
      () => dispatch(getTrendingInfluencers()).unwrap(),
      {
        operation: 'loadTrendingInfluencers',
        errorMessage: 'Failed to load trending influencers',
      }
    );
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(4)
      .fill(0)
      .map((_, index) => (
        <Grid item xs={12} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Skeleton variant="circular" width={50} height={50} />
                <Box sx={{ ml: 2 }}>
                  <Skeleton variant="text" width={120} height={24} />
                  <Skeleton variant="text" width={80} height={20} />
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Skeleton variant="text" width={100} height={24} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="80%" height={16} />
              </Box>
              <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
                <Skeleton variant="rounded" width={60} height={24} />
                <Skeleton variant="rounded" width={60} height={24} />
                <Skeleton variant="rounded" width={60} height={24} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ));
  };

  // Render error message
  if (errorTrending && !loadingTrending) {
    return (
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Trending This Week
        </Typography>
        <ErrorMessage
          message="Failed to load trending influencers"
          error={errorTrending}
          showRetryButton
          onRetry={loadTrendingInfluencers}
          showHomeButton={false}
        />
      </Box>
    );
  }

  // If we have no trends, don't show the section
  if (!loadingTrending && (!trendingInfluencers || trendingInfluencers.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WhatshotIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="h5">Trending This Week</Typography>
        </Box>
        
        <Button 
          component={RouterLink} 
          to="/influencers?sort=trending" 
          color="primary"
        >
          View All
        </Button>
      </Box>

      <Grid container spacing={2}>
        {loadingTrending
          ? renderSkeletons()
          : trendingInfluencers.slice(0, 4).map((influencer) => (
              <Grid item xs={12} key={influencer._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={influencer.profile?.avatar}
                        sx={{ width: 50, height: 50 }}
                      >
                        {influencer.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ ml: 2 }}>
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
                      <Box sx={{ flexGrow: 1 }} />
                      <Box>
                        <Chip 
                          icon={<WhatshotIcon />} 
                          label={`${influencer.weeklyGrowth || '+32'}% growth`} 
                          color="error" 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {influencer.profile?.bio
                        ? influencer.profile.bio.substring(0, 100) + (influencer.profile.bio.length > 100 ? '...' : '')
                        : 'No bio provided'}
                    </Typography>
                    
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      sx={{ mt: 2, flexWrap: 'wrap', gap: 0.5 }}
                    >
                      {influencer.socialAccounts &&
                        influencer.socialAccounts.slice(0, 3).map((account) => (
                          <Chip
                            key={account._id}
                            label={account.platform}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      
                      <Box sx={{ flexGrow: 1 }} />
                      
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/influencers/${influencer._id}`}
                        variant="outlined"
                      >
                        View Profile
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>
    </Box>
  );
};

export default withApiHandler(TrendingInfluencers, {
  componentName: 'TrendingInfluencers'
});
