/**
 * TikTok API Rate Limiter Middleware
 * 
 * Implements rate limiting for TikTok API requests to:
 * - Prevent API abuse
 * - Stay within TikTok API rate limits
 * - Provide consistent API access across users
 * - Handle rate limit errors gracefully
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../../utils/redisAdapter');
const logger = require('../../config/logger');

/**
 * Creates a rate limiter for TikTok API endpoints
 * @param {Object} options - Custom options for the rate limiter
 * @returns {Function} Express middleware
 */
const createTikTokRateLimiter = (options = {}) => {
  const defaultOptions = {
    // Allow 50 requests per minute per user by default
    windowMs: 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    // Use user ID as key
    keyGenerator: (req) => {
      return req.user ? `tiktok_${req.user.id}` : `tiktok_${req.ip}`;
    },
    // Customize rate limit exceeded handler
    handler: (req, res) => {
      logger.warn(`TikTok rate limit exceeded for user ${req.user ? req.user.id : req.ip}`);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to TikTok API. Please try again later.',
        retryAfter: Math.ceil(60 - (Date.now() % 60000) / 1000)
      });
    },
    // Skip rate limiting for non-TikTok endpoints
    skip: (req) => !req.path.includes('/platform/tiktok') && !req.path.includes('/api/tiktok'),
    // Skip rate limiting for certain user roles if needed
    skipFailedRequests: false,
    requestWasSuccessful: (req, res) => res.statusCode < 400
  };

  // Use Redis for distributed rate limiting if available
  let limiterOptions = { ...defaultOptions, ...options };
  if (redis.isConnected()) {
    limiterOptions.store = new RedisStore({
      sendCommand: (...args) => redis.client.sendCommand(args),
      prefix: 'tiktok_ratelimit:'
    });
    logger.info('Using Redis store for TikTok rate limiting');
  } else {
    logger.info('Using memory store for TikTok rate limiting (Redis not available)');
  }

  return rateLimit(limiterOptions);
};

/**
 * Rate limiters with different settings for different TikTok API endpoint types
 */
const rateLimiters = {
  // General TikTok API rate limiter
  general: createTikTokRateLimiter(),
  
  // Rate limiter for authentication endpoints (more permissive)
  auth: createTikTokRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => `tiktok_auth_${req.ip}`
  }),
  
  // Rate limiter for analytics endpoints (more restrictive)
  analytics: createTikTokRateLimiter({
    windowMs: 60 * 1000,
    max: 20
  }),
  
  // Rate limiter for content endpoints (medium restrictive)
  content: createTikTokRateLimiter({
    windowMs: 60 * 1000,
    max: 30
  }),
  
  // Rate limiter for read-only endpoints (less restrictive)
  readonly: createTikTokRateLimiter({
    windowMs: 60 * 1000,
    max: 100
  }),
  
  // Rate limiter for write operations (more restrictive)
  write: createTikTokRateLimiter({
    windowMs: 60 * 1000,
    max: 10
  })
};

/**
 * Get the appropriate rate limiter based on request path
 * @param {Object} req - Express request object
 * @returns {Function} Appropriate rate limiter middleware
 */
const getTikTokRateLimiter = (req) => {
  const path = req.path.toLowerCase();
  
  // Auth endpoints
  if (path.includes('/auth') || path.includes('/connect')) {
    return rateLimiters.auth;
  }
  
  // Analytics endpoints
  if (path.includes('/analytics') || path.includes('/stats') || path.includes('/audience')) {
    return rateLimiters.analytics;
  }
  
  // Content endpoints
  if (path.includes('/content') || path.includes('/videos') || path.includes('/post')) {
    // Check if read or write
    if (req.method === 'GET') {
      return rateLimiters.content;
    }
    return rateLimiters.write;
  }
  
  // Read-only endpoints
  if (req.method === 'GET') {
    return rateLimiters.readonly;
  }
  
  // Default to general limiter
  return rateLimiters.general;
};

/**
 * Dynamic TikTok rate limiter middleware
 * Selects the appropriate rate limiter based on the request path
 */
const dynamicTikTokRateLimiter = (req, res, next) => {
  const rateLimiter = getTikTokRateLimiter(req);
  rateLimiter(req, res, next);
};

module.exports = {
  createTikTokRateLimiter,
  rateLimiters,
  dynamicTikTokRateLimiter
};
