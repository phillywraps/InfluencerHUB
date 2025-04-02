import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewAPI } from '../../services/api';

// Create a review
export const createReview = createAsyncThunk(
  'review/createReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.createReview(reviewData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create review');
    }
  }
);

// Get reviews for a user
export const getUserReviews = createAsyncThunk(
  'review/getUserReviews',
  async ({ userId, params }, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.getUserReviews(userId, params);
      return {
        userId,
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get reviews');
    }
  }
);

// Get reviews by the current user
export const getMyReviews = createAsyncThunk(
  'review/getMyReviews',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.getMyReviews(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get reviews');
    }
  }
);

// Get reviews for the current user
export const getReviewsOfMe = createAsyncThunk(
  'review/getReviewsOfMe',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.getReviewsOfMe(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get reviews');
    }
  }
);

// Respond to a review
export const respondToReview = createAsyncThunk(
  'review/respondToReview',
  async ({ reviewId, responseData }, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.respondToReview(reviewId, responseData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to respond to review');
    }
  }
);

// Report a review
export const reportReview = createAsyncThunk(
  'review/reportReview',
  async ({ reviewId, reportData }, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.reportReview(reviewId, reportData);
      return {
        reviewId,
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to report review');
    }
  }
);

const initialState = {
  userReviews: [],
  myReviews: [],
  reviewsOfMe: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
};

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetPagination: (state) => {
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.myReviews.unshift(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get User Reviews
      .addCase(getUserReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserReviews.fulfilled, (state, action) => {
        state.loading = false;
        
        // If it's the first page, replace reviews, otherwise append
        if (action.payload.currentPage === 1) {
          state.userReviews = action.payload.data;
        } else {
          state.userReviews = [...state.userReviews, ...action.payload.data];
        }
        
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(getUserReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get My Reviews
      .addCase(getMyReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyReviews.fulfilled, (state, action) => {
        state.loading = false;
        
        // If it's the first page, replace reviews, otherwise append
        if (action.payload.currentPage === 1) {
          state.myReviews = action.payload.data;
        } else {
          state.myReviews = [...state.myReviews, ...action.payload.data];
        }
        
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(getMyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Reviews Of Me
      .addCase(getReviewsOfMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReviewsOfMe.fulfilled, (state, action) => {
        state.loading = false;
        
        // If it's the first page, replace reviews, otherwise append
        if (action.payload.currentPage === 1) {
          state.reviewsOfMe = action.payload.data;
        } else {
          state.reviewsOfMe = [...state.reviewsOfMe, ...action.payload.data];
        }
        
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(getReviewsOfMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Respond To Review
      .addCase(respondToReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToReview.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the review in the reviews of me list
        const reviewIndex = state.reviewsOfMe.findIndex(
          (review) => review._id === action.payload._id
        );
        
        if (reviewIndex !== -1) {
          state.reviewsOfMe[reviewIndex] = action.payload;
        }
      })
      .addCase(respondToReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Report Review
      .addCase(reportReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reportReview.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the review in the reviews of me list
        const reviewIndex = state.reviewsOfMe.findIndex(
          (review) => review._id === action.payload.reviewId
        );
        
        if (reviewIndex !== -1) {
          state.reviewsOfMe[reviewIndex].isReported = true;
        }
      })
      .addCase(reportReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetPagination } = reviewSlice.actions;

export default reviewSlice.reducer;
