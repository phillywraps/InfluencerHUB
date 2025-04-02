/**
 * Enhanced Error Handling Middleware
 * 
 * This middleware provides standardized error handling for all API endpoints.
 * It integrates with the errorHandler utility to provide consistent error responses,
 * proper logging, and error categorization.
 */

const {
  errorHandlerMiddleware,
  asyncHandler,
  parseError,
  createResourceNotFoundError,
  createValidationError,
  createConflictError,
  ApiError,
  ErrorTypes
} = require('../utils/errorHandler');

/**
 * Handle 404 errors (Not Found)
 * This middleware converts 404 errors into standardized ApiError objects
 */
const notFound = (req, res, next) => {
  const error = createResourceNotFoundError(
    'Route',
    req.originalUrl,
    new Error(`Not Found - ${req.originalUrl}`)
  );
  next(error);
};

/**
 * Global error handler that integrates with the errorHandler utility
 * In development, include detailed error info. In production, sanitize responses.
 */
const errorHandler = errorHandlerMiddleware(process.env.NODE_ENV !== 'production');

/**
 * Specialized middleware for handling Mongoose validation errors
 * This converts Mongoose-specific error formats into standardized ApiError objects
 */
const handleValidationError = (err, req, res, next) => {
  // Already handled by the parseError function in errorHandler utility
  // But we'll keep this middleware for backward compatibility and specific Mongoose error handling
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = `Invalid input data: ${errors.join(', ')}`;
    
    const validationError = createValidationError(
      message,
      Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {}),
      err
    );
    
    return next(validationError);
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    
    const conflictError = createConflictError(
      message,
      { field, value: err.keyValue[field] },
      err
    );
    
    return next(conflictError);
  }
  
  next(err);
};

/**
 * Helper function to wrap async route handlers for automatic error handling
 * This eliminates the need for try/catch blocks in every controller
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware with error handling
 * 
 * Usage example:
 * 
 * // Instead of:
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.find({});
 *     res.json(users);
 *   } catch (err) {
 *     next(err);
 *   }
 * });
 * 
 * // Use:
 * router.get('/users', wrap(async (req, res) => {
 *   const users = await User.find({});
 *   res.json(users);
 * }));
 */
const wrap = asyncHandler;

module.exports = { 
  notFound, 
  errorHandler, 
  handleValidationError,
  wrap,
  
  // Export error creation helpers for use in controllers
  createResourceNotFoundError,
  createValidationError,
  createConflictError,
  ApiError,
  ErrorTypes
};
