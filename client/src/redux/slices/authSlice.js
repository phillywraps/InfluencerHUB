import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Check if user is already logged in
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('No token found');
    }

    const response = await authAPI.getProfile();
    return response.data.data;
  } catch (error) {
    // If error is due to email verification, don't remove token
    if (error.response?.data?.requiresVerification) {
      return rejectWithValue({
        message: error.response.data.message,
        requiresVerification: true
      });
    }
    
    localStorage.removeItem('token');
    return rejectWithValue(error.response?.data?.message || 'Failed to authenticate');
  }
});

// Register a new user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      localStorage.setItem('token', response.data.data.token);
      return {
        ...response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Login user
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authAPI.login(credentials);
    
    // Check if 2FA is required
    if (response.data.requiresTwoFactor) {
      return rejectWithValue({
        requiresTwoFactor: true,
        tempToken: response.data.tempToken,
        message: response.data.message
      });
    }
    
    localStorage.setItem('token', response.data.data.token);
    return response.data.data;
  } catch (error) {
    // Check if error is due to email verification
    if (error.response?.data?.requiresVerification) {
      return rejectWithValue({
        message: error.response.data.message,
        requiresVerification: true,
        email: credentials.email
      });
    }
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// Verify 2FA during login
export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyTwoFactor(verificationData);
      localStorage.setItem('token', response.data.data.token);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Two-factor verification failed');
    }
  }
);

// Enable 2FA
export const enableTwoFactor = createAsyncThunk(
  'auth/enableTwoFactor',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.enableTwoFactor();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to enable two-factor authentication');
    }
  }
);

// Verify 2FA setup
export const verifyTwoFactorSetup = createAsyncThunk(
  'auth/verifyTwoFactorSetup',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyTwoFactorSetup(token);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify two-factor setup');
    }
  }
);

// Disable 2FA
export const disableTwoFactor = createAsyncThunk(
  'auth/disableTwoFactor',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.disableTwoFactor(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to disable two-factor authentication');
    }
  }
);

// Generate new recovery codes
export const generateRecoveryCodes = createAsyncThunk(
  'auth/generateRecoveryCodes',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.generateRecoveryCodes(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate recovery codes');
    }
  }
);

// Verify email
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyEmail(token);
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Email verification failed');
    }
  }
);

// Resend verification email
export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.resendVerification(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend verification email');
    }
  }
);

// Forgot password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process password reset');
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.resetPassword(token, password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

// Update user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(userData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Change password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  return null;
});

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  twoFactorSetup: {
    loading: false,
    error: null,
    qrCode: null,
    secret: null,
    recoveryCodes: null
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data?.isEmailVerified) {
          if (state.user) {
            state.user.isEmailVerified = true;
          }
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Resend Verification Email
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset Password
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Verify 2FA
      .addCase(verifyTwoFactor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Enable 2FA
      .addCase(enableTwoFactor.pending, (state) => {
        state.twoFactorSetup.loading = true;
        state.twoFactorSetup.error = null;
      })
      .addCase(enableTwoFactor.fulfilled, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.qrCode = action.payload.qrCode;
        state.twoFactorSetup.secret = action.payload.secret;
      })
      .addCase(enableTwoFactor.rejected, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.error = action.payload;
      })
      
      // Verify 2FA Setup
      .addCase(verifyTwoFactorSetup.pending, (state) => {
        state.twoFactorSetup.loading = true;
        state.twoFactorSetup.error = null;
      })
      .addCase(verifyTwoFactorSetup.fulfilled, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.recoveryCodes = action.payload.recoveryCodes;
        if (state.user) {
          state.user.twoFactorEnabled = true;
        }
      })
      .addCase(verifyTwoFactorSetup.rejected, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.error = action.payload;
      })
      
      // Disable 2FA
      .addCase(disableTwoFactor.pending, (state) => {
        state.twoFactorSetup.loading = true;
        state.twoFactorSetup.error = null;
      })
      .addCase(disableTwoFactor.fulfilled, (state) => {
        state.twoFactorSetup.loading = false;
        if (state.user) {
          state.user.twoFactorEnabled = false;
        }
        state.twoFactorSetup.qrCode = null;
        state.twoFactorSetup.secret = null;
        state.twoFactorSetup.recoveryCodes = null;
      })
      .addCase(disableTwoFactor.rejected, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.error = action.payload;
      })
      
      // Generate Recovery Codes
      .addCase(generateRecoveryCodes.pending, (state) => {
        state.twoFactorSetup.loading = true;
        state.twoFactorSetup.error = null;
      })
      .addCase(generateRecoveryCodes.fulfilled, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.recoveryCodes = action.payload.recoveryCodes;
      })
      .addCase(generateRecoveryCodes.rejected, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;
