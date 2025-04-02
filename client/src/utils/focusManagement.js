/**
 * Focus Management Utilities
 * 
 * This utility provides functions for managing focus, screen reader announcements,
 * and other accessibility-related DOM operations.
 */

/**
 * Announce a message to screen readers using ARIA live regions
 * @param {string} message - The message to announce
 * @param {string} priority - Can be "polite" (default) or "assertive"
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  if (!message) return;
  
  // Check if announcement containers already exist
  let politeAnnouncer = document.getElementById('aria-live-polite');
  let assertiveAnnouncer = document.getElementById('aria-live-assertive');
  
  // Create polite announcer if it doesn't exist
  if (!politeAnnouncer) {
    politeAnnouncer = document.createElement('div');
    politeAnnouncer.id = 'aria-live-polite';
    politeAnnouncer.className = 'sr-only';
    politeAnnouncer.setAttribute('aria-live', 'polite');
    politeAnnouncer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(politeAnnouncer);
  }
  
  // Create assertive announcer if it doesn't exist
  if (!assertiveAnnouncer) {
    assertiveAnnouncer = document.createElement('div');
    assertiveAnnouncer.id = 'aria-live-assertive';
    assertiveAnnouncer.className = 'sr-only';
    assertiveAnnouncer.setAttribute('aria-live', 'assertive');
    assertiveAnnouncer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(assertiveAnnouncer);
  }
  
  // Select appropriate announcer based on priority
  const announcer = priority === 'assertive' ? assertiveAnnouncer : politeAnnouncer;
  
  // Clear previous content and add new announcement
  // To ensure announcements are read even when the text doesn't change,
  // we first clear the announcer, then set its content in the next frame
  announcer.textContent = '';
  
  setTimeout(() => {
    announcer.textContent = message;
  }, 50);
};

/**
 * Get the first focusable element in a container
 * @param {HTMLElement} container - The container element to search within
 * @returns {HTMLElement|null} The first focusable element or null if none found
 */
export const getFirstFocusableElement = (container) => {
  if (!container) return null;
  
  // Selector for potentially focusable elements
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'area[href]'
  ].join(',');
  
  // Find all focusable elements in the container
  const focusableElements = Array.from(container.querySelectorAll(focusableSelector));
  
  // Return the first visible, focusable element
  return focusableElements.find(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }) || null;
};

/**
 * Set up focus trapping within a container (e.g., for modals/dialogs)
 * @param {HTMLElement} container - The container to trap focus within
 * @param {Function} onEscape - Optional callback to handle Escape key
 * @returns {Function} Cleanup function to remove the focus trap
 */
export const trapFocus = (container, onEscape) => {
  if (!container) return () => {};
  
  // Get all focusable elements in container
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'area[href]'
  ].join(',');
  
  const focusableElements = Array.from(container.querySelectorAll(focusableSelector))
    .filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  
  if (focusableElements.length === 0) return () => {};
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Store previously focused element to restore focus later
  const previouslyFocused = document.activeElement;
  
  // Focus first element in container
  firstElement.focus();
  
  // Handle keyboard events for focus trapping
  const handleKeyDown = (e) => {
    // Handle Escape key
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }
    
    // Handle Tab key for focus trapping
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, move to last element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if focus is on last element, move to first element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
  
  // Add event listener for keyboard handling
  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    
    // Restore focus to previously focused element
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
  };
};

/**
 * Apply accessible focus styling to elements for keyboard navigation
 * @param {string} selector - CSS selector for elements to style
 */
export const applyAccessibleFocusStyles = (selector = ':focus-visible') => {
  // Create style element if it doesn't exist
  let style = document.getElementById('accessible-focus-styles');
  
  if (!style) {
    style = document.createElement('style');
    style.id = 'accessible-focus-styles';
    document.head.appendChild(style);
  }
  
  // Define focus styles
  const cssRules = `
    ${selector} {
      outline: 2px solid #2684FF !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(38, 132, 255, 0.3) !important;
    }
  `;
  
  // Apply styles
  style.textContent = cssRules;
};

/**
 * Set up enhanced keyboard shortcuts for UI components
 * @param {HTMLElement} element - Element to attach shortcuts to
 * @param {Object} shortcuts - Map of keys to handler functions
 * @returns {Function} Cleanup function to remove shortcuts
 */
