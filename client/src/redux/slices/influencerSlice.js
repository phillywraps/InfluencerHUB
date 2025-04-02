import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { influencerAPI } from '../../services/api';

// Get influencer profile
export const getInfluencerProfile = createAsyncThunk(
  'influencer/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getProfile();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile');
    }
  }
);

// Update influencer profile
export const updateInfluencerProfile = createAsyncThunk(
  'influencer/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.updateProfile(profileData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Add social media account
export const addSocialAccount = createAsyncThunk(
  'influencer/addSocialAccount',
  async (accountData, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.addSocialAccount(accountData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add social account');
    }
  }
);

// Update social media account
export const updateSocialAccount = createAsyncThunk(
  'influencer/updateSocialAccount',
  async (data, { rejectWithValue }) => {
    try {
      const { accountId, ...accountData } = data;
      const response = await influencerAPI.updateSocialAccount(accountId, accountData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update social account');
    }
  }
);

// Delete social media account
export const deleteSocialAccount = createAsyncThunk(
  'influencer/deleteSocialAccount',
  async (accountId, { rejectWithValue }) => {
    try {
      await influencerAPI.deleteSocialAccount(accountId);
      return accountId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete social account');
    }
  }
);

// Rotate API key
export const rotateApiKey = createAsyncThunk(
  'influencer/rotateApiKey',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.rotateApiKey(accountId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to rotate API key');
    }
  }
);

// Get API key security settings
export const getApiKeySecuritySettings = createAsyncThunk(
  'influencer/getApiKeySecuritySettings',
  async ({ socialAccountId }, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getApiKeySecuritySettings(socialAccountId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get API key security settings');
    }
  }
);

// Update API key rotation settings
export const updateApiKeyRotationSettings = createAsyncThunk(
  'influencer/updateApiKeyRotationSettings',
  async ({ socialAccountId, settings }, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.updateApiKeyRotationSettings(socialAccountId, settings);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update API key rotation settings');
    }
  }
);

// Get API key usage statistics
export const getApiKeyUsage = createAsyncThunk(
  'influencer/getApiKeyUsage',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getApiKeyUsage(accountId);
      return { accountId, usageData: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get API key usage');
    }
  }
);

// Get API key rentals
export const getApiKeyRentals = createAsyncThunk(
  'influencer/getApiKeyRentals',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getApiKeyRentals(accountId);
      return { accountId, rentals: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get API key rentals');
    }
  }
);

// Update API key status
export const updateApiKeyStatus = createAsyncThunk(
  'influencer/updateApiKeyStatus',
  async ({ accountId, statusData }, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.updateApiKeyStatus(accountId, statusData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update API key status');
    }
  }
);

// Get all influencers
export const getAllInfluencers = createAsyncThunk(
  'influencer/getAllInfluencers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getAllInfluencers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get influencers');
    }
  }
);

// Get influencer by ID
export const getInfluencerById = createAsyncThunk(
  'influencer/getInfluencerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getInfluencerById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get influencer');
    }
  }
);

// Get featured influencers
export const getFeaturedInfluencers = createAsyncThunk(
  'influencer/getFeaturedInfluencers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getFeaturedInfluencers();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get featured influencers');
    }
  }
);

// Get top influencers
export const getTopInfluencers = createAsyncThunk(
  'influencer/getTopInfluencers',
  async (category, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getTopInfluencers(category);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get top influencers');
    }
  }
);

// Get trending influencers
export const getTrendingInfluencers = createAsyncThunk(
  'influencer/getTrendingInfluencers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getTrendingInfluencers();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get trending influencers');
    }
  }
);

// Get influencers by platform
export const getInfluencersByPlatform = createAsyncThunk(
  'influencer/getInfluencersByPlatform',
  async ({ platform, params }, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getInfluencersByPlatform(platform, params);
      return { 
        platform, 
        data: response.data.data,
        count: response.data.count
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get influencers by platform');
    }
  }
);

// Get influencer statistics
export const getInfluencerStatistics = createAsyncThunk(
  'influencer/getInfluencerStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await influencerAPI.getInfluencerStatistics();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get influencer statistics');
    }
  }
);

const initialState = {
  profile: null,
  influencers: [],
  currentInfluencer: null,
  loading: false,
  error: null,
  totalCount: 0,
  apiKeyUsage: {},
  apiKeyRentals: {},
  apiKeySecuritySettings: null,
  rotationSuccess: false,
  updateSuccess: false,
  featuredInfluencers: [],
  topInfluencers: [],
  trendingInfluencers: [],
  influencersByPlatform: {},
  platformTotalCounts: {},
  statistics: null,
  loadingFeatured: false,
  loadingTop: false,
  loadingTrending: false,
  loadingByPlatform: {},
  loadingStatistics: false,
  errorFeatured: null,
  errorTop: null,
  errorTrending: null,
  errorByPlatform: {},
  errorStatistics: null
};

