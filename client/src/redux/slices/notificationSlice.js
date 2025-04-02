import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { setAlert } from './alertSlice';

// Async thunks
export const getNotifications = createAsyncThunk(
  'notifications/getNotifications',
  async ({ limit = 20, skip = 0, unreadOnly = false }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/notifications?limit=${limit}&skip=${skip}&unreadOnly=${unreadOnly}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      );
    }
  }
);

export const getUnreadNotificationCount = createAsyncThunk(
  'notifications/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.count;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch unread notification count'
      );
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark notification as read'
      );
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put('/notifications/read-all');
      dispatch(setAlert({
        type: 'success',
        message: 'All notifications marked as read'
      }));
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark all notifications as read'
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      dispatch(setAlert({
        type: 'success',
        message: 'Notification deleted successfully'
      }));
      return notificationId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete notification'
      );
    }
  }
);

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  totalCount: 0
};

// Slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.hasMore = true;
      state.totalCount = 0;
    },
    resetNotificationError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      // For real-time notifications (e.g., from WebSocket)
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
      state.totalCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      // getNotifications
      .addCase(getNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        
        // If skip is 0, replace notifications, otherwise append
        const skip = action.meta.arg.skip || 0;
        if (skip === 0) {
          state.notifications = action.payload.data;
        } else {
          // Filter out duplicates
          const newNotifications = action.payload.data.filter(
            (notification) => !state.notifications.some(n => n._id === notification._id)
          );
          state.notifications = [...state.notifications, ...newNotifications];
        }
        
        state.unreadCount = action.payload.unreadCount;
        state.totalCount = action.payload.count;
        state.hasMore = action.payload.data.length === action.meta.arg.limit;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // getUnreadNotificationCount
      .addCase(getUnreadNotificationCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      
      // markNotificationAsRead
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload._id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          if (state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
      })
      
      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          isRead: true
        }));
        state.unreadCount = 0;
      })
      
      // deleteNotification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const deletedNotification = state.notifications.find(n => n._id === action.payload);
        state.notifications = state.notifications.filter(n => n._id !== action.payload);
        
        if (deletedNotification && !deletedNotification.isRead && state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
        
        if (state.totalCount > 0) {
          state.totalCount -= 1;
        }
      });
  }
});

export const { clearNotifications, resetNotificationError, addNotification } = notificationSlice.actions;

export default notificationSlice.reducer;
