import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import PinterestIcon from '@mui/icons-material/Pinterest';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import pinterestService from '../../services/pinterestService';

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <Typography variant="body2">{`${label}: ${payload[0].value}`}</Typography>
      </Paper>
    );
  }
  return null;
};

// Stat card component
const StatCard = ({ title, value, icon, change, changeType, color = 'primary' }) => {
  const theme = useTheme();
  
  const getColorByType = (type) => {
    switch (type) {
      case 'increase':
        return theme.palette.success.main;
      case 'decrease':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ 
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ mt: 1 }}>
          {value}
        </Typography>
        {change && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mt: 1,
            color: getColorByType(changeType),
          }}>
            {changeType === 'increase' ? (
              <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
            ) : changeType === 'decrease' ? (
              <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
            ) : null}
            <Typography variant="body2" component="span" sx={{ 
              color: getColorByType(changeType),
            }}>
              {change}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const PinterestAnalytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('last30days');
  const [analytics, setAnalytics] = useState(null);
  
  // COLORS for Charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
  ];
  
  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await pinterestService.getAnalytics({ timeRange });
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to load Pinterest analytics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);
  
  // Load analytics on initial render and when time range changes
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  
  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadAnalytics();
  };
  
  // Handle export data
  const handleExport = () => {
    if (!analytics) return;
    
    // Create a CSV string from analytics data
    const csvData = [];
    
    // Add headers
    csvData.push(['Date', 'Impressions', 'Clicks', 'Saves', 'Engagement Rate']);
    
    // Add data rows
    analytics.dailyMetrics.forEach(day => {
      csvData.push([
        day.date,
        day.impressions,
        day.clicks,
        day.saves,
        day.engagementRate,
      ]);
    });
    
    // Convert to CSV string
    const csv = csvData.map(row => row.join(',')).join('\n');
    
    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `pinterest_analytics_${timeRange}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // If loading and no data yet
  if (loading && !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PinterestIcon sx={{ color: '#E60023', mr: 1, fontSize: 28 }} />
          <Typography variant="h5">Pinterest Analytics</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range"
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
              <MenuItem value="last90days">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export Data">
            <IconButton onClick={handleExport} disabled={!analytics || loading}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {analytics && (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Impressions"
                value={analytics.summary.totalImpressions.toLocaleString()}
                icon={<VisibilityIcon sx={{ color: theme.palette.primary.main }} />}
                change={`${analytics.summary.impressionsChange}%`}
                changeType={analytics.summary.impressionsChange > 0 ? 'increase' : 'decrease'}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Clicks"
                value={analytics.summary.totalClicks.toLocaleString()}
                icon={<TouchAppIcon sx={{ color: theme.palette.success.main }} />}
                change={`${analytics.summary.clicksChange}%`}
                changeType={analytics.summary.clicksChange > 0 ? 'increase' : 'decrease'}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Saves"
                value={analytics.summary.totalSaves.toLocaleString()}
                icon={<BookmarkIcon sx={{ color: theme.palette.info.main }} />}
                change={`${analytics.summary.savesChange}%`}
                changeType={analytics.summary.savesChange > 0 ? 'increase' : 'decrease'}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Engagement Rate"
                value={`${analytics.summary.engagementRate.toFixed(2)}%`}
                icon={<ThumbUpIcon sx={{ color: theme.palette.secondary.main }} />}
                change={`${analytics.summary.engagementRateChange}%`}
                changeType={analytics.summary.engagementRateChange > 0 ? 'increase' : 'decrease'}
                color="secondary"
              />
            </Grid>
          </Grid>
          
          {/* Charts */}
          <Grid container spacing={3}>
            {/* Daily Metrics Chart */}
            <Grid item xs={12} md={8}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Daily Performance</Typography>
                    <Tooltip title="Shows impressions, clicks, and saves by day">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics.dailyMetrics}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="impressions"
                          stroke={theme.palette.primary.main}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="clicks"
                          stroke={theme.palette.success.main}
                        />
                        <Line
                          type="monotone"
                          dataKey="saves"
                          stroke={theme.palette.info.main}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Top Boards Chart */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Top Boards</Typography>
                    <Tooltip title="Boards with the most engagement">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.topBoards}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.topBoards.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Audience Demographics */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Audience Demographics</Typography>
                    <Tooltip title="Demographics of your Pinterest audience">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Grid container spacing={3}>
                    {/* Age Distribution */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Age Distribution
                      </Typography>
                      <Box sx={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={analytics.demographics.age}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="group" />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Bar dataKey="percentage" fill={theme.palette.primary.main} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                    
                    {/* Gender Distribution */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Gender Distribution
                      </Typography>
                      <Box sx={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.demographics.gender}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              <Cell fill={theme.palette.primary.main} />
                              <Cell fill={theme.palette.secondary.main} />
                              <Cell fill={theme.palette.info.main} />
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default PinterestAnalytics;
