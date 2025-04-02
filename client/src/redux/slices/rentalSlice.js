import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { rentalAPI } from '../../services/api';

// Create rental request
export const createRentalRequest = createAsyncThunk(
  'rental/createRentalRequest',
  async (rentalData, { rejectWithValue }) => {
    try {
      const response = await rentalAPI.createRentalRequest(rentalData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create rental request');
    }
  }
);

// Get all rentals
export const getRentals = createAsyncThunk('rental/getRentals', async (_, { rejectWithValue }) => {
  try {
    const response = await rentalAPI.getRentals();
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to get rentals');
  }
});

// Get rental by ID
export const getRentalById = createAsyncThunk(
  'rental/getRentalById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await rentalAPI.getRentalById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get rental');
    }
  }
);

// Update rental status
export const updateRentalStatus = createAsyncThunk(
  'rental/updateRentalStatus',
  async ({ id, statusData }, { rejectWithValue }) => {
    try {
      const response = await rentalAPI.updateRentalStatus(id, statusData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update rental status');
    }
  }
);

// Get rental API key
export const getRentalApiKey = createAsyncThunk(
  'rental/getRentalApiKey',
  async (id, { rejectWithValue }) => {
    try {
      const response = await rentalAPI.getRentalApiKey(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get API key');
    }
  }
);

// Get API key usage statistics
export const getApiKeyUsage = createAsyncThunk(
  'rental/getApiKeyUsage',
  async (id, { rejectWithValue }) => {
    try {
      const response = await rentalAPI.getApiKeyUsage(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get API key usage');
    }
  }
);

// Track API key usage
export const trackApiKeyUsage = createAsyncThunk(
  'rental/trackApiKeyUsage',
  async ({ id, usageData }, { rejectWithValue }) => {
    try {
      const response = await rentalAPI.trackApiKeyUsage(id, usageData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to track API key usage');
    }
  }
);

const initialState = {
  rentals: [],
  currentRental: null,
  apiKey: null,
  apiKeyUsage: null,
  loading: false,
  error: null,
};

const rentalSlice = createSlice({
  name: 'rental',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentRental: (state) => {
      state.currentRental = null;
    },
    clearApiKey: (state) => {
      state.apiKey = null;
    },
    clearApiKeyUsage: (state) => {
      state.apiKeyUsage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Rental Request
      .addCase(createRentalRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRentalRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.rentals.unshift(action.payload);
        state.currentRental = action.payload;
      })
      .addCase(createRentalRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Rentals
      .addCase(getRentals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRentals.fulfilled, (state, action) => {
        state.loading = false;
        state.rentals = action.payload;
      })
      .addCase(getRentals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Rental By ID
      .addCase(getRentalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRentalById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRental = action.payload;
      })
      .addCase(getRentalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Rental Status
      .addCase(updateRentalStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRentalStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRental = action.payload;
        
        // Update the rental in the rentals array
        const index = state.rentals.findIndex((rental) => rental._id === action.payload._id);
        if (index !== -1) {
          state.rentals[index] = action.payload;
        }
      })
      .addCase(updateRentalStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Rental API Key
      .addCase(getRentalApiKey.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRentalApiKey.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKey = action.payload;
      })
      .addCase(getRentalApiKey.rejected, (state, action) => {
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
        state.apiKeyUsage = action.payload;
      })
      .addCase(getApiKeyUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Track API Key Usage
      .addCase(trackApiKeyUsage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(trackApiKeyUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeyUsage = action.payload;
      })
      .addCase(trackApiKeyUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentRental, clearApiKey, clearApiKeyUsage } = rentalSlice.actions;

export default rentalSlice.reducer;
