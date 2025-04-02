/**
 * Payment Security Middleware
 * 
 * Enhances security for payment-related endpoints with:
 * - Rate limiting to prevent brute force attacks
 * - CSRF protection
 * - Payment-specific input validation
 * - Request / origin validation
 * - PCI-DSS compliant logging practices 
 * - Fraud detection patterns
 */

const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const helmet = require('helmet');
const logger = require('../config/logger');
const ipRangeCheck = require('ip-range-check');
const { createValidationError } = require('./errorMiddleware');

// Constants
const STRIPE_IP_RANGES = [
  '3.18.12.63',
  '3.130.192.231',
  '13.235.14.237',
  '13.235.122.149',
  '18.211.135.69',
  '35.154.171.200',
  '52.15.183.38',
  '54.88.130.119',
  '54.88.130.237',
  '54.187.174.169',
  '54.187.205.235',
  '54.187.216.72',
  '54.241.31.99',
  '54.241.31.102',
  '54.241.34.107'
];

// IP Whitelist for Webhook endpoints (Stripe IPs)
const webhookIpWhitelist = (req, res, next) => {
  const clientIp = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress || 
                   req.connection.socket.remoteAddress;
  
  // Check if the IP is in the Stripe IP range
  if (!ipRangeCheck(clientIp, STRIPE_IP_RANGES)) {
    logger.warn('Unauthorized webhook access attempt', {
      ip: clientIp, 
      path: req.path,
      headers: req.headers
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access forbidden'
    });
  }
  
  next();
};

// Rate limiting for payment endpoints
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many payment requests from this IP, please try again after 15 minutes'
  },
  headers: true,
  keyGenerator: (req) => {
    // Use a combination of IP and user ID if available for more precise limiting
    return req.user ? `${req.ip}-${req.user._id}` : req.ip;
  },
  skip: (req) => {
    // Don't rate limit webhook endpoints (they're protected by signature verification)
    return req.path.includes('/webhook');
  },
  onLimitReached: (req, res) => {
    logger.warn('Rate limit reached for payment endpoint', {
      ip: req.ip,
      userId: req.user?._id,
      path: req.path
    });
  }
});

// More strict rate limiting for payment method operations
const paymentMethodRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  message: {
    success: false,
    message: 'Too many payment method operations from this IP, please try again after an hour'
  },
  headers: true,
  keyGenerator: (req) => {
    return req.user ? `${req.ip}-${req.user._id}` : req.ip;
  }
});

// Request validation for payment intents
const validatePaymentIntentRequest = [
  body('rentalId')
    .isMongoId().withMessage('Invalid rentalId format')
    .exists().withMessage('rentalId is required'),
  
  body('paymentMethodId')
    .isString().withMessage('paymentMethodId must be a string')
    .isLength({ min: 3, max: 100 }).withMessage('paymentMethodId is invalid length')
    .exists().withMessage('paymentMethodId is required'),
  
  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createValidationError('Invalid payment request data', 
        { errors: errors.array() }
      ));
    }
    next();
  }
];

// Request validation for payment methods
const validatePaymentMethodRequest = [
  body('paymentMethodId')
    .isString().withMessage('paymentMethodId must be a string')
    .matches(/^pm_/).withMessage('paymentMethodId must be a valid Stripe payment method ID')
    .isLength({ min: 3, max: 100 }).withMessage('paymentMethodId is invalid length')
    .exists().withMessage('paymentMethodId is required'),
  
  // Optional field validation
  body('setAsDefault')
    .optional()
    .isBoolean().withMessage('setAsDefault must be a boolean'),
  
  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createValidationError('Invalid payment method data', 
        { errors: errors.array() }
      ));
    }
    next();
  }
];

// Validation for subscription creation
const validateSubscriptionRequest = [
  body('rentalId')
    .isMongoId().withMessage('Invalid rentalId format')
    .exists().withMessage('rentalId is required'),
  
  body('paymentMethodId')
    .isString().withMessage('paymentMethodId must be a string')
    .matches(/^pm_/).withMessage('paymentMethodId must be a valid Stripe payment method ID')
    .isLength({ min: 3, max: 100 }).withMessage('paymentMethodId is invalid length')
    .exists().withMessage('paymentMethodId is required'),
  
  body('priceId')
    .isString().withMessage('priceId must be a string')
    .matches(/^price_/).withMessage('priceId must be a valid Stripe price ID')
    .isLength({ min: 8, max: 100 }).withMessage('priceId is invalid length')
    .exists().withMessage('priceId is required'),
  
  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createValidationError('Invalid subscription data', 
        { errors: errors.array() }
      ));
    }
    next();
  }
];

