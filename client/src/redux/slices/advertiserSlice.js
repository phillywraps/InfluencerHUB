import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { advertiserAPI } from '../../services/api';

// Get advertiser profile
export const getAdvertiserProfile = createAsyncThunk(
  'advertiser/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.getProfile();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile');
    }
  }
);

// Update advertiser profile
export const updateAdvertiserProfile = createAsyncThunk(
  'advertiser/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.updateProfile(profileData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Add payment method
export const addPaymentMethod = createAsyncThunk(
  'advertiser/addPaymentMethod',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.addPaymentMethod(paymentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add payment method');
    }
  }
);

// Update payment method
export const updatePaymentMethod = createAsyncThunk(
  'advertiser/updatePaymentMethod',
  async ({ methodId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.updatePaymentMethod(methodId, paymentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment method');
    }
  }
);

// Delete payment method
export const deletePaymentMethod = createAsyncThunk(
  'advertiser/deletePaymentMethod',
  async (methodId, { rejectWithValue }) => {
    try {
      await advertiserAPI.deletePaymentMethod(methodId);
      return methodId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete payment method');
    }
  }
);

// Get all campaigns
export const getCampaigns = createAsyncThunk(
  'advertiser/getCampaigns',
  async (_, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.getCampaigns();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get campaigns');
    }
  }
);

// Get campaign by ID
export const getCampaignById = createAsyncThunk(
  'advertiser/getCampaignById',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.getCampaignById(campaignId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get campaign');
    }
  }
);

// Add campaign
export const addCampaign = createAsyncThunk(
  'advertiser/addCampaign',
  async (campaignData, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.addCampaign(campaignData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add campaign');
    }
  }
);

// Update campaign
export const updateCampaign = createAsyncThunk(
  'advertiser/updateCampaign',
  async ({ campaignId, campaignData }, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.updateCampaign(campaignId, campaignData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update campaign');
    }
  }
);

// Delete campaign
export const deleteCampaign = createAsyncThunk(
  'advertiser/deleteCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      await advertiserAPI.deleteCampaign(campaignId);
      return campaignId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete campaign');
    }
  }
);

// Update campaign metrics
export const updateCampaignMetrics = createAsyncThunk(
  'advertiser/updateCampaignMetrics',
  async ({ campaignId, metricsData }, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.updateCampaignMetrics(campaignId, metricsData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update campaign metrics');
    }
  }
);

// Get campaign analytics
export const getCampaignAnalytics = createAsyncThunk(
  'advertiser/getCampaignAnalytics',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.getCampaignAnalytics(campaignId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get campaign analytics');
    }
  }
);

// Add rental to campaign
export const addRentalToCampaign = createAsyncThunk(
  'advertiser/addRentalToCampaign',
  async ({ campaignId, rentalId }, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.addRentalToCampaign(campaignId, rentalId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add rental to campaign');
    }
  }
);

// Remove rental from campaign
export const removeRentalFromCampaign = createAsyncThunk(
  'advertiser/removeRentalFromCampaign',
  async ({ campaignId, rentalId }, { rejectWithValue }) => {
    try {
      const response = await advertiserAPI.removeRentalFromCampaign(campaignId, rentalId);
      return { campaignId, rentalId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove rental from campaign');
    }
  }
);

const initialState = {
  profile: null,
  loading: false,
  error: null,
  currentCampaign: null,
  campaignAnalytics: null,
};

const advertiserSlice = createSlice({
  name: 'advertiser',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Profile
      .addCase(getAdvertiserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdvertiserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getAdvertiserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateAdvertiserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdvertiserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateAdvertiserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Payment Method
      .addCase(addPaymentMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(addPaymentMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Payment Method
      .addCase(updatePaymentMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updatePaymentMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Payment Method
      .addCase(deletePaymentMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePaymentMethod.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.paymentMethods = state.profile.paymentMethods.filter(
            (method) => method._id !== action.payload
          );
        }
      })
      .addCase(deletePaymentMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Campaign
      .addCase(addCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(addCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Campaign
      .addCase(updateCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Campaign
      .addCase(deleteCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.campaigns = state.profile.campaigns.filter(
            (campaign) => campaign._id !== action.payload
          );
        }
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Campaigns
      .addCase(getCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.campaigns = action.payload;
        }
      })
      .addCase(getCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Campaign By ID
      .addCase(getCampaignById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentCampaign = null;
      })
      .addCase(getCampaignById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCampaign = action.payload;
      })
      .addCase(getCampaignById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Campaign Metrics
      .addCase(updateCampaignMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCampaignMetrics.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          const campaignIndex = state.profile.campaigns.findIndex(
            (campaign) => campaign._id === action.payload._id
          );
          if (campaignIndex !== -1) {
            state.profile.campaigns[campaignIndex] = action.payload;
          }
        }
        if (state.currentCampaign && state.currentCampaign._id === action.payload._id) {
          state.currentCampaign = action.payload;
        }
      })
      .addCase(updateCampaignMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Campaign Analytics
      .addCase(getCampaignAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.campaignAnalytics = null;
      })
      .addCase(getCampaignAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.campaignAnalytics = action.payload;
      })
      .addCase(getCampaignAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Rental to Campaign
      .addCase(addRentalToCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRentalToCampaign.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          const campaignIndex = state.profile.campaigns.findIndex(
            (campaign) => campaign._id === action.payload._id
          );
          if (campaignIndex !== -1) {
            state.profile.campaigns[campaignIndex] = action.payload;
          }
        }
        if (state.currentCampaign && state.currentCampaign._id === action.payload._id) {
          state.currentCampaign = action.payload;
        }
      })
      .addCase(addRentalToCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove Rental from Campaign
      .addCase(removeRentalFromCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeRentalFromCampaign.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          const campaignIndex = state.profile.campaigns.findIndex(
            (campaign) => campaign._id === action.payload.campaignId
          );
          if (campaignIndex !== -1) {
            state.profile.campaigns[campaignIndex].rentals = state.profile.campaigns[campaignIndex].rentals.filter(
              (rentalId) => rentalId !== action.payload.rentalId
            );
          }
        }
        if (state.currentCampaign && state.currentCampaign._id === action.payload.campaignId) {
          state.currentCampaign.rentals = state.currentCampaign.rentals.filter(
            (rentalId) => rentalId !== action.payload.rentalId
          );
        }
      })
      .addCase(removeRentalFromCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = advertiserSlice.actions;

export default advertiserSlice.reducer;
