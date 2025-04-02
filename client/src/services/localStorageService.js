/**
 * Local Storage Service
 * 
 * A utility service for safely storing and retrieving data from localStorage
 * with expiration support, JSON serialization, and error handling.
 */

// Default expiration time (7 days) in milliseconds
const DEFAULT_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

// Keys used by the application
const KEYS = {
  THEME: 'app_theme',
  USER_PREFERENCES: 'user_preferences',
  RECENT_SEARCHES: 'recent_searches',
  UI_STATE: 'ui_state',
  RECENT_VIEWS: 'recent_views',
  FORM_DRAFTS: 'form_drafts',
  FILTER_SETTINGS: 'filter_settings',
  DASHBOARD_LAYOUT: 'dashboard_layout',
  LANGUAGE: 'language',
};

// Types of data that can be stored
const TYPES = {
  STRING: 'string',
  OBJECT: 'object',
  ARRAY: 'array',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
};

/**
 * Local Storage Service
 */
const localStorageService = {
  // Public constants for keys
  KEYS,
  
  /**
   * Set an item in localStorage with optional expiration
   * 
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {object} options - Storage options
   * @param {number} options.expiration - Expiration time in milliseconds
   * @param {string} options.type - Type of data (for validation)
   * @returns {boolean} Success status
   */
  set(key, value, options = {}) {
    try {
      const { expiration = DEFAULT_EXPIRATION, type } = options;
      
      // Validate type if provided
      if (type && !this._validateType(value, type)) {
        console.error(`LocalStorage: Type mismatch for key "${key}". Expected ${type}`);
        return false;
      }
      
      // Create storage object with expiration
      const storageObject = {
        value,
        expiry: Date.now() + expiration,
        type: type || typeof value,
      };
      
      localStorage.setItem(key, JSON.stringify(storageObject));
      return true;
    } catch (error) {
      console.warn(`LocalStorage: Failed to set item "${key}"`, error);
      return false;
    }
  },
  
  /**
   * Get an item from localStorage
   * 
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found or expired
   * @returns {any} Stored value or defaultValue
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      
      if (!item) return defaultValue;
      
      const storageObject = JSON.parse(item);
      
      // Check if the item has expired
      if (storageObject.expiry && storageObject.expiry < Date.now()) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      
      return storageObject.value;
    } catch (error) {
      console.warn(`LocalStorage: Failed to get item "${key}"`, error);
      return defaultValue;
    }
  },
  
  /**
   * Remove an item from localStorage
   * 
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`LocalStorage: Failed to remove item "${key}"`, error);
      return false;
    }
  },
  
  /**
   * Check if localStorage has an item (that isn't expired)
   * 
   * @param {string} key - Storage key
   * @returns {boolean} Whether the item exists and is not expired
   */
  has(key) {
    try {
      const item = localStorage.getItem(key);
      
      if (!item) return false;
      
      const storageObject = JSON.parse(item);
      
      // Check if the item has expired
      if (storageObject.expiry && storageObject.expiry < Date.now()) {
        localStorage.removeItem(key);
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Clear all app-specific items from localStorage
   * 
   * @returns {boolean} Success status
   */
  clearAll() {
    try {
      // Only clear keys that belong to our app
      Object.values(KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('LocalStorage: Failed to clear all items', error);
      return false;
    }
  },
  
  /**
   * Update a specific property in a stored object
   * 
   * @param {string} key - Storage key
   * @param {string|Array} property - Property or path to update
   * @param {any} value - New value
   * @returns {boolean} Success status
   */
  updateProperty(key, property, value) {
    try {
      const storedValue = this.get(key, null);
      
      if (storedValue === null) return false;
      
      // Handle property path as array, e.g. ['user', 'settings', 'theme']
      if (Array.isArray(property)) {
        let current = storedValue;
        const lastProp = property.pop();
        
        // Navigate to the nested object
        for (const prop of property) {
          if (current[prop] === undefined) {
            current[prop] = {};
          }
          current = current[prop];
        }
        
        // Set the value at the final property
        current[lastProp] = value;
      } else {
        // Simple property update
        storedValue[property] = value;
      }
      
      // Re-store with the same options
      return this.set(key, storedValue);
    } catch (error) {
      console.warn(`LocalStorage: Failed to update property "${property}" for key "${key}"`, error);
      return false;
    }
  },
  
  /**
   * Get or set user preferences
   * 
   * @param {string} preference - Preference key
   * @param {any} value - Value to set (if getting, leave undefined)
   * @returns {any} Current value of the preference
   */
  preference(preference, value) {
    const preferences = this.get(KEYS.USER_PREFERENCES, {});
    
    // Getter mode
    if (value === undefined) {
      return preferences[preference] !== undefined ? 
        preferences[preference] : null;
    }
    
    // Setter mode
    preferences[preference] = value;
    this.set(KEYS.USER_PREFERENCES, preferences);
    return value;
  },
  
  /**
   * Track recently viewed items (maintains an ordered list with max size)
   * 
   * @param {string} type - Type of item (e.g., 'influencer', 'rental')
   * @param {string|number} id - ID of the item
   * @param {object} itemData - Additional data about the item
   * @param {number} maxItems - Maximum number of items to keep
   * @returns {Array} Updated list of recent items
   */
  trackRecentView(type, id, itemData = {}, maxItems = 10) {
    const key = `${KEYS.RECENT_VIEWS}_${type}`;
    const recentItems = this.get(key, []);
    
    // Create new item with timestamp
    const newItem = {
      id,
      viewedAt: Date.now(),
      ...itemData
    };
    
    // Remove if already exists (to move to front)
    const updatedItems = recentItems.filter(item => item.id !== id);
    
    // Add new item at the beginning
    updatedItems.unshift(newItem);
    
    // Limit array size
    const limitedItems = updatedItems.slice(0, maxItems);
    
    // Save back to localStorage
    this.set(key, limitedItems);
    
    return limitedItems;
  },
  
  /**
   * Get the list of recently viewed items
   * 
   * @param {string} type - Type of item (e.g., 'influencer', 'rental')
   * @returns {Array} List of recent items
   */
  getRecentViews(type) {
    const key = `${KEYS.RECENT_VIEWS}_${type}`;
    return this.get(key, []);
  },
  
  /**
   * Save draft form data
   * 
   * @param {string} formId - Identifier for the form
   * @param {object} formData - Form data to save
   * @returns {boolean} Success status
   */
  saveFormDraft(formId, formData) {
    const drafts = this.get(KEYS.FORM_DRAFTS, {});
    drafts[formId] = {
      data: formData,
      savedAt: Date.now()
    };
    return this.set(KEYS.FORM_DRAFTS, drafts);
  },
  
  /**
   * Get draft form data
   * 
   * @param {string} formId - Identifier for the form
   * @returns {object|null} Saved form data or null
   */
  getFormDraft(formId) {
    const drafts = this.get(KEYS.FORM_DRAFTS, {});
    return drafts[formId]?.data || null;
  },
  
  /**
   * Clear a form draft
   * 
   * @param {string} formId - Identifier for the form
   * @returns {boolean} Success status
   */
  clearFormDraft(formId) {
    const drafts = this.get(KEYS.FORM_DRAFTS, {});
    if (drafts[formId]) {
      delete drafts[formId];
      return this.set(KEYS.FORM_DRAFTS, drafts);
    }
    return true;
  },
  
  /**
   * Save filter settings for a page
   * 
   * @param {string} pageId - Identifier for the page
   * @param {object} settings - Filter settings
   * @returns {boolean} Success status
   */
  saveFilterSettings(pageId, settings) {
    const allSettings = this.get(KEYS.FILTER_SETTINGS, {});
    allSettings[pageId] = settings;
    return this.set(KEYS.FILTER_SETTINGS, allSettings);
  },
  
  /**
   * Get filter settings for a page
   * 
   * @param {string} pageId - Identifier for the page
   * @returns {object} Filter settings
   */
  getFilterSettings(pageId) {
    const allSettings = this.get(KEYS.FILTER_SETTINGS, {});
    return allSettings[pageId] || {};
  },
  
  // Private helper methods
  
  /**
   * Validate that a value matches the expected type
   * 
   * @param {any} value - Value to validate
   * @param {string} type - Expected type
   * @returns {boolean} Whether the value matches the type
   * @private
   */
  _validateType(value, type) {
    switch (type) {
      case TYPES.STRING:
        return typeof value === 'string';
      case TYPES.NUMBER:
        return typeof value === 'number' && !isNaN(value);
      case TYPES.BOOLEAN:
        return typeof value === 'boolean';
      case TYPES.OBJECT:
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      case TYPES.ARRAY:
        return Array.isArray(value);
      default:
        return true; // No validation for unknown types
    }
  }
};

export { KEYS, TYPES };
export default localStorageService;
