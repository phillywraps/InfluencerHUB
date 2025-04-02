const { RateLimiterMemory } = require('rate-limiter-flexible');

// Create a rate limiter for login attempts
const loginLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60 * 60, // per 1 hour
});

// Create a rate limiter for password reset attempts
const passwordResetLimiter = new RateLimiterMemory({
  points: 3, // 3 attempts
  duration: 60 * 60, // per 1 hour
});

// Create a rate limiter for email verification attempts
const emailVerificationLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60 * 60, // per 1 hour
});

// Create a rate limiter for registration attempts
const registrationLimiter = new RateLimiterMemory({
  points: 3, // 3 attempts
  duration: 60 * 60, // per 1 hour
});

// Create general purpose rate limiters with different severities
const lowLimiter = new RateLimiterMemory({
  points: 30, // 30 requests
  duration: 60, // per 1 minute
});

const mediumLimiter = new RateLimiterMemory({
  points: 15, // 15 requests
  duration: 60, // per 1 minute
});

const highLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60, // per 1 minute
});

// Middleware for login rate limiting
const loginRateLimiter = async (req, res, next) => {
  try {
    // Use IP as key
    const key = req.ip;
    await loginLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.'
    });
  }
};

// Middleware for password reset rate limiting
const passwordResetRateLimiter = async (req, res, next) => {
  try {
    // Use IP as key
    const key = req.ip;
    await passwordResetLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again later.'
    });
  }
};

// Middleware for email verification rate limiting
const emailVerificationRateLimiter = async (req, res, next) => {
  try {
    // Use IP as key
    const key = req.ip;
    await emailVerificationLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      message: 'Too many email verification attempts. Please try again later.'
    });
  }
};

// Middleware for registration rate limiting
const registrationRateLimiter = async (req, res, next) => {
  try {
    // Use IP as key
    const key = req.ip;
    await registrationLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts. Please try again later.'
    });
  }
};

// General purpose rate limiting middlewares
const low = async (req, res, next) => {
  try {
    const key = req.ip;
    await lowLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
};

const medium = async (req, res, next) => {
  try {
    const key = req.ip;
    await mediumLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
};

const high = async (req, res, next) => {
  try {
    const key = req.ip;
    await highLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
};

module.exports = {
  loginRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
  registrationRateLimiter,
  low,
  medium,
  high
};
