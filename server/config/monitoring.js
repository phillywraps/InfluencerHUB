/**
 * Monitoring and Observability Configuration
 * 
 * This file implements a comprehensive monitoring system for the InfluencerHUB server,
 * including structured logging, metrics collection, distributed tracing, and health checks.
 */

const winston = require('winston');
const { format } = winston;
const { combine, timestamp, json, colorize, printf } = format;
const promClient = require('prom-client');
const { createServer } = require('http');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// Create the registry for metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  // Buckets for response time from 1ms to 10s
  buckets: [1, 5, 15, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const apiErrorCounter = new promClient.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['route', 'error_type']
});

const authenticationAttempts = new promClient.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'user_type']
});

const databaseOperationDuration = new promClient.Histogram({
  name: 'database_operation_duration_ms',
  help: 'Duration of database operations in ms',
  labelNames: ['operation', 'collection'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

const mediaUploadSize = new promClient.Histogram({
  name: 'media_upload_size_bytes',
  help: 'Size of media uploads in bytes',
  labelNames: ['media_type', 'user_type'],
  buckets: [1024, 10240, 102400, 1048576, 5242880, 10485760, 26214400]
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(activeConnections);
register.registerMetric(apiErrorCounter);
register.registerMetric(authenticationAttempts);
register.registerMetric(databaseOperationDuration);
register.registerMetric(mediaUploadSize);

// Set up structured logging
const isDevelopment = process.env.NODE_ENV !== 'production';

// Custom log formats
const consoleFormat = combine(
  colorize(),
  timestamp(),
  printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

const productionFormat = combine(
  timestamp(),
  json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: isDevelopment ? consoleFormat : productionFormat,
  defaultMeta: { 
    service: 'influencerhub-api',
    environment: process.env.NODE_ENV || 'development',
    host: os.hostname()
  },
  transports: [
    // Console transport is always enabled
    new winston.transports.Console(),
    
    // File transport for errors only in production
    ...(isDevelopment ? [] : [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 10
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 10
      })
    ])
  ],
  // Don't exit on error
  exitOnError: false
});

// Create request tracking middleware
const requestTrackingMiddleware = (req, res, next) => {
  // Add request ID
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  
  // Track active connections
  activeConnections.inc();
  
  // Start timer to measure request duration
  const startTime = Date.now();
  
  // Capture original methods to intercept responses
  const originalEnd = res.end;
  const originalWrite = res.write;
  
  // Track request completion
  res.end = function(chunk, encoding) {
    // Calculate request duration
    const duration = Date.now() - startTime;
    
    // Get route (or path if route not available)
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    
    // Increment request counter
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
    
    // Record request duration
    httpRequestDurationMicroseconds.observe({
      method: req.method,
      route: route,
      status_code: res.statusCode
    }, duration);
    
    // Log request completion
    logger.info(`${req.method} ${req.originalUrl}`, {
      request_id: req.id,
      method: req.method,
      url: req.originalUrl,
      route: route,
      status_code: res.statusCode,
      duration_ms: duration,
      user_id: req.user ? req.user.id : 'anonymous',
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown'
    });
    
    // Decrement active connections
    activeConnections.dec();
    
    // Call original end method
    return originalEnd.apply(this, arguments);
  };
  
  res.write = function(chunk, encoding) {
    return originalWrite.apply(this, arguments);
  };
  
  // Log incoming request
  logger.debug(`Incoming request: ${req.method} ${req.originalUrl}`, {
    request_id: req.id,
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    params: req.params,
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    user_agent: req.headers['user-agent'] || 'unknown'
  });
  
  next();
};

// Error logging middleware
const errorLoggingMiddleware = (err, req, res, next) => {
  const route = req.route ? req.baseUrl + req.route.path : req.path;
  
  // Increment error counter
  apiErrorCounter.inc({
    route: route,
    error_type: err.name || 'UnknownError'
  });
  
  // Log error
  logger.error(`API Error: ${err.message}`, {
    request_id: req.id,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    },
    method: req.method,
    url: req.originalUrl,
    route: route,
    user_id: req.user ? req.user.id : 'anonymous',
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
  });
  
  next(err);
};

// Database monitoring
const databaseMonitoring = {
  startOperation(operation, collection) {
    const startTime = Date.now();
    return { startTime, operation, collection };
  },
  
  endOperation(opInfo) {
    const duration = Date.now() - opInfo.startTime;
    databaseOperationDuration.observe({
      operation: opInfo.operation,
      collection: opInfo.collection
    }, duration);
    
    if (duration > 1000) {
      logger.warn(`Slow database operation: ${opInfo.operation} on ${opInfo.collection}`, {
        operation: opInfo.operation,
        collection: opInfo.collection,
        duration_ms: duration
      });
    }
    
    return duration;
  },
  
  trackQuery(collection, operation, query, options = {}) {
    const opInfo = this.startOperation(operation, collection);
    
    return {
      end: () => this.endOperation(opInfo),
      log: (result) => {
        const duration = this.endOperation(opInfo);
        
        logger.debug(`Database operation completed: ${operation} on ${collection}`, {
          operation: operation,
          collection: collection,
          duration_ms: duration,
          query: isDevelopment ? query : undefined,
          options: isDevelopment ? options : undefined,
          result_count: Array.isArray(result) ? result.length : undefined
        });
        
        return result;
      }
    };
  }
};

// Authentication monitoring
const authMonitoring = {
  trackLogin(success, userType) {
    authenticationAttempts.inc({
      status: success ? 'success' : 'failure',
      user_type: userType || 'unknown'
    });
    
    logger[success ? 'info' : 'warn'](`User login ${success ? 'successful' : 'failed'}`, {
      user_type: userType,
      status: success ? 'success' : 'failure'
    });
  }
};

// Media upload monitoring
const mediaMonitoring = {
  trackUpload(size, mediaType, userType) {
    mediaUploadSize.observe({
      media_type: mediaType,
      user_type: userType
    }, size);
    
    logger.info(`Media upload completed`, {
      media_type: mediaType,
      user_type: userType,
      size_bytes: size
    });
  }
};

// Health check endpoints
const setupHealthCheckServer = (port) => {
  const server = createServer((req, res) => {
    // Basic health check
    if (req.url === '/health' || req.url === '/health/liveness') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }
    
    // Readiness check - can include db connection check, etc.
    if (req.url === '/health/readiness') {
      // Implement your readiness checks here
      // For now just return ok
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }));
      return;
    }
    
    // Warmup endpoint for serverless environments
    if (req.url === '/health/warmup') {
      res.statusCode = 200;
      res.end('ok');
      return;
    }
    
    // Metrics endpoint
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      register.metrics().then(
        metrics => {
          res.end(metrics);
        },
        err => {
          res.statusCode = 500;
          res.end(err.message);
        }
      );
      return;
    }
    
    // Not found for other endpoints
    res.statusCode = 404;
    res.end();
  });
  
  server.listen(port || 9090, () => {
    logger.info(`Health check and metrics server running on port ${port || 9090}`);
  });
  
  return server;
};

// Set global uncaught exception and promise rejection handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: { message: error.message, stack: error.stack } });
  // Perform any necessary cleanup
  // Don't exit in production to allow for graceful recovery
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
    promise
  });
});

// Export all monitoring components
module.exports = {
  logger,
  metrics: {
    httpRequestDurationMicroseconds,
    httpRequestCounter,
    activeConnections,
    apiErrorCounter,
    authenticationAttempts,
    databaseOperationDuration,
    mediaUploadSize,
    register
  },
  middleware: {
    requestTracking: requestTrackingMiddleware,
    errorLogging: errorLoggingMiddleware
  },
  monitoring: {
    database: databaseMonitoring,
    auth: authMonitoring,
    media: mediaMonitoring
  },
  setupHealthCheckServer
};
