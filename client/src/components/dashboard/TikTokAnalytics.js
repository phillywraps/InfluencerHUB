import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Group as GroupIcon,
  ThumbUp as ThumbUpIcon,
  Visibility as VisibilityIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  VideoCameraBack as VideoCameraBackIcon
} from '@mui/icons-material';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import tiktokService from '../../services/tiktokService';
import { setAlert } from '../../redux/slices/alertSlice';
import { useDispatch } from 'react-redux';
import withApiHandler from '../common/withApiHandler';
import moment from 'moment';

/**
 * TikTokAnalytics component
 * 
 * Displays comprehensive analytics and insights for the connected TikTok account
 * including audience demographics, content performance, and growth trends
 */
const TikTokAnalytics = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState(0);
  const [overviewData, setOverviewData] = useState(null);
  const [audienceData, setAudienceData] = useState(null);
  const [contentData, setContentData] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [growthMetric, setGrowthMetric] = useState('followers');
  
  // Load data on component mount
  useEffect(() => {
    checkConnectionAndLoadData();
  }, []);
  
  // Reload data when time range changes
  useEffect(() => {
    if (isConnected) {
      loadAnalyticsData();
    }
  }, [timeRange]);
  
  // Load growth data when metric changes
  useEffect(() => {
    if (isConnected) {
      loadGrowthData();
    }
  }, [growthMetric, timeRange]);
  
  // Check if TikTok account is connected and load initial data
  const checkConnectionAndLoadData = async () => {
    try {
      setIsLoading(true);
      const connected = await tiktokService.isAccountConnected();
      setIsConnected(connected);
      
      if (connected) {
        await loadAnalyticsData();
      }
    } catch (error) {
      console.error('Error checking TikTok connection:', error);
      setIsConnected(false);
      dispatch(setAlert({
        message: 'Error loading TikTok analytics',
        severity: 'error'
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load all analytics data
  const loadAnalyticsData = async () => {
    try {
      setIsRefreshing(true);
      
      // Load data in parallel
      const [overview, audience, content] = await Promise.all([
        tiktokService.getAnalyticsOverview(timeRange),
        tiktokService.getAudienceDemographics(),
        tiktokService.getContentPerformance(timeRange)
      ]);
      
      setOverviewData(overview);
      setAudienceData(audience);
      setContentData(content);
      
      // Load growth data separately
      await loadGrowthData();
    } catch (error) {
      console.error('Error loading TikTok analytics data:', error);
      dispatch(setAlert({
        message: 'Error loading analytics data',
        severity: 'error'
      }));
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Load growth data for selected metric
  const loadGrowthData = async () => {
    try {
      const data = await tiktokService.getGrowthMetrics(timeRange, growthMetric);
      setGrowthData(data);
    } catch (error) {
      console.error('Error loading TikTok growth data:', error);
      dispatch(setAlert({
        message: 'Error loading growth trend data',
        severity: 'error'
      }));
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  // Handle growth metric change
  const handleGrowthMetricChange = (event) => {
    setGrowthMetric(event.target.value);
  };
  
  // Format large numbers with K/M suffix
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Get colors for metrics based on time range
  const getMetricColors = () => {
    if (timeRange === 'week') {
      return {
        views: theme.palette.primary.main,
        likes: theme.palette.secondary.main,
        comments: theme.palette.success.main,
        shares: theme.palette.warning.main
      };
    }
    
    if (timeRange === 'month') {
      return {
        views: theme.palette.info.main,
        likes: theme.palette.error.main,
        comments: theme.palette.success.dark,
        shares: theme.palette.warning.dark
      };
    }
    
    return {
      views: theme.palette.primary.dark,
      likes: theme.palette.secondary.dark,
      comments: theme.palette.success.light,
      shares: theme.palette.warning.light
    };
  };
  
  // Prepare line chart data from growth data
  const prepareGrowthChartData = () => {
    if (!growthData || !growthData.timeSeriesData) {
      return [];
    }
    
    const metricLabel = 
      growthMetric === 'followers' ? 'Followers' :
      growthMetric === 'views' ? 'Video Views' :
      growthMetric === 'engagement' ? 'Engagement' : 'Growth';
    
    return [
      {
        id: metricLabel,
        color: theme.palette.primary.main,
        data: growthData.timeSeriesData.map(point => ({
          x: point.date,
          y: point.value
        }))
      }
    ];
  };
  
  // Prepare pie chart data for audience demographics
  const prepareAudienceChartData = (demographicType) => {
    if (!audienceData) {
      return [];
    }
    
    let data = [];
    
    if (demographicType === 'age') {
      data = Object.entries(audienceData.ageDistribution || {}).map(([key, value]) => ({
        id: key,
        label: key,
        value: value
      }));
    } else if (demographicType === 'gender') {
      data = Object.entries(audienceData.genderDistribution || {}).map(([key, value]) => ({
        id: key === 'male' ? 'Male' : key === 'female' ? 'Female' : 'Other',
        label: key === 'male' ? 'Male' : key === 'female' ? 'Female' : 'Other',
        value: value
      }));
    } else if (demographicType === 'location') {
      // Take top 5 locations
      const topLocations = Object.entries(audienceData.locationDistribution || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      data = topLocations.map(([key, value]) => ({
        id: key,
        label: key,
        value: value
      }));
      
      // Add "Other" category for the rest
      const otherValue = 100 - topLocations.reduce((sum, [_, value]) => sum + value, 0);
      if (otherValue > 0) {
        data.push({
          id: 'Other',
          label: 'Other',
          value: otherValue
        });
      }
    }
    
    return data;
  };
  
  // Prepare bar chart data for content performance
  const prepareContentPerformanceData = () => {
    if (!contentData || !contentData.videos) {
      return [];
    }
    
    // Take top 5 videos
    return contentData.videos.slice(0, 5).map(video => ({
      video: video.title || `Video ${video.id.substring(0, 6)}...`,
      views: video.viewCount,
      likes: video.likeCount,
      comments: video.commentCount,
      shares: video.shareCount
    }));
  };
  
  // Render overview metrics
  const renderOverviewMetrics = () => {
    if (!overviewData) {
      return (
        <Typography variant="body2" color="textSecondary">
          No overview data available
        </Typography>
      );
    }
    
    const {
      followers,
      videosPosted,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      averageViewDuration,
      averageCompletionRate,
      followerGrowth,
      viewsGrowth,
      engagementRate,
      viewsPerVideo
    } = overviewData;
    
    return (
      <Grid container spacing={3}>
        {/* Followers Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <GroupIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                Followers
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {formatNumber(followers)}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 'auto',
                color: followerGrowth >= 0 ? 'success.main' : 'error.main',
              }}
            >
              {followerGrowth >= 0 ? '+' : ''}
              {followerGrowth}%
              <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                since last {timeRange}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Views Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <VisibilityIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                Total Views
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {formatNumber(totalViews)}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 'auto',
                color: viewsGrowth >= 0 ? 'success.main' : 'error.main',
              }}
            >
              {viewsGrowth >= 0 ? '+' : ''}
              {viewsGrowth}%
              <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                since last {timeRange}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Engagement Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ThumbUpIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                Engagement Rate
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {engagementRate}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              <Typography variant="caption" color="textSecondary">
                {formatNumber(totalLikes)} likes · {formatNumber(totalComments)} comments · {formatNumber(totalShares)} shares
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Video Performance */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <VideoCameraBackIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                Video Performance
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {formatNumber(viewsPerVideo)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              <Typography variant="caption" color="textSecondary">
                Avg. views per video · {videosPosted} videos posted
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Video Completion */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="textSecondary">
                  Video Completion Rate
                </Typography>
              </Box>
              <Typography variant="h6">
                {averageCompletionRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={averageCompletionRate}
              sx={{ height: 10, borderRadius: 1, my: 1 }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              Average view duration: {averageViewDuration} seconds
            </Typography>
          </Paper>
        </Grid>
        
        {/* Top Countries */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InfoIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                Video Performance Insights
              </Typography>
            </Box>
            <Box sx={{ mt: 1, flex: 1 }}>
              {overviewData.performanceInsights && overviewData.performanceInsights.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {overviewData.performanceInsights.slice(0, 3).map((insight, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        {insight}
                      </Typography>
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No insights available for this time period
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  // Render audience demographics
  const renderAudienceDemographics = () => {
    if (!audienceData) {
      return (
        <Typography variant="body2" color="textSecondary">
          No audience data available
        </Typography>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {/* Age Distribution */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Age Distribution
            </Typography>
            <Box sx={{ height: 240 }}>
              <ResponsivePie
                data={prepareAudienceChartData('age')}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={theme.palette.getContrastText(theme.palette.background.paper)}
                theme={{
                  textColor: theme.palette.text.primary,
                  tooltip: {
                    container: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Gender Distribution */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Gender Distribution
            </Typography>
            <Box sx={{ height: 240 }}>
              <ResponsivePie
                data={prepareAudienceChartData('gender')}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={theme.palette.getContrastText(theme.palette.background.paper)}
                colors={[theme.palette.primary.main, theme.palette.secondary.main, theme.palette.info.main]}
                theme={{
                  textColor: theme.palette.text.primary,
                  tooltip: {
                    container: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Location Distribution */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Top Locations
            </Typography>
            <Box sx={{ height: 240 }}>
              <ResponsivePie
                data={prepareAudienceChartData('location')}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={theme.palette.getContrastText(theme.palette.background.paper)}
                theme={{
                  textColor: theme.palette.text.primary,
                  tooltip: {
                    container: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Audience Interests */}
        <Grid item xs={12}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Audience Interests
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {audienceData.interests && Object.entries(audienceData.interests).map(([interest, percentage]) => (
                <Grid item key={interest}>
                  <Chip
                    label={`${interest} (${percentage}%)`}
                    color="primary"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  // Render content performance data
  const renderContentPerformance = () => {
    if (!contentData || !contentData.videos || contentData.videos.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary">
          No content performance data available
        </Typography>
      );
    }
    
    const barData = prepareContentPerformanceData();
    const metricColors = getMetricColors();
    
    return (
      <Grid container spacing={3}>
        {/* Top Performing Videos */}
        <Grid item xs={12}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Top Performing Videos
            </Typography>
            <Box sx={{ height: 330 }}>
              <ResponsiveBar
                data={barData}
                keys={['views', 'likes', 'comments', 'shares']}
                indexBy="video"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                groupMode="grouped"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={({ id }) => metricColors[id]}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Videos',
                  legendPosition: 'middle',
                  legendOffset: 40,
                  truncateTickAt: 0
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Metrics',
                  legendPosition: 'middle',
                  legendOffset: -50,
                  truncateTickAt: 0
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
                role="application"
                ariaLabel="TikTok video performance chart"
                theme={{
                  textColor: theme.palette.text.primary,
                  tooltip: {
                    container: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                  },
                  axis: {
                    ticks: {
                      line: {
                        stroke: theme.palette.text.secondary
                      },
                      text: {
                        fill: theme.palette.text.secondary
                      }
                    },
                    legend: {
                      text: {
                        fill: theme.palette.text.primary
                      }
                    }
                  },
                  grid: {
                    line: {
                      stroke: theme.palette.divider
                    }
                  },
                  legends: {
                    text: {
                      fill: theme.palette.text.primary
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  // Render growth trends
  const renderGrowthTrends = () => {
    if (!growthData) {
      return (
        <Typography variant="body2" color="textSecondary">
          No growth trend data available
        </Typography>
      );
    }
    
    const lineData = prepareGrowthChartData();
    const metricName = 
      growthMetric === 'followers' ? 'Followers' :
      growthMetric === 'views' ? 'Views' :
      growthMetric === 'engagement' ? 'Engagement' : 'Metric';
    
    const { growthRate, startValue, endValue } = growthData;
    
    return (
      <Grid container spacing={3}>
        {/* Growth Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TimelineIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                {metricName} Growth
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 'auto',
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="caption">
                Over last {timeRange}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Start Value */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InfoIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                Starting {metricName}
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {formatNumber(startValue)}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 'auto',
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="caption">
                At beginning of period
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* End Value */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InfoIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                Current {metricName}
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {formatNumber(endValue)}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 'auto',
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="caption">
                At end of period
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Net Change */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TimelineIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="textSecondary">
                Net Change
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                mt: 1,
                color: endValue - startValue >= 0 ? 'success.main' : 'error.main'
              }}
            >
              {endValue - startValue >= 0 ? '+' : ''}{formatNumber(endValue - startValue)}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 'auto',
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="caption">
                Absolute change in {timeRange}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Growth Chart */}
        <Grid item xs={12}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {metricName} Growth Trend
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                  <Select
                    value={growthMetric}
                    onChange={handleGrowthMetricChange}
                    displayEmpty
                  >
                    <MenuItem value="followers">Followers</MenuItem>
                    <MenuItem value="views">Views</MenuItem>
                    <MenuItem value="engagement">Engagement</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <Box sx={{ height: 320 }}>
              <ResponsiveLine
                data={lineData}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                  stacked: false,
                  reverse: false
                }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legendOffset: 36,
                  legendPosition: 'middle',
                  truncateTickAt: 0
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: metricName,
                  legendOffset: -50,
                  legendPosition: 'middle',
                  truncateTickAt: 0
                }}
                colors={{ scheme: 'category10' }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 0,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
                theme={{
                  textColor: theme.palette.text.primary,
                  tooltip: {
                    container: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                  },
                  axis: {
                    ticks: {
                      line: {
                        stroke: theme.palette.text.secondary
                      },
                      text: {
                        fill: theme.palette.text.secondary
                      }
                    },
                    legend: {
                      text: {
                        fill: theme.palette.text.primary
                      }
                    }
                  },
                  grid: {
                    line: {
                      stroke: theme.palette.divider
                    }
                  },
                  legends: {
                    text: {
                      fill: theme.palette.text.primary
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VideoCameraBackIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">TikTok Analytics</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
              <Select
                value={timeRange}
                onChange={handleTimeRangeChange}
                displayEmpty
              >
                <MenuItem value="week">Last 7 days</MenuItem>
                <MenuItem value="month">Last 30 days</MenuItem>
                <MenuItem value="year">Last 12 months</MenuItem>
              </Select>
            </FormControl>
            
            <IconButton 
              onClick={loadAnalyticsData} 
              disabled={!isConnected || isRefreshing}
              size="small"
            >
              {isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Box>
        }
      />
      
      <Divider />
      
      <CardContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading TikTok analytics...
            </Typography>
          </Box>
        ) : !isConnected ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <WarningIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              TikTok Account Not Connected
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              To view analytics, you need to connect your TikTok account first.
            </Typography>
            <Button 
              variant="contained" 
              component="a" 
              href="/profile"
              startIcon={<LinkIcon />}
            >
              Connect Account
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
              sx={{ mb: 2 }}
            >
              <Tab label="Overview" />
              <Tab label="Audience" />
              <Tab label="Content" />
              <Tab label="Growth" />
            </Tabs>
            
            <Box sx={{ p: 2 }}>
              {activeTab === 0 && renderOverviewMetrics()}
              {activeTab === 1 && renderAudienceDemographics()}
              {activeTab === 2 && renderContentPerformance()}
              {activeTab === 3 && renderGrowthTrends()}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default withApiHandler(TikTokAnalytics);