const influencerSlice = createSlice({
  name: 'influencer',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentInfluencer: (state) => {
      state.currentInfluencer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Profile
      .addCase(getInfluencerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInfluencerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getInfluencerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateInfluencerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInfluencerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateInfluencerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Social Account
      .addCase(addSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(addSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Social Account
      .addCase(updateSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Social Account
      .addCase(deleteSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.socialAccounts = state.profile.socialAccounts.filter(
            (account) => account._id !== action.payload
          );
        }
      })
      .addCase(deleteSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get All Influencers
      .addCase(getAllInfluencers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllInfluencers.fulfilled, (state, action) => {
        state.loading = false;
        state.influencers = action.payload.data;
        state.totalCount = action.payload.count;
      })
      .addCase(getAllInfluencers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Influencer By ID
      .addCase(getInfluencerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInfluencerById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInfluencer = action.payload;
      })
      .addCase(getInfluencerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Rotate API Key
      .addCase(rotateApiKey.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rotateApiKey.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(rotateApiKey.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get API Key Usage
      .addCase(getApiKeyUsage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApiKeyUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeyUsage[action.payload.accountId] = action.payload.usageData;
      })
      .addCase(getApiKeyUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get API Key Rentals
      .addCase(getApiKeyRentals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApiKeyRentals.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeyRentals[action.payload.accountId] = action.payload.rentals;
      })
      .addCase(getApiKeyRentals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Featured Influencers
      .addCase(getFeaturedInfluencers.pending, (state) => {
        state.loadingFeatured = true;
        state.errorFeatured = null;
      })
      .addCase(getFeaturedInfluencers.fulfilled, (state, action) => {
        state.loadingFeatured = false;
        state.featuredInfluencers = action.payload;
      })
      .addCase(getFeaturedInfluencers.rejected, (state, action) => {
        state.loadingFeatured = false;
        state.errorFeatured = action.payload;
      })
      
      // Get Top Influencers
      .addCase(getTopInfluencers.pending, (state) => {
        state.loadingTop = true;
        state.errorTop = null;
      })
      .addCase(getTopInfluencers.fulfilled, (state, action) => {
        state.loadingTop = false;
        state.topInfluencers = action.payload;
      })
      .addCase(getTopInfluencers.rejected, (state, action) => {
        state.loadingTop = false;
        state.errorTop = action.payload;
      })
      
      // Get Trending Influencers
      .addCase(getTrendingInfluencers.pending, (state) => {
        state.loadingTrending = true;
        state.errorTrending = null;
      })
      .addCase(getTrendingInfluencers.fulfilled, (state, action) => {
        state.loadingTrending = false;
        state.trendingInfluencers = action.payload;
      })
      .addCase(getTrendingInfluencers.rejected, (state, action) => {
        state.loadingTrending = false;
        state.errorTrending = action.payload;
      })
      
      // Get Influencers By Platform
      .addCase(getInfluencersByPlatform.pending, (state, action) => {
        const platform = action.meta.arg.platform;
        state.loadingByPlatform = {
          ...state.loadingByPlatform,
          [platform]: true
        };
        state.errorByPlatform = {
          ...state.errorByPlatform,
          [platform]: null
        };
      })
      .addCase(getInfluencersByPlatform.fulfilled, (state, action) => {
        const { platform, data, count } = action.payload;
        state.loadingByPlatform = {
          ...state.loadingByPlatform,
          [platform]: false
        };
        state.influencersByPlatform = {
          ...state.influencersByPlatform,
          [platform]: data
        };
        state.platformTotalCounts = {
          ...state.platformTotalCounts,
          [platform]: count
        };
      })
      .addCase(getInfluencersByPlatform.rejected, (state, action) => {
        const platform = action.meta.arg.platform;
        state.loadingByPlatform = {
          ...state.loadingByPlatform,
          [platform]: false
        };
        state.errorByPlatform = {
          ...state.errorByPlatform,
          [platform]: action.payload
        };
      })
      
      // Get Influencer Statistics
      .addCase(getInfluencerStatistics.pending, (state) => {
        state.loadingStatistics = true;
        state.errorStatistics = null;
      })
      .addCase(getInfluencerStatistics.fulfilled, (state, action) => {
        state.loadingStatistics = false;
        state.statistics = action.payload;
      })
      .addCase(getInfluencerStatistics.rejected, (state, action) => {
        state.loadingStatistics = false;
        state.errorStatistics = action.payload;
      })

      // Update API Key Status
      .addCase(updateApiKeyStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateApiKeyStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateApiKeyStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get API Key Security Settings
      .addCase(getApiKeySecuritySettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApiKeySecuritySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeySecuritySettings = action.payload;
      })
      .addCase(getApiKeySecuritySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update API Key Rotation Settings
      .addCase(updateApiKeyRotationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateApiKeyRotationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeySecuritySettings = action.payload;
        state.updateSuccess = true;
      })
      .addCase(updateApiKeyRotationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })
      
      // Rotate API Key (updated to set rotationSuccess)
      .addCase(rotateApiKey.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.rotationSuccess = false;
      })
      .addCase(rotateApiKey.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeySecuritySettings = action.payload;
        state.rotationSuccess = true;
      })
      .addCase(rotateApiKey.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.rotationSuccess = false;
      });
  },
});

export const { clearError, clearCurrentInfluencer } = influencerSlice.actions;

export default influencerSlice.reducer;
