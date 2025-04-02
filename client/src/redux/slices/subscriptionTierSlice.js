import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { setAlert } from './alertSlice';

// Async thunks
export const getSubscriptionTiers = createAsyncThunk(
  'subscriptionTiers/getSubscriptionTiers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/subscription-tiers');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch subscription tiers'
      );
    }
  }
);

export const getSubscriptionTiersByPlatform = createAsyncThunk(
  'subscriptionTiers/getSubscriptionTiersByPlatform',
  async ({ platform, influencerId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/subscription-tiers/${platform}?influencerId=${influencerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch subscription tiers for platform'
      );
    }
  }
);

export const getDefaultSubscriptionTier = createAsyncThunk(
  'subscriptionTiers/getDefaultSubscriptionTier',
  async ({ platform, influencerId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/subscription-tiers/default/${platform}?influencerId=${influencerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch default subscription tier'
      );
    }
  }
);

export const createSubscriptionTier = createAsyncThunk(
  'subscriptionTiers/createSubscriptionTier',
  async (tierData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/subscription-tiers', tierData);
      dispatch(setAlert({
        type: 'success',
        message: 'Subscription tier created successfully'
      }));
      return response.data;
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create subscription tier'
      }));
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create subscription tier'
      );
    }
  }
);

export const updateSubscriptionTier = createAsyncThunk(
  'subscriptionTiers/updateSubscriptionTier',
  async ({ id, tierData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`/subscription-tiers/${id}`, tierData);
      dispatch(setAlert({
        type: 'success',
        message: 'Subscription tier updated successfully'
      }));
      return response.data;
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update subscription tier'
      }));
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update subscription tier'
      );
    }
  }
);

export const deleteSubscriptionTier = createAsyncThunk(
  'subscriptionTiers/deleteSubscriptionTier',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/subscription-tiers/${id}`);
      dispatch(setAlert({
        type: 'success',
        message: 'Subscription tier deleted successfully'
      }));
      return id;
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete subscription tier'
      }));
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete subscription tier'
      );
    }
  }
);

export const setDefaultSubscriptionTier = createAsyncThunk(
  'subscriptionTiers/setDefaultSubscriptionTier',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`/subscription-tiers/${id}/default`);
      dispatch(setAlert({
        type: 'success',
        message: 'Default subscription tier set successfully'
      }));
      return response.data;
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to set default subscription tier'
      }));
      return rejectWithValue(
        error.response?.data?.message || 'Failed to set default subscription tier'
      );
    }
  }
);

export const createDefaultSubscriptionTiers = createAsyncThunk(
  'subscriptionTiers/createDefaultSubscriptionTiers',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/subscription-tiers/create-defaults');
      dispatch(setAlert({
        type: 'success',
        message: 'Default subscription tiers created successfully'
      }));
      return response.data;
    } catch (error) {
      dispatch(setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create default subscription tiers'
      }));
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create default subscription tiers'
      );
    }
  }
);

// Initial state
const initialState = {
  tiers: [],
  platformTiers: [],
  defaultTier: null,
  loading: false,
  error: null,
  success: false
};

// Slice
const subscriptionTierSlice = createSlice({
  name: 'subscriptionTiers',
  initialState,
  reducers: {
    resetSubscriptionTierState: (state) => {
      state.error = null;
      state.success = false;
    },
    clearPlatformTiers: (state) => {
      state.platformTiers = [];
    },
    clearDefaultTier: (state) => {
      state.defaultTier = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // getSubscriptionTiers
      .addCase(getSubscriptionTiers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptionTiers.fulfilled, (state, action) => {
        state.loading = false;
        state.tiers = action.payload.data;
      })
      .addCase(getSubscriptionTiers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // getSubscriptionTiersByPlatform
      .addCase(getSubscriptionTiersByPlatform.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptionTiersByPlatform.fulfilled, (state, action) => {
        state.loading = false;
        state.platformTiers = action.payload.data;
      })
      .addCase(getSubscriptionTiersByPlatform.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // getDefaultSubscriptionTier
      .addCase(getDefaultSubscriptionTier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDefaultSubscriptionTier.fulfilled, (state, action) => {
        state.loading = false;
        state.defaultTier = action.payload.data;
      })
      .addCase(getDefaultSubscriptionTier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // createSubscriptionTier
      .addCase(createSubscriptionTier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createSubscriptionTier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.tiers.push(action.payload.data);
      })
      .addCase(createSubscriptionTier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // updateSubscriptionTier
      .addCase(updateSubscriptionTier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateSubscriptionTier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Update in tiers array
        const index = state.tiers.findIndex(tier => tier._id === action.payload.data._id);
        if (index !== -1) {
          state.tiers[index] = action.payload.data;
        }
        
        // Update in platformTiers array if present
        const platformIndex = state.platformTiers.findIndex(tier => tier._id === action.payload.data._id);
        if (platformIndex !== -1) {
          state.platformTiers[platformIndex] = action.payload.data;
        }
        
        // Update defaultTier if this is the default tier
        if (state.defaultTier && state.defaultTier._id === action.payload.data._id) {
          state.defaultTier = action.payload.data;
        }
      })
      .addCase(updateSubscriptionTier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // deleteSubscriptionTier
      .addCase(deleteSubscriptionTier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteSubscriptionTier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.tiers = state.tiers.filter(tier => tier._id !== action.payload);
        state.platformTiers = state.platformTiers.filter(tier => tier._id !== action.payload);
        
        // Clear defaultTier if it was deleted
        if (state.defaultTier && state.defaultTier._id === action.payload) {
          state.defaultTier = null;
        }
      })
      .addCase(deleteSubscriptionTier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // setDefaultSubscriptionTier
      .addCase(setDefaultSubscriptionTier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(setDefaultSubscriptionTier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Update the tier in the tiers array
        const updatedTier = action.payload.data;
        const platform = updatedTier.platform;
        
        // Update isDefault flag for all tiers of this platform
        state.tiers = state.tiers.map(tier => {
          if (tier.platform === platform) {
            return {
              ...tier,
              isDefault: tier._id === updatedTier._id
            };
          }
          return tier;
        });
        
        // Update isDefault flag for all platformTiers
        state.platformTiers = state.platformTiers.map(tier => {
          if (tier.platform === platform) {
            return {
              ...tier,
              isDefault: tier._id === updatedTier._id
            };
          }
          return tier;
        });
        
        // Update defaultTier
        state.defaultTier = updatedTier;
      })
      .addCase(setDefaultSubscriptionTier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // createDefaultSubscriptionTiers
      .addCase(createDefaultSubscriptionTiers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createDefaultSubscriptionTiers.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Add new tiers to the tiers array
        const newTiers = action.payload.data;
        
        // Filter out any tiers that already exist
        const uniqueNewTiers = newTiers.filter(
          newTier => !state.tiers.some(tier => tier._id === newTier._id)
        );
        
        state.tiers = [...state.tiers, ...uniqueNewTiers];
      })
      .addCase(createDefaultSubscriptionTiers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { 
  resetSubscriptionTierState, 
  clearPlatformTiers, 
  clearDefaultTier 
} = subscriptionTierSlice.actions;

export default subscriptionTierSlice.reducer;
