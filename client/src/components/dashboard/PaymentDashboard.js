import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { getTransactionHistory } from '../../redux/slices/paymentSlice';
import { getPayouts } from '../../redux/slices/payoutSlice';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PaymentDashboard = () => {
  const dispatch = useDispatch();
  const { transactions, loading: transactionsLoading, error: transactionsError } = useSelector((state) => state.payment);
  const { payouts, loading: payoutsLoading, error: payoutsError } = useSelector((state) => state.payout);
  const { user } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('6months');
  
  const isInfluencer = user.userType === 'influencer';
  const isAdvertiser = user.userType === 'advertiser';
  
  useEffect(() => {
    dispatch(getTransactionHistory());
    if (isInfluencer) {
      dispatch(getPayouts());
    }
  }, [dispatch, isInfluencer]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleRefresh = () => {
    dispatch(getTransactionHistory());
    if (isInfluencer) {
      dispatch(getPayouts());
    }
  };
  
  // Calculate summary data
  const calculateSummary = () => {
    if (!transactions || transactions.length === 0) {
      return {
        totalAmount: 0,
        pendingAmount: 0,
        completedAmount: 0,
        refundedAmount: 0,
        thisMonthAmount: 0,
        lastMonthAmount: 0,
        percentChange: 0
      };
    }
    
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    let totalAmount = 0;
    let pendingAmount = 0;
    let completedAmount = 0;
    let refundedAmount = 0;
    let thisMonthAmount = 0;
    let lastMonthAmount = 0;
    
    transactions.forEach(transaction => {
      const amount = transaction.amount;
      const date = new Date(transaction.createdAt);
      
      // Total amounts by status
      if (transaction.status === 'pending') {
        pendingAmount += amount;
      } else if (transaction.status === 'completed') {
        completedAmount += amount;
      } else if (transaction.status === 'refunded') {
        refundedAmount += amount;
      }
      
      // Total amount
      totalAmount += amount;
      
      // This month and last month
      if (date >= thisMonthStart && date <= thisMonthEnd) {
        thisMonthAmount += amount;
      } else if (date >= lastMonthStart && date <= lastMonthEnd) {
        lastMonthAmount += amount;
      }
    });
    
    // Calculate percent change
    const percentChange = lastMonthAmount === 0 
      ? 100 
      : ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100;
    
    return {
      totalAmount,
      pendingAmount,
      completedAmount,
      refundedAmount,
      thisMonthAmount,
      lastMonthAmount,
      percentChange
    };
  };
  
  // Format data for charts
  const formatMonthlyData = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case '12months':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 6);
    }
    
    // Get all months in the range
    const months = eachMonthOfInterval({
      start: startDate,
      end: now
    });
    
    // Initialize data for each month
    const monthlyData = months.map(month => ({
      month: format(month, 'MMM yyyy'),
      amount: 0,
      count: 0
    }));
    
    // Populate with transaction data
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      if (date >= startDate && date <= now) {
        const monthIndex = months.findIndex(month => 
          month.getMonth() === date.getMonth() && 
          month.getFullYear() === date.getFullYear()
        );
        
        if (monthIndex !== -1) {
          monthlyData[monthIndex].amount += transaction.amount;
          monthlyData[monthIndex].count += 1;
        }
      }
    });
    
    return monthlyData;
  };
  
  const formatStatusData = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const statusCounts = {
      completed: 0,
      pending: 0,
      refunded: 0,
      failed: 0
    };
    
    transactions.forEach(transaction => {
      if (statusCounts[transaction.status] !== undefined) {
        statusCounts[transaction.status]++;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    })).filter(item => item.value > 0);
  };
  
  const summary = calculateSummary();
  const monthlyData = formatMonthlyData();
  const statusData = formatStatusData();
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {isInfluencer ? 'Earnings Dashboard' : 'Payment Dashboard'}
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh} disabled={transactionsLoading || payoutsLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {(transactionsError || payoutsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {transactionsError || payoutsError}
        </Alert>
      )}
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <AttachMoneyIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  {isInfluencer ? 'Total Earnings' : 'Total Spent'}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" color="primary.main">
                ${summary.totalAmount.toFixed(2)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {summary.percentChange > 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                )}
                <Typography variant="body2" color={summary.percentChange > 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(summary.percentChange).toFixed(1)}% {summary.percentChange > 0 ? 'increase' : 'decrease'} from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <ReceiptIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  {isInfluencer ? 'This Month' : 'This Month'}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" color="success.main">
                ${summary.thisMonthAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Last Month: ${summary.lastMonthAmount.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <PaymentIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  {isInfluencer ? 'Pending' : 'Pending'}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" color="warning.main">
                ${summary.pendingAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {transactions?.filter(t => t.status === 'pending').length || 0} pending transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <AccountBalanceIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  {isInfluencer ? 'Available' : 'Completed'}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" color="info.main">
                ${summary.completedAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {isInfluencer ? 'Available for payout' : 'Successfully processed'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="payment dashboard tabs">
          <Tab label="Overview" id="payment-tab-0" aria-controls="payment-tabpanel-0" />
          <Tab label="Transactions" id="payment-tab-1" aria-controls="payment-tabpanel-1" />
          {isInfluencer && <Tab label="Payouts" id="payment-tab-2" aria-controls="payment-tabpanel-2" />}
        </Tabs>
      </Box>
      
      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        {transactionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : !transactions || transactions.length === 0 ? (
          <Alert severity="info">
            No transaction data available yet. {isInfluencer ? 'Earnings' : 'Payment'} data will appear once you have completed transactions.
          </Alert>
        ) : (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ mb: 3 }}>
                  <CardHeader 
                    title={isInfluencer ? "Monthly Earnings" : "Monthly Spending"} 
                    action={
                      <Box sx={{ minWidth: 120 }}>
                        <Button
                          size="small"
                          onClick={() => setTimeRange('3months')}
                          color={timeRange === '3months' ? 'primary' : 'inherit'}
                          variant={timeRange === '3months' ? 'contained' : 'text'}
                          sx={{ mr: 1 }}
                        >
                          3M
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setTimeRange('6months')}
                          color={timeRange === '6months' ? 'primary' : 'inherit'}
                          variant={timeRange === '6months' ? 'contained' : 'text'}
                          sx={{ mr: 1 }}
                        >
                          6M
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setTimeRange('12months')}
                          color={timeRange === '12months' ? 'primary' : 'inherit'}
                          variant={timeRange === '12months' ? 'contained' : 'text'}
                        >
                          1Y
                        </Button>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value) => [`$${value}`, isInfluencer ? 'Earnings' : 'Spending']}
                          />
                          <Bar 
                            dataKey="amount" 
                            name={isInfluencer ? "Earnings" : "Spending"} 
                            fill="#8884d8" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 3 }}>
                  <CardHeader title="Transaction Status" />
                  <CardContent>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Card>
              <CardHeader title="Recent Transactions" />
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <List>
                    {transactions.slice(0, 5).map((transaction) => (
                      <ListItem key={transaction._id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <PaymentIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={transaction.description || `Transaction #${transaction._id.substring(0, 8)}`}
                          secondary={`${new Date(transaction.createdAt).toLocaleDateString()} • $${transaction.amount}`}
                        />
                        <Chip
                          label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          color={
                            transaction.status === 'completed'
                              ? 'success'
                              : transaction.status === 'pending'
                              ? 'warning'
                              : transaction.status === 'refunded'
                              ? 'info'
                              : 'error'
                          }
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent transactions.
                  </Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => {
                      setTabValue(1);
                    }}
                  >
                    View All Transactions
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </TabPanel>
      
      {/* Transactions Tab */}
      <TabPanel value={tabValue} index={1}>
        {transactionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : !transactions || transactions.length === 0 ? (
          <Alert severity="info">
            No transaction data available yet.
          </Alert>
        ) : (
          <Card>
            <CardHeader title="All Transactions" />
            <CardContent>
              <List>
                {transactions.map((transaction) => (
                  <ListItem key={transaction._id} divider>
                    <ListItemAvatar>
                      <Avatar>
                        <PaymentIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">
                            {transaction.description || `Transaction #${transaction._id.substring(0, 8)}`}
                          </Typography>
                          <Typography variant="subtitle1" color="primary.main">
                            ${transaction.amount}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Date: {new Date(transaction.createdAt).toLocaleDateString()}
                          </Typography>
                          {transaction.paymentMethod && (
                            <Typography variant="body2" color="text.secondary">
                              Method: {transaction.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                          )}
                          {transaction.isSubscription && (
                            <Typography variant="body2" color="text.secondary">
                              Type: Subscription ({transaction.subscriptionPeriod})
                            </Typography>
                          )}
                          {transaction.errorMessage && (
                            <Typography variant="body2" color="error.main">
                              Error: {transaction.errorMessage}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Chip
                      label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      color={
                        transaction.status === 'completed'
                          ? 'success'
                          : transaction.status === 'pending'
                          ? 'warning'
                          : transaction.status === 'refunded'
                          ? 'info'
                          : 'error'
                      }
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </TabPanel>
      
      {/* Payouts Tab (Influencers Only) */}
      {isInfluencer && (
        <TabPanel value={tabValue} index={2}>
          {payoutsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : !payouts || payouts.length === 0 ? (
            <Alert severity="info">
              No payout data available yet. Payouts will appear once you have requested or received payments.
            </Alert>
          ) : (
            <Card>
              <CardHeader title="Payout History" />
              <CardContent>
                <List>
                  {payouts.map((payout) => (
                    <ListItem key={payout._id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <AccountBalanceIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1">
                              Payout #{payout._id.substring(0, 8)}
                            </Typography>
                            <Typography variant="subtitle1" color="primary.main">
                              ${payout.amount}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Requested: {new Date(payout.createdAt).toLocaleDateString()}
                            </Typography>
                            {payout.processedAt && (
                              <Typography variant="body2" color="text.secondary">
                                Processed: {new Date(payout.processedAt).toLocaleDateString()}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Method: {payout.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            {payout.accountDetails && (
                              <Typography variant="body2" color="text.secondary">
                                Account: {payout.accountDetails.accountNumber 
                                  ? `****${payout.accountDetails.accountNumber.slice(-4)}` 
                                  : payout.accountDetails.email}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        color={
                          payout.status === 'completed'
                            ? 'success'
                            : payout.status === 'pending'
                            ? 'warning'
                            : payout.status === 'cancelled'
                            ? 'error'
                            : 'default'
                        }
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      window.location.href = '/payouts';
                    }}
                  >
                    Request Payout
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </TabPanel>
      )}
    </Paper>
  );
};

export default PaymentDashboard;
