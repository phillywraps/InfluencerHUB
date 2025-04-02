/**
 * Standardized Error Handling Utility
 * 
 * This module provides a consistent approach to error handling across the server
 * with proper error categorization, logging, and response formatting.
 */

const logger = require('./logger');

// Error types for categorization
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  THIRD_PARTY_API: 'THIRD_PARTY_API_ERROR',
  DATABASE: 'DATABASE_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// HTTP status codes mapping
const StatusCodes = {
  [ErrorTypes.VALIDATION]: 400,
  [ErrorTypes.AUTHENTICATION]: 401,
  [ErrorTypes.AUTHORIZATION]: 403,
  [ErrorTypes.RESOURCE_NOT_FOUND]: 404,
  [ErrorTypes.CONFLICT]: 409,
  [ErrorTypes.SERVICE_UNAVAILABLE]: 503,
  [ErrorTypes.THIRD_PARTY_API]: 502,
  [ErrorTypes.DATABASE]: 500,
  [ErrorTypes.RATE_LIMIT]: 429,
  [ErrorTypes.UNKNOWN]: 500
};

/**
 * Custom API Error class with additional metadata
 */
class ApiError extends Error {
  constructor(type, message, details = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.statusCode = StatusCodes[type] || 500;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Format the error for API response
   * @param {boolean} includeDetails - Whether to include error details in response
   * @returns {Object} Formatted error response
   */
  toResponse(includeDetails = false) {
    const response = {
      success: false,
      error: {
        type: this.type,
        message: this.message,
        timestamp: this.timestamp
      }
    };
    
    // Include details if available and enabled
    if (this.details && includeDetails) {
      response.error.details = this.details;
    }
    
    return response;
  }
}

/**
 * Factory functions for creating specific error types
 */
const createValidationError = (message, details = null, originalError = null) => {
  return new ApiError(ErrorTypes.VALIDATION, message, details, originalError);
};

const createAuthenticationError = (message = 'Authentication required', details = null, originalError = null) => {
  return new ApiError(ErrorTypes.AUTHENTICATION, message, details, originalError);
};

const createAuthorizationError = (message = 'Permission denied', details = null, originalError = null) => {
  return new ApiError(ErrorTypes.AUTHORIZATION, message, details, originalError);
};

const createResourceNotFoundError = (resource, identifier, originalError = null) => {
  const message = `${resource} with identifier ${identifier} not found`;
  return new ApiError(ErrorTypes.RESOURCE_NOT_FOUND, message, { resource, identifier }, originalError);
};

const createConflictError = (message, details = null, originalError = null) => {
  return new ApiError(ErrorTypes.CONFLICT, message, details, originalError);
};

const createServiceUnavailableError = (service, message = null, originalError = null) => {
  const errorMessage = message || `${service} service is currently unavailable`;
  return new ApiError(ErrorTypes.SERVICE_UNAVAILABLE, errorMessage, { service }, originalError);
};

const createThirdPartyApiError = (api, message, details = null, originalError = null) => {
  const errorMessage = `Error communicating with ${api}: ${message}`;
  return new ApiError(ErrorTypes.THIRD_PARTY_API, errorMessage, details, originalError);
};

const createDatabaseError = (operation, collection, message = null, originalError = null) => {
  const errorMessage = message || `Database error during ${operation} operation on ${collection}`;
  return new ApiError(ErrorTypes.DATABASE, errorMessage, { operation, collection }, originalError);
};

const createRateLimitError = (limit, timeWindow, resource = 'API', originalError = null) => {
  const message = `Rate limit exceeded: ${limit} requests per ${timeWindow} for ${resource}`;
  return new ApiError(ErrorTypes.RATE_LIMIT, message, { limit, timeWindow, resource }, originalError);
};

/**
 * Parse errors from various sources and convert to ApiError
 * @param {Error} error - Original error object
 * @returns {ApiError} Standardized API error
 */
const parseError = (error) => {
  // If it's already an ApiError, return it
  if (error instanceof ApiError) {
    return error;
  }
  
  // Check for Mongoose/MongoDB validation errors
  if (error.name === 'ValidationError' && error.errors) {
    return createValidationError(
      'Invalid input data',
      Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {}),
      error
    );
  }
  
  // Check for Mongoose/MongoDB duplicate key error
  if (error.name === 'MongoError' && error.code === 11000) {
    return createConflictError(
      'Duplicate entry',
      { field: Object.keys(error.keyPattern)[0] },
      error
    );
  }
  
  // Check for JWT errors
  if (error.name === 'JsonWebTokenError') {
    return createAuthenticationError('Invalid token', null, error);
  }
  
  if (error.name === 'TokenExpiredError') {
    return createAuthenticationError('Token expired', null, error);
  }
  
  // Check for Axios errors (third-party API calls)
  if (error.isAxiosError) {
    const api = error.config ? error.config.url : 'unknown API';
    const statusCode = error.response ? error.response.status : null;
    const responseData = error.response ? error.response.data : null;
    
    return createThirdPartyApiError(
      api,
      error.message,
      { statusCode, responseData },
      error
    );
  }
  
  // Default to unknown error
  return new ApiError(
    ErrorTypes.UNKNOWN,
    error.message || 'An unexpected error occurred',
    null,
    error
  );
};

/**
 * Global error handler middleware for Express
 * @param {boolean} includeDetailsInResponse - Whether to include error details in API response
 * @returns {Function} Express middleware function
 */
const errorHandlerMiddleware = (includeDetailsInResponse = false) => {
  return (err, req, res, next) => {
    // Parse the error
    const apiError = parseError(err);
    
    // Log the error
    logError(apiError, req);
    
    // Send appropriate response
    res.status(apiError.statusCode).json(apiError.toResponse(includeDetailsInResponse));
  };
};

/**
 * Async handler to eliminate try/catch boilerplate in route handlers
 * @param {Function} fn - The async route handler function
 * @returns {Function} Express middleware function that handles async errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Log error with appropriate severity level
 * @param {ApiError} error - The error to log
 * @param {Object} req - Express request object
 */
const logError = (error, req = null) => {
  const logData = {
    type: error.type,
    message: error.message,
    timestamp: error.timestamp,
    details: error.details
  };
  
  // Add request information if available
  if (req) {
    logData.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : null
    };
  }
  
  // Add stack trace for server errors
  if (error.statusCode >= 500) {
    logData.stack = error.stack;
    if (error.originalError) {
      logData.originalError = {
        message: error.originalError.message,
        stack: error.originalError.stack
      };
    }
  }
  
  // Log with appropriate level based on error type
  if (error.statusCode >= 500) {
    logger.error(logData);
  } else if (error.type === ErrorTypes.AUTHENTICATION || error.type === ErrorTypes.AUTHORIZATION) {
    logger.warn(logData);
  } else {
    logger.info(logData);
  }
};

/**
 * Handle errors in async functions (non-express)
 * @param {Function} fn - Async function to wrap
 * @param {Function} errorHandler - Function to handle errors
 * @returns {Function} Wrapped function with error handling
 */
const withErrorHandling = (fn, errorHandler) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const apiError = parseError(error);
      return errorHandler(apiError, ...args);
    }
  };
};

module.exports = {
  ErrorTypes,
  ApiError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createResourceNotFoundError,
  createConflictError,
  createServiceUnavailableError,
  createThirdPartyApiError,
  createDatabaseError,
  createRateLimitError,
  parseError,
  errorHandlerMiddleware,
  asyncHandler,
  logError,
  withErrorHandling
};
