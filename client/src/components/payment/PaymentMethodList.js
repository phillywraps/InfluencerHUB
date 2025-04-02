import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { getPaymentMethods, deletePaymentMethod } from '../../redux/slices/paymentSlice';

const PaymentMethodList = ({ onAddNew }) => {
  const dispatch = useDispatch();
  const { paymentMethods, loading, error } = useSelector((state) => state.payment);

  useEffect(() => {
    dispatch(getPaymentMethods());
  }, [dispatch]);

  const handleDeletePaymentMethod = (methodId) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      dispatch(deletePaymentMethod(methodId));
    }
  };

  const formatCardBrand = (brand) => {
    switch (brand) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      case 'discover':
        return 'Discover';
      case 'diners':
        return 'Diners Club';
      case 'jcb':
        return 'JCB';
      case 'unionpay':
        return 'UnionPay';
      default:
        return brand;
    }
  };

  const formatExpiryDate = (month, year) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Payment Methods</Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={onAddNew}
          disabled={loading}
        >
          Add New Card
        </Button>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : paymentMethods.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No payment methods found. Add a payment method to get started.
          </Typography>
        </Box>
      ) : (
        <List>
          {paymentMethods.map((method, index) => (
            <React.Fragment key={method.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem>
                <CreditCardIcon sx={{ mr: 2, color: 'primary.main' }} />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {formatCardBrand(method.card.brand)} •••• {method.card.last4}
                      </Typography>
                      {method.isDefault && (
                        <Chip
                          label="Default"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={`Expires ${formatExpiryDate(method.card.expMonth, method.card.expYear)}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeletePaymentMethod(method.id)}
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default PaymentMethodList;
