/**
 * Security Middleware
 * 
 * This middleware provides security-related functionality for the server,
 * including rate limiting, enhanced header security, and protection against
 * common web vulnerabilities.
 */

const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const csrf = require('csurf');
const hpp = require('hpp');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Configure rate limiting to prevent brute force and DoS attacks
 * @param {Object} options - Rate limiting options
 * @returns {Function} Rate limiting middleware
 */
const configureRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * API rate limiter with default settings
 */
const apiLimiter = configureRateLimit();

/**
 * More strict rate limiter for sensitive routes like login/register
 */
const authLimiter = configureRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again after an hour.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Setup CSRF protection
 * @returns {Function} CSRF protection middleware
 */
const setupCSRF = () => {
  // CSRF protection should be disabled for API routes that are called from mobile apps
  // or from external services with API keys
  return csrf({ 
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  });
};

/**
 * CORS configuration for different environments
 * @returns {Object} CORS configuration object
 */
const corsOptions = () => {
  // In development, allow all origins (or specify local dev origins)
  if (process.env.NODE_ENV !== 'production') {
    return {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    };
  }
  
  // In production, only allow specified origins
  return {
    origin: process.env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
};

/**
 * Configure security headers using Helmet
 * @returns {Function} Helmet middleware with configured options
 */
const configureHelmet = () => {
  return [
    // Basic Helmet setup (already applied in server.js)
    helmet(),
    
    // Content Security Policy
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "*.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://*"],
        connectSrc: ["'self'", "wss://*", "ws://*", "*.stripe.com"],
        frameSrc: ["'self'", "*.stripe.com"],
        reportUri: process.env.CSP_REPORT_URI || '/api/csp-report'
      }
    }),
    
    // Other security headers
    helmet.xssFilter(),
    helmet.noSniff(),
    helmet.hidePoweredBy(),
    helmet.frameguard({ action: 'deny' }),
    helmet.referrerPolicy({ policy: 'same-origin' }),
    
    // Set Strict Transport Security header in production
    process.env.NODE_ENV === 'production' ? 
      helmet.hsts({
        maxAge: 15552000, // 180 days in seconds
        includeSubDomains: true,
        preload: true
      }) : 
      (req, res, next) => next() // No-op in development
  ];
};

/**
 * Validates that the request body, params, and query do not contain XSS content
 */
const xssMiddleware = xss();

/**
 * Sanitizes user input to prevent MongoDB operator injection
 */
const mongoSanitizeMiddleware = mongoSanitize();

/**
 * Prevents HTTP Parameter Pollution attacks
 */
const preventParamPollution = hpp();

/**
 * Apply all security middleware to the app
 * @param {Object} app - Express app
 */
const applySecurityMiddleware = (app) => {
  // Apply rate limiting
  if (process.env.ENABLE_RATE_LIMITING === 'true') {
    app.use('/api/', apiLimiter);
    app.use('/api/users/login', authLimiter);
    app.use('/api/users/register', authLimiter);
    app.use('/api/users/forgot-password', authLimiter);
  }
  
  // Apply security headers
  configureHelmet().forEach(middleware => app.use(middleware));
  
  // Apply XSS prevention
  if (process.env.ENABLE_XSS_PROTECTION === 'true') {
    app.use(xssMiddleware);
  }
  
  // Apply MongoDB sanitization
  app.use(mongoSanitizeMiddleware);
  
  // Prevent parameter pollution
  app.use(preventParamPollution);
  
  // Apply CSRF protection for non-API routes
  if (process.env.ENABLE_CSRF_PROTECTION === 'true') {
    // Apply CSRF protection to all routes except API routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      return setupCSRF()(req, res, next);
    });
    
    // CSRF error handler
    app.use((err, req, res, next) => {
      if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid CSRF token',
          code: 'INVALID_CSRF_TOKEN'
        });
      }
      return next(err);
    });
  }
};

module.exports = {
  apiLimiter,
  authLimiter,
  corsOptions,
  configureHelmet,
  setupCSRF,
  applySecurityMiddleware
};
