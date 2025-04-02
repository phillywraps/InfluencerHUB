/**
 * Advanced Logging Configuration
 * 
 * This module sets up Winston logger with multiple transports and levels,
 * supporting structured logging, rotation, and different outputs for
 * development and production environments.
 */

const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');

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

// Define format for file output (JSON for better parsing)
const fileFormat = format.combine(
  format.timestamp(),
  format.json()
);

// Define format for error stacktraces
const errorFormat = format(info => {
  if (info.error instanceof Error) {
    info.stack = info.error.stack;
    info.errorMessage = info.error.message;
    delete info.error; // Remove circular structure for JSON serialization
  }
  return info;
});

// Get log level from environment or default
const getLogLevel = () => {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return Object.prototype.hasOwnProperty.call(logLevels, envLevel) ? envLevel : 'info';
};

// Create transports based on environment
const getTransports = () => {
  const logLevel = getLogLevel();
  
  // Common transports for all environments
  const commonTransports = [
    // Log everything to console
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: consoleFormat
    })
  ];
  
  // Production specific transports
  if (process.env.NODE_ENV === 'production') {
    return [
      ...commonTransports,
      
      // Daily rotating general log file
      new DailyRotateFile({
        level: logLevel,
        dirname: path.join(logDir, 'general'),
        filename: 'general-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat
      }),
      
      // Store errors in a separate file
      new DailyRotateFile({
        level: 'error',
        dirname: path.join(logDir, 'error'),
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: format.combine(
          errorFormat(),
          fileFormat
        )
      }),
      
      // Store HTTP requests in a separate file
      new DailyRotateFile({
        level: 'http',
        dirname: path.join(logDir, 'http'),
        filename: 'http-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: fileFormat
      })
    ];
  }
  
  // Development specific transports
  return commonTransports;
};

// Create the logger instance
const logger = createLogger({
  levels: logLevels,
  level: getLogLevel(),
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    errorFormat()
  ),
  transports: getTransports(),
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
      request: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        body: level === 'error' ? req.body : undefined, // Only log body on errors
        headers: {
          userAgent,
          referrer,
          contentType: req.headers['content-type']
        },
        ip
      },
      response: {
        statusCode: res.statusCode,
        responseTime,
        contentLength: res.get('content-length') || '-'
      },
      user: req.user ? req.user.id : 'anonymous',
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

module.exports = logger;