// Validation for confirming payment intents
const validatePaymentIntentConfirmation = [
  body('paymentIntentId')
    .isString().withMessage('paymentIntentId must be a string')
    .matches(/^pi_/).withMessage('paymentIntentId must be a valid Stripe payment intent ID')
    .isLength({ min: 8, max: 100 }).withMessage('paymentIntentId is invalid length')
    .exists().withMessage('paymentIntentId is required'),
  
  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createValidationError('Invalid payment intent confirmation data', 
        { errors: errors.array() }
      ));
    }
    next();
  }
];

// Webhook body parser - preserve raw body for signature verification
const webhookBodyParser = (req, res, next) => {
  if (req.path.includes('/webhook')) {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

// Security headers for payment routes
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
  hsts: { 
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: true 
  }
});

// PCI-DSS compliant logging (avoid logging sensitive data)
const pciCompliantLogger = (req, res, next) => {
  // Clone the request body to avoid mutating it
  const sanitizedBody = { ...req.body };
  
  // Remove sensitive data before logging
  if (sanitizedBody.paymentMethodId) {
    sanitizedBody.paymentMethodId = '***REDACTED***';
  }
  
  // Log request metadata but not sensitive payment data
  logger.info('Payment endpoint accessed', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?._id,
    userAgent: req.get('User-Agent'),
    referrer: req.get('Referer'),
    requestId: req.id // Assuming you have a request ID middleware
  });
  
  next();
};

// Fraud detection patterns (time-based token validation)
const fraudDetection = (req, res, next) => {
  // Simple time-based token validation to prevent replay attacks
  const authTimestamp = req.get('X-Auth-Timestamp');
  
  if (authTimestamp) {
    const timestamp = parseInt(authTimestamp, 10);
    const now = Date.now();
    
    // Check if timestamp is within a reasonable window (5 minutes)
    if (isNaN(timestamp) || Math.abs(now - timestamp) > 5 * 60 * 1000) {
      logger.warn('Potential replay attack detected', {
        ip: req.ip,
        userId: req.user?._id,
        path: req.path,
        authTimestamp
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid request timestamp'
      });
    }
  }
  
  next();
};

// Context validation (HTTP Referer, Origin)
const originValidation = (req, res, next) => {
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  
  // Skip for webhook endpoints
  if (req.path.includes('/webhook')) {
    return next();
  }
  
  // Check that origin/referer is from allowed domains
  const allowedDomains = [
    process.env.FRONTEND_URL,
    process.env.MOBILE_APP_URL,
    'https://influencerhub.com',
    'https://app.influencerhub.com'
  ].filter(Boolean);
  
  const hasValidOrigin = !origin || allowedDomains.some(domain => origin.startsWith(domain));
  const hasValidReferer = !referer || allowedDomains.some(domain => referer.startsWith(domain));
  
  if (!hasValidOrigin || !hasValidReferer) {
    logger.warn('Invalid origin or referer for payment request', {
      ip: req.ip,
      userId: req.user?._id,
      path: req.path,
      origin,
      referer
    });
    
    return res.status(403).json({
      success: false,
      message: 'Invalid request origin'
    });
  }
  
  next();
};

// Middleware combinations for different payment routes
const createPaymentIntentMiddleware = [
  securityHeaders,
  paymentRateLimiter,
  pciCompliantLogger,
  fraudDetection,
  originValidation,
  validatePaymentIntentRequest
];

const confirmPaymentIntentMiddleware = [
  securityHeaders,
  paymentRateLimiter,
  pciCompliantLogger,
  fraudDetection,
  originValidation,
  validatePaymentIntentConfirmation
];

const paymentMethodsMiddleware = [
  securityHeaders,
  paymentMethodRateLimiter,
  pciCompliantLogger,
  fraudDetection,
  originValidation,
  validatePaymentMethodRequest
];

const subscriptionMiddleware = [
  securityHeaders,
  paymentRateLimiter,
  pciCompliantLogger,
  fraudDetection,
  originValidation,
  validateSubscriptionRequest
];

const webhookMiddleware = [
  webhookBodyParser,
  webhookIpWhitelist
];

module.exports = {
  createPaymentIntentMiddleware,
  confirmPaymentIntentMiddleware,
  paymentMethodsMiddleware,
  subscriptionMiddleware,
  webhookMiddleware,
  // Export individual middleware for custom combinations
  paymentRateLimiter,
  paymentMethodRateLimiter,
  validatePaymentIntentRequest,
  validatePaymentMethodRequest,
  validateSubscriptionRequest,
  validatePaymentIntentConfirmation,
  securityHeaders,
  pciCompliantLogger,
  fraudDetection,
  originValidation,
  webhookBodyParser,
  webhookIpWhitelist
};
