/**
 * Query Optimizer
 * 
 * Utility for optimizing database queries to improve performance,
 * reduce database load, and minimize response times.
 * 
 * Features:
 * - Query consolidation to reduce multiple database calls
 * - Automatic field selection to prevent overfetching
 * - Query caching for frequently accessed data
 * - Query execution time tracking for monitoring
 * - Pagination and cursor-based optimizations
 */

const mongoose = require('mongoose');
const NodeCache = require('node-cache');
const logger = require('../config/logger');

// Cache for frequently accessed queries
// stdTTL: default time to live in seconds
// checkperiod: how often to check for expired keys in seconds
const queryCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Track query statistics
const queryStats = {
  totalQueries: 0,
  cachedQueries: 0,
  slowQueries: 0, // Queries taking >100ms
  executionTimes: {}
};

/**
 * Optimize query by selecting only needed fields
 * 
 * @param {Object} query - Mongoose query object
 * @param {Array|String} fields - Array of field names or comma-separated string
 * @returns {Object} - Modified query with field selection
 */
const selectFields = (query, fields) => {
  if (!fields) return query;
  
  if (Array.isArray(fields)) {
    return query.select(fields.join(' '));
  } else if (typeof fields === 'string') {
    return query.select(fields.replace(/,/g, ' '));
  }
  
  return query;
};

/**
 * Execute a query with caching and performance tracking
 * 
 * @param {Object} query - Mongoose query object
 * @param {String} cacheKey - Key for caching results
 * @param {Object} options - Additional options
 * @param {Number} options.ttl - Cache time to live in seconds
 * @param {Boolean} options.skipCache - Skip cache for this query
 * @param {Function} options.keyGenerator - Function to generate cache key
 * @returns {Promise<Array|Object>} - Query results
 */
const executeQuery = async (query, cacheKey, options = {}) => {
  const {
    ttl = 300,
    skipCache = false,
    keyGenerator = null
  } = options;
  
  // If keyGenerator is provided, use it to generate cache key
  const finalCacheKey = keyGenerator ? keyGenerator(query) : cacheKey;
  
  // Increment total queries counter
  queryStats.totalQueries++;

  // Check cache first if caching is enabled
  if (finalCacheKey && !skipCache) {
    const cachedResult = queryCache.get(finalCacheKey);
    if (cachedResult) {
      queryStats.cachedQueries++;
      logger.debug(`Cache hit for key: ${finalCacheKey}`);
      return cachedResult;
    }
  }

  // Measure execution time
  const startTime = Date.now();
  
  // Execute query
  const result = await query.exec();

  // Calculate execution time
  const executionTime = Date.now() - startTime;
  
  // Track execution time statistics
  if (!queryStats.executionTimes[finalCacheKey]) {
    queryStats.executionTimes[finalCacheKey] = [];
  }
  queryStats.executionTimes[finalCacheKey].push(executionTime);
  
  // Log slow queries
  if (executionTime > 100) {
    queryStats.slowQueries++;
    logger.warn(`Slow query detected: ${finalCacheKey || query._collection.name} (${executionTime}ms)`);
  }
  
  // Cache result if cache key is provided
  if (finalCacheKey && !skipCache) {
    queryCache.set(finalCacheKey, result, ttl);
  }
  
  return result;
};

/**
 * Create a batch loader for efficient loading of related documents
 * (prevents N+1 query problem)
 * 
 * @param {Object} model - Mongoose model
 * @param {String} key - Foreign key to batch by
 * @param {Object} options - Additional options
 * @returns {Function} - Batch loader function
 */
const createBatchLoader = (model, key = '_id', options = {}) => {
  const {
    fields = null,
    cacheResults = true,
    ttl = 300
  } = options;
  
  // The batch loader function
  return async (ids) => {
    if (!ids || ids.length === 0) return [];
    
    // Create a unique key based on the ids
    const cacheKey = cacheResults ? `batch:${model.modelName}:${key}:${ids.join(',')}` : null;
    
    // Create query
    let query = model.find({ [key]: { $in: ids } });
    
    // Apply field selection if specified
    if (fields) {
      query = selectFields(query, fields);
    }
    
    // Execute with caching
    const results = await executeQuery(query, cacheKey, { ttl });
    
    // Index results by id for faster lookup
    const indexedResults = {};
    results.forEach(item => {
      indexedResults[item[key]] = item;
    });
    
    // Return results in the same order as requested ids
    return ids.map(id => indexedResults[id] || null);
  };
};

/**
 * Get optimized aggregation for analytics queries
 * 
 * @param {Object} model - Mongoose model
 * @param {Array} pipeline - Aggregation pipeline stages
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Aggregation results
 */
const executeOptimizedAggregation = async (model, pipeline, options = {}) => {
  const {
    cacheKey = null,
    ttl = 300,
    skipCache = false,
    explain = false
  } = options;
  
  // Add $hint stage if index is specified
  if (options.index) {
    pipeline.unshift({ $hint: options.index });
  }
  
  // Create aggregation
  const aggregation = model.aggregate(pipeline);
  
  // If explain is true, return explanation of query execution
  if (explain) {
    return aggregation.explain();
  }
  
  // Execute with caching
  return executeQuery(aggregation, cacheKey, { ttl, skipCache });
};

/**
 * Optimize pagination queries with efficient cursor implementation
 * 
 * @param {Object} model - Mongoose model
 * @param {Object} filter - Filter conditions
 * @param {Object} options - Pagination and other options
 * @returns {Promise<Object>} - Paginated results with cursor
 */
