/**
 * Accessibility Metadata Utilities
 * 
 * This module provides utilities for enhancing API responses with accessibility 
 * metadata to improve screen reader experiences and help client applications 
 * present data in more accessible ways.
 */

/**
 * Adds accessibility metadata to API responses
 * 
 * @param {Object} data - The original API response data
 * @param {Object} options - Configuration options for the metadata
 * @param {boolean} options.includeDescriptions - Whether to include descriptive text for screen readers
 * @param {boolean} options.includeAltTexts - Whether to include alternative text for visual elements
 * @param {boolean} options.includeAriaLabels - Whether to include recommended ARIA labels
 * @param {Object} options.additionalMetadata - Additional custom metadata to include
 * @returns {Object} Enhanced data with accessibility metadata
 */
const addAccessibilityMetadata = (data, options = {}) => {
  const {
    includeDescriptions = true,
    includeAltTexts = true,
    includeAriaLabels = true,
    additionalMetadata = {}
  } = options;

  if (!data) return data;

  // Create a deep copy of the data to avoid modifying the original
  const enhancedData = JSON.parse(JSON.stringify(data));

  // Add a metadata field to the response
  if (!enhancedData._metadata) {
    enhancedData._metadata = {};
  }

  // Add accessibility metadata namespace
  enhancedData._metadata.accessibility = {
    version: '1.0',
    generated: new Date().toISOString(),
    ...additionalMetadata
  };

  // Process arrays of items (common pattern in REST APIs)
  if (Array.isArray(enhancedData.items || enhancedData.data || enhancedData)) {
    const items = enhancedData.items || enhancedData.data || enhancedData;
    const itemsArray = Array.isArray(items) ? items : [items];
    
    // Enhance each item with accessibility metadata
    itemsArray.forEach(item => {
      enhanceItemWithAccessibility(item, { 
        includeDescriptions, 
        includeAltTexts, 
        includeAriaLabels 
      });
    });
  } else if (typeof enhancedData === 'object') {
    // Process single object
    enhanceItemWithAccessibility(enhancedData, { 
      includeDescriptions, 
      includeAltTexts, 
      includeAriaLabels 
    });
  }

  return enhancedData;
};

/**
 * Enhances a single data item with accessibility metadata
 * 
 * @param {Object} item - The item to enhance
 * @param {Object} options - Configuration options
 * @private
 */
const enhanceItemWithAccessibility = (item, options) => {
  if (!item || typeof item !== 'object') return;
  
  // Create accessibility namespace if it doesn't exist
  if (!item._accessibility) {
    item._accessibility = {};
  }

  // Add descriptions for screen readers
  if (options.includeDescriptions) {
    item._accessibility.descriptions = generateDescriptions(item);
  }

  // Add alt texts for images
  if (options.includeAltTexts) {
    item._accessibility.altTexts = generateAltTexts(item);
  }

  // Add ARIA label recommendations
  if (options.includeAriaLabels) {
    item._accessibility.ariaLabels = generateAriaLabels(item);
  }
};

/**
 * Generates descriptive text for each important field in an item
 * 
 * @param {Object} item - The data item
 * @returns {Object} Field-specific descriptions
 * @private
 */
const generateDescriptions = (item) => {
  const descriptions = {};
  
  // Process common fields that benefit from enhanced descriptions
  if (item.status) {
    descriptions.status = getStatusDescription(item.status, item);
  }
  
  if (item.created || item.createdAt || item.dateCreated) {
    const date = item.created || item.createdAt || item.dateCreated;
    descriptions.created = getDateDescription(date);
  }
  
  if (item.updated || item.updatedAt || item.dateUpdated) {
    const date = item.updated || item.updatedAt || item.dateUpdated;
    descriptions.updated = getDateDescription(date);
  }
  
  if (item.amount || item.price || item.cost) {
    const value = item.amount || item.price || item.cost;
    const currency = item.currency || 'USD';
    descriptions.monetary = getMonetaryDescription(value, currency);
  }
  
  if (item.progress || item.completion) {
    const progress = item.progress || item.completion;
    descriptions.progress = getProgressDescription(progress);
  }
  
  return descriptions;
};

/**
 * Generates alt text recommendations for image fields
 * 
 * @param {Object} item - The data item
 * @returns {Object} Field-specific alt texts
 * @private
 */
