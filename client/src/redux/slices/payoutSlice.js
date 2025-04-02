import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const getBalance = createAsyncThunk(
  'payout/getBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payouts/balance');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get balance');
    }
  }
);

export const getBalanceTransactions = createAsyncThunk(
  'payout/getBalanceTransactions',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/payouts/transactions', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get balance transactions');
    }
  }
);

export const createPayout = createAsyncThunk(
  'payout/createPayout',
  async (payoutData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payouts', payoutData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payout');
    }
  }
);

export const getPayoutMethods = createAsyncThunk(
  'payout/getPayoutMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payouts/methods');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get payout methods');
    }
  }
);

export const addPayoutMethod = createAsyncThunk(
  'payout/addPayoutMethod',
  async (methodData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payouts/methods', methodData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add payout method');
    }
  }
);

export const deletePayoutMethod = createAsyncThunk(
  'payout/deletePayoutMethod',
  async (methodId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/payouts/methods/${methodId}`);
      return { methodId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete payout method');
    }
  }
);

export const updatePayoutSchedule = createAsyncThunk(
  'payout/updatePayoutSchedule',
  async (scheduleData, { rejectWithValue }) => {
    try {
      const response = await api.put('/payouts/schedule', scheduleData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payout schedule');
    }
  }
);

// Initial state
const initialState = {
  balance: null,
  balanceTransactions: [],
  payoutMethods: [],
  payoutSchedule: null,
  loading: false,
  error: null,
  success: false
};

// Slice
const payoutSlice = createSlice({
  name: 'payout',
  initialState,
  reducers: {
    clearPayoutState: (state) => {
      state.balance = null;
      state.balanceTransactions = [];
      state.payoutMethods = [];
      state.payoutSchedule = null;
      state.success = false;
      state.error = null;
    },
    setPayoutSuccess: (state, action) => {
      state.success = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get balance
      .addCase(getBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload;
      })
      .addCase(getBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get balance transactions
      .addCase(getBalanceTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBalanceTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.balanceTransactions = action.payload;
      })
      .addCase(getBalanceTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create payout
      .addCase(createPayout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayout.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Add the new payout to the balance transactions
        if (action.payload.balanceTransaction) {
          state.balanceTransactions.unshift(action.payload.balanceTransaction);
        }
        
        // Update balance
        if (state.balance) {
          state.balance.available -= action.payload.payout.amount;
          state.balance.pending += action.payload.payout.amount;
          state.balance.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(createPayout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get payout methods
      .addCase(getPayoutMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPayoutMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.payoutMethods = action.payload;
      })
      .addCase(getPayoutMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add payout method
      .addCase(addPayoutMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPayoutMethod.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Add the new payout method
        state.payoutMethods.push(action.payload);
        
        // If this is the default method, update other methods
        if (action.payload.isDefault) {
          state.payoutMethods.forEach(method => {
            if (method._id !== action.payload._id) {
              method.isDefault = false;
            }
          });
        }
      })
      .addCase(addPayoutMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete payout method
      .addCase(deletePayoutMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePayoutMethod.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Remove the deleted payout method
        state.payoutMethods = state.payoutMethods.filter(
          method => method._id !== action.payload.methodId
        );
      })
      .addCase(deletePayoutMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update payout schedule
      .addCase(updatePayoutSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePayoutSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.payoutSchedule = action.payload;
      })
      .addCase(updatePayoutSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearPayoutState, setPayoutSuccess } = payoutSlice.actions;

export default payoutSlice.reducer;
