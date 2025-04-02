import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  Typography,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { format, parseISO } from 'date-fns';

/**
 * Report Viewer Component
 * Displays report data with visualizations
 */
const ReportViewer = ({ data, metrics, template, dateRange }) => {
  const [viewType, setViewType] = useState('charts');
  const [activeMetric, setActiveMetric] = useState(metrics && metrics.length > 0 ? metrics[0] : null);
  const [chartType, setChartType] = useState('bar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if the data is valid
  const validData = data && Array.isArray(data.items) && data.items.length > 0;
  
  // CHART COLORS
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];
  
  useEffect(() => {
    // Set the default active metric when metrics change
    if (metrics && metrics.length > 0 && (!activeMetric || !metrics.includes(activeMetric))) {
      setActiveMetric(metrics[0]);
    }
    
    // Auto select best chart type based on data and metric
    if (data && activeMetric) {
      const metricData = data.metricTypes?.find(m => m.id === activeMetric);
      if (metricData) {
        if (metricData.type === 'time_series') {
          setChartType('line');
        } else if (metricData.type === 'categorical') {
          setChartType('bar');
        } else if (metricData.type === 'distribution') {
          setChartType('pie');
        }
      }
    }
  }, [metrics, activeMetric, data]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setViewType(newValue);
  };
  
  // Handle metric change
  const handleMetricChange = (event) => {
    setActiveMetric(event.target.value);
  };
  
  // Handle chart type change
  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };
  
  // Format date labels
  const formatDateLabel = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d');
    } catch (e) {
      return dateString;
    }
  };
  
  // Render the appropriate chart based on the selected type
  const renderChart = () => {
    if (!validData || !activeMetric) {
      return (
        <Alert severity="info">
          No data available for visualization.
        </Alert>
      );
    }
    
    // Get the metric display name
    const metricName = data.metricTypes?.find(m => m.id === activeMetric)?.name || activeMetric;
    
    // Map data for the chart
    const chartData = data.items.map(item => ({
      name: item.label || item.date || formatDateLabel(item.timestamp) || '',
      value: item.metrics[activeMetric] || 0,
      ...item.metrics
    }));
    
    const renderTooltipContent = (props) => {
      const { payload } = props;
      if (!payload || payload.length === 0) return null;
      
      return (
        <Paper sx={{ p: 1 }}>
          <Typography variant="body2" color="textPrimary">
            {payload[0].payload.name}
          </Typography>
          <Typography variant="body2" color="primary">
            {metricName}: {payload[0].value.toLocaleString()}
          </Typography>
        </Paper>
      );
    };
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis />
              <Tooltip content={renderTooltipContent} />
              <Legend />
              <Bar 
                dataKey="value" 
                name={metricName} 
                fill={COLORS[0]} 
                animationDuration={1000} 
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis />
              <Tooltip content={renderTooltipContent} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                name={metricName} 
                stroke={COLORS[0]} 
                activeDot={{ r: 8 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis />
              <Tooltip content={renderTooltipContent} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                name={metricName} 
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.3}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <Alert severity="info">
            Unsupported chart type selected.
          </Alert>
        );
    }
  };
  
  // Render the data table
  const renderDataTable = () => {
    if (!validData) {
      return (
        <Alert severity="info">
          No data available for display.
        </Alert>
      );
    }
    
    // Get all metric names for the headers
    const metricHeaders = data.metricTypes?.map(metric => ({
      id: metric.id,
      name: metric.name,
    })) || [];
    
    return (
      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Date/Label
              </th>
              {metricHeaders.map(header => (
                <th 
                  key={header.id} 
                  style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    borderBottom: '1px solid #ddd',
                    backgroundColor: header.id === activeMetric ? '#f5f5f5' : 'transparent',
                  }}
                >
                  {header.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                <td style={{ padding: '16px', borderBottom: '1px solid #ddd' }}>
                  {item.label || item.date || formatDateLabel(item.timestamp) || '—'}
                </td>
                {metricHeaders.map(header => (
                  <td 
                    key={header.id} 
                    style={{ 
                      padding: '16px', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #ddd',
                      backgroundColor: header.id === activeMetric ? '#f5f5f5' : 'transparent', 
                    }}
                  >
                    {(item.metrics[header.id] || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    );
  };
  
  // Render summary statistics
  const renderSummaryStats = () => {
    if (!validData || !activeMetric) {
      return null;
    }
    
    // Calculate summary statistics for the active metric
    const values = data.items.map(item => item.metrics[activeMetric] || 0);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // Get the metric display name
    const metricName = data.metricTypes?.find(m => m.id === activeMetric)?.name || activeMetric;
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Summary Statistics: {metricName}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Total
              </Typography>
              <Typography variant="h6">
                {sum.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Average
              </Typography>
              <Typography variant="h6">
                {avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Maximum
              </Typography>
              <Typography variant="h6">
                {max.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Minimum
              </Typography>
              <Typography variant="h6">
                {min.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Controls */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth variant="outlined" size="small">
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Metric
            </Typography>
            <Select
              value={activeMetric || ''}
              onChange={handleMetricChange}
              disabled={!metrics || metrics.length === 0}
            >
              {data.metricTypes?.map(metric => (
                <MenuItem key={metric.id} value={metric.id}>
                  {metric.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth variant="outlined" size="small">
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Chart Type
            </Typography>
            <Select
              value={chartType}
              onChange={handleChartTypeChange}
              disabled={!validData}
            >
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="area">Area Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              View
            </Typography>
            <Tabs
              value={viewType}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Charts" value="charts" />
              <Tab label="Table" value="table" />
            </Tabs>
          </FormControl>
        </Grid>
      </Grid>
      
      {/* Summary statistics */}
      {renderSummaryStats()}
      
      {/* Visualization */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        {viewType === 'charts' ? renderChart() : renderDataTable()}
      </Paper>
    </Box>
  );
};

export default ReportViewer;
