import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  useTheme,
  Skeleton,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PeopleIcon from '@mui/icons-material/People';
import KeyIcon from '@mui/icons-material/Key';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import withApiHandler from '../common/withApiHandler';
import { getInfluencerStatistics } from '../../redux/slices/influencerSlice';

// Styled components
const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  height: '100%',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
}));

const IconBox = styled(Box)(({ theme, color }) => ({
  backgroundColor: color,
  color: 'white',
  borderRadius: '50%',
  width: 56,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
}));

const MarketplaceStats = ({ handleApiRequest }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { statistics, loadingStatistics } = useSelector((state) => state.influencer);

  React.useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    await handleApiRequest(
      () => dispatch(getInfluencerStatistics()).unwrap(),
      {
        operation: 'loadStats',
        errorMessage: 'Failed to load marketplace statistics'
      }
    );
  };

  // Get stat values or use defaults if not available
  const getStatValue = (key, defaultValue) => {
    if (statistics && statistics[key] !== undefined) {
      return statistics[key];
    }
    return defaultValue;
  };

  // Stats to display
  const stats = [
    {
      title: 'Active Influencers',
      value: getStatValue('totalInfluencers', 1350),
      icon: PeopleIcon,
      color: theme.palette.primary.main,
      description: 'Verified content creators on our platform',
    },
    {
      title: 'API Keys Available',
      value: getStatValue('totalApiKeys', 3720),
      icon: KeyIcon,
      color: theme.palette.secondary.main,
      description: 'Across multiple social media platforms',
    },
    {
      title: 'Active Rentals',
      value: getStatValue('activeRentals', 842),
      icon: StorefrontIcon,
      color: theme.palette.success.main,
      description: 'Keys currently being utilized',
    },
    {
      title: 'Average Daily Views',
      value: getStatValue('averageDailyViews', '5.2M'),
      icon: WhatshotIcon,
      color: theme.palette.error.main,
      description: 'Potential audience across all platforms',
    },
  ];

  // Format numbers with commas
  const formatNumber = (num) => {
    if (typeof num === 'string') return num;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return stats.map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <StatCard>
          <Skeleton variant="circular" width={56} height={56} />
          <Skeleton variant="text" width={120} height={28} sx={{ mt: 2 }} />
          <Skeleton variant="text" width={80} height={40} sx={{ mt: 1 }} />
          <Skeleton variant="text" width={150} height={20} sx={{ mt: 1 }} />
        </StatCard>
      </Grid>
    ));
  };

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Marketplace Highlights
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Key statistics from our influencer API marketplace
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {loadingStatistics
          ? renderSkeletons()
          : stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StatCard>
                  <IconBox color={stat.color}>
                    <stat.icon fontSize="large" />
                  </IconBox>
                  <Typography variant="h6" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" color="text.primary" fontWeight="bold" gutterBottom>
                    {formatNumber(stat.value)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.description}
                  </Typography>
                </StatCard>
              </Grid>
            ))}
      </Grid>
      
      <Divider sx={{ my: 4 }} />
    </Box>
  );
};

export default withApiHandler(MarketplaceStats, {
  componentName: 'MarketplaceStats'
});
