/**
 * Simplified Fallback Logging Configuration
 * 
 * This is a simplified version of the logger that doesn't require winston-daily-rotate-file.
 * It's used as a fallback if the main logger configuration fails to load.
 */

const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray'
};

// Apply custom colors
winston.addColors(logColors);

// Define custom format for console output
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
    
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

// Get log level from environment or default
const getLogLevel = () => {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return Object.prototype.hasOwnProperty.call(logLevels, envLevel) ? envLevel : 'info';
};

// Create simple logger instance with console transport only
const logger = createLogger({
  levels: logLevels,
  level: getLogLevel(),
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat()
  ),
  transports: [
    // Log everything to console
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: consoleFormat
    })
  ],
  exitOnError: false,
  // Silence logs during tests unless explicitly enabled
  silent: process.env.NODE_ENV === 'test' && !process.env.ENABLE_LOGS
});

// Add request metadata
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // When response finishes, log the request/response details
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const userAgent = req.headers['user-agent'] || '-';
    const referrer = req.headers['referer'] || '-';
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               '-';
    
    // Get the route (exclude query parameters)
    const route = req.originalUrl.split('?')[0];
    
    // Determine log level based on status code
    let level = 'http';
    if (res.statusCode >= 500) {
      level = 'error';
    } else if (res.statusCode >= 400) {
      level = 'warn';
    }
    
    logger.log(level, `${req.method} ${route} ${res.statusCode} ${responseTime}ms`, {
      method: req.method,
      url: route,
      statusCode: res.statusCode,
      responseTime,
      ip
    });
  });
  
  next();
};

// Simplified API for common log levels with context
const createContextualLogger = (context = {}) => {
  const contextLogger = {};
  
  Object.keys(logLevels).forEach(level => {
    contextLogger[level] = (message, meta = {}) => {
      logger[level](message, { ...context, ...meta });
    };
  });
  
  return contextLogger;
};

// Add helper to create contextual loggers
logger.createContextLogger = createContextualLogger;

// Log startup message
logger.info('Fallback logger initialized - winston-daily-rotate-file not available');

module.exports = logger;
