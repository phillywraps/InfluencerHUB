/**
 * Cache Service
 * 
 * A service for caching API responses to improve performance.
 * - Stores API responses in memory for a configurable TTL
 * - Automatically invalidates cache entries when they expire
 * - Supports cache bypassing for specific requests
 * - Only caches GET requests
 */

// Cache configuration
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_ENABLED = true;

// In-memory cache storage
const cache = new Map();

/**
 * Cache service for API responses
 */
const cacheService = {
  /**
   * Set a value in the cache
   * 
   * @param {string} key - The cache key
   * @param {any} value - The value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = DEFAULT_TTL) {
    if (!CACHE_ENABLED) return;
    
    const now = Date.now();
    const expiry = now + ttl;
    
    cache.set(key, {
      value,
      expiry
    });
    
    // Schedule cache entry cleanup after TTL expires
    setTimeout(() => {
      if (cache.has(key) && cache.get(key).expiry === expiry) {
        cache.delete(key);
      }
    }, ttl);
  },
  
  /**
   * Get a value from the cache
   * 
   * @param {string} key - The cache key
   * @returns {any|null} The cached value or null if not found or expired
   */
  get(key) {
    if (!CACHE_ENABLED || !cache.has(key)) return null;
    
    const entry = cache.get(key);
    const now = Date.now();
    
    // Check if the entry has expired
    if (entry.expiry < now) {
      cache.delete(key);
      return null;
    }
    
    return entry.value;
  },
  
  /**
   * Remove a value from the cache
   * 
   * @param {string} key - The cache key
   */
  delete(key) {
    cache.delete(key);
  },
  
  /**
   * Clear the entire cache
   */
  clear() {
    cache.clear();
  },
  
  /**
   * Clear cache entries that match a pattern
   * 
   * @param {RegExp} pattern - Regular expression pattern to match cache keys
   */
  clearPattern(pattern) {
    if (!pattern instanceof RegExp) return;
    
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    }
  },
  
  /**
   * Generate a cache key from a request config
   * 
   * @param {Object} config - Axios request config
   * @returns {string} Cache key
   */
  generateKey(config) {
    const { url, params, data } = config;
    
    // For GET requests, include URL and params in the key
    if (config.method === 'get') {
      return `${url}${params ? JSON.stringify(params) : ''}`;
    }
    
    // For other methods, include URL, params, and request data
    return `${config.method}:${url}${params ? JSON.stringify(params) : ''}${data ? JSON.stringify(data) : ''}`;
  },
  
  /**
   * Check if a request should be cached
   * 
   * @param {Object} config - Axios request config
   * @returns {boolean} Whether the request should be cached
   */
  shouldCache(config) {
    // Only cache GET requests
    if (config.method !== 'get') return false;
    
    // Don't cache requests with cache: false in their config
    if (config.cache === false) return false;
    
    return CACHE_ENABLED;
  },
  
  /**
   * Get the TTL for a specific request
   * 
   * @param {Object} config - Axios request config
   * @returns {number} TTL in milliseconds
   */
  getTTL(config) {
    // Allow custom TTL per request
    if (typeof config.ttl === 'number') {
      return config.ttl;
    }
    
    // Use endpoint-specific TTLs
    if (config.url.includes('/influencers')) {
      return 10 * 60 * 1000; // 10 minutes for influencer data
    }
    
    if (config.url.includes('/analytics')) {
      return 30 * 60 * 1000; // 30 minutes for analytics data
    }
    
    // Default TTL
    return DEFAULT_TTL;
  }
};

export default cacheService;
