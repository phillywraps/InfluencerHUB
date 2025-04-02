/**
 * Client-side error handling utilities that work with the server's standardized error system
 */

import { toast } from 'react-toastify';
import logger from './logger';

// Error types that match the server ErrorTypes enum
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR', 
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  THIRD_PARTY_API_ERROR: 'THIRD_PARTY_API_ERROR',
  SOCKET_ERROR: 'SOCKET_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INPUT_ERROR: 'INPUT_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR'
};

/**
 * Maps error types to user-friendly messages
 */
const defaultErrorMessages = {
  [ErrorTypes.VALIDATION_ERROR]: 'The information you provided is invalid or incomplete.',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorTypes.AUTHENTICATION_ERROR]: 'Authentication failed. Please log in again.',
  [ErrorTypes.AUTHORIZATION_ERROR]: 'You do not have permission to perform this action.',
  [ErrorTypes.THIRD_PARTY_API_ERROR]: 'We encountered an issue with an external service.',
  [ErrorTypes.SOCKET_ERROR]: 'Communication error. Please check your connection.',
  [ErrorTypes.SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ErrorTypes.DATABASE_ERROR]: 'Database operation failed.',
  [ErrorTypes.INPUT_ERROR]: 'Please check your input and try again.',
  [ErrorTypes.CONFLICT_ERROR]: 'The action conflicts with the current state.',
  'default': 'An unexpected error occurred. Please try again.'
};

/**
 * Extract the most relevant error information from different error objects
 * @param {Error|Object|string} error - The error to parse
 * @returns {Object} Formatted error with type, message, and details
 */
export const parseError = (error) => {
  // Initialize with default values
  let errorType = ErrorTypes.SERVER_ERROR;
  let message = defaultErrorMessages.default;
  let details = {};
  let statusCode = null;
  
  // Parse axios error responses
  if (error?.response?.data) {
    const { data } = error.response;
    statusCode = error.response.status;
    
    // Extract error type and message from server response
    errorType = data.type || errorType;
    message = data.message || message;
    details = data.details || details;
  } 
  // Handle standard Error objects
  else if (error instanceof Error) {
    message = error.message || message;
    // Check for custom error type property
    if (error.type && ErrorTypes[error.type]) {
      errorType = error.type;
    }
    // Use any additional properties as details
    details = { ...error };
    delete details.message;
    delete details.type;
    delete details.stack;
  } 
  // Handle string errors
  else if (typeof error === 'string') {
    message = error;
  } 
  // Handle plain objects
  else if (error && typeof error === 'object') {
    message = error.message || message;
    errorType = error.type || errorType;
    details = error.details || details;
    statusCode = error.statusCode || statusCode;
  }
  
  // Get appropriate user message based on error type
  const userMessage = defaultErrorMessages[errorType] || defaultErrorMessages.default;
  
  return {
    type: errorType,
    message: message,
    userMessage: userMessage,
    details: details,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Handle error with appropriate UI feedback and logging
 * @param {Error|Object|string} error - The error to handle
 * @param {Object} options - Error handling options
 * @param {string} options.context - Context in which the error occurred
 * @param {Function} options.onError - Callback function with parsed error
 * @param {boolean} options.showToast - Whether to show a toast notification
 * @param {boolean} options.logError - Whether to log the error
 * @returns {Object} Parsed error information
 */
export const handleError = (error, options = {}) => {
  const { 
    context = 'application', 
    onError = null,
    showToast = true,
    logError = true 
  } = options;
  
  // Parse the error
  const parsedError = parseError(error);
  
  // Log error
  if (logError) {
    logger.error(`${context} error:`, {
      type: parsedError.type,
      message: parsedError.message,
      details: parsedError.details,
      statusCode: parsedError.statusCode,
      timestamp: parsedError.timestamp
    });
  }
  
  // Show toast notification
  if (showToast) {
    toast.error(parsedError.userMessage, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }
  
  // Execute callback if provided
  if (onError && typeof onError === 'function') {
    onError(parsedError);
  }
  
  return parsedError;
};

/**
 * Create a specialized API request function with error handling
 * @param {Function} apiCall - The API function to call (e.g., axios.get)
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped API function with error handling
 */
export const withErrorHandling = (apiCall, options = {}) => {
  return async (...args) => {
    try {
      const result = await apiCall(...args);
      return result;
    } catch (error) {
      return handleError(error, options);
    }
  };
};

/**
 * Process validation errors into a form-friendly format
 * @param {Object} error - Error object with validation details
 * @returns {Object} Formatted validation errors by field
 */
export const processValidationErrors = (error) => {
  const formErrors = {};
  
  if (error?.details?.fields) {
    Object.entries(error.details.fields).forEach(([field, invalid]) => {
      if (invalid) {
        formErrors[field] = error.details.messages?.[field] || 'Invalid value';
      }
    });
  } else if (error?.details?.missing) {
    if (Array.isArray(error.details.missing)) {
      error.details.missing.forEach(field => {
        formErrors[field] = 'This field is required';
      });
    } else if (typeof error.details.missing === 'object') {
      Object.entries(error.details.missing).forEach(([field, isMissing]) => {
        if (isMissing) {
          formErrors[field] = 'This field is required';
        }
      });
    }
  }
  
  return formErrors;
};

export default {
  ErrorTypes,
  parseError,
  handleError,
  withErrorHandling,
  processValidationErrors
};
