/**
 * Utility Logger Module
 * 
 * This module serves as a bridge to import the main logger from config.
 * It allows utils modules to depend on a local logger file within the utils directory,
 * making the code more modular and easier to test.
 */

// Try to import the main logger from config, fall back to simple console if it fails
let logger;

try {
  // First try to import the main logger
  logger = require('../config/logger');
} catch (error) {
  try {
    // If main logger fails, try the fallback logger
    logger = require('../config/logger.fallback');
    console.warn('Using fallback logger in utils/logger.js');
  } catch (fallbackError) {
    // If all else fails, create a basic console logger
    console.warn('All logger imports failed, using basic console logger');
    logger = {
      error: (msg) => console.error('[ERROR]', msg),
      warn: (msg) => console.warn('[WARN]', msg),
      info: (msg) => console.info('[INFO]', msg),
      debug: (msg) => console.debug('[DEBUG]', msg),
      verbose: (msg) => console.log('[VERBOSE]', msg)
    };
  }
}

// Export the logger
module.exports = logger;
