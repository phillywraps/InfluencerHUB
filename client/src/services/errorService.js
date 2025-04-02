/**
 * Error handling and reporting service
 * 
 * This service provides centralized error handling, reporting, and logging
 * capabilities for the entire application. It manages error state, reports
 * errors to monitoring services, and provides helpful debugging information.
 */

import { captureException } from './monitoringService';

// Configurable settings
let config = {
  logToConsole: process.env.NODE_ENV !== 'production',
  reportToMonitoring: process.env.NODE_ENV === 'production',
  includeStackTrace: true,
  errorPrefix: '[InfluencerPlatform]',
  contextInfo: {}
};

/**
 * Configure error service settings
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.logToConsole - Whether to log errors to console
 * @param {boolean} options.reportToMonitoring - Whether to report to monitoring service
 * @param {boolean} options.includeStackTrace - Whether to include stack traces in logs
 * @param {string} options.errorPrefix - Prefix for error messages
 * @param {Object} options.contextInfo - Additional context info to include with errors
 */
export const configureErrorService = (options = {}) => {
  config = { ...config, ...options };
};

/**
 * Set additional context information to be included with errors
 * Useful for including user info, session data, etc.
 * 
 * @param {Object} contextInfo - Key-value pairs to include with error reports
 */
export const setErrorContext = (contextInfo = {}) => {
  config.contextInfo = { ...config.contextInfo, ...contextInfo };
};

/**
 * Clear specific context keys or all context if no keys provided
 * 
 * @param {Array} keys - Keys to clear, or empty to clear all
 */
export const clearErrorContext = (keys = []) => {
  if (keys.length === 0) {
    config.contextInfo = {};
  } else {
    const newContext = { ...config.contextInfo };
    keys.forEach(key => {
      delete newContext[key];
    });
    config.contextInfo = newContext;
  }
};

/**
 * Process and report an error
 * 
 * @param {Error|string} error - Error object or message to process
 * @param {Object} additionalInfo - Additional context for this specific error
 * @param {string} source - Source of the error (component name, function, etc.)
 * @returns {string} Error ID that can be used for referencing the error
 */
export const handleError = (error, additionalInfo = {}, source = 'app') => {
  // Generate unique error ID for reference
  const errorId = generateErrorId();
  
  // Format error data
  const errorObject = formatError(error, errorId, source, additionalInfo);
  
  // Log to console if enabled
  if (config.logToConsole) {
    logErrorToConsole(errorObject);
  }
  
  // Report to monitoring service if enabled
  if (config.reportToMonitoring) {
    reportErrorToMonitoring(errorObject);
  }
  
  return errorId;
};

/**
 * Format error data into a standardized structure
 * 
 * @param {Error|string} error - Error object or message
 * @param {string} errorId - Generated error ID
 * @param {string} source - Source of the error
 * @param {Object} additionalInfo - Additional context for this error
 * @returns {Object} Formatted error object
 */
const formatError = (error, errorId, source, additionalInfo) => {
  const isErrorObject = error instanceof Error;
  
  const formattedError = {
    id: errorId,
    message: isErrorObject ? error.message : String(error),
    source,
    timestamp: new Date().toISOString(),
    type: isErrorObject ? error.name : 'Error',
    context: {
      ...config.contextInfo,
      ...additionalInfo
    }
  };
  
  // Include stack trace if available and enabled
  if (isErrorObject && error.stack && config.includeStackTrace) {
    formattedError.stackTrace = error.stack;
  }
  
  return formattedError;
};

/**
 * Log error to console in a structured way
 * 
 * @param {Object} errorObject - Formatted error object
 */
const logErrorToConsole = (errorObject) => {
  const { id, message, source, type, stackTrace } = errorObject;
  
  // Format console output
  console.error(
    `${config.errorPrefix} ${type} [${id}] in ${source}: ${message}`,
    '\nContext:', errorObject.context,
    stackTrace ? `\nStack Trace:\n${stackTrace}` : ''
  );
};

/**
 * Report error to external monitoring service
 * 
 * @param {Object} errorObject - Formatted error object
 */
const reportErrorToMonitoring = (errorObject) => {
  try {
    captureException(errorObject);
  } catch (reportingError) {
    // Fallback to console if reporting fails
    console.error('Failed to report error to monitoring service:', reportingError);
    console.error('Original error:', errorObject);
  }
};

/**
 * Generate a unique ID for an error occurrence
 * 
 * @returns {string} Unique error identifier
 */
const generateErrorId = () => {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * Create an error boundary handler function
 * For use with React ErrorBoundary component
 * 
 * @param {string} componentName - Name of the component for error source
 * @returns {Function} Error handler for ErrorBoundary
 */
export const createErrorBoundaryHandler = (componentName) => {
  return (error, errorInfo) => {
    return handleError(error, { 
      componentStack: errorInfo?.componentStack,
      isBoundaryError: true
    }, componentName);
  };
};

/**
 * Create a higher-order function that wraps a function with error handling
 * 
 * @param {Function} fn - Function to wrap with error handling
 * @param {Object} options - Options for error handling
 * @param {string} options.source - Source identifier for the error
 * @param {Function} options.onError - Optional callback for when error occurs
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (fn, options = {}) => {
  const { source = 'function', onError } = options;
  
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorId = handleError(error, { 
        args: JSON.stringify(args),
        isHandledError: true
      }, source);
      
      if (typeof onError === 'function') {
        onError(error, errorId);
      }
      
      throw error; // Re-throw to allow caller to also handle if needed
    }
  };
};

/**
 * Utility for API error handling with specific formatting
 * 
 * @param {Error} error - Error from API call
 * @param {Object} requestInfo - Information about the request
 * @returns {string} Error ID
 */
export const handleApiError = (error, requestInfo = {}) => {
  const { url, method, data } = requestInfo;
  
  // Extract response info if it exists
  const responseInfo = error.response ? {
    status: error.response.status,
    statusText: error.response.statusText,
    data: error.response.data
  } : null;
  
  return handleError(error, {
    apiRequest: { url, method, data },
    apiResponse: responseInfo,
    isApiError: true
  }, 'api');
};

/**
 * Default export of the main error handling function
 */
export default handleError;
