import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Grid,
  useTheme,
  Avatar,
  Skeleton,
  Badge,
} from '@mui/material';
import { getInfluencerStatistics } from '../../redux/slices/influencerSlice';
import withApiHandler from '../common/withApiHandler';

// Platform icons
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import PinterestIcon from '@mui/icons-material/Pinterest';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PublicIcon from '@mui/icons-material/Public';
import TikTokIcon from '@mui/icons-material/MusicNote'; // Using MusicNote as TikTok substitute
import LanguageIcon from '@mui/icons-material/Language';

const PLATFORM_ICONS = {
  instagram: { icon: InstagramIcon, color: '#E1306C', name: 'Instagram' },
  youtube: { icon: YouTubeIcon, color: '#FF0000', name: 'YouTube' },
  tiktok: { icon: TikTokIcon, color: '#000000', name: 'TikTok' },
  twitter: { icon: TwitterIcon, color: '#1DA1F2', name: 'Twitter' },
  facebook: { icon: FacebookIcon, color: '#4267B2', name: 'Facebook' },
  pinterest: { icon: PinterestIcon, color: '#E60023', name: 'Pinterest' },
  linkedin: { icon: LinkedInIcon, color: '#0077B5', name: 'LinkedIn' },
  website: { icon: LanguageIcon, color: '#2E7D32', name: 'Website' },
  other: { icon: PublicIcon, color: '#757575', name: 'Other' },
};

// Default platforms to display
const DEFAULT_PLATFORMS = [
  'instagram',
  'youtube',
  'tiktok',
  'twitter',
  'facebook',
  'pinterest',
  'linkedin',
  'website',
];

const PlatformCategories = ({ handleApiRequest }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { statistics, loadingStatistics, errorStatistics } = useSelector(
    (state) => state.influencer
  );
  
  React.useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    await handleApiRequest(
      () => dispatch(getInfluencerStatistics()).unwrap(),
      {
        operation: 'loadStatistics',
        errorMessage: 'Failed to load platform statistics'
      }
    );
  };

  // Get platform counts or estimate if no statistics are available
  const getPlatformCount = (platform) => {
    if (statistics && statistics.platformCounts && statistics.platformCounts[platform]) {
      return statistics.platformCounts[platform];
    }
    
    // Fallback to default values
    const defaultCounts = {
      instagram: 380,
      youtube: 210,
      tiktok: 290,
      twitter: 140,
      facebook: 120,
      pinterest: 90,
      linkedin: 80,
      website: 60,
      other: 40,
    };
    
    return defaultCounts[platform] || 0;
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return DEFAULT_PLATFORMS.map((_, index) => (
      <Grid item key={index} xs={6} sm={4} md={3}>
        <Card elevation={1}>
          <CardActionArea>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Skeleton variant="circular" width={60} height={60} />
              <Skeleton variant="text" width={100} height={24} sx={{ mt: 2 }} />
              <Skeleton variant="text" width={80} height={20} sx={{ mt: 1 }} />
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    ));
  };

  return (
    <Box sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Browse by Platform
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Find influencers based on their social media platforms
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {loadingStatistics
          ? renderSkeletons()
          : DEFAULT_PLATFORMS.map((platform) => {
              const platformInfo = PLATFORM_ICONS[platform] || PLATFORM_ICONS.other;
              const IconComponent = platformInfo.icon;
              const count = getPlatformCount(platform);
              
              return (
                <Grid item key={platform} xs={6} sm={4} md={3}>
                  <Card elevation={1}>
                    <CardActionArea
                      component={RouterLink}
                      to={`/influencers?platform=${platform}`}
                    >
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                        <Avatar
                          sx={{
                            width: 60,
                            height: 60,
                            bgcolor: platformInfo.color,
                            color: 'white',
                          }}
                        >
                          <IconComponent />
                        </Avatar>
                        <Typography variant="h6" sx={{ mt: 2 }}>
                          {platformInfo.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {count} {count === 1 ? 'Influencer' : 'Influencers'}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
      </Grid>
    </Box>
  );
};

export default withApiHandler(PlatformCategories, {
  componentName: 'PlatformCategories'
});
