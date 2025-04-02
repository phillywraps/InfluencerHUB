import React from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Box, useTheme } from '@mui/material';

/**
 * Reusable Line Chart component
 * 
 * @param {Object} props Component props
 * @param {Array} props.data Array of data objects for the chart
 * @param {string} props.xKey Key in each data object for X-axis values
 * @param {Array<string>} props.yKeys Array of keys in each data object for Y-axis values
 * @param {Array<string>} props.colors Array of colors for each Y-axis line
 * @param {string} props.xLabel Label for X-axis
 * @param {string} props.yLabel Label for Y-axis
 * @param {Function} props.tooltipFormatter Custom formatter for tooltip values
 * @param {Object} props.customProps Additional props to pass to Recharts LineChart
 */
const LineChart = ({
  data = [],
  xKey,
  yKeys = [],
  colors,
  xLabel = '',
  yLabel = '',
  tooltipFormatter,
  customProps = {}
}) => {
  const theme = useTheme();
  
  // Default colors based on theme if not provided
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main
  ];
  
  // Use provided colors or fallback to defaults
  const lineColors = colors || defaultColors;
  
  // Default tooltip formatter if not provided
  const defaultTooltipFormatter = (value) => {
    return [value, ''];
  };
  
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          {...customProps}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          
          <XAxis 
            dataKey={xKey} 
            label={{ 
              value: xLabel, 
              position: 'insideBottomRight', 
              offset: -10 
            }}
            tick={{ fill: theme.palette.text.secondary }}
            stroke={theme.palette.divider}
          />
          
          <YAxis 
            label={{ 
              value: yLabel, 
              angle: -90, 
              position: 'insideLeft' 
            }}
            tick={{ fill: theme.palette.text.secondary }}
            stroke={theme.palette.divider}
          />
          
          <Tooltip 
            formatter={tooltipFormatter || defaultTooltipFormatter}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 4,
              color: theme.palette.text.primary
            }}
          />
          
          <Legend wrapperStyle={{ color: theme.palette.text.primary }} />
          
          {yKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={lineColors[index % lineColors.length]}
              activeDot={{ r: 8 }}
              dot={{ r: 3 }}
              strokeWidth={2}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default LineChart;
