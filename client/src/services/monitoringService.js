/**
 * Monitoring Service
 * 
 * This service provides error monitoring, application performance monitoring,
 * and user analytics. In production, this would be connected to services
 * like Sentry, LogRocket, New Relic, or Google Analytics.
 * 
 * This implementation provides stub functionality that can be replaced
 * with actual monitoring implementations in production.
 */

// Configuration object for monitoring settings
let config = {
  // Whether monitoring is enabled
  enabled: process.env.NODE_ENV === 'production',
  
  // Analytics settings
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    sampleRate: 1.0, // 1.0 = 100% of events are tracked
  },
  
  // Error monitoring settings
  errorMonitoring: {
    enabled: process.env.NODE_ENV === 'production',
    captureUnhandledRejections: true,
    includeContextLines: 5,
    ignoreErrors: ['Network request failed'], // Errors to ignore
  },
  
  // Performance monitoring settings
  performanceMonitoring: {
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.2, // 20% of transactions
    idleTimeout: 5000,
  },
  
  // User session recording settings (for production use only)
  sessionRecording: {
    enabled: false, // Disabled by default as this requires user consent
    maskAllInputs: true,
    maskAllText: false,
  }
};

/**
 * Configure the monitoring service
 * 
 * @param {Object} options - Configuration options
 */
export const configureMonitoring = (options = {}) => {
  // Deep merge the configs
  config = mergeConfigs(config, options);
  
  // Initialize monitoring services based on new config
  if (config.enabled) {
    initializeMonitoring();
  }
};

/**
 * Initialize the monitoring services
 * This would connect to actual services in a production environment
 */
const initializeMonitoring = () => {
  // This is a placeholder for actually initializing services like Sentry
  if (process.env.NODE_ENV === 'production') {
    console.log('Monitoring service initialized in production mode');
    
    // In production, this would connect to real services:
    // Example: Sentry.init({ dsn: process.env.SENTRY_DSN, ...config.errorMonitoring });
  } else {
    console.log('Monitoring service initialized in development mode (inactive)');
  }
};

/**
 * Deep merge two configuration objects
 * 
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged configuration
 */
const mergeConfigs = (target, source) => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      result[key] = mergeConfigs(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
};

/**
 * Capture an exception and send to monitoring service
 * 
 * @param {Error|Object} exception - Error object or formatted error
 * @param {Object} contextData - Additional context for the error
 * @returns {string} Error tracking ID
 */
export const captureException = (exception, contextData = {}) => {
  if (!config.enabled || !config.errorMonitoring.enabled) {
    // In development, just log to console
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[MonitoringService] Exception captured in dev mode:', exception);
    }
    return 'dev_error_id';
  }
  
  // In production, this would send to an actual service
  // Example: return Sentry.captureException(exception, { extra: contextData });
  
  // Generate a random ID to simulate a tracking ID
  const trackingId = `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
  
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[MonitoringService] Exception captured with ID ${trackingId}:`, exception);
  }
  
  return trackingId;
};

/**
 * Track an analytics event
 * 
 * @param {string} category - Event category
 * @param {string} action - Event action
 * @param {Object} properties - Event properties
 */
export const trackEvent = (category, action, properties = {}) => {
  if (!config.enabled || !config.analytics.enabled) {
    // In development, just log to console
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[MonitoringService] Event tracked in dev mode: ${category} - ${action}`, properties);
    }
    return;
  }
  
  // Apply sampling if configured
  if (Math.random() > config.analytics.sampleRate) {
    return;
  }
  
  // In production, this would send to an actual analytics service
  // Example: analytics.track(action, { category, ...properties });
  
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[MonitoringService] Event tracked: ${category} - ${action}`, properties);
  }
};

/**
 * Start tracking a performance transaction
 * 
 * @param {string} name - Transaction name
 * @param {string} category - Transaction category
 * @returns {Object|null} Transaction object for finishing later
 */
export const startTransaction = (name, category = 'app') => {
  if (!config.enabled || !config.performanceMonitoring.enabled) {
    // Return a no-op transaction in development
    return {
      setTag: () => {},
      setData: () => {},
      finish: () => {}
    };
  }
  
  // In production, this would start a real transaction
  // Example: const transaction = Sentry.startTransaction({ name, op: category });
  
  const startTime = performance.now();
  
  // Return a transaction-like object
  return {
    setTag: (key, value) => {
      // Would set a tag on the transaction
      // Example: transaction.setTag(key, value);
    },
    setData: (key, value) => {
      // Would set contextual data on the transaction
      // Example: transaction.setData(key, value);
    },
    finish: () => {
      // Would finish the transaction and record it
      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[MonitoringService] Transaction completed: ${category} - ${name} (${duration.toFixed(2)}ms)`);
      }
      // Example: transaction.finish();
    }
  };
};

/**
 * Set user information for monitoring
 * 
 * @param {Object} userInfo - User information to set
 * @param {string} userInfo.id - User ID
 * @param {string} userInfo.email - User email
 * @param {string} userInfo.username - Username
 */
export const setUser = (userInfo) => {
  if (!config.enabled) {
    return;
  }
  
  // In production, this would set user context for the monitoring service
  // Example: Sentry.setUser(userInfo);
  
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[MonitoringService] User context set:', userInfo);
  }
};

/**
 * Clear user information
 */
export const clearUser = () => {
  if (!config.enabled) {
    return;
  }
  
  // In production, this would clear user context
  // Example: Sentry.setUser(null);
  
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[MonitoringService] User context cleared');
  }
};

/**
 * Measure a specific metric and report it to the monitoring service
 * 
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {Object} tags - Additional tags to associate with the metric
 */
export const recordMetric = (name, value, tags = {}) => {
  if (!config.enabled || !config.performanceMonitoring.enabled) {
    return;
  }
  
  // In production, this would report to the actual monitoring service
  // Example: Sentry.metrics.timing(name, value, tags);
  
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[MonitoringService] Metric recorded: ${name} = ${value}`, tags);
  }
};

// Initialize the service when the module is imported
if (config.enabled) {
  initializeMonitoring();
}

export default {
  captureException,
  trackEvent,
  startTransaction,
  setUser,
  clearUser,
  recordMetric,
  configureMonitoring
};
