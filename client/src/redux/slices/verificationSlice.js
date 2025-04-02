import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { setAlert } from './alertSlice';

// Initial state
const initialState = {
  verifications: [],
  currentVerification: null,
  verificationStatus: null,
  pendingVerifications: [],
  loading: false,
  error: null,
};

// Async thunks
export const initiateIdentityVerification = createAsyncThunk(
  'verification/initiateIdentity',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/verifications/identity');
      dispatch(setAlert('Identity verification initiated successfully', 'success'));
      return response.data.data;
    } catch (error) {
      dispatch(setAlert(error.response?.data?.message || 'Failed to initiate identity verification', 'error'));
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const uploadVerificationDocuments = createAsyncThunk(
  'verification/uploadDocuments',
  async ({ id, documents }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`/verifications/${id}/documents`, { documents });
      dispatch(setAlert('Documents uploaded successfully', 'success'));
      return response.data.data;
    } catch (error) {
      dispatch(setAlert(error.response?.data?.message || 'Failed to upload documents', 'error'));
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const initiateSocialAccountVerification = createAsyncThunk(
  'verification/initiateSocialAccount',
  async (socialAccountId, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/verifications/social-account', { socialAccountId });
      dispatch(setAlert('Verification code sent to your email', 'success'));
      return response.data.data;
    } catch (error) {
      dispatch(setAlert(error.response?.data?.message || 'Failed to initiate social account verification', 'error'));
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const verifySocialAccount = createAsyncThunk(
  'verification/verifySocialAccount',
  async ({ verificationId, code }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/verifications/social-account/verify', { verificationId, code });
      dispatch(setAlert('Social account verified successfully', 'success'));
      return response.data;
    } catch (error) {
      dispatch(setAlert(error.response?.data?.message || 'Failed to verify social account', 'error'));
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const resendVerificationCode = createAsyncThunk(
  'verification/resendCode',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`/verifications/${id}/resend-code`);
      dispatch(setAlert('Verification code resent to your email', 'success'));
      return response.data;
    } catch (error) {
      dispatch(setAlert(error.response?.data?.message || 'Failed to resend verification code', 'error'));
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getVerificationStatus = createAsyncThunk(
  'verification/getStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/verifications/status');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getInfluencerVerifications = createAsyncThunk(
  'verification/getInfluencerVerifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/verifications');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getVerificationById = createAsyncThunk(
  'verification/getById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/verifications/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Admin thunks
export const getPendingVerifications = createAsyncThunk(
  'verification/getPendingVerifications',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/verifications/admin/pending?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const reviewIdentityVerification = createAsyncThunk(
  'verification/reviewIdentity',
  async ({ id, approved, notes }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`/verifications/${id}/review`, { approved, notes });
      dispatch(setAlert(`Verification ${approved ? 'approved' : 'rejected'} successfully`, 'success'));
      return response.data.data;
    } catch (error) {
      dispatch(setAlert(error.response?.data?.message || 'Failed to review verification', 'error'));
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Slice
const verificationSlice = createSlice({
  name: 'verification',
  initialState,
  reducers: {
    clearVerificationError: (state) => {
      state.error = null;
    },
    clearCurrentVerification: (state) => {
      state.currentVerification = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initiate identity verification
      .addCase(initiateIdentityVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiateIdentityVerification.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVerification = action.payload;
      })
      .addCase(initiateIdentityVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to initiate identity verification';
      })
      
      // Upload verification documents
      .addCase(uploadVerificationDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadVerificationDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVerification = action.payload;
      })
      .addCase(uploadVerificationDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to upload documents';
      })
      
      // Initiate social account verification
      .addCase(initiateSocialAccountVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiateSocialAccountVerification.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVerification = action.payload;
      })
      .addCase(initiateSocialAccountVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to initiate social account verification';
      })
      
      // Verify social account
      .addCase(verifySocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifySocialAccount.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifySocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to verify social account';
      })
      
      // Resend verification code
      .addCase(resendVerificationCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerificationCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to resend verification code';
      })
      
      // Get verification status
      .addCase(getVerificationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVerificationStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.verificationStatus = action.payload;
      })
      .addCase(getVerificationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get verification status';
      })
      
      // Get influencer verifications
      .addCase(getInfluencerVerifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInfluencerVerifications.fulfilled, (state, action) => {
        state.loading = false;
        state.verifications = action.payload;
      })
      .addCase(getInfluencerVerifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get verifications';
      })
      
      // Get verification by ID
      .addCase(getVerificationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVerificationById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVerification = action.payload;
      })
      .addCase(getVerificationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get verification';
      })
      
      // Get pending verifications (admin)
      .addCase(getPendingVerifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPendingVerifications.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingVerifications = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getPendingVerifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get pending verifications';
      })
      
      // Review identity verification (admin)
      .addCase(reviewIdentityVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewIdentityVerification.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVerification = action.payload;
        // Update the pending verifications list
        if (state.pendingVerifications.length > 0) {
          state.pendingVerifications = state.pendingVerifications.filter(
            (v) => v._id !== action.payload._id
          );
        }
      })
      .addCase(reviewIdentityVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to review verification';
      });
  },
});

export const { clearVerificationError, clearCurrentVerification } = verificationSlice.actions;

export default verificationSlice.reducer;
