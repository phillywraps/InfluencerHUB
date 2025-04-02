import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  // Transaction state
  transactions: [],
  transactionsLoading: false,
  transactionsError: null,
  transactionsTotal: 0,
  
  // Subscription state
  subscriptions: [],
  subscriptionsLoading: false,
  subscriptionsError: null,
  
  // Exchange rates state
  exchangeRates: null,
  exchangeRatesLoading: false,
  exchangeRatesError: null,
  
  // Active payment state
  activePayment: null,
  paymentLoading: false,
  paymentError: null
};

// Async thunks
export const fetchCryptoTransactions = createAsyncThunk(
  'payment/fetchCryptoTransactions',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/payments/crypto/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchCryptoSubscriptions = createAsyncThunk(
  'payment/fetchCryptoSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/payments/crypto/subscriptions');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscriptions');
    }
  }
);

export const fetchExchangeRates = createAsyncThunk(
  'payment/fetchExchangeRates',
  async (currency = 'USD', { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/payments/crypto/rates?currency=${currency}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exchange rates');
    }
  }
);

export const createCryptoCharge = createAsyncThunk(
  'payment/createCryptoCharge',
  async (chargeData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/payments/crypto/charges', chargeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create charge');
    }
  }
);

export const checkCryptoCharge = createAsyncThunk(
  'payment/checkCryptoCharge',
  async (chargeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/payments/crypto/charges/${chargeId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check charge status');
    }
  }
);

export const cancelCryptoCharge = createAsyncThunk(
  'payment/cancelCryptoCharge',
  async (chargeId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/payments/crypto/charges/${chargeId}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel charge');
    }
  }
);

export const createCryptoSubscription = createAsyncThunk(
  'payment/createCryptoSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/payments/crypto/subscriptions', subscriptionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subscription');
    }
  }
);

export const cancelCryptoSubscription = createAsyncThunk(
  'payment/cancelCryptoSubscription',
  async (subscriptionId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/payments/crypto/subscriptions/${subscriptionId}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel subscription');
    }
  }
);

// Payment slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.paymentError = null;
    },
    clearActivePayment: (state) => {
      state.activePayment = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchCryptoTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.transactionsError = null;
      })
      .addCase(fetchCryptoTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload.data.transactions;
        state.transactionsTotal = action.payload.data.pagination.total;
      })
      .addCase(fetchCryptoTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.transactionsError = action.payload;
      })
      
      // Fetch subscriptions
      .addCase(fetchCryptoSubscriptions.pending, (state) => {
        state.subscriptionsLoading = true;
        state.subscriptionsError = null;
      })
      .addCase(fetchCryptoSubscriptions.fulfilled, (state, action) => {
        state.subscriptionsLoading = false;
        state.subscriptions = action.payload.data.subscriptions;
      })
      .addCase(fetchCryptoSubscriptions.rejected, (state, action) => {
        state.subscriptionsLoading = false;
        state.subscriptionsError = action.payload;
      })
      
      // Fetch exchange rates
      .addCase(fetchExchangeRates.pending, (state) => {
        state.exchangeRatesLoading = true;
        state.exchangeRatesError = null;
      })
      .addCase(fetchExchangeRates.fulfilled, (state, action) => {
        state.exchangeRatesLoading = false;
        state.exchangeRates = action.payload.data;
      })
      .addCase(fetchExchangeRates.rejected, (state, action) => {
        state.exchangeRatesLoading = false;
        state.exchangeRatesError = action.payload;
      })
      
      // Create crypto charge
      .addCase(createCryptoCharge.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(createCryptoCharge.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.activePayment = action.payload.data;
      })
      .addCase(createCryptoCharge.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      
      // Check crypto charge
      .addCase(checkCryptoCharge.pending, (state) => {
        state.paymentLoading = true;
      })
      .addCase(checkCryptoCharge.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.activePayment = action.payload.data;
        
        // Update transaction in the list if it exists
        if (state.transactions.length > 0) {
          const index = state.transactions.findIndex(
            t => t.orderNumber === action.payload.data.id
          );
          
          if (index !== -1) {
            state.transactions[index] = {
              ...state.transactions[index],
              status: action.payload.data.status,
              updatedAt: action.payload.data.updatedAt
            };
          }
        }
      })
      .addCase(checkCryptoCharge.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      
      // Cancel crypto charge
      .addCase(cancelCryptoCharge.pending, (state) => {
        state.paymentLoading = true;
      })
      .addCase(cancelCryptoCharge.fulfilled, (state, action) => {
        state.paymentLoading = false;
        
        // Update active payment if it matches
        if (state.activePayment && state.activePayment.id === action.payload.data.id) {
          state.activePayment.status = 'canceled';
        }
        
        // Update transaction in the list if it exists
        if (state.transactions.length > 0) {
          const index = state.transactions.findIndex(
            t => t.orderNumber === action.payload.data.id
          );
          
          if (index !== -1) {
            state.transactions[index] = {
              ...state.transactions[index],
              status: 'canceled'
            };
          }
        }
      })
      .addCase(cancelCryptoCharge.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      
      // Create crypto subscription
      .addCase(createCryptoSubscription.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(createCryptoSubscription.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.activePayment = action.payload.data;
      })
      .addCase(createCryptoSubscription.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      
      // Cancel crypto subscription
      .addCase(cancelCryptoSubscription.pending, (state) => {
        state.paymentLoading = true;
      })
      .addCase(cancelCryptoSubscription.fulfilled, (state, action) => {
        state.paymentLoading = false;
        
        // Update subscription in the list if it exists
        if (state.subscriptions.length > 0) {
          const index = state.subscriptions.findIndex(
            s => s._id === action.payload.data.id
          );
          
          if (index !== -1) {
            state.subscriptions[index] = {
              ...state.subscriptions[index],
              status: 'canceled'
            };
          }
        }
      })
      .addCase(cancelCryptoSubscription.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      });
  }
});

// Export actions
export const { clearPaymentError, clearActivePayment } = paymentSlice.actions;

// Export selectors
export const selectPaymentState = (state) => state.payment;

export default paymentSlice.reducer;
