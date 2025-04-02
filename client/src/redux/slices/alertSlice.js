import { createSlice } from '@reduxjs/toolkit';
import { getUserFriendlyErrorMessage } from '../../services/errorService';

const initialState = {
  alerts: [],
};

let nextId = 1;

/**
 * Alert Slice for Redux Store
 * 
 * Handles global alert state management with enhanced features:
 * - Support for alert titles, custom icons, timeouts
 * - Support for action buttons with callbacks
 * - Automatic error parsing from API responses
 */
const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    setAlert: (state, action) => {
      const {
        type,
        message,
        title,
        timeout,
        icon,
        action: alertAction,
        position,
        persistent,
      } = action.payload;
      
      const id = nextId++;
      
      state.alerts.push({
        id,
        type,
        message,
        title,
        timeout: persistent ? 0 : timeout,
        icon,
        action: alertAction,
        position,
        createdAt: Date.now(),
      });
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter((alert) => alert.id !== action.payload);
    },
    removeAlertsByType: (state, action) => {
      state.alerts = state.alerts.filter((alert) => alert.type !== action.payload);
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },
  },
});

// Export actions for use in components
export const {
  setAlert,
  removeAlert,
  removeAlertsByType,
  clearAlerts,
} = alertSlice.actions;

/**
 * Helper function to create a success alert
 * 
 * @param {string|Object} messageOrOptions - Message string or options object
 * @param {number} timeout - Optional timeout override (in ms)
 * @returns {Object} Action object for dispatch
 */
export const setSuccessAlert = (messageOrOptions, timeout = 5000) => {
  if (typeof messageOrOptions === 'string') {
    return setAlert({
      type: 'success',
      message: messageOrOptions,
      timeout,
    });
  }

  return setAlert({
    type: 'success',
    timeout,
    ...messageOrOptions,
  });
};

/**
 * Helper function to create an error alert
 * 
 * @param {string|Error|Object} errorOrOptions - Error object, message string, or options object
 * @param {number} timeout - Optional timeout override (in ms)
 * @returns {Object} Action object for dispatch
 */
export const setErrorAlert = (errorOrOptions, timeout = 8000) => {
  // Handle case when error is a string, Error object, or API error
  if (typeof errorOrOptions === 'string' || errorOrOptions instanceof Error || errorOrOptions?.isAxiosError) {
    const message = getUserFriendlyErrorMessage(errorOrOptions);
    
    return setAlert({
      type: 'error',
      message,
      timeout,
    });
  }

  // Handle case when options object is provided
  return setAlert({
    type: 'error',
    timeout,
    ...errorOrOptions,
  });
};

/**
 * Helper function to create an info alert
 * 
 * @param {string|Object} messageOrOptions - Message string or options object
 * @param {number} timeout - Optional timeout override (in ms)
 * @returns {Object} Action object for dispatch
 */
export const setInfoAlert = (messageOrOptions, timeout = 5000) => {
  if (typeof messageOrOptions === 'string') {
    return setAlert({
      type: 'info',
      message: messageOrOptions,
      timeout,
    });
  }

  return setAlert({
    type: 'info',
    timeout,
    ...messageOrOptions,
  });
};

/**
 * Helper function to create a warning alert
 * 
 * @param {string|Object} messageOrOptions - Message string or options object
 * @param {number} timeout - Optional timeout override (in ms)
 * @returns {Object} Action object for dispatch
 */
export const setWarningAlert = (messageOrOptions, timeout = 6000) => {
  if (typeof messageOrOptions === 'string') {
    return setAlert({
      type: 'warning',
      message: messageOrOptions,
      timeout,
    });
  }

  return setAlert({
    type: 'warning',
    timeout,
    ...messageOrOptions,
  });
};

/**
 * Helper function to create a persistent alert (no auto-timeout)
 * 
 * @param {Object} options - Alert options
 * @returns {Object} Action object for dispatch
 */
export const setPersistentAlert = (options) => {
  return setAlert({
    ...options,
    persistent: true,
  });
};

/**
 * Helper function to create an alert with an action button
 * 
 * @param {Object} options - Alert options
 * @param {Object} actionOptions - Action button options
 * @returns {Object} Action object for dispatch
 */
export const setAlertWithAction = (options, actionOptions) => {
  return setAlert({
    ...options,
    action: actionOptions,
  });
};

export default alertSlice.reducer;
