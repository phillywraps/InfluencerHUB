import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import {
  getBalance,
  getBalanceTransactions,
  createPayout,
  getPayoutMethods,
  addPayoutMethod,
  deletePayoutMethod,
  updatePayoutSchedule
} from '../../redux/slices/payoutSlice';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payout-tabpanel-${index}`}
      aria-labelledby={`payout-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PayoutManagement = () => {
  const dispatch = useDispatch();
  const { 
    balance, 
    balanceTransactions, 
    payoutMethods, 
    payoutSchedule,
    loading, 
    error 
  } = useSelector((state) => state.payout);
  
  const [tabValue, setTabValue] = useState(0);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState('');
  const [payoutDescription, setPayoutDescription] = useState('');
  const [payoutError, setPayoutError] = useState('');
  
  const [openAddMethodDialog, setOpenAddMethodDialog] = useState(false);
  const [methodType, setMethodType] = useState('');
  const [methodDetails, setMethodDetails] = useState({});
  const [isDefault, setIsDefault] = useState(false);
  const [methodError, setMethodError] = useState('');
  
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [frequency, setFrequency] = useState('manual');
  const [minimumAmount, setMinimumAmount] = useState(100);
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [scheduleError, setScheduleError] = useState('');
  
  // Pagination for transactions
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Load data on component mount
  useEffect(() => {
    dispatch(getBalance());
    dispatch(getBalanceTransactions());
    dispatch(getPayoutMethods());
  }, [dispatch]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCreatePayout = () => {
    // Validate payout amount
    if (!payoutAmount || isNaN(payoutAmount) || parseFloat(payoutAmount) <= 0) {
      setPayoutError('Please enter a valid payout amount');
      return;
    }
    
    // Validate payout method
    if (!selectedPayoutMethod && payoutMethods.length > 0) {
      setPayoutError('Please select a payout method');
      return;
    }
    
    // Clear error
    setPayoutError('');
    
    // Create payout
    dispatch(createPayout({
      amount: parseFloat(payoutAmount),
      payoutMethodId: selectedPayoutMethod,
      description: payoutDescription
    }))
      .unwrap()
      .then(() => {
        // Reset form
        setPayoutAmount('');
        setSelectedPayoutMethod('');
        setPayoutDescription('');
        
        // Refresh balance and transactions
        dispatch(getBalance());
        dispatch(getBalanceTransactions());
      })
      .catch((error) => {
        setPayoutError(error.message || 'Failed to create payout');
      });
  };
  
  const handleOpenAddMethodDialog = () => {
    setOpenAddMethodDialog(true);
    setMethodType('');
    setMethodDetails({});
    setIsDefault(false);
    setMethodError('');
  };
  
  const handleCloseAddMethodDialog = () => {
    setOpenAddMethodDialog(false);
  };
  
  const handleMethodTypeChange = (event) => {
    setMethodType(event.target.value);
    setMethodDetails({});
  };
  
  const handleMethodDetailChange = (field, value) => {
    setMethodDetails({
      ...methodDetails,
      [field]: value
    });
  };
  
  const handleAddPayoutMethod = () => {
    // Validate method type
    if (!methodType) {
      setMethodError('Please select a payout method type');
      return;
    }
    
    // Validate method details
    let isValid = true;
    
    switch (methodType) {
      case 'bank_account':
        if (!methodDetails.accountHolderName || !methodDetails.bankName) {
          setMethodError('Please fill in all required fields');
          isValid = false;
        }
        break;
        
      case 'paypal':
        if (!methodDetails.email) {
          setMethodError('Please enter your PayPal email');
          isValid = false;
        }
        break;
        
      case 'crypto':
        if (!methodDetails.walletAddress || !methodDetails.cryptoCurrency) {
          setMethodError('Please fill in all required fields');
          isValid = false;
        }
        break;
        
      default:
        break;
    }
    
    if (!isValid) {
      return;
    }
    
    // Clear error
    setMethodError('');
    
    // Add payout method
    dispatch(addPayoutMethod({
      type: methodType,
      details: methodDetails,
      isDefault
    }))
      .unwrap()
      .then(() => {
        // Close dialog
        handleCloseAddMethodDialog();
        
        // Refresh payout methods
        dispatch(getPayoutMethods());
      })
      .catch((error) => {
        setMethodError(error.message || 'Failed to add payout method');
      });
  };
  
  const handleDeletePayoutMethod = (methodId) => {
    if (window.confirm('Are you sure you want to delete this payout method?')) {
      dispatch(deletePayoutMethod(methodId))
        .unwrap()
        .then(() => {
          // Refresh payout methods
          dispatch(getPayoutMethods());
        })
        .catch((error) => {
          console.error('Failed to delete payout method:', error);
        });
    }
  };
  
  const handleOpenScheduleDialog = () => {
    setOpenScheduleDialog(true);
    setFrequency(payoutSchedule?.frequency || 'manual');
    setMinimumAmount(payoutSchedule?.minimumAmount || 100);
    setDayOfWeek(payoutSchedule?.dayOfWeek || 1);
    setDayOfMonth(payoutSchedule?.dayOfMonth || 1);
    setScheduleError('');
  };
  
  const handleCloseScheduleDialog = () => {
    setOpenScheduleDialog(false);
  };
  
  const handleUpdatePayoutSchedule = () => {
    // Validate minimum amount
    if (minimumAmount < 0) {
      setScheduleError('Minimum amount cannot be negative');
      return;
    }
    
    // Clear error
    setScheduleError('');
    
    // Update payout schedule
    dispatch(updatePayoutSchedule({
      frequency,
      minimumAmount,
      dayOfWeek,
      dayOfMonth
    }))
      .unwrap()
      .then(() => {
        // Close dialog
        handleCloseScheduleDialog();
      })
      .catch((error) => {
        setScheduleError(error.message || 'Failed to update payout schedule');
      });
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Get transaction type label
  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'rental_payment':
        return 'Rental Payment';
      case 'payout':
        return 'Payout';
      case 'refund':
        return 'Refund';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };
  
  // Render method details
  const renderMethodDetails = (type, details) => {
    switch (type) {
      case 'bank_account':
        return (
          <>
            <Typography variant="body2">{details.bankName}</Typography>
            <Typography variant="body2">{details.accountHolderName}</Typography>
            {details.accountNumber && (
              <Typography variant="body2">
                Account ending in {details.accountNumber.slice(-4)}
              </Typography>
            )}
          </>
        );
        
      case 'paypal':
        return <Typography variant="body2">{details.email}</Typography>;
        
      case 'stripe':
        return <Typography variant="body2">Stripe Account</Typography>;
        
      case 'crypto':
        return (
          <>
            <Typography variant="body2">{details.cryptoCurrency}</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {details.walletAddress}
            </Typography>
          </>
        );
        
      default:
        return <Typography variant="body2">Other payment method</Typography>;
    }
  };
  
  // Render method icon
  const renderMethodIcon = (type) => {
    switch (type) {
      case 'bank_account':
        return <AccountBalanceIcon />;
      case 'paypal':
      case 'stripe':
        return <CreditCardIcon />;
      case 'crypto':
        return <PaymentIcon />;
      default:
        return <PaymentIcon />;
    }
  };
  
  // Render method type fields
  const renderMethodTypeFields = () => {
    switch (methodType) {
      case 'bank_account':
        return (
          <>
            <TextField
              margin="dense"
              label="Bank Name"
              fullWidth
              value={methodDetails.bankName || ''}
              onChange={(e) => handleMethodDetailChange('bankName', e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="Account Holder Name"
              fullWidth
              value={methodDetails.accountHolderName || ''}
              onChange={(e) => handleMethodDetailChange('accountHolderName', e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="Account Number"
              fullWidth
              type="password"
              value={methodDetails.accountNumber || ''}
              onChange={(e) => handleMethodDetailChange('accountNumber', e.target.value)}
            />
            <TextField
              margin="dense"
              label="Routing Number"
              fullWidth
              type="password"
              value={methodDetails.routingNumber || ''}
              onChange={(e) => handleMethodDetailChange('routingNumber', e.target.value)}
            />
          </>
        );
        
      case 'paypal':
        return (
          <TextField
            margin="dense"
            label="PayPal Email"
            fullWidth
            type="email"
            value={methodDetails.email || ''}
            onChange={(e) => handleMethodDetailChange('email', e.target.value)}
            required
          />
        );
        
      case 'crypto':
        return (
          <>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Cryptocurrency</InputLabel>
              <Select
                value={methodDetails.cryptoCurrency || ''}
                onChange={(e) => handleMethodDetailChange('cryptoCurrency', e.target.value)}
                label="Cryptocurrency"
              >
                <MenuItem value="BTC">Bitcoin (BTC)</MenuItem>
                <MenuItem value="ETH">Ethereum (ETH)</MenuItem>
                <MenuItem value="USDC">USD Coin (USDC)</MenuItem>
                <MenuItem value="USDT">Tether (USDT)</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Wallet Address"
              fullWidth
              value={methodDetails.walletAddress || ''}
              onChange={(e) => handleMethodDetailChange('walletAddress', e.target.value)}
              required
            />
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Payout Management
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="Balance" icon={<AccountBalanceIcon />} iconPosition="start" />
          <Tab label="Transactions" icon={<HistoryIcon />} iconPosition="start" />
          <Tab label="Payout Methods" icon={<CreditCardIcon />} iconPosition="start" />
          <Tab label="Payout Schedule" icon={<ScheduleIcon />} iconPosition="start" />
        </Tabs>
        
        {/* Balance Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Your Balance" />
                  <CardContent>
                    <Typography variant="h3" component="div" gutterBottom>
                      {formatCurrency(balance?.available || 0, balance?.currency)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Available for payout
                    </Typography>
                    
                    {balance?.pending > 0 && (
                      <>
                        <Typography variant="h6" component="div" sx={{ mt: 2 }}>
                          {formatCurrency(balance?.pending || 0, balance?.currency)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pending (in process)
                        </Typography>
                      </>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Last updated: {balance?.lastUpdated ? formatDate(balance.lastUpdated) : 'Never'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Request Payout" />
                  <CardContent>
                    <TextField
                      label="Amount"
                      type="number"
                      fullWidth
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                      }}
                      sx={{ mb: 2 }}
                    />
                    
                    {payoutMethods.length > 0 ? (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Payout Method</InputLabel>
                        <Select
                          value={selectedPayoutMethod}
                          onChange={(e) => setSelectedPayoutMethod(e.target.value)}
                          label="Payout Method"
                        >
                          {payoutMethods.map((method) => (
                            <MenuItem key={method._id} value={method._id}>
                              {method.type} {method.isDefault ? '(Default)' : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        You need to add a payout method first.
                      </Alert>
                    )}
                    
                    <TextField
                      label="Description (Optional)"
                      fullWidth
                      value={payoutDescription}
                      onChange={(e) => setPayoutDescription(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    
                    {payoutError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {payoutError}
                      </Alert>
                    )}
                    
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleCreatePayout}
                      disabled={loading || !payoutAmount || (payoutMethods.length > 0 && !selectedPayoutMethod)}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Request Payout'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
        
        {/* Transactions Tab */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : balanceTransactions.length === 0 ? (
            <Alert severity="info">
              You don't have any transactions yet.
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {balanceTransactions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                          <TableCell>{getTransactionTypeLabel(transaction.type)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell align="right">
                            <Typography
                              color={transaction.amount < 0 ? 'error' : 'success'}
                              fontWeight="bold"
                            >
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status}
                              color={getStatusColor(transaction.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={balanceTransactions.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </TabPanel>
        
        {/* Payout Methods Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddMethodDialog}
            >
              Add Payout Method
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : payoutMethods.length === 0 ? (
            <Alert severity="info">
              You don't have any payout methods yet. Add one to receive payouts.
            </Alert>
          ) : (
            <List>
              {payoutMethods.map((method) => (
                <Paper key={method._id} sx={{ mb: 2 }}>
                  <ListItem>
                    <Box sx={{ mr: 2 }}>
                      {renderMethodIcon(method.type)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                            {method.type.replace('_', ' ')}
                          </Typography>
                          {method.isDefault && (
                            <Chip
                              label="Default"
                              color="primary"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={renderMethodDetails(method.type, method.details)}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeletePayoutMethod(method._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
          
          {/* Add Payout Method Dialog */}
          <Dialog open={openAddMethodDialog} onClose={handleCloseAddMethodDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Add Payout Method</DialogTitle>
            <DialogContent>
              <FormControl fullWidth margin="dense">
                <InputLabel>Method Type</InputLabel>
                <Select
                  value={methodType}
                  onChange={handleMethodTypeChange}
                  label="Method Type"
                >
                  <MenuItem value="bank_account">Bank Account</MenuItem>
                  <MenuItem value="paypal">PayPal</MenuItem>
                  <MenuItem value="crypto">Cryptocurrency</MenuItem>
                </Select>
                <FormHelperText>Select the type of payout method you want to add</FormHelperText>
              </FormControl>
              
              {methodType && renderMethodTypeFields()}
              
              <Box sx={{ mt: 2 }}>
                <FormControl>
                  <Typography variant="body2" gutterBottom>
                    Set as default payout method
                  </Typography>
                  <Select
                    value={isDefault ? 'yes' : 'no'}
                    onChange={(e) => setIsDefault(e.target.value === 'yes')}
                    size="small"
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {methodError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {methodError}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAddMethodDialog}>Cancel</Button>
              <Button
                onClick={handleAddPayoutMethod}
                color="primary"
                disabled={!methodType}
              >
                Add Method
              </Button>
            </DialogActions>
          </Dialog>
        </TabPanel>
        
        {/* Payout Schedule Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardHeader
              title="Payout Schedule"
              action={
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleOpenScheduleDialog}
                >
                  Edit
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Frequency
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {payoutSchedule?.frequency || 'Manual'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Minimum Amount
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(payoutSchedule?.minimumAmount || 100)}
                  </Typography>
                </Grid>
                
                {payoutSchedule?.frequency === 'weekly' || payoutSchedule?.frequency === 'biweekly' ? (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Day of Week
                    </Typography>
                    <Typography variant="body1">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][payoutSchedule?.dayOfWeek || 1]}
                    </Typography>
                  </Grid>
                ) : payoutSchedule?.frequency === 'monthly' ? (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Day of Month
                    </Typography>
                    <Typography variant="body1">
                      {payoutSchedule?.dayOfMonth || 1}
                    </Typography>
                  </Grid>
                ) : null}
                
                {payoutSchedule?.nextPayoutDate && payoutSchedule?.frequency !== 'manual' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Next Scheduled Payout
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(payoutSchedule.nextPayoutDate)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                  {payoutSchedule?.frequency === 'manual' ? (
                    'You have chosen to request payouts manually. You can change this to automatic payouts by editing your payout schedule.'
                  ) : (
                    `You will receive automatic payouts ${payoutSchedule?.frequency} when your available balance is at least ${formatCurrency(payoutSchedule?.minimumAmount || 100)}.`
                  )}
                </Alert>
              </Box>
            </CardContent>
          </Card>
          
          {/* Edit Payout Schedule Dialog */}
          <Dialog open={openScheduleDialog} onClose={handleCloseScheduleDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Payout Schedule</DialogTitle>
            <DialogContent>
              <FormControl fullWidth margin="dense">
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  label="Frequency"
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="biweekly">Biweekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
                <FormHelperText>
                  How often you want to receive automatic payouts
                </FormHelperText>
              </FormControl>
              
              <TextField
                margin="dense"
                label="Minimum Amount"
                type="number"
                fullWidth
                value={minimumAmount}
                onChange={(e) => setMinimumAmount(parseFloat(e.target.value))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
                helperText="Minimum balance required for automatic payout"
              />
              
              {(frequency === 'weekly' || frequency === 'biweekly') && (
                <FormControl fullWidth margin="dense">
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                    label="Day of Week"
                  >
                    <MenuItem value={0}>Sunday</MenuItem>
                    <MenuItem value={1}>Monday</MenuItem>
                    <MenuItem value={2}>Tuesday</MenuItem>
                    <MenuItem value={3}>Wednesday</MenuItem>
                    <MenuItem value={4}>Thursday</MenuItem>
                    <MenuItem value={5}>Friday</MenuItem>
                    <MenuItem value={6}>Saturday</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              {frequency === 'monthly' && (
                <TextField
                  margin="dense"
                  label="Day of Month"
                  type="number"
                  fullWidth
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 31 }}
                  helperText="Day of month for automatic payouts (1-31)"
                />
              )}
              
              {scheduleError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {scheduleError}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseScheduleDialog}>Cancel</Button>
              <Button
                onClick={handleUpdatePayoutSchedule}
                color="primary"
              >
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default PayoutManagement;
