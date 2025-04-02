/**
 * Simple async handler to replace express-async-handler dependency
 * Wraps async route handlers to properly handle errors and pass them to Express error middleware
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Middleware function that handles errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