const generateAltTexts = (item) => {
  const altTexts = {};
  
  // Process common image fields
  if (item.image || item.imageUrl || item.avatar || item.thumbnail) {
    const imageField = item.image || item.imageUrl || item.avatar || item.thumbnail;
    
    if (item.type === 'user' || item.type === 'profile') {
      altTexts.profile = `Profile picture of ${item.name || item.username || 'user'}`;
    } else if (item.type === 'product') {
      altTexts.product = `Image of ${item.name || item.title || 'product'}`;
    } else if (item.type === 'content') {
      altTexts.content = `Content thumbnail for ${item.title || 'media item'}`;
    } else {
      // Generic alt text
      altTexts.image = `Image${item.title ? ` related to ${item.title}` : ''}`;
    }
  }
  
  // Handle charts and data visualizations
  if (item.chart || item.visualization) {
    altTexts.dataViz = `Chart showing ${item.title || 'data'} - ${item.description || 'data visualization'}`;
  }
  
  return altTexts;
};

/**
 * Generates ARIA label recommendations for interactive elements
 * 
 * @param {Object} item - The data item
 * @returns {Object} Field-specific ARIA labels
 * @private
 */
const generateAriaLabels = (item) => {
  const ariaLabels = {};
  
  // Generate ARIA labels for common actions
  if (item.id) {
    if (item.type === 'user' || item.type === 'profile') {
      ariaLabels.view = `View profile for ${item.name || item.username || 'user'}`;
      ariaLabels.edit = `Edit profile for ${item.name || item.username || 'user'}`;
      ariaLabels.delete = `Delete profile for ${item.name || item.username || 'user'}`;
    } else if (item.type === 'content') {
      ariaLabels.view = `View ${item.title || 'content'}`;
      ariaLabels.edit = `Edit ${item.title || 'content'}`;
      ariaLabels.delete = `Delete ${item.title || 'content'}`;
    } else if (item.title || item.name) {
      const itemName = item.title || item.name;
      ariaLabels.view = `View ${itemName}`;
      ariaLabels.edit = `Edit ${itemName}`;
      ariaLabels.delete = `Delete ${itemName}`;
    }
  }
  
  // Status-related actions
  if (item.status) {
    if (item.status === 'pending' || item.status === 'draft') {
      ariaLabels.publish = `Publish ${item.title || item.name || 'item'}`;
    } else if (item.status === 'published' || item.status === 'active') {
      ariaLabels.unpublish = `Unpublish ${item.title || item.name || 'item'}`;
    }
  }
  
  return ariaLabels;
};

/**
 * Generates a descriptive text for a status field
 * 
 * @param {string} status - The status value
 * @param {Object} item - The full item for context
 * @returns {string} Descriptive text
 * @private
 */
const getStatusDescription = (status, item) => {
  const itemType = item.type || 'item';
  const itemName = item.title || item.name || itemType;
  
  switch (status.toLowerCase()) {
    case 'active':
      return `${itemName} is currently active and visible to users.`;
    case 'inactive':
      return `${itemName} is currently inactive and not visible to users.`;
    case 'pending':
      return `${itemName} is pending approval before it becomes visible.`;
    case 'published':
      return `${itemName} is published and visible to the intended audience.`;
    case 'draft':
      return `${itemName} is saved as a draft and not yet published.`;
    case 'scheduled':
      const scheduleDate = item.scheduledDate || item.publishDate;
      const dateStr = scheduleDate ? getDateDescription(scheduleDate) : 'a future date';
      return `${itemName} is scheduled for publication on ${dateStr}.`;
    case 'archived':
      return `${itemName} is archived and no longer actively displayed.`;
    case 'deleted':
      return `${itemName} has been deleted.`;
    default:
      return `${itemName} has status: ${status}.`;
  }
};

/**
 * Generates a descriptive text for a date field
 * 
 * @param {string|Date} date - The date value
 * @returns {string} Descriptive text
 * @private
 */