const paginateWithCursor = async (model, filter = {}, options = {}) => {
  const {
    limit = 20,
    cursor = null,
    sortField = '_id',
    sortDirection = 'desc',
    fields = null,
    cacheKey = null,
    ttl = 300
  } = options;
  
  // Determine sort order
  const sort = { [sortField]: sortDirection === 'desc' ? -1 : 1 };
  
  // Build filter with cursor logic
  let cursorFilter = { ...filter };
  if (cursor) {
    try {
      const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString());
      const comparisonOp = sortDirection === 'desc' ? '$lt' : '$gt';
      cursorFilter[sortField] = { [comparisonOp]: decodedCursor.value };
    } catch (error) {
      logger.error('Invalid cursor format', error);
    }
  }
  
  // Create query
  let query = model.find(cursorFilter).sort(sort).limit(limit + 1); // get one extra for next cursor
  
  // Apply field selection if specified
  if (fields) {
    query = selectFields(query, fields);
  }
  
  // Calculate cache key if needed
  const finalCacheKey = cacheKey ? 
    `${cacheKey}:${JSON.stringify(cursorFilter)}:${limit}:${sortField}:${sortDirection}:${fields}` : 
    null;
  
  // Execute query
  const results = await executeQuery(query, finalCacheKey, { ttl });
  
  // Check if there are more results
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  
  // Create next cursor if there are more results
  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    const cursorValue = lastItem[sortField];
    nextCursor = Buffer.from(JSON.stringify({ value: cursorValue })).toString('base64');
  }
  
  return {
    items,
    hasMore,
    nextCursor
  };
};

/**
 * Preload commonly accessed data for a user session
 * 
 * @param {String} userId - User ID
 * @param {Array} dataTypes - Types of data to preload
 * @returns {Promise<Object>} - Preloaded data
 */
const preloadUserData = async (userId, dataTypes = ['notifications', 'preferences']) => {
  if (!userId) {
    throw new Error('User ID is required for preloading data');
  }
  
  const preloadedData = {};
  const User = mongoose.model('User');
  
  // Run queries in parallel
  const tasks = [];
  
  if (dataTypes.includes('profile')) {
    tasks.push(
      executeQuery(
        User.findById(userId).select('-password'),
        `user:${userId}:profile`,
        { ttl: 600 }
      ).then(result => { preloadedData.profile = result; })
    );
  }
  
  if (dataTypes.includes('notifications')) {
    const Notification = mongoose.model('Notification');
    tasks.push(
      executeQuery(
        Notification.find({ userId, read: false }).sort({ createdAt: -1 }).limit(10),
        `user:${userId}:notifications`,
        { ttl: 60 } // Short TTL for notifications
      ).then(result => { preloadedData.notifications = result; })
    );
  }
  
  if (dataTypes.includes('preferences')) {
    tasks.push(
      executeQuery(
        User.findById(userId).select('preferences'),
        `user:${userId}:preferences`,
        { ttl: 3600 } // Longer TTL for preferences
      ).then(result => { preloadedData.preferences = result?.preferences || {}; })
    );
  }
  
  if (dataTypes.includes('analytics')) {
    // Analytics summary data that is commonly used across dashboard components
    const analyticsModel = mongoose.model('Analytics');
    tasks.push(
      executeOptimizedAggregation(
        analyticsModel,
        [
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $sort: { date: -1 } },
          { $limit: 30 },
          { $project: { _id: 0, date: 1, metrics: 1 } }
        ],
        { 
          cacheKey: `user:${userId}:analytics-summary`, 
          ttl: 300
        }
      ).then(result => { preloadedData.analytics = result; })
    );
  }
  
  // Wait for all tasks to complete
  await Promise.all(tasks);
  
  return preloadedData;
};

/**
 * Get cached data directly without executing a query
 * Useful when you want to check if data is in cache before deciding to query
 * 
 * @param {String} key - Cache key to retrieve
 * @returns {any} - Cached data or undefined if not in cache
 */
const getCachedData = (key) => {
  if (!key) return undefined;
  return queryCache.get(key);
};

/**
 * Get query performance statistics
 * 
 * @returns {Object} - Query performance statistics
 */
const getQueryStats = () => {
  // Calculate average execution times
  const avgExecutionTimes = {};
  for (const [key, times] of Object.entries(queryStats.executionTimes)) {
    if (times.length > 0) {
      const sum = times.reduce((a, b) => a + b, 0);
      avgExecutionTimes[key] = Math.round(sum / times.length);
    }
  }
  
  // Add cache hit rate
  const cacheHitRate = queryStats.totalQueries > 0 
    ? (queryStats.cachedQueries / queryStats.totalQueries) * 100 
    : 0;
  
  return {
    totalQueries: queryStats.totalQueries,
    cachedQueries: queryStats.cachedQueries,
    slowQueries: queryStats.slowQueries,
    cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    cacheSize: queryCache.getStats().keys,
    avgExecutionTimes
  };
};

/**
 * Clear query cache
 * 
 * @param {String} pattern - Optional pattern to match keys
 * @returns {Number} - Number of keys deleted
 */
const clearQueryCache = (pattern = null) => {
  if (pattern) {
    const keys = queryCache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => queryCache.del(key));
    return matchingKeys.length;
  } else {
    queryCache.flushAll();
    return queryCache.getStats().keys;
  }
};

/**
 * Reset query statistics
 */
const resetQueryStats = () => {
  queryStats.totalQueries = 0;
  queryStats.cachedQueries = 0;
  queryStats.slowQueries = 0;
  queryStats.executionTimes = {};
};

module.exports = {
  executeQuery,
  selectFields,
  createBatchLoader,
  executeOptimizedAggregation,
  paginateWithCursor,
  preloadUserData,
  getQueryStats,
  clearQueryCache,
  resetQueryStats,
  getCachedData
};
