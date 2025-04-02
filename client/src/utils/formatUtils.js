/**
 * Utility functions for formatting values in the application
 */

/**
 * Format currency amount with appropriate currency symbol and decimal places
 * 
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (e.g., 'USD', 'EUR', 'GBP')
 * @param {string} locale - The locale to use for formatting (defaults to browser locale or 'en-US')
 * @returns {string} Formatted currency amount
 */
export const formatCurrency = (amount, currencyCode = 'USD', locale = undefined) => {
  if (amount === undefined || amount === null) {
    return '';
  }
  
  const actualLocale = locale || navigator.language || 'en-US';
  
  try {
    return new Intl.NumberFormat(actualLocale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback in case of an invalid currency code
    console.warn(`Error formatting currency: ${error.message}`);
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
};

/**
 * Format cryptocurrency amount with appropriate precision
 * 
 * @param {number|string} amount - The crypto amount to format
 * @param {string} cryptoCurrency - Cryptocurrency code (e.g., 'BTC', 'ETH')
 * @returns {string} Formatted crypto amount
 */
export const formatCryptoAmount = (amount, cryptoCurrency = 'BTC') => {
  if (amount === undefined || amount === null) {
    return '';
  }
  
  // Parse amount if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Different cryptocurrencies have different common decimal precisions
  const precisionMap = {
    'BTC': 8, // Bitcoin shows 8 decimal places (satoshis)
    'ETH': 6, // Ethereum typically shows 6
    'USDC': 2, // Stablecoins often show 2
    'DAI': 2,
    'LTC': 5, // Litecoin
    'BCH': 5, // Bitcoin Cash
    'XRP': 4, // Ripple
    'default': 6 // Default for other currencies
  };
  
  const precision = precisionMap[cryptoCurrency] || precisionMap.default;
  
  // Format the amount with the appropriate precision
  return `${numericAmount.toFixed(precision)} ${cryptoCurrency}`;
};

/**
 * Format a number with thousands separators and specified decimal places
 * 
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @param {string} locale - The locale to use for formatting (defaults to browser locale or 'en-US')
 * @returns {string} Formatted number
 */
export const formatNumber = (number, decimals = 0, locale = undefined) => {
  if (number === undefined || number === null) {
    return '';
  }
  
  const actualLocale = locale || navigator.language || 'en-US';
  
  return new Intl.NumberFormat(actualLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Format a percentage value
 * 
 * @param {number} value - The percentage value (e.g., 0.15 for 15%)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {boolean} includeSymbol - Whether to include the % symbol (default: true)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2, includeSymbol = true) => {
  if (value === undefined || value === null) {
    return '';
  }
  
  // Convert to percentage format (multiply by 100) if the value is between 0 and 1
  const displayValue = (value > -1 && value < 1) ? value * 100 : value;
  
  // Format with specified decimal places
  const formatted = displayValue.toFixed(decimals);
  
  // Add % symbol if required
  return includeSymbol ? `${formatted}%` : formatted;
};

/**
 * Format a file size in bytes to a human-readable format
 * 
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Format a phone number to a standardized format
 * 
 * @param {string} phoneNumber - The raw phone number input
 * @param {string} format - Format type (default: 'national')
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber, format = 'national') => {
  if (!phoneNumber) return '';
  
  // Strip all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Apply formatting based on specified format and number length
  if (format === 'national' && cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (format === 'international' && cleaned.length === 10) {
    return `+1 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  } else if (format === 'international' && cleaned.length > 10) {
    // Assume first 1-3 digits are country code
    const countryCodeLength = cleaned.length > 12 ? 3 : (cleaned.length > 11 ? 2 : 1);
    const countryCode = cleaned.slice(0, countryCodeLength);
    const rest = cleaned.slice(countryCodeLength);
    
    // Format rest as blocks of 3 or 4 digits
    const formatted = rest.match(/.{1,3}/g).join(' ');
    
    return `+${countryCode} ${formatted}`;
  }
  
  // Return original cleaned number if no formatting applied
  return cleaned;
};

/**
 * Truncate text to a specified length and add ellipsis if needed
 * 
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @param {string} suffix - Suffix to add when truncated (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}${suffix}`;
};

/**
 * Truncate cryptocurrency address for display purposes
 * 
 * @param {string} address - The full cryptocurrency address
 * @param {number} startChars - Number of characters to keep at the start (default: 6)
 * @param {number} endChars - Number of characters to keep at the end (default: 4)
 * @returns {string} Truncated address (e.g., "0x1234...abcd")
 */
export const truncateAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
