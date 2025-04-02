import React, { useState, useCallback, useMemo, memo, Suspense } from 'react';
import { useDeepMemo } from '../../utils/memoHelper';
import localStorageService, { KEYS } from '../../services/localStorageService';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

// Custom Recharts tooltip component - memoized
const CustomTooltip = memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: 1.5, 
        border: 1, 
        borderColor: 'divider',
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'medium' }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="body2" color={entry.color} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="span"
              sx={{
                width: 10,
                height: 10,
                bgcolor: entry.color,
                borderRadius: '50%',
                display: 'inline-block',
                mr: 1,
              }}
            />
            {`${entry.name || 'Value'}: ${entry.value}`}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
});

// Chart component using Recharts - memoized
const RechartsChart = memo(({ type, data, height = 300 }) => {
  const theme = useTheme();
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
  ];

  // Memoize formatted data to prevent unnecessary recalculations
  const formattedData = useDeepMemo(() => data.map(item => ({
    name: item.label,
    value: item.value,
    color: item.color ? theme.palette[item.color].main : undefined
  })), [data, theme]);
  
  if (type === 'line') {
    return (
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="name"
              tick={{ fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <YAxis 
              tick={{ fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Line
              type="monotone"
              dataKey="value"
              name="Amount"
              stroke={theme.palette.primary.main}
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  if (type === 'bar') {
    return (
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="name"
              tick={{ fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <YAxis 
              tick={{ fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="value" name="Count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  if (type === 'pie') {
    return (
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {formattedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend formatter={(value, entry) => {
              return <span style={{ color: theme.palette.text.primary }}>{value}</span>;
            }} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  return null;
});

// Stat card component with enhanced UI
const StatCard = memo(({ title, value, icon, change, changeType, color = 'primary' }) => {
  const theme = useTheme();
  const isPositive = changeType === 'positive';
  
  return (
    <Card 
      variant="outlined" 
      sx={{
        borderRadius: 2,
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-5px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        {change && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {isPositive ? (
              <KeyboardArrowUpIcon sx={{ color: 'success.main', fontSize: '1.2rem' }} />
            ) : (
              <KeyboardArrowDownIcon sx={{ color: 'error.main', fontSize: '1.2rem' }} />
            )}
            <Typography
              variant="body2"
              component="span"
              sx={{ color: isPositive ? 'success.main' : 'error.main' }}
            >
              {change}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// Date range selector component
const DateRangeSelector = memo(({ onChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRange, setSelectedRange] = useState('Last 30 Days');
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleRangeSelect = useCallback((range) => {
    setSelectedRange(range);
    setAnchorEl(null);
    if (onChange) onChange(range);
    
    // Store the selected range in localStorage
    localStorageService.preference('analytics_date_range', range);
  }, [onChange]);
  
  // Initialize from localStorage on mount
  React.useEffect(() => {
    const savedRange = localStorageService.preference('analytics_date_range');
    if (savedRange) {
      setSelectedRange(savedRange);
      if (onChange) onChange(savedRange);
    }
  }, [onChange]);
  
  return (
    <>
      <Button 
        variant="outlined" 
        startIcon={<DateRangeIcon />}
        onClick={handleClick}
        size="small"
      >
        {selectedRange}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleRangeSelect('Last 7 Days')}>Last 7 Days</MenuItem>
        <MenuItem onClick={() => handleRangeSelect('Last 30 Days')}>Last 30 Days</MenuItem>
        <MenuItem onClick={() => handleRangeSelect('Last Quarter')}>Last Quarter</MenuItem>
        <MenuItem onClick={() => handleRangeSelect('Year to Date')}>Year to Date</MenuItem>
        <MenuItem onClick={() => handleRangeSelect('All Time')}>All Time</MenuItem>
      </Menu>
    </>
  );
});

// Export button with menu
const ExportButton = memo(() => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleExport = (format) => {
    setAnchorEl(null);
    // In a real app, this would trigger an actual export
    alert(`Exporting data as ${format}`);
  };
  
  return (
    <>
      <Button 
        variant="outlined" 
        startIcon={<FileDownloadIcon />}
        onClick={handleClick}
        size="small"
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleExport('PDF')}>Export as PDF</MenuItem>
        <MenuItem onClick={() => handleExport('CSV')}>Export as CSV</MenuItem>
        <MenuItem onClick={() => handleExport('Excel')}>Export as Excel</MenuItem>
      </Menu>
    </>
  );
});

// Chart card with controls
const ChartCard = memo(({ title, description, chartType, data, height = 300, onRefresh }) => {
  // Use deep comparison for data to prevent unnecessary re-renders
  const memoizedData = useDeepMemo(() => data, [data]);
  
  const handleRefresh = useCallback(() => {
    // Call the parent's refresh handler if provided
    if (onRefresh) {
      onRefresh(chartType);
    } else {
      // In a real app, this would fetch fresh data
      alert('Refreshing data...');
    }
  }, [onRefresh, chartType]);
  
  // Memoize the entire chart to prevent expensive re-renders
  const chart = useMemo(() => (
    <RechartsChart type={chartType} data={memoizedData} height={height} />
  ), [chartType, memoizedData, height]);
  
  return (
    <Paper 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column' 
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <DateRangeSelector />
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="More options">
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      {chart}
    </Paper>
  );
});

// Performance decorator to track render times
const withPerformanceTracking = (Component, name) => {
  return (props) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      console.log(`[Performance] ${name} rendered in ${(endTime - startTime).toFixed(2)}ms`);
    });
    
    return <Component {...props} />;
  };
};

const AnalyticsDashboard = ({ userType, data }) => {
  const isInfluencer = userType === 'influencer';
  const [dateRange, setDateRange] = useState('Last 30 Days');
  
  // Track when dashboard data loads or changes
  React.useEffect(() => {
    if (data) {
      console.log('[Performance] Dashboard data loaded');
    }
  }, [data]);
  
  // Handle chart refresh - using useCallback to prevent unnecessary recreations
  const handleChartRefresh = useCallback((chartType) => {
    console.log(`Refreshing ${chartType} chart...`);
    // In a real app, this would fetch fresh data for the specific chart
  }, []);
  
  // Use memoized data structures to prevent recreation on each render
  const earningsData = useMemo(() => data?.earningsData || [
    { label: 'Jan', value: 1200 },
    { label: 'Feb', value: 1900 },
    { label: 'Mar', value: 1500 },
    { label: 'Apr', value: 2400 },
    { label: 'May', value: 2800 },
    { label: 'Jun', value: 3200 },
  ], [data?.earningsData]);
  
  const platformData = useMemo(() => data?.platformData || [
    { label: 'Instagram', value: 40, color: 'primary' },
    { label: 'TikTok', value: 30, color: 'secondary' },
    { label: 'YouTube', value: 20, color: 'success' },
    { label: 'Twitter', value: 10, color: 'info' },
  ], [data?.platformData]);
  
  const rentalDurationData = useMemo(() => data?.rentalDurationData || [
    { label: '1 Day', value: 10 },
    { label: '3 Days', value: 25 },
    { label: '7 Days', value: 40 },
    { label: '14 Days', value: 20 },
    { label: '30 Days', value: 5 },
  ], [data?.rentalDurationData]);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isInfluencer
              ? 'Track your earnings, API key performance, and rental statistics.'
              : 'Monitor your spending, API key usage, and campaign performance.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DateRangeSelector onChange={setDateRange} />
          <ExportButton />
          
          {/* Add a debounced refresh button for the whole dashboard */}
          <Tooltip title="Refresh all data">
            <IconButton 
              onClick={() => {
                // In a real app, this would fetch all fresh data
                console.log('Refreshing all dashboard data...');
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isInfluencer ? 'Total Earnings' : 'Total Spent'}
            value={`$${data?.totalAmount || '3,450'}`}
            icon={<MonetizationOnIcon />}
            change={data?.amountChange || '12%'}
            changeType={data?.amountChangeType || 'positive'}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Rentals"
            value={data?.activeRentals || 14}
            icon={<KeyIcon />}
            change={data?.rentalsChange || '5%'}
            changeType={data?.rentalsChangeType || 'positive'}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isInfluencer ? 'Avg. Rental Duration' : 'Avg. Usage Time'}
            value={`${data?.avgDuration || 7} days`}
            icon={<AccessTimeIcon />}
            change={data?.durationChange || '3%'}
            changeType={data?.durationChangeType || 'positive'}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isInfluencer ? 'Total Advertisers' : 'Influencers Used'}
            value={data?.totalUsers || 8}
            icon={<PeopleIcon />}
            change={data?.usersChange || '8%'}
            changeType={data?.usersChangeType || 'positive'}
            color="secondary"
          />
        </Grid>
      </Grid>
      
      {/* Charts */}
      {/* Use React.Suspense for the charts section to improve initial load time */}
      <Suspense fallback={
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Loading charts...
          </Typography>
        </Box>
      }>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <ChartCard
              title={isInfluencer ? 'Earnings Over Time' : 'Spending Over Time'}
              description={isInfluencer
                ? 'Track your monthly earnings from API key rentals.'
                : 'Monitor your monthly spending on API key rentals.'}
              chartType="line"
              data={earningsData}
              height={300}
              onRefresh={handleChartRefresh}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Platform Distribution"
              description={isInfluencer
                ? 'Breakdown of earnings by platform.'
                : 'Breakdown of spending by platform.'}
              chartType="pie"
              data={platformData}
              height={300}
              onRefresh={handleChartRefresh}
            />
          </Grid>
          <Grid item xs={12}>
            <ChartCard
              title="Rental Duration Analysis"
              description={isInfluencer
                ? 'Distribution of rental durations chosen by advertisers.'
                : 'Distribution of rental durations you typically choose.'}
              chartType="bar"
              data={rentalDurationData}
              height={250}
              onRefresh={handleChartRefresh}
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
            <IconButton size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider sx={{ mb: 2 }} />
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
      </Paper>
    </Box>
  );
};

// Apply performance tracking to the component
export default memo(withPerformanceTracking(AnalyticsDashboard, 'AnalyticsDashboard'));
