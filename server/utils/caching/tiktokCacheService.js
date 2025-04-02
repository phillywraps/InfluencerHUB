/**
 * TikTok Cache Service
 * 
 * Provides caching functionality for TikTok API responses to:
 * - Reduce API calls and stay within rate limits
 * - Improve performance for frequently requested data
 * - Provide fallback data when the API is unavailable
 */

const NodeCache = require('node-cache');
const logger = require('../../config/logger');

// Configure cache with different TTLs based on data type
const ttlSettings = {
  // Cache user profile data for 1 hour
  profile: 60 * 60,
  // Cache analytics data for 15 minutes
  analytics: 15 * 60,
  // Cache content lists for 5 minutes
  content: 5 * 60,
  // Cache audience data for 3 hours
  audience: 3 * 60 * 60,
  // Cache hashtag suggestions for 1 day
  hashtags: 24 * 60 * 60
};

// Initialize cache with checkperiod of 10 minutes
const cache = new NodeCache({
  stdTTL: 60 * 60, // Default TTL: 1 hour
  checkperiod: 10 * 60 // Check for expired keys every 10 minutes
});

/**
 * Generate a cache key for TikTok data
 * @param {string} dataType - Type of data (profile, analytics, content, audience, hashtags)
 * @param {string} userId - User ID
 * @param {Object} params - Additional parameters to uniquely identify the data
 * @returns {string} Cache key
 */
const generateCacheKey = (dataType, userId, params = {}) => {
  const paramsString = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('_');
  
  return `tiktok_${dataType}_${userId}${paramsString ? '_' + paramsString : ''}`;
};

/**
 * Get data from cache
 * @param {string} dataType - Type of data
 * @param {string} userId - User ID
 * @param {Object} params - Additional parameters
 * @returns {Object|null} Cached data or null if not found
 */
const getCachedData = (dataType, userId, params = {}) => {
  const cacheKey = generateCacheKey(dataType, userId, params);
  const data = cache.get(cacheKey);
  
  if (data) {
    logger.debug(`TikTok cache hit for ${cacheKey}`);
    return data;
  }
  
  logger.debug(`TikTok cache miss for ${cacheKey}`);
  return null;
};

/**
 * Set data in cache
 * @param {string} dataType - Type of data
 * @param {string} userId - User ID
 * @param {Object} data - Data to cache
 * @param {Object} params - Additional parameters
 * @param {number} customTtl - Custom TTL in seconds (optional)
 * @returns {boolean} Success status
 */
const setCachedData = (dataType, userId, data, params = {}, customTtl = null) => {
  const cacheKey = generateCacheKey(dataType, userId, params);
  const ttl = customTtl || ttlSettings[dataType] || ttlSettings.default;
  
  try {
    const success = cache.set(cacheKey, data, ttl);
    logger.debug(`TikTok data cached for ${cacheKey}, TTL: ${ttl}s`);
    return success;
  } catch (error) {
    logger.error(`Failed to cache TikTok data for ${cacheKey}:`, error);
    return false;
  }
};

/**
 * Delete cached data
 * @param {string} dataType - Type of data
 * @param {string} userId - User ID
 * @param {Object} params - Additional parameters
 * @returns {boolean} Success status
 */
const deleteCachedData = (dataType, userId, params = {}) => {
  const cacheKey = generateCacheKey(dataType, userId, params);
  return cache.del(cacheKey);
};

/**
 * Clear all cached data for a user
 * @param {string} userId - User ID
 * @returns {Array} Deleted keys
 */
const clearUserCache = (userId) => {
  const allKeys = cache.keys();
  const userKeys = allKeys.filter(key => key.includes(`_${userId}_`));
  
  userKeys.forEach(key => cache.del(key));
  logger.info(`Cleared TikTok cache for user ${userId}, ${userKeys.length} entries removed`);
  
  return userKeys;
};

/**
 * Get all cache stats
 * @returns {Object} Cache statistics
 */
const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    stats: cache.getStats(),
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};

/**
 * Cache wrapper for API calls
 * @param {string} dataType - Type of data
 * @param {string} userId - User ID
 * @param {Object} params - Additional parameters
 * @param {Function} fetchFunction - Function to call if cache miss
 * @param {number} customTtl - Custom TTL in seconds (optional)
 * @returns {Promise<Object>} Requested data
 */
const withCache = async (dataType, userId, params, fetchFunction, customTtl = null) => {
  // Try to get from cache first
  const cachedData = getCachedData(dataType, userId, params);
  if (cachedData) {
    return cachedData;
  }
  
  // If not in cache, fetch from source
  try {
    const data = await fetchFunction();
    
    // Cache the fetched data
    setCachedData(dataType, userId, data, params, customTtl);
    
    return data;
  } catch (error) {
    logger.error(`Error fetching TikTok ${dataType} data:`, error);
    throw error;
  }
};

module.exports = {
  getCachedData,
  setCachedData,
  deleteCachedData,
  clearUserCache,
  getCacheStats,
  withCache
};
