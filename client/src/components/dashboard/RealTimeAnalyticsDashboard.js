import React, { useState, useCallback, useMemo, memo, Suspense, useEffect, useRef } from 'react';
import { useDeepMemo } from '../../utils/memoHelper';
import localStorageService from '../../services/localStorageService';
import { useWebSocket } from '../../services/websocketService';
import { useAccessibility } from '../../utils/accessibilityContext';
import { useFocusTrap } from '../../utils/focusTrapUtils';
import { useLiveAnnouncement, POLITENESS, ANNOUNCEMENT_PRIORITY } from '../../utils/liveAnnouncementUtils';
import { EVENTS, TIME_PERIODS, CHART_TYPES } from '../../constants';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Card,
  CardContent,
  useTheme,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
  Badge,
  LinearProgress,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import KeyIcon from '@mui/icons-material/Key';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import NotificationsIcon from '@mui/icons-material/Notifications';

// Import Recharts components
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

// Import existing components from AnalyticsDashboard.js
import { CustomTooltip, RechartsChart, StatCard, DateRangeSelector, ExportButton, ChartCard } from './AnalyticsDashboard';

/**
 * Real-time analytics dashboard with WebSocket integration
 */
const RealTimeAnalyticsDashboard = ({ userType, initialData }) => {
  const theme = useTheme();
  const isInfluencer = userType === 'influencer';
  
  // State for real-time updates
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Dashboard data state - initialize with provided data or defaults
  const [dashboardData, setDashboardData] = useState(initialData || {
    totalAmount: '0',
    activeRentals: 0,
    avgDuration: 0,
    totalUsers: 0,
    earningsData: [],
    platformData: [],
    rentalDurationData: [],
    insights: [],
  });
  
  // Filter and date range state
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [timeFrame, setTimeFrame] = useState(TIME_PERIODS.MONTH);
  
  // Define the WebSocket event types to listen for
  const dashboardEventTypes = [
    EVENTS.DASHBOARD.ANALYTICS_UPDATE,
    EVENTS.DASHBOARD.EARNINGS_UPDATE,
    EVENTS.DASHBOARD.PERFORMANCE_UPDATE,
    EVENTS.DASHBOARD.REAL_TIME_STATS,
    EVENTS.DASHBOARD.PLATFORM_STATS,
  ];
  
  // Event handlers for WebSocket events
  const websocketHandlers = {
    [EVENTS.DASHBOARD.ANALYTICS_UPDATE]: (data) => {
      // Update dashboard stats
      setDashboardData((prevData) => ({
        ...prevData,
        ...data,
      }));
      
      // Track update
      registerUpdate('Analytics data updated');
    },
    
    [EVENTS.DASHBOARD.EARNINGS_UPDATE]: (data) => {
      // Update earnings chart data
      setDashboardData((prevData) => ({
        ...prevData,
        earningsData: data.earningsData || prevData.earningsData,
        totalAmount: data.totalAmount || prevData.totalAmount,
      }));
      
      // Track update
      registerUpdate('Earnings data updated');
    },
    
    [EVENTS.DASHBOARD.PERFORMANCE_UPDATE]: (data) => {
      // Update performance metrics
      setDashboardData((prevData) => ({
        ...prevData,
        insights: data.insights || prevData.insights,
      }));
      
      // Track update
      registerUpdate('Performance insights updated');
    },
    
    [EVENTS.DASHBOARD.REAL_TIME_STATS]: (data) => {
      // Update real-time statistics
      setDashboardData((prevData) => ({
        ...prevData,
        activeRentals: data.activeRentals !== undefined ? data.activeRentals : prevData.activeRentals,
        avgDuration: data.avgDuration !== undefined ? data.avgDuration : prevData.avgDuration,
        totalUsers: data.totalUsers !== undefined ? data.totalUsers : prevData.totalUsers,
      }));
      
      // Track update without notification
      setLastUpdate(new Date());
    },
    
    [EVENTS.DASHBOARD.PLATFORM_STATS]: (data) => {
      // Update platform-specific data
      setDashboardData((prevData) => ({
        ...prevData,
        platformData: data.platformData || prevData.platformData,
        rentalDurationData: data.rentalDurationData || prevData.rentalDurationData,
      }));
      
      // Track update
      registerUpdate('Platform statistics updated');
    },
  };
  
  // Initialize WebSocket connection
  const { 
    isConnected, 
    requestData,
    lastMessage
  } = useWebSocket(dashboardEventTypes, websocketHandlers);
  
  // Track WebSocket connection status changes
  useEffect(() => {
    if (isConnected) {
      setSnackbarMessage('Connected to real-time data feed');
      setSnackbarOpen(true);
      
      // Request initial data
      if (isRealTimeEnabled) {
        requestData('dashboard_data', { 
          userType,
          timeFrame,
          dateRange
        });
      }
    } else if (isConnected === false) { // explicitly check for false to avoid initial undefined state
      setSnackbarMessage('Disconnected from real-time data feed');
      setSnackbarOpen(true);
    }
  }, [isConnected, requestData, userType, timeFrame, dateRange, isRealTimeEnabled]);
  
  // Handle date range changes
  const handleDateRangeChange = useCallback((newRange) => {
    setDateRange(newRange);
    
    // Map the date range to a time frame
    let newTimeFrame;
    switch (newRange) {
      case 'Last 7 Days':
        newTimeFrame = TIME_PERIODS.WEEK;
        break;
      case 'Last 30 Days':
        newTimeFrame = TIME_PERIODS.MONTH;
        break;
      case 'Last Quarter':
        newTimeFrame = TIME_PERIODS.QUARTER;
        break;
      case 'Year to Date':
      case 'All Time':
        newTimeFrame = TIME_PERIODS.YEAR;
        break;
      default:
        newTimeFrame = TIME_PERIODS.MONTH;
    }
    
    setTimeFrame(newTimeFrame);
    
    // Request updated data from server
    if (isConnected && isRealTimeEnabled) {
      requestData('dashboard_data', { 
        userType,
        timeFrame: newTimeFrame,
        dateRange: newRange
      });
    }
  }, [isConnected, isRealTimeEnabled, requestData, userType]);
  
  // Toggle real-time updates
  const toggleRealTimeUpdates = useCallback(() => {
    setIsRealTimeEnabled((prev) => !prev);
    if (!isRealTimeEnabled && isConnected) {
      // Re-enable and refresh data
      requestData('dashboard_data', { 
        userType,
        timeFrame,
        dateRange
      });
    }
  }, [isRealTimeEnabled, isConnected, requestData, userType, timeFrame, dateRange]);
  
  // Register an update and show notification
  const registerUpdate = useCallback((message) => {
    const timestamp = new Date();
    
    // Add to recent updates
    setRecentUpdates((prev) => {
      const newUpdates = [
        {
          message,
          timestamp
        },
        ...prev
      ].slice(0, 5); // Keep only the 5 most recent updates
      
      return newUpdates;
    });
    
    // Increment notification counter
    setNotificationCount((prev) => prev + 1);
    
    // Update last update timestamp
    setLastUpdate(timestamp);
    
    // Show snackbar for important updates
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }, []);
  
  // Handle snackbar close
  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);
  
  // Handle dashboard refresh
  const handleRefresh = useCallback(() => {
    if (isConnected) {
      requestData('dashboard_data', { 
        userType,
        timeFrame,
        dateRange,
        forceRefresh: true
      });
      
      setSnackbarMessage('Refreshing dashboard data...');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage('Cannot refresh: disconnected from server');
      setSnackbarOpen(true);
    }
  }, [isConnected, requestData, userType, timeFrame, dateRange]);
  
  // Access accessibility context
  const { isScreenReaderEnabled } = useAccessibility();
  
  // Use live announcement system
  const { announce } = useLiveAnnouncement();
  
  // Handle notifications panel
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const notificationMenuRef = useRef(null);
  const notificationButtonRef = useRef(null);
  
  // Use focus trap for notification menu
  const focusTrap = useFocusTrap(notificationMenuRef, {
    enabled: Boolean(notificationAnchorEl),
    onEscape: () => setNotificationAnchorEl(null),
    autoFocus: true
  });
  
  // Initialize focus trap when notification menu opens, cleanup when it closes
  useEffect(() => {
    if (notificationAnchorEl) {
      // Initialize focus trap after the menu is rendered
      setTimeout(() => {
        focusTrap.initialize();
        
        // Announce to screen readers
        announce('Recent updates menu opened', {
          politeness: POLITENESS.POLITE,
          priority: ANNOUNCEMENT_PRIORITY.MEDIUM
        });
      }, 50);
    }
    
    return () => {
      focusTrap.cleanup();
    };
  }, [notificationAnchorEl, focusTrap, announce]);
  
  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
    // Reset notification count when opening the panel
    setNotificationCount(0);
  };
  
  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
    
    // Return focus to notification button
    if (notificationButtonRef.current) {
      setTimeout(() => {
        notificationButtonRef.current.focus();
      }, 50);
    }
    
    // Announce to screen readers
    announce('Recent updates menu closed', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.MEDIUM
    });
  };
  
  // Clear recent updates
  const clearRecentUpdates = useCallback(() => {
    setRecentUpdates([]);
    handleNotificationClose();
  }, []);
  
  // Get time since last update as string
  const getTimeSinceLastUpdate = useMemo(() => {
    const now = new Date();
    const diffMs = now - lastUpdate;
    
    if (diffMs < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diffMs < 3600000) { // Less than 1 hour
      const mins = Math.floor(diffMs / 60000);
      return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
  }, [lastUpdate]);
  
  return (
    <Box>
      {/* Header with controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Analytics Dashboard
            {isRealTimeEnabled && (
              <Chip 
                icon={<SyncIcon fontSize="small" />} 
                label="Real-Time" 
                color="primary" 
                size="small"
                sx={{ ml: 2, animation: isConnected ? 'pulse 2s infinite' : 'none' }}
              />
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isInfluencer
              ? 'Track your earnings, API key performance, and rental statistics.'
              : 'Monitor your spending, API key usage, and campaign performance.'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Real-time status indicator */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: isConnected ? 'success.light' : 'error.light',
            color: isConnected ? 'success.dark' : 'error.dark',
            px: 2,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.8rem',
          }}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: isConnected ? 'success.main' : 'error.main',
                mr: 1,
                animation: isConnected && isRealTimeEnabled ? 'pulse 2s infinite' : 'none',
              }} 
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </Box>
          
          {/* Toggle real-time updates */}
          <Tooltip title={isRealTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}>
            <IconButton 
              color={isRealTimeEnabled ? 'primary' : 'default'} 
              onClick={toggleRealTimeUpdates}
            >
              <SyncIcon />
            </IconButton>
          </Tooltip>
          
          {/* Last updated time */}
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
            Last updated: {getTimeSinceLastUpdate}
          </Typography>
          
          {/* Notifications */}
          <Tooltip title="Recent updates">
            <IconButton 
              onClick={handleNotificationClick}
              aria-label={`Recent updates ${notificationCount > 0 ? `- ${notificationCount} new` : ''}`}
              aria-haspopup="menu"
              aria-expanded={Boolean(notificationAnchorEl)}
              aria-controls={notificationAnchorEl ? 'notification-menu' : undefined}
              ref={notificationButtonRef}
            >
              <Badge badgeContent={notificationCount} color="primary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            id="notification-menu"
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            PaperProps={{
              sx: { 
                maxWidth: 320,
                // Improved focus outline
                '& *:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px'
                }
              },
              ref: notificationMenuRef
            }}
            MenuListProps={{
              'aria-label': 'Recent dashboard updates',
              role: 'menu'
            }}
          >
            <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">Recent Updates</Typography>
              <Button 
                size="small" 
                onClick={clearRecentUpdates}
                aria-label="Clear all recent updates"
              >
                Clear All
              </Button>
            </Box>
            <Divider />
            {recentUpdates.length === 0 ? (
              <MenuItem 
                disabled
                role="presentation"
              >
                <Typography variant="body2" color="text.secondary">
                  No recent updates
                </Typography>
              </MenuItem>
            ) : (
              recentUpdates.map((update, index) => (
                <MenuItem 
                key={index} 
                dense
                role="menuitem"
                aria-label={`${update.message} at ${new Date(update.timestamp).toLocaleTimeString()}`}
              >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2">{update.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>
          
          {/* Date range filter */}
          <DateRangeSelector onChange={handleDateRangeChange} />
          
          {/* Export button */}
          <ExportButton />
          
          {/* Refresh button */}
          <Tooltip title="Refresh all data">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Stats Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isInfluencer ? 'Total Earnings' : 'Total Spent'}
            value={`$${dashboardData?.totalAmount || '0'}`}
            icon={<MonetizationOnIcon />}
            change={dashboardData?.amountChange || '0%'}
            changeType={dashboardData?.amountChangeType || 'neutral'}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Rentals"
            value={dashboardData?.activeRentals || 0}
            icon={<KeyIcon />}
            change={dashboardData?.rentalsChange || '0%'}
            changeType={dashboardData?.rentalsChangeType || 'neutral'}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isInfluencer ? 'Avg. Rental Duration' : 'Avg. Usage Time'}
            value={`${dashboardData?.avgDuration || 0} days`}
            icon={<AccessTimeIcon />}
            change={dashboardData?.durationChange || '0%'}
            changeType={dashboardData?.durationChangeType || 'neutral'}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isInfluencer ? 'Total Advertisers' : 'Influencers Used'}
            value={dashboardData?.totalUsers || 0}
            icon={<PeopleIcon />}
            change={dashboardData?.usersChange || '0%'}
            changeType={dashboardData?.usersChangeType || 'neutral'}
            color="secondary"
          />
        </Grid>
      </Grid>
      
      {/* Real-time connection status indicator (only show when disconnected) */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Disconnected from real-time updates. Data may not be current.{' '}
            <Button 
              variant="text" 
              size="small" 
              onClick={handleRefresh}
              sx={{ textTransform: 'none' }}
            >
              Reconnect
            </Button>
          </Typography>
        </Alert>
      )}
      
      {/* Charts */}
      <Suspense fallback={
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Loading charts...
          </Typography>
          <LinearProgress sx={{ maxWidth: 400, mx: 'auto' }} />
        </Box>
      }>
        <Grid container spacing={3}>
          {/* Earnings/Spending Chart */}
          <Grid item xs={12} md={8}>
            <ChartCard
              title={isInfluencer ? 'Earnings Over Time' : 'Spending Over Time'}
              description={isInfluencer
                ? 'Track your monthly earnings from API key rentals.'
                : 'Monitor your monthly spending on API key rentals.'}
              chartType="line"
              data={dashboardData?.earningsData || []}
              height={300}
              onRefresh={() => requestData('earnings_data', { timeFrame, dateRange })}
            />
          </Grid>
          
          {/* Platform Distribution */}
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Platform Distribution"
              description={isInfluencer
                ? 'Breakdown of earnings by platform.'
                : 'Breakdown of spending by platform.'}
              chartType="pie"
              data={dashboardData?.platformData || []}
              height={300}
              onRefresh={() => requestData('platform_data', { })}
            />
          </Grid>
          
          {/* Rental Duration Analysis */}
          <Grid item xs={12}>
            <ChartCard
              title="Rental Duration Analysis"
              description={isInfluencer
                ? 'Distribution of rental durations chosen by advertisers.'
                : 'Distribution of rental durations you typically choose.'}
              chartType="bar"
              data={dashboardData?.rentalDurationData || []}
              height={250}
              onRefresh={() => requestData('rental_duration_data', { })}
            />
          </Grid>
        </Grid>
      </Suspense>
      
      {/* Performance Insights */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Performance Insights
          </Typography>
          <Tooltip title="Refresh insights">
            <IconButton 
              size="small"
              onClick={() => requestData('performance_insights', { })}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {/* Use insights from data or fallback to defaults */}
        {dashboardData?.insights && dashboardData.insights.length > 0 ? (
          <Grid container spacing={3}>
            {dashboardData.insights.map((insight, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      bgcolor: insight.type === 'positive' ? 'success.light' : 'error.light',
                      color: insight.type === 'positive' ? 'success.main' : 'error.main',
                      mr: 2,
                      display: 'flex',
                    }}
                  >
                    {insight.type === 'positive' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {insight.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {insight.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          // Default insights if none are provided
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    color: 'success.main',
                    mr: 2,
                    display: 'flex',
                  }}
                >
                  <TrendingUpIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {isInfluencer
                      ? 'Your Instagram API key is your top performer'
                      : 'Instagram API keys provide the best ROI'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isInfluencer
                      ? 'It generates 45% of your total earnings with the highest rental frequency.'
                      : 'They account for 45% of your successful campaigns with the highest engagement rates.'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: 'error.light',
                    color: 'error.main',
                    mr: 2,
                    display: 'flex',
                  }}
                >
                  <TrendingDownIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {isInfluencer
                      ? 'Your Twitter API key has the lowest demand'
                      : 'Twitter API keys show the lowest performance'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isInfluencer
                      ? 'Consider adjusting the pricing or highlighting unique features to attract more advertisers.'
                      : 'Consider focusing your budget on other platforms for better campaign results.'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: 'info.light',
                    color: 'info.main',
                    mr: 2,
                    display: 'flex',
                  }}
                >
                  <AccessTimeIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {isInfluencer
                      ? 'Weekly rentals are most popular among advertisers'
                      : 'Weekly rentals provide the best balance of cost and results'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isInfluencer
                      ? 'Consider optimizing your weekly pricing tier to maximize revenue.'
                      : 'Your campaigns using 7-day rentals show 30% better performance than shorter durations.'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default RealTimeAnalyticsDashboard;