const getDateDescription = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Format the date in a screen reader friendly way
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Format the date according to locale
  const dateFormat = new Intl.DateTimeFormat('en-US', { 
    dateStyle: 'long',
    timeStyle: 'short'
  });
  
  const formattedDate = dateFormat.format(dateObj);
  
  // Add relative time for better context
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 5) {
        return `Just now (${formattedDate})`;
      }
      return `${diffMinutes} minutes ago (${formattedDate})`;
    }
    return `${diffHours} hours ago (${formattedDate})`;
  } else if (diffDays === 1) {
    return `Yesterday at ${dateObj.toLocaleTimeString()} (${formattedDate})`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago (${formattedDate})`;
  }
  
  return formattedDate;
};

/**
 * Generates a descriptive text for a monetary value
 * 
 * @param {number|string} value - The monetary value
 * @param {string} currency - The currency code
 * @returns {string} Descriptive text
 * @private
 */
const getMonetaryDescription = (value, currency = 'USD') => {
  if (value === undefined || value === null) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'Invalid monetary value';
  }
  
  // Format the monetary value according to locale and currency
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  });
  
  return formatter.format(numValue);
};

/**
 * Generates a descriptive text for a progress value
 * 
 * @param {number|string} progress - The progress value (0-100 or 0-1)
 * @returns {string} Descriptive text
 * @private
 */
const getProgressDescription = (progress) => {
  if (progress === undefined || progress === null) return '';
  
  const numProgress = typeof progress === 'string' ? parseFloat(progress) : progress;
  
  if (isNaN(numProgress)) {
    return 'Invalid progress value';
  }
  
  // Normalize progress to 0-100 scale
  const normalizedProgress = numProgress > 1 ? numProgress : numProgress * 100;
  const percentage = Math.round(normalizedProgress);
  
  // Descriptive text based on progress percentage
  if (percentage === 0) {
    return 'Not started (0% complete)';
  } else if (percentage === 100) {
    return 'Complete (100%)';
  } else if (percentage < 10) {
    return 'Just started (less than 10% complete)';
  } else if (percentage < 50) {
    return `In progress (${percentage}% complete)`;
  } else if (percentage < 90) {
    return `Mostly complete (${percentage}% done)`;
  } else {
    return `Nearly finished (${percentage}% complete)`;
  }
};

/**
 * Creates an accessibility-enhanced data structure for screen reader friendly pagination
 * 
 * @param {Object} pagination - Pagination data from API
 * @param {number} pagination.page - Current page number
 * @param {number} pagination.pageSize - Items per page
 * @param {number} pagination.totalItems - Total number of items
 * @param {number} pagination.totalPages - Total number of pages
 * @returns {Object} Enhanced pagination with accessibility information
 */
const createAccessiblePagination = (pagination) => {
  if (!pagination) return null;
  
  const { page, pageSize, totalItems, totalPages } = pagination;
  
  // Calculate item range for the current page
  const startItem = ((page - 1) * pageSize) + 1;
  const endItem = Math.min(startItem + pageSize - 1, totalItems || 0);
  
  return {
    ...pagination,
    _accessibility: {
      currentPageDescription: `Page ${page} of ${totalPages || 'unknown'}`,
      itemRangeDescription: `Showing items ${startItem} to ${endItem} of ${totalItems || 'unknown'}`,
      navigationLabels: {
        previous: `Go to previous page (page ${page - 1})`,
        next: `Go to next page (page ${page + 1})`,
        first: 'Go to first page',
        last: `Go to last page (page ${totalPages})`,
      },
      // Note if we're at the beginning or end of the list
      isFirstPage: page === 1,
      isLastPage: page === totalPages
    }
  };
};

/**
 * Creates accessible error messages for screen readers
 * 
 * @param {string|Object} error - Error message or object
 * @param {string} error.message - Error message
 * @param {number} error.code - Error code
 * @param {Object} options - Additional options
 * @param {boolean} options.includeResolution - Whether to include resolution steps
 * @returns {Object} Enhanced error with accessibility information
 */
const createAccessibleError = (error, options = {}) => {
  const { includeResolution = true } = options;
  
  // Extract error information
  const errorMessage = typeof error === 'string' ? error : error.message || 'An unknown error occurred';
  const errorCode = typeof error === 'object' && error.code ? error.code : null;
  
  const accessibleError = {
    error: typeof error === 'string' ? { message: error } : error,
    _accessibility: {
      screenReaderMessage: errorCode 
        ? `Error ${errorCode}: ${errorMessage}` 
        : errorMessage,
      errorType: getErrorType(error),
    }
  };
  
  // Add resolution steps if requested
  if (includeResolution) {
    accessibleError._accessibility.resolutionSteps = getResolutionSteps(error);
  }
  
  return accessibleError;
};

/**
 * Determines the type of error for better screen reader context
 * 
 * @param {string|Object} error - Error message or object
 * @returns {string} Error type classification
 * @private
 */
const getErrorType = (error) => {
  if (typeof error === 'string') {
    return 'general';
  }
  
  const code = error.code || error.status || 0;
  const message = error.message || '';
  
  if (code >= 400 && code < 500) {
    if (code === 401 || code === 403) {
      return 'authorization';
    } else if (code === 404) {
      return 'notFound';
    } else if (code === 422 || message.includes('validation')) {
      return 'validation';
    }
    return 'clientError';
  } else if (code >= 500) {
    return 'serverError';
  }
  
  return 'general';
};

/**
 * Generates resolution steps for common error types
 * 
 * @param {string|Object} error - Error message or object
 * @returns {Array} List of resolution steps
 * @private
 */
const getResolutionSteps = (error) => {
  const errorType = getErrorType(error);
  const resolutionSteps = [];
  
  switch (errorType) {
    case 'authorization':
      resolutionSteps.push('You may need to log in again or request access.');
      resolutionSteps.push('Check that you have permission to access this feature.');
      break;
    case 'notFound':
      resolutionSteps.push('The requested item could not be found.');
      resolutionSteps.push('Check the URL or return to the previous page.');
      break;
    case 'validation':
      resolutionSteps.push('Please check the information you provided for errors.');
      resolutionSteps.push('Review highlighted fields and correct any issues.');
      break;
    case 'serverError':
      resolutionSteps.push('This is a technical issue on our end.');
      resolutionSteps.push('Please try again later or contact support if the problem persists.');
      break;
    default:
      resolutionSteps.push('Please try again or refresh the page.');
      resolutionSteps.push('If the problem persists, contact support.');
  }
  
  return resolutionSteps;
};

/**
 * Get accessibility attributes specifically for notifications
 * Used by notification services to enhance notifications with accessibility information
 * 
 * @param {Object} notification - The notification object
 * @returns {Object} Accessibility attributes for the notification
 */
const getAccessibilityAttributes = (notification) => {
  if (!notification) return {};
  
  const attributes = {};
  
  // Generate a screen reader friendly message
  if (notification.title && notification.message) {
    attributes.screenReaderMessage = `${notification.title}: ${notification.message}`;
  } else {
    attributes.screenReaderMessage = notification.message || notification.title || '';
  }
  
  // Add importance information for screen readers
  switch (notification.type) {
    case 'error':
    case 'payment_failed':
      attributes.importance = 'assertive';
      attributes.role = 'alert';
      break;
    case 'warning':
      attributes.importance = 'assertive';
      attributes.role = 'alertdialog';
      break;
    default:
      attributes.importance = 'polite';
      attributes.role = 'status';
  }
  
  // Add a more detailed description based on notification type
  if (notification.type === 'payment_success') {
    const amount = notification.data?.amount || '';
    const currency = notification.data?.currency || 'USD';
    attributes.detailedDescription = `Payment of ${getMonetaryDescription(amount, currency)} was successful.`;
  } else if (notification.type === 'payment_failed') {
    attributes.detailedDescription = `Payment failed. Reason: ${notification.data?.errorMessage || 'Unknown error'}.`;
  } else if (notification.type === 'subscription_renewal') {
    const renewalDate = notification.data?.renewalDate 
      ? getDateDescription(notification.data.renewalDate)
      : 'soon';
    attributes.detailedDescription = `Your subscription will renew ${renewalDate}.`;
  }
  
  // Add focus management hints
  if (notification.actionLink || notification.data?.actionLink) {
    attributes.focusManagement = {
      shouldFocus: true,
      focusElementId: 'notification-action-button'
    };
  }
  
  // Add any contextual information that might be helpful
  if (notification.createdAt) {
    attributes.timeContext = getDateDescription(notification.createdAt);
  }
  
  return attributes;
};

module.exports = {
  addAccessibilityMetadata,
  createAccessiblePagination,
  createAccessibleError,
  getAccessibilityAttributes,
};