export const setupKeyboardShortcuts = (element, shortcuts) => {
  if (!element || !shortcuts) return () => {};
  
  const handleKeyDown = (e) => {
    // Get key identifier (e.g., "Shift+A", "Control+S")
    const key = [
      e.ctrlKey ? 'Control' : '',
      e.altKey ? 'Alt' : '',
      e.shiftKey ? 'Shift' : '',
      e.metaKey ? 'Meta' : '',
      e.key
    ].filter(Boolean).join('+');
    
    // Execute handler if shortcut exists
    if (shortcuts[key] || shortcuts[e.key]) {
      const handler = shortcuts[key] || shortcuts[e.key];
      handler(e);
    }
  };
  
  // Add event listener
  element.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Utility for showing an icon that indicates keyboard shortcuts are available
 * @param {HTMLElement} container - Container element to add indicators to
 * @param {Object} shortcutMap - Map of element selectors to shortcut texts
 */
export const addKeyboardShortcutIndicators = (container, shortcutMap) => {
  if (!container || !shortcutMap) return;
  
  // Process each selector/shortcut pair
  Object.entries(shortcutMap).forEach(([selector, shortcut]) => {
    const elements = container.querySelectorAll(selector);
    
    elements.forEach(el => {
      // Create indicator span
      const indicator = document.createElement('span');
      indicator.className = 'keyboard-shortcut-indicator';
      indicator.setAttribute('aria-hidden', 'true'); // Hide from screen readers
      indicator.textContent = shortcut;
      
      // Style the indicator
      indicator.style.fontSize = '0.8em';
      indicator.style.opacity = '0.8';
      indicator.style.marginLeft = '4px';
      indicator.style.padding = '2px 4px';
      indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      indicator.style.borderRadius = '3px';
      
      // Add indicator to element
      el.appendChild(indicator);
      
      // Update aria-keyshortcuts attribute
      el.setAttribute('aria-keyshortcuts', shortcut);
    });
  });
};

/**
 * Detect which screen reader (if any) is active
 * @returns {string|null} The detected screen reader or null if none detected
 */
export const detectScreenReader = () => {
  // This detection is not 100% reliable but provides a best guess
  
  if (window.navigator.userAgent.includes('JAWS')) {
    return 'JAWS';
  }
  
  if (window.navigator.userAgent.includes('NVDA')) {
    return 'NVDA';
  }
  
  if (
    /^MacIntel/.test(navigator.platform) && 
    /Apple/.test(navigator.vendor) && 
    typeof window.VoiceOver !== 'undefined'
  ) {
    return 'VoiceOver';
  }
  
  // Look for common screen reader features
  if (
    document.documentElement.getAttribute('data-at-detector') ||
    document.documentElement.getAttribute('data-aria-application')
  ) {
    return 'Unknown Screen Reader';
  }
  
  return null;
};

/**
 * Add a skip link to the page for keyboard navigation
 */
export const addSkipToContentLink = () => {
  // Check if skip link already exists
  if (document.getElementById('skip-to-content-link')) return;
  
  // Create skip link
  const skipLink = document.createElement('a');
  skipLink.id = 'skip-to-content-link';
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to content';
  
  // Style link
  skipLink.style.position = 'fixed';
  skipLink.style.top = '-100px';
  skipLink.style.left = '0';
  skipLink.style.padding = '8px';
  skipLink.style.zIndex = '10000';
  skipLink.style.backgroundColor = '#fff';
  skipLink.style.color = '#000';
  skipLink.style.fontWeight = 'bold';
  skipLink.style.textDecoration = 'none';
  skipLink.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
  skipLink.style.transition = 'top 0.2s';
  skipLink.style.borderRadius = '0 0 4px 0';
  
  // Show link on focus
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-100px';
  });
  
  // Insert as first element in body
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Make sure there's a main content target
  if (!document.getElementById('main-content')) {
    const main = document.querySelector('main') || document.querySelector('.main-content');
    if (main) {
      main.id = 'main-content';
      main.tabIndex = -1; // Make it focusable for skip link
    }
  }
};
