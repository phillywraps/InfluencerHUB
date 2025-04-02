/**
 * Shared validation utilities for both web and mobile platforms
 * 
 * This module provides common validation functions that ensure consistent data
 * validation behavior across web and mobile platforms.
 */

/**
 * Email validation
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  // RFC 5322 compliant email regex
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email.trim());
};

/**
 * Password strength validation
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation results with details
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    maxLength = 128
  } = options;
  
  const result = {
    isValid: true,
    strength: 0, // 0-100
    errors: []
  };
  
  // Check length
  if (!password || password.length < minLength) {
    result.isValid = false;
    result.errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (password && password.length > maxLength) {
    result.isValid = false;
    result.errors.push(`Password cannot exceed ${maxLength} characters`);
  }
  
  // Check for required character types
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }
  
  if (requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one special character');
  }
  
  // Calculate password strength
  if (password) {
    let strength = 0;
    
    // Base points for length (up to 40 points)
    const lengthPoints = Math.min(40, (password.length / maxLength) * 40);
    strength += lengthPoints;
    
    // Points for character variety (up to 60 points)
    if (/[A-Z]/.test(password)) strength += 10;
    if (/[a-z]/.test(password)) strength += 10;
    if (/\d/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;
    
    // Uniqueness points (higher ratio of unique chars = higher score)
    const uniqueChars = new Set(password.split('')).size;
    const uniquenessPoints = Math.min(15, (uniqueChars / password.length) * 15);
    strength += uniquenessPoints;
    
    result.strength = Math.round(strength);
  }
  
  return result;
};

/**
 * Username validation
 * @param {string} username - Username to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation results
 */
