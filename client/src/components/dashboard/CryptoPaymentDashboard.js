import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccessibility } from '../../utils/accessibilityContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
  Chip,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  ArrowDownward,
  ArrowUpward,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon,
  CancelOutlined as CancelIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  FileCopy as CopyIcon,
  SwapHoriz as SwapIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { fetchCryptoTransactions, fetchExchangeRates, cancelCryptoCharge, cancelCryptoSubscription } from '../../redux/slices/paymentSlice';
import { addAlert } from '../../redux/slices/alertSlice';
import { formatCurrency, formatCryptoAmount } from '../../utils/formatUtils';
import QRCode from 'qrcode.react';
import LineChart from '../charts/LineChart';
import NoDataPlaceholder from '../common/NoDataPlaceholder';
import cryptoLogos from '../../constants/cryptoLogos';

const PaymentStatusChip = ({ status }) => {
  const { largeText, highContrast, colorBlindMode } = useAccessibility();
  
  let color = 'default';
  let icon = <InfoIcon />;
  let label = status;
  let ariaLabel = '';
  let additionalStyles = {};

  switch (status?.toLowerCase()) {
    case 'completed':
    case 'successful':
    case 'paid':
      color = 'success';
      icon = <CheckIcon />;
      label = 'Paid';
      ariaLabel = 'Payment Status: Paid';
      additionalStyles = highContrast ? { 
        border: '2px solid #2e7d32',
        fontWeight: 'bold'
      } : {};
      break;
    case 'pending':
      color = 'primary';
      icon = <AccessTimeIcon />;
      label = 'Pending';
      ariaLabel = 'Payment Status: Pending';
      additionalStyles = highContrast ? { 
        border: '2px solid #1976d2',
        fontWeight: 'bold'
      } : {};
      break;
    case 'confirming':
      color = 'info';
      icon = <ScheduleIcon />;
      label = 'Confirming';
      ariaLabel = 'Payment Status: Confirming';
      additionalStyles = highContrast ? { 
        border: '2px solid #0288d1',
        fontWeight: 'bold'
      } : {};
      break;
    case 'canceled':
    case 'cancelled':
      color = 'default';
      icon = <CancelIcon />;
      label = 'Cancelled';
      ariaLabel = 'Payment Status: Cancelled';
      additionalStyles = highContrast ? { 
        border: '2px dashed #757575',
        fontWeight: 'bold'
      } : {};
      break;
    case 'failed':
      color = 'error';
      icon = <ErrorIcon />;
      label = 'Failed';
      ariaLabel = 'Payment Status: Failed';
      additionalStyles = highContrast ? { 
        border: '2px solid #d32f2f',
        fontWeight: 'bold'
      } : {};
      break;
    case 'delayed':
      color = 'warning';
      icon = <WarningIcon />;
      label = 'Delayed';
      ariaLabel = 'Payment Status: Delayed';
      additionalStyles = highContrast ? { 
        border: '2px solid #ed6c02',
        fontWeight: 'bold'
      } : {};
      break;
    default:
      ariaLabel = `Payment Status: ${status || 'Unknown'}`;
      break;
  }

  // Additional accessibility indicators for color blind users
  const getStatusSymbol = () => {
    if (colorBlindMode !== 'normal') {
      switch (status?.toLowerCase()) {
        case 'completed':
        case 'successful':
        case 'paid':
          return '✓ '; // Checkmark prefix
        case 'failed':
          return '✗ '; // X mark prefix
        case 'pending':
        case 'confirming':
          return '⋯ '; // Ellipsis prefix
        case 'delayed':
          return '! '; // Exclamation prefix
        case 'canceled':
        case 'cancelled':
          return '⊘ '; // Prohibition sign prefix
        default:
          return '';
      }
    }
    return '';
  };

  const accessibleLabel = getStatusSymbol() + label;

  return (
    <Chip 
      icon={icon} 
      label={accessibleLabel} 
      color={color} 
      size="small" 
      variant={highContrast ? "filled" : "outlined"}
      aria-label={ariaLabel}
      sx={{
        fontSize: largeText ? '1rem' : undefined,
        height: largeText ? '32px' : undefined,
        ...additionalStyles
      }}
    />
  );
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  const { largeText } = useAccessibility();

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`crypto-dashboard-tabpanel-${index}`}
      aria-labelledby={`crypto-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: largeText ? 4 : 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const DetailDialog = ({ transaction, open, handleClose }) => {
  const [qrVisible, setQrVisible] = useState(false);
  const dispatch = useDispatch();
  const { isScreenReaderEnabled, largeText, reduceMotion, announce } = useAccessibility();
  
  // Ref for focus management
  const closeButtonRef = useRef(null);
  const mainContentRef = useRef(null);

  // Focus management with ref
  useEffect(() => {
    if (open && mainContentRef.current) {
      setTimeout(() => {
        mainContentRef.current.focus();
      }, 100);
    }
  }, [open]);
  
  // Keyboard event handling for dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      
      // Close on Escape
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);
  
  if (!transaction) return null;

  const isPending = ['pending', 'confirming'].includes(transaction.status?.toLowerCase());
  const cryptoCurrency = transaction.cryptoCurrency || transaction.metadata?.cryptoCurrency || 'BTC';
  const cryptoAmount = transaction.metadata?.cryptoAmount || '0';
  const cryptoLogo = cryptoLogos[cryptoCurrency?.toUpperCase()] || cryptoLogos.BTC;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    
    dispatch(addAlert({
      type: 'success',
      message: 'Address copied to clipboard'
    }));
    
    // Announce to screen readers
    if (isScreenReaderEnabled) {
      announce('Crypto address copied to clipboard', 'assertive');
    }
  };

  const handleCancel = () => {
    if (transaction.orderNumber) {
      dispatch(cancelCryptoCharge(transaction.orderNumber))
        .then(() => {
          dispatch(addAlert({
            type: 'success',
            message: 'Payment cancelled successfully'
          }));
          handleClose();
        })
        .catch((error) => {
          dispatch(addAlert({
            type: 'error',
            message: `Failed to cancel payment: ${error.message}`
          }));
        });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="transaction-dialog-title"
      aria-describedby="transaction-dialog-description"
    >
      <DialogTitle id="transaction-dialog-title">
        Transaction Details
        <Typography variant="subtitle2" color="textSecondary">
          Order: {transaction.orderNumber}
        </Typography>
      </DialogTitle>
      <DialogContent ref={mainContentRef} tabIndex={-1} id="transaction-dialog-description">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Status</Typography>
              <PaymentStatusChip status={transaction.status} />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Amount</Typography>
              <Typography variant="body1">
                {formatCurrency(transaction.amount, transaction.currency)} ({cryptoAmount} {cryptoCurrency})
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Date</Typography>
              <Typography variant="body1">
                {transaction.createdAt && format(new Date(transaction.createdAt), 'PPP pp')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {transaction.createdAt && `(${formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })})`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Description</Typography>
              <Typography variant="body1">{transaction.description}</Typography>
            </Box>
            
            {transaction.metadata?.chargeId && isPending && (
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel Payment
                </Button>
              </Box>
            )}
          </Grid>
          
          {isPending && transaction.metadata?.cryptoAddress && (
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Payment Details</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <img 
                  src={cryptoLogo} 
                  alt={cryptoCurrency} 
                  style={{ width: 24, height: 24, marginRight: 8 }} 
                />
                <Typography variant="body1">
                  Send exactly {cryptoAmount} {cryptoCurrency}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    border: '1px solid #ddd', 
                    borderRadius: 1,
                    p: 1, 
                    fontFamily: 'monospace',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {transaction.metadata.cryptoAddress}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(transaction.metadata.cryptoAddress)}
                  sx={{ ml: 1 }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
              
              {qrVisible ? (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
              <QRCode 
                value={transaction.metadata.cryptoAddress}
                size={largeText ? 250 : 200}
                level="H"
                renderAs="svg"
                aria-label={`QR code for ${cryptoCurrency} address ${transaction.metadata.cryptoAddress}`}
              />
              <Typography variant="caption" display="block" sx={{ fontSize: largeText ? '0.875rem' : undefined }}>
                    Scan with your wallet app
                  </Typography>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<QrCodeIcon />}
                  onClick={() => setQrVisible(true)}
                  sx={{ mb: 2 }}
                >
                  Show QR Code
                </Button>
              )}
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Payment will be automatically confirmed once the transaction is verified on the blockchain.
              </Alert>
            </Grid>
          )}
        </Grid>
        
        {transaction.timeline && transaction.timeline.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Timeline
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transaction.timeline.map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <PaymentStatusChip status={event.status} />
                      </TableCell>
                      <TableCell>
                        {event.time && format(new Date(event.time), 'PPP pp')}
                      </TableCell>
                      <TableCell>{event.context || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          ref={closeButtonRef}
          aria-label="Close transaction details dialog"
          sx={{ 
            fontSize: largeText ? '1rem' : undefined,
            padding: largeText ? '8px 16px' : undefined
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SubscriptionDetailDialog = ({ subscription, open, handleClose }) => {
  const dispatch = useDispatch();
  const { isScreenReaderEnabled, largeText, reduceMotion, announce } = useAccessibility();
  
  // Refs for focus management
  const closeButtonRef = useRef(null);
  const mainContentRef = useRef(null);
  
  // Focus management with ref
  useEffect(() => {
    if (open && mainContentRef.current) {
      setTimeout(() => {
        mainContentRef.current.focus();
      }, 100);
    }
  }, [open]);
  
  // Keyboard event handling for dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      
      // Close on Escape
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);

  if (!subscription) return null;

  const handleCancel = () => {
    if (subscription._id) {
      dispatch(cancelCryptoSubscription(subscription._id))
        .then(() => {
          dispatch(addAlert({
            type: 'success',
            message: 'Subscription cancelled successfully'
          }));
          handleClose();
        })
        .catch((error) => {
          dispatch(addAlert({
            type: 'error',
            message: `Failed to cancel subscription: ${error.message}`
          }));
        });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      aria-labelledby="subscription-dialog-title"
      aria-describedby="subscription-dialog-description"
    >
      <DialogTitle id="subscription-dialog-title">
        Subscription Details
        <Typography variant="subtitle2" color="textSecondary">
          ID: {subscription._id}
        </Typography>
      </DialogTitle>
      <DialogContent ref={mainContentRef} tabIndex={-1} id="subscription-dialog-description">
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">Status</Typography>
          <PaymentStatusChip status={subscription.status} />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">Name</Typography>
          <Typography variant="body1">{subscription.name}</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">Description</Typography>
          <Typography variant="body1">{subscription.description}</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">Amount</Typography>
          <Typography variant="body1">
            {formatCurrency(subscription.amount, subscription.currency)} per {subscription.billingPeriod}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">Next Billing Date</Typography>
          <Typography variant="body1">
            {subscription.nextBillingDate && format(new Date(subscription.nextBillingDate), 'PPP')}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">Created</Typography>
          <Typography variant="body1">
            {subscription.createdAt && format(new Date(subscription.createdAt), 'PPP')}
          </Typography>
        </Box>
        
        {subscription.status !== 'canceled' && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cancelling a subscription will immediately terminate access to the associated service.
            </Alert>
            
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              fullWidth
            >
              Cancel Subscription
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          ref={closeButtonRef}
          aria-label="Close subscription details dialog"
          sx={{ 
            fontSize: largeText ? '1rem' : undefined,
            padding: largeText ? '8px 16px' : undefined
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CryptoExchangeRates = ({ exchangeRates, onRefresh, loading }) => {
  const theme = useTheme();
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const currencies = ['BTC', 'ETH', 'USDC', 'DAI', 'LTC', 'BCH'];
  
  const getRate = (currency) => {
    if (!exchangeRates) return '0';
    return (1 / exchangeRates[currency]).toFixed(8);
  };
  
  return (
    <Card>
      <CardHeader
        title="Current Exchange Rates"
        action={
          <IconButton onClick={onRefresh} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        }
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1" sx={{ mr: 1 }}>1 {baseCurrency} =</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {currencies.map(currency => (
              <Chip
                key={currency}
                label={`${getRate(currency)} ${currency}`}
                variant="outlined"
                size="small"
                avatar={
                  <img 
                    src={cryptoLogos[currency]} 
                    alt={currency}
                    style={{ width: 16, height: 16 }} 
                  />
                }
              />
            ))}
          </Box>
        </Box>
        
        <Typography variant="caption" color="textSecondary">
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

const TransactionHistoryTable = ({ transactions, loading, page, setPage, rowsPerPage, setRowsPerPage, totalCount, handleViewDetails }) => {
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <NoDataPlaceholder 
        title="No transactions found"
        description="You haven't made any cryptocurrency transactions yet."
        icon={<SwapIcon style={{ fontSize: 64 }} />}
      />
    );
  }
  
  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>
                  {transaction.createdAt ? format(new Date(transaction.createdAt), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {formatCurrency(transaction.amount, transaction.currency)}
                    {transaction.cryptoCurrency && (
                      <Tooltip title={`${transaction.metadata?.cryptoAmount || '0'} ${transaction.cryptoCurrency}`}>
                        <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                          <img 
                            src={cryptoLogos[transaction.cryptoCurrency]} 
                            alt={transaction.cryptoCurrency}
                            style={{ width: 16, height: 16 }} 
                          />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <PaymentStatusChip status={transaction.status} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleViewDetails(transaction)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
};

const SubscriptionsTable = ({ subscriptions, loading, handleViewDetails }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <NoDataPlaceholder 
        title="No active subscriptions"
        description="You don't have any cryptocurrency subscriptions yet."
        icon={<ScheduleIcon style={{ fontSize: 64 }} />}
      />
    );
  }
  
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Billing Period</TableCell>
            <TableCell>Next Billing</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription._id}>
              <TableCell>{subscription.name}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {formatCurrency(subscription.amount, subscription.currency)}
                  {subscription.cryptoCurrency && (
                    <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                      <img 
                        src={cryptoLogos[subscription.cryptoCurrency]} 
                        alt={subscription.cryptoCurrency}
                        style={{ width: 16, height: 16 }} 
                      />
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                {subscription.billingPeriod}
              </TableCell>
              <TableCell>
                {subscription.nextBillingDate && subscription.status !== 'canceled'
                  ? format(new Date(subscription.nextBillingDate), 'MMM d, yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <PaymentStatusChip status={subscription.status} />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => handleViewDetails(subscription)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const PaymentAnalytics = ({ transactions }) => {
  const theme = useTheme();
  
  if (!transactions || transactions.length === 0) {
    return (
      <NoDataPlaceholder 
        title="No transaction data"
        description="There isn't enough data to generate analytics yet."
        icon={<TimelineIcon style={{ fontSize: 64 }} />}
      />
    );
  }
  
  // Process data for charts
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: format(date, 'MMM'),
      monthIndex: date.getMonth(),
      year: date.getFullYear()
    };
  }).reverse();
  
  const monthlyData = last6Months.map(monthData => {
    const { month, monthIndex, year } = monthData;
    
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate.getMonth() === monthIndex && txDate.getFullYear() === year && tx.status === 'completed';
    });
    
    const totalAmount = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      month,
      total: totalAmount
    };
  });
  
  // Count transactions by crypto currency
  const cryptoDistribution = transactions.reduce((acc, tx) => {
    const currency = tx.cryptoCurrency || 'Unknown';
    acc[currency] = (acc[currency] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.entries(cryptoDistribution).map(([currency, count]) => ({
    name: currency,
    value: count
  }));
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Monthly Transaction Volume</Typography>
        <Paper sx={{ p: 2, height: 300 }}>
          <LineChart 
            data={monthlyData}
            xKey="month"
            yKeys={['total']}
            yLabel="Amount"
            colors={[theme.palette.primary.main]}
          />
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom>Transaction Statistics</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Total Transactions</TableCell>
                <TableCell align="right">{transactions.length}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Completed Transactions</TableCell>
                <TableCell align="right">
                  {transactions.filter(tx => tx.status === 'completed').length}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pending Transactions</TableCell>
                <TableCell align="right">
                  {transactions.filter(tx => tx.status === 'pending' || tx.status === 'confirming').length}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Failed/Cancelled Transactions</TableCell>
                <TableCell align="right">
                  {transactions.filter(tx => tx.status === 'failed' || tx.status === 'canceled').length}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Average Transaction Amount</TableCell>
                <TableCell align="right">
                  {formatCurrency(
                    transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length || 0, 
                    transactions[0]?.currency || 'USD'
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom>Most Used Cryptocurrencies</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cryptocurrency</TableCell>
                <TableCell align="right">Transactions</TableCell>
                <TableCell align="right">Percentage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pieData.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={cryptoLogos[item.name] || ''}
                        alt={item.name}
                        style={{ width: 20, height: 20, marginRight: 8 }}
                      />
                      {item.name}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{item.value}</TableCell>
                  <TableCell align="right">
                    {((item.value / transactions.length) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

const CryptoPaymentDashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  
  // Accessibility context
  const { 
    isScreenReaderEnabled, 
    reduceMotion, 
    largeText, 
    colorBlindMode,
    highContrast,
    announce 
  } = useAccessibility();
  
  // Refs for focus management
  const tabsRef = useRef(null);
  const mainContentRef = useRef(null);
  
  const { 
    transactions, 
    transactionsLoading, 
    transactionsTotal,
    subscriptions,
    subscriptionsLoading,
    exchangeRates,
    exchangeRatesLoading
  } = useSelector((state) => state.payment);
  
  useEffect(() => {
    loadTransactions();
    dispatch(fetchExchangeRates());
    
    // Announce page to screen readers
    if (isScreenReaderEnabled) {
      announce('Crypto Payment Dashboard loaded. Use tabs to navigate between sections.', 'polite');
    }
  }, [dispatch, page, rowsPerPage, isScreenReaderEnabled, announce]);
  
  const loadTransactions = () => {
    dispatch(fetchCryptoTransactions({ page: page + 1, limit: rowsPerPage }));
  };
  
  const handleRefreshRates = () => {
    dispatch(fetchExchangeRates());
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Announce tab change to screen readers
    if (isScreenReaderEnabled) {
      const tabNames = ['Overview', 'Transactions', 'Subscriptions', 'Analytics'];
      announce(`${tabNames[newValue]} tab selected`, 'polite');
      
      // Focus management - set focus to the main content area
      if (mainContentRef.current) {
        setTimeout(() => {
          mainContentRef.current.focus();
        }, 100);
      }
    }
  };
  
  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
    
    // Announce to screen readers
    if (isScreenReaderEnabled) {
      announce(`Transaction details dialog opened for ${transaction.description || 'transaction'}`, 'polite');
    }
  };
  
  const handleViewSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setSubscriptionDialogOpen(true);
    
    // Announce to screen readers
    if (isScreenReaderEnabled) {
      announce(`Subscription details dialog opened for ${subscription.name || 'subscription'}`, 'polite');
    }
  };
  
  const getFontSize = (baseSize) => {
    return largeText ? `${baseSize * 1.25}px` : `${baseSize}px`;
  };
  
  const getAccessibleStyles = () => {
    return {
      // Increase touch targets for better accessibility
      button: {
        padding: largeText ? '12px 16px' : '8px 12px',
        minWidth: largeText ? '88px' : '64px',
      },
      // Increase spacing for better readability
      spacing: {
        padding: largeText ? 3 : 2,
        margin: largeText ? 2 : 1,
      },
      // Font sizes
      fontSize: {
        h6: getFontSize(20),
        body1: getFontSize(16),
        body2: getFontSize(14),
        caption: getFontSize(12),
      },
    };
  };
  
  const styles = getAccessibleStyles();
  
  return (
    <Box sx={{ width: '100%' }} id="main-content" tabIndex={-1} ref={mainContentRef}>
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 2 
        }}
        role="navigation"
        aria-label="Dashboard sections"
        ref={tabsRef}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="crypto dashboard tabs"
          // Enhanced focus visibility
          TabIndicatorProps={{ 
            style: { 
              height: highContrast ? '4px' : '2px',
              backgroundColor: highContrast ? theme.palette.primary.main : undefined
            } 
          }}
        >
          <Tab 
            label="Overview" 
            id="crypto-dashboard-tab-0" 
            aria-controls="crypto-dashboard-tabpanel-0" 
            sx={{ fontSize: styles.fontSize.body1 }}
          />
          <Tab 
            label="Transactions" 
            id="crypto-dashboard-tab-1" 
            aria-controls="crypto-dashboard-tabpanel-1"
            sx={{ fontSize: styles.fontSize.body1 }}
          />
          <Tab 
            label="Subscriptions" 
            id="crypto-dashboard-tab-2" 
            aria-controls="crypto-dashboard-tabpanel-2"
            sx={{ fontSize: styles.fontSize.body1 }}
          />
          <Tab 
            label="Analytics" 
            id="crypto-dashboard-tab-3" 
            aria-controls="crypto-dashboard-tabpanel-3"
            sx={{ fontSize: styles.fontSize.body1 }}
          />
        </Tabs>
      </Box>
      
      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Recent Transactions" />
              <Divider />
              <CardContent>
                {transactionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : transactions && transactions.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.slice(0, 5).map((transaction) => (
                          <TableRow key={transaction._id}>
                            <TableCell>
                              {transaction.createdAt ? format(new Date(transaction.createdAt), 'MMM d, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </TableCell>
                            <TableCell>
                              <PaymentStatusChip status={transaction.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
                    No transactions yet
                  </Typography>
                )}
                
                {transactions && transactions.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      size="small"
                      endIcon={<ArrowDownward />}
                      onClick={() => setTabValue(1)}
                    >
                      View All Transactions
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <CryptoExchangeRates 
              exchangeRates={exchangeRates}
              onRefresh={handleRefreshRates}
              loading={exchangeRatesLoading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Active Subscriptions" />
              <Divider />
              <CardContent>
                {subscriptionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : subscriptions && subscriptions.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Next Billing</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {subscriptions
                          .filter(subscription => subscription.status !== 'canceled')
                          .slice(0, 3)
                          .map((subscription) => (
                            <TableRow key={subscription._id}>
                              <TableCell>{subscription.name}</TableCell>
                              <TableCell>
                                {formatCurrency(subscription.amount, subscription.currency)}
                              </TableCell>
                              <TableCell>
                                {subscription.nextBillingDate 
                                  ? format(new Date(subscription.nextBillingDate), 'MMM d, yyyy') 
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <PaymentStatusChip status={subscription.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
                    No active subscriptions
                  </Typography>
                )}
                
                {subscriptions && subscriptions.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      size="small"
                      endIcon={<ArrowDownward />}
                      onClick={() => setTabValue(2)}
                    >
                      View All Subscriptions
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Transactions Tab */}
      <TabPanel value={tabValue} index={1}>
        <TransactionHistoryTable 
          transactions={transactions}
          loading={transactionsLoading}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalCount={transactionsTotal}
          handleViewDetails={handleViewDetails}
        />
      </TabPanel>
      
      {/* Subscriptions Tab */}
      <TabPanel value={tabValue} index={2}>
        <SubscriptionsTable 
          subscriptions={subscriptions}
          loading={subscriptionsLoading}
          handleViewDetails={handleViewSubscription}
        />
      </TabPanel>
      
      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <PaymentAnalytics transactions={transactions} />
      </TabPanel>
      
      {/* Detail Dialogs */}
      <DetailDialog 
        transaction={selectedTransaction}
        open={detailDialogOpen}
        handleClose={() => setDetailDialogOpen(false)}
      />
      
      <SubscriptionDetailDialog 
        subscription={selectedSubscription}
        open={subscriptionDialogOpen}
        handleClose={() => setSubscriptionDialogOpen(false)}
      />
    </Box>
  );
};

export default CryptoPaymentDashboard;
