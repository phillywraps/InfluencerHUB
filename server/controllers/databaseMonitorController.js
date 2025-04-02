/**
 * Database Monitor Controller
 * 
 * Provides controllers for monitoring database performance and query optimization.
 * This controller is useful for administrators to understand database usage patterns,
 * identify slow queries, and manage query caching.
 */

const queryOptimizer = require('../utils/queryOptimizer');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createAuthorizationError,
  createServerError,
  createDatabaseError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

/**
 * @desc    Get database query statistics
 * @route   GET /api/admin/database/stats
 * @access  Private (Admin)
 */
const getQueryStats = wrap(async (req, res) => {
  // Verify admin permissions
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Admin privileges required to access database statistics', {
      requiredRole: 'admin',
      userRole: req.user.role,
      userId: req.user._id
    });
  }

  // Get query stats from the optimizer
  const stats = queryOptimizer.getQueryStats();
  
  // Get MongoDB connection statistics
  const mongoStats = {
    connections: mongoose.connections.length,
    readyState: mongoose.connection.readyState,
    collections: Object.keys(mongoose.connection.collections).length,
    models: Object.keys(mongoose.models).length
  };
  
  return res.json({
    success: true,
    data: {
      queryStats: stats,
      mongoStats,
      timestamp: new Date()
    }
  });
});

/**
 * @desc    Clear query cache
 * @route   POST /api/admin/database/clear-cache
 * @access  Private (Admin)
 * @body    {pattern?} Optional pattern to match cache keys
 */
const clearCache = wrap(async (req, res) => {
  // Verify admin permissions
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Admin privileges required to clear query cache', {
      requiredRole: 'admin',
      userRole: req.user.role,
      userId: req.user._id
    });
  }
  
  const { pattern } = req.body;
  
  // Clear cache with optional pattern
  const clearedCount = queryOptimizer.clearQueryCache(pattern);
  
  logger.info(`Cleared ${clearedCount} items from query cache${pattern ? ` matching "${pattern}"` : ''}`);
  
  return res.json({
    success: true,
    message: `Cleared ${clearedCount} items from query cache`,
    clearedCount
  });
});

/**
 * @desc    Reset query statistics
 * @route   POST /api/admin/database/reset-stats
 * @access  Private (Admin)
 */
const resetQueryStats = wrap(async (req, res) => {
  // Verify admin permissions
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Admin privileges required to reset query statistics', {
      requiredRole: 'admin',
      userRole: req.user.role,
      userId: req.user._id
    });
  }
  
  queryOptimizer.resetQueryStats();
  
  logger.info('Reset query statistics');
  
  return res.json({
    success: true,
    message: 'Query statistics have been reset'
  });
});

/**
 * @desc    Get explain plan for a query
 * @route   POST /api/admin/database/explain
 * @access  Private (Admin)
 * @body    {model, query, options}
 */
const explainQuery = wrap(async (req, res) => {
  // Verify admin permissions
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Admin privileges required to get query explain plans', {
      requiredRole: 'admin',
      userRole: req.user.role,
      userId: req.user._id
    });
  }
  
  const { modelName, filter, options } = req.body;
  
  if (!modelName || !mongoose.models[modelName]) {
    throw createValidationError(`Invalid model name: ${modelName}`, {
      modelName,
      availableModels: Object.keys(mongoose.models)
    });
  }
  
  const model = mongoose.models[modelName];
  
  // Create the query
  let query;
  if (filter) {
    query = model.find(filter);
  } else {
    query = model.find();
  }
  
  // Apply options
  if (options) {
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    if (options.select) query = queryOptimizer.selectFields(query, options.select);
  }
  
  try {
    // Get explain plan
    const explainPlan = await query.explain();
    
    return res.json({
      success: true,
      data: {
        modelName,
        filter,
        options,
        explainPlan
      }
    });
  } catch (error) {
    logger.error('Error explaining query:', error);
    throw createDatabaseError('Failed to explain query', {
      modelName,
      filter,
      options,
      errorMessage: error.message
    });
  }
});

/**
 * @desc    Get query execution time data for specific queries
 * @route   GET /api/admin/database/slow-queries
 * @access  Private (Admin)
 */
const getSlowQueries = wrap(async (req, res) => {
  // Verify admin permissions
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Admin privileges required to access slow query data', {
      requiredRole: 'admin',
      userRole: req.user.role,
      userId: req.user._id
    });
  }
  
  const stats = queryOptimizer.getQueryStats();
  
  // Sort by average execution time
  const sortedQueries = Object.entries(stats.avgExecutionTimes)
    .map(([key, avgTime]) => ({
      queryKey: key,
      avgExecutionTime: avgTime
    }))
    .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime);
  
  return res.json({
    success: true,
    data: {
      slowQueries: sortedQueries.slice(0, 10), // Top 10 slowest queries
      totalSlowQueries: stats.slowQueries,
      threshold: 100, // ms
      timestamp: new Date()
    }
  });
});

/**
 * @desc    Check for missing indexes
 * @route   GET /api/admin/database/missing-indexes
 * @access  Private (Admin)
 */
const checkMissingIndexes = wrap(async (req, res) => {
  // Verify admin permissions
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Admin privileges required to check for missing indexes', {
      requiredRole: 'admin',
      userRole: req.user.role,
      userId: req.user._id
    });
  }
  
  try {
    const missingIndexes = [];
    
    // Check each model for common query patterns without indexes
    for (const [modelName, model] of Object.entries(mongoose.models)) {
      // Get schema paths
      const paths = model.schema.paths;
      const indexedPaths = Object.keys(model.schema.indexes());
      
      // Common fields that should be indexed
      const commonFields = ['userId', 'createdAt', 'updatedAt', 'status', 'type'];
      
      for (const field of commonFields) {
        if (paths[field] && !indexedPaths.includes(field)) {
          missingIndexes.push({
            model: modelName,
            field,
            recommendation: `Consider adding an index for frequently queried field: ${field}`,
            impact: 'Can improve query performance on large collections'
          });
        }
      }
      
      // Check for potential compound indexes
      // This is a simplified example - in a real system you'd analyze query patterns
      if (paths['userId'] && paths['createdAt'] && !indexedPaths.includes('userId_createdAt')) {
        missingIndexes.push({
          model: modelName,
          field: 'userId + createdAt',
          recommendation: 'Consider adding a compound index for user-based time series queries',
          impact: 'Can significantly improve filtering and sorting performance'
        });
      }
    }
    
    return res.json({
      success: true,
      data: {
        missingIndexes,
        totalRecommendations: missingIndexes.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error checking for missing indexes:', error);
    throw createDatabaseError('Failed to check for missing indexes', {
      errorMessage: error.message,
      errorStack: error.stack
    });
  }
});

module.exports = {
  getQueryStats,
  clearCache,
  resetQueryStats,
  explainQuery,
  getSlowQueries,
  checkMissingIndexes
};