export const validateUsername = (username, options = {}) => {
  const {
    minLength = 3,
    maxLength = 30,
    allowSpecialChars = false
  } = options;
  
  const result = {
    isValid: true,
    errors: []
  };
  
  if (!username) {
    result.isValid = false;
    result.errors.push('Username is required');
    return result;
  }
  
  // Check length
  if (username.length < minLength) {
    result.isValid = false;
    result.errors.push(`Username must be at least ${minLength} characters long`);
  }
  
  if (username.length > maxLength) {
    result.isValid = false;
    result.errors.push(`Username cannot exceed ${maxLength} characters`);
  }
  
  // Check for invalid characters
  const validRegex = allowSpecialChars 
    ? /^[a-zA-Z0-9_.-]+$/
    : /^[a-zA-Z0-9_]+$/;
    
  if (!validRegex.test(username)) {
    result.isValid = false;
    result.errors.push(allowSpecialChars 
      ? 'Username can only contain letters, numbers, underscores, periods, and hyphens'
      : 'Username can only contain letters, numbers and underscores');
  }
  
  return result;
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @param {boolean} requireProtocol - Whether the protocol (http/https) is required
 * @returns {boolean} Whether the URL is valid
 */
export const isValidUrl = (url, requireProtocol = true) => {
  if (!url) return false;
  
  try {
    // If protocol is required, check that it exists
    if (requireProtocol && !/^https?:\/\//i.test(url)) {
      return false;
    }
    
    // Add protocol if missing and not required
    const parsedUrl = requireProtocol ? new URL(url) : new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    
    // Valid URL should have hostname with at least one dot
    return parsedUrl.hostname.includes('.');
  } catch (error) {
    return false;
  }
};

/**
 * Phone number validation
 * @param {string} phone - Phone number to validate
 * @param {string} countryCode - ISO country code for region-specific validation
 * @returns {boolean} Whether the phone number is valid
 */
export const isValidPhone = (phone, countryCode = 'US') => {
  if (!phone) return false;
  
  // Strip non-numeric characters for basic validation
  const digits = phone.replace(/\D/g, '');
  
  // Basic validation based on country
  switch (countryCode.toUpperCase()) {
    case 'US':
    case 'CA':
      // North American numbers should be 10 digits or 11 with leading 1
      return (digits.length === 10) || (digits.length === 11 && digits.charAt(0) === '1');
    case 'UK':
    case 'GB':
      // UK numbers vary, but generally 10-11 digits
      return digits.length >= 10 && digits.length <= 11;
    default:
      // Generic validation - require at least 8 digits
      return digits.length >= 8 && digits.length <= 15;
  }
};

/**
 * Date validation
 * @param {string|Date} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {boolean} Whether the date is valid
 */
export const isValidDate = (date, options = {}) => {
  const {
    minDate = null,
    maxDate = null,
    format = null // Not used for Date objects
  } = options;
  
  let dateObj;
  
  // Convert string to Date if needed
  if (typeof date === 'string') {
    if (format === 'YYYY-MM-DD') {
      // Parse ISO format
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      // Default parsing
      dateObj = new Date(date);
    }
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return false;
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  // Check min/max constraints
  if (minDate && dateObj < new Date(minDate)) {
    return false;
  }
  
  if (maxDate && dateObj > new Date(maxDate)) {
    return false;
  }
  
  return true;
};

/**
 * Credit card validation
 * @param {string} cardNumber - Credit card number to validate
 * @returns {Object} Validation results including card type
 */
export const validateCreditCard = (cardNumber) => {
  if (!cardNumber) {
    return { isValid: false, cardType: null };
  }
  
  // Remove spaces and hyphens
  const digits = cardNumber.replace(/[\s-]/g, '');
  
  // Determine card type based on pattern
  let cardType = null;
  if (/^4\d{12}(\d{3})?$/.test(digits)) {
    cardType = 'visa';
  } else if (/^5[1-5]\d{14}$/.test(digits)) {
    cardType = 'mastercard';
  } else if (/^3[47]\d{13}$/.test(digits)) {
    cardType = 'amex';
  } else if (/^6(?:011|5\d{2})\d{12}$/.test(digits)) {
    cardType = 'discover';
  }
  
  // Luhn algorithm validation
  let sum = 0;
  let shouldDouble = false;
  
  // Loop from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  const isValid = (sum % 10 === 0) && digits.length >= 13 && digits.length <= 19;
  
  return { isValid, cardType };
};

/**
 * Social media handle validation
 * @param {string} handle - Social media handle to validate
 * @param {string} platform - Social media platform (instagram, twitter, etc.)
 * @returns {boolean} Whether the handle is valid for the platform
 */
export const isValidSocialHandle = (handle, platform) => {
  if (!handle || !platform) return false;
  
  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
  
  // Empty handles are invalid
  if (!cleanHandle.length) return false;
  
  // Platform-specific validation
  switch (platform.toLowerCase()) {
    case 'instagram':
      // Instagram: 1-30 characters, letters, numbers, periods, underscores
      return /^[a-zA-Z0-9_.]{1,30}$/.test(cleanHandle);
    case 'twitter':
    case 'x':
      // Twitter: 1-15 characters, letters, numbers, underscores
      return /^[a-zA-Z0-9_]{1,15}$/.test(cleanHandle);
    case 'facebook':
      // Facebook: 5-50 characters
      return cleanHandle.length >= 5 && cleanHandle.length <= 50;
    case 'tiktok':
      // TikTok: 1-24 characters
      return /^[a-zA-Z0-9_.]{1,24}$/.test(cleanHandle);
    case 'youtube':
      // YouTube: Custom URLs have specific requirements
      return cleanHandle.length >= 3 && cleanHandle.length <= 30;
    default:
      // Generic validation: at least 1 character, max 50
      return cleanHandle.length >= 1 && cleanHandle.length <= 50;
  }
};

/**
 * File validation
 * @param {File|Object} file - File object to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation results
 */
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes = [],
    maxSizeKB = 5120, // 5MB default
    minSizeKB = 0
  } = options;
  
  const result = {
    isValid: true,
    errors: []
  };
  
  if (!file) {
    result.isValid = false;
    result.errors.push('No file provided');
    return result;
  }
  
  // Check file type if specified
  if (allowedTypes.length > 0) {
    const fileType = file.type || '';
    const fileExtension = file.name ? file.name.split('.').pop().toLowerCase() : '';
    
    const isTypeValid = allowedTypes.some(type => {
      // Check MIME type
      if (fileType === type) return true;
      
      // Check by extension
      if (type.startsWith('.') && fileExtension === type.substring(1)) return true;
      
      // Check by category
      if (type === 'image/*' && fileType.startsWith('image/')) return true;
      if (type === 'video/*' && fileType.startsWith('video/')) return true;
      if (type === 'audio/*' && fileType.startsWith('audio/')) return true;
      
      return false;
    });
    
    if (!isTypeValid) {
      result.isValid = false;
      result.errors.push(`File type not allowed. Accepted types: ${allowedTypes.join(', ')}`);
    }
  }
  
  // Check file size
  const sizeKB = file.size / 1024;
  
  if (sizeKB < minSizeKB) {
    result.isValid = false;
    result.errors.push(`File size too small. Minimum size: ${minSizeKB} KB`);
  }
  
  if (sizeKB > maxSizeKB) {
    result.isValid = false;
    result.errors.push(`File size too large. Maximum size: ${maxSizeKB} KB`);
  }
  
  return result;
};
