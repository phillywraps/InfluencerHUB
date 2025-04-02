/**
 * API utilities shared between web and mobile platforms
 * 
 * This module provides common utilities for API interactions, ensuring
 * consistent behavior across web and mobile platforms.
 */

/**
 * Generates a cryptographically secure random API key
 * @param {number} length - Length of the API key
 * @param {boolean} includeSpecialChars - Whether to include special characters
 * @returns {string} A random API key
 */
export const generateSecureApiKey = (length = 32, includeSpecialChars = true) => {
  // Characters to use in the API key
  const alphaNumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  
  // Choose character set based on includeSpecialChars
  const chars = includeSpecialChars ? alphaNumeric + specialChars : alphaNumeric;
  
  // Create array of random bytes
  const randomValues = new Uint8Array(length);
  
  // Fill with cryptographically secure random values
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    const crypto = require('crypto');
    randomValues.forEach((_, i) => {
      randomValues[i] = crypto.randomBytes(1)[0];
    });
  } else {
    // Fallback (less secure)
    randomValues.forEach((_, i) => {
      randomValues[i] = Math.floor(Math.random() * 256);
    });
  }
  
  // Convert random bytes to characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  
  return result;
};

/**
 * Formats an API key for display (masking most characters)
 * @param {string} apiKey - The API key to format
 * @returns {string} Formatted API key for display
 */
export const formatApiKeyForDisplay = (apiKey) => {
  if (!apiKey) return '';
  
  const firstChars = apiKey.substring(0, 4);
  const lastChars = apiKey.substring(apiKey.length - 4);
  
  return `${firstChars}...${lastChars}`;
};

/**
 * Validates an API key format
 * @param {string} apiKey - The API key to validate
 * @param {object} options - Validation options
 * @returns {boolean} Whether the API key is valid
 */
export const validateApiKey = (apiKey, options = {}) => {
  const { 
    minLength = 16, 
    requireSpecialChars = false,
    requireNumbers = true,
    requireUppercase = true,
    requireLowercase = true
  } = options;
  
  if (!apiKey || typeof apiKey !== 'string') return false;
  if (apiKey.length < minLength) return false;
  
  // Check for required character types
  if (requireNumbers && !/\d/.test(apiKey)) return false;
  if (requireUppercase && !/[A-Z]/.test(apiKey)) return false;
  if (requireLowercase && !/[a-z]/.test(apiKey)) return false;
  if (requireSpecialChars && !/[^A-Za-z0-9]/.test(apiKey)) return false;
  
  return true;
};

/**
 * Calculate API key expiration date based on rotation settings
 * @param {Date} lastRotated - Last rotation date
 * @param {number} frequency - Rotation frequency in days
 * @returns {Date} Expiration date
 */
export const calculateApiKeyExpiration = (lastRotated, frequency = 30) => {
  if (!lastRotated) return null;
  
  const expirationDate = new Date(lastRotated);
  expirationDate.setDate(expirationDate.getDate() + frequency);
  
  return expirationDate;
};

/**
 * Calculate API key strength score (0-100)
 * @param {string} apiKey - The API key to evaluate
 * @returns {number} Strength score from 0-100
 */
export const calculateApiKeyStrength = (apiKey) => {
  if (!apiKey) return 0;
  
  let score = 0;
  
  // Basic length score (up to 40 points)
  score += Math.min(40, apiKey.length * 1.25);
  
  // Character variety (up to 60 points)
  if (/[a-z]/.test(apiKey)) score += 10;
  if (/[A-Z]/.test(apiKey)) score += 10;
  if (/[0-9]/.test(apiKey)) score += 10;
  if (/[^A-Za-z0-9]/.test(apiKey)) score += 15;
  
  // Character distribution
  const uniqueChars = new Set(apiKey.split('')).size;
  score += Math.min(15, uniqueChars / apiKey.length * 15);
  
  return Math.min(100, Math.round(score));
};

/**
 * Checks if an API key needs rotation based on settings
 * @param {object} settings - API key rotation settings
 * @param {Date} lastRotated - Last rotation date
 * @returns {boolean} Whether the API key needs rotation
 */
export const needsRotation = (settings, lastRotated) => {
  if (!settings?.enabled || !lastRotated) return false;
  
  const now = new Date();
  const rotationDate = new Date(lastRotated);
  rotationDate.setDate(rotationDate.getDate() + settings.frequency);
  
  return now >= rotationDate;
};

/**
 * Sanitizes API key input to prevent security issues
 * @param {string} input - Raw input
 * @returns {string} Sanitized input
 */
export const sanitizeApiKeyInput = (input) => {
  if (!input) return '';
  
  // Remove whitespace
  let sanitized = input.trim();
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>&"']/g, '');
  
  return sanitized;
};
