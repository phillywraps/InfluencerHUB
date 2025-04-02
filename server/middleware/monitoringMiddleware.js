/**
 * Monitoring Middleware
 * 
 * This middleware provides real-time monitoring of system and application metrics.
 * It exposes a /metrics endpoint for Prometheus scraping and integrates with
 * various monitoring systems.
 */

const promClient = require('prom-client');
const os = require('os');
const logger = require('../config/logger');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Initialize Prometheus Registry
const register = new promClient.Registry();

// Enable default metrics collection (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics for application performance and business KPIs
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [1, 5, 15, 50, 100, 200, 500, 1000, 2000, 5000]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const failedApiCalls = new promClient.Counter({
  name: 'failed_api_calls_total',
  help: 'Total number of failed API calls',
  labelNames: ['service', 'endpoint', 'status_code']
});

const activeSessions = new promClient.Gauge({
  name: 'active_sessions',
  help: 'Number of active user sessions'
});

const databaseOperationDuration = new promClient.Histogram({
  name: 'database_operation_duration_ms',
  help: 'Duration of database operations in ms',
  labelNames: ['operation', 'collection'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500]
});

// Register metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(failedApiCalls);
register.registerMetric(activeSessions);
register.registerMetric(databaseOperationDuration);

// Track last metrics collection time
let lastMetricsUpdate = Date.now();

// Initialize error tracking with Sentry
const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express(),
        // Enable profiling (performance monitoring)
        new ProfilingIntegration(),
      ],
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
      // In production, you'll want to adjust this to a lower value
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Profiling sample rate adjusts how many profiles are captured
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Enable environment-specific contexts
      environment: process.env.NODE_ENV || 'development',
      // Add release information (useful for release tracking)
      release: process.env.APP_VERSION || '1.0.0',
      // Set server name for better organization
      serverName: process.env.HOSTNAME || os.hostname(),
      // Add contextual features
      beforeSend: (event, hint) => {
        // Don't send PII or sensitive info
        if (event.request && event.request.data) {
          // Sanitize request data
          event.request.data = sanitizeSensitiveData(event.request.data);
        }
        return event;
      }
    });
    logger.info('Sentry error tracking initialized');
  } else {
    logger.warn('Sentry DSN not provided, error tracking disabled');
  }
};

// Sanitize sensitive data from error reports
const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credentials', 'credit_card'];
function sanitizeSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (sensitiveKeys.some(pattern => key.toLowerCase().includes(pattern))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  }
  return sanitized;
}

// Prometheus metrics middleware
const metricsMiddleware = async (req, res, next) => {
  // Skip metrics endpoint itself to avoid recursion
  if (req.path === '/metrics') {
    return next();
  }
  
  // Start timer for request duration
  const end = httpRequestDurationMicroseconds.startTimer();
  const startTime = Date.now();
  
  // Continue with the request
  res.on('finish', () => {
    // Record request completion
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    // Record metrics
    end({ method, route, status_code: statusCode });
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    
    // Record failures separately (4xx, 5xx)
    if (statusCode >= 400) {
      failedApiCalls.inc({ 
        service: 'api',
        endpoint: route,
        status_code: statusCode
      });
    }
    
    // Log long-running requests
    const requestDuration = Date.now() - startTime;
    if (requestDuration > 1000) {
      logger.warn(`Slow request: ${method} ${route} took ${requestDuration}ms`);
    }
  });
  
  next();
};

// Expose metrics endpoint
const metricsEndpoint = async (req, res) => {
  try {
    // Update system metrics if needed (every 10 seconds)
    const now = Date.now();
    if (now - lastMetricsUpdate > 10000) {
      updateSystemMetrics();
      lastMetricsUpdate = now;
    }
    
    // Return metrics in Prometheus format
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error('Error collecting metrics', { error: err });
    res.status(500).send('Error collecting metrics');
  }
};

// Update system-level metrics
function updateSystemMetrics() {
  // CPU usage
  const cpus = os.cpus();
  const cpuUsage = process.cpuUsage();
  
  // Memory usage
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  // Process memory
  const processMemory = process.memoryUsage();
  
  // Load average
  const loadAvg = os.loadavg();
  
  logger.debug('System metrics updated', {
    cpu: {
      usage: cpuUsage,
      cores: cpus.length
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usagePercent: memoryUsagePercent.toFixed(2)
    },
    process: {
      memory: processMemory,
      uptime: process.uptime()
    },
    system: {
      uptime: os.uptime(),
      loadAvg
    }
  });
}

// Track MongoDB operations (can be attached to Mongoose middleware)
const trackDbOperation = (operation, collection) => {
  const end = databaseOperationDuration.startTimer();
  
  return () => {
    end({ operation, collection });
  };
};

// Middleware for Sentry request tracking
const sentryRequestMiddleware = (app) => {
  if (process.env.SENTRY_DSN) {
    // The request handler must be the first middleware on the app
    app.use(Sentry.Handlers.requestHandler({
      // Ensures all transactions have user context if available
      user: ['id', 'username', 'email'],
      // Add more contexts as needed
      ip: true,
      request: ['headers', 'method', 'url', 'query_string'],
    }));
    
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }
};

// Middleware for Sentry error tracking (to be added after routes)
const sentryErrorMiddleware = (app) => {
  if (process.env.SENTRY_DSN) {
    // The error handler must be added before any other error middleware
    app.use(Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Send all 500-level errors to Sentry
        return error.status >= 500;
      }
    }));
  }
};

// Record a session start
const recordSessionStart = () => {
  activeSessions.inc();
};

// Record a session end
const recordSessionEnd = () => {
  activeSessions.dec();
};

// Record a failed external API call
const recordFailedApiCall = (service, endpoint, statusCode) => {
  failedApiCalls.inc({ service, endpoint, status_code: statusCode });
};

module.exports = {
  initSentry,
  metricsMiddleware,
  metricsEndpoint,
  sentryRequestMiddleware,
  sentryErrorMiddleware,
  trackDbOperation,
  recordSessionStart,
  recordSessionEnd,
  recordFailedApiCall,
  // Export metrics objects for use in other modules
  metrics: {
    httpRequestDurationMicroseconds,
    httpRequestsTotal,
    failedApiCalls,
    activeSessions,
    databaseOperationDuration
  }
};
