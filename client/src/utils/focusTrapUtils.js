/**
 * Focus Trap Utilities
 * 
 * This module provides utilities for trapping focus within modal dialogs and
 * other components for enhanced keyboard accessibility.
 */

/**
 * Gets all focusable elements within a container
 * 
 * @param {HTMLElement} container - The container element to search within
 * @returns {Array<HTMLElement>} - Array of focusable elements
 */
export const getFocusableElements = (container) => {
  if (!container) return [];
  
  // Common selectors for focusable elements
  const selector = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');
  
  return Array.from(container.querySelectorAll(selector))
    .filter(el => {
      // Additional checks to ensure elements are actually focusable:
      
      // Check visibility (approximate)
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
      
      // Check if element is disabled or has an ancestor that is disabled
      let current = el;
      while (current) {
        if (current.disabled) return false;
        current = current.parentElement;
      }
      
      return true;
    });
};

/**
 * Creates a keyboard event handler that traps focus within a container
 * 
 * @param {HTMLElement} container - The container to trap focus within
 * @param {Object} options - Options object
 * @param {Function} options.onEscape - Optional callback for when Escape key is pressed
 * @param {boolean} options.autoFocus - Whether to focus the first element when handler is attached (default: true)
 * @param {boolean} options.lockFocus - Whether to lock focus completely inside container (default: true)
 * @returns {Function} - Event handler function to attach to the container
 */
export const createFocusTrap = (container, options = {}) => {
  const {
    onEscape = null,
    autoFocus = true,
    lockFocus = true
  } = options;
  
  let focusableElements = getFocusableElements(container);
  
  // Cache these to avoid repeated queries
  let firstFocusableElement = focusableElements[0];
  let lastFocusableElement = focusableElements[focusableElements.length - 1];
  
  // Store the element that had focus before the dialog was opened
  const previousActiveElement = document.activeElement;
  
  // Auto-focus the first element if requested
  if (autoFocus && firstFocusableElement) {
    setTimeout(() => {
      firstFocusableElement.focus();
    }, 50); // Small delay to ensure DOM is ready
  }
  
  /**
   * Refreshes the list of focusable elements
   * Call this if the DOM structure changes dynamically
   */
  const refreshFocusableElements = () => {
    focusableElements = getFocusableElements(container);
    firstFocusableElement = focusableElements[0];
    lastFocusableElement = focusableElements[focusableElements.length - 1];
  };
  
  /**
   * Handles keyboard events to trap focus
   * @param {KeyboardEvent} event - The keyboard event
   */
  const trapFocusHandler = (event) => {
    // Handle Escape key
    if (event.key === 'Escape' && onEscape) {
      onEscape(event);
      return;
    }
    
    // Only handle Tab key for focus trapping
    if (event.key !== 'Tab') return;
    
    // If we don't want to lock focus, don't prevent default behavior
    if (!lockFocus) return;
    
    // If there are no focusable elements, do nothing
    if (focusableElements.length === 0) return;
    
    // Handle Tab and Shift+Tab navigation
    const isTabForward = !event.shiftKey;
    const isTabBackward = event.shiftKey;
    
    // Check if we're on the last focusable element and tabbing forward
    if (isTabForward && document.activeElement === lastFocusableElement) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
    
    // Check if we're on the first focusable element and tabbing backward
    if (isTabBackward && document.activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement.focus();
    }
  };
  
  /**
   * Creates a handler to monitor focus changing outside the container
   * This prevents focus leaving the container due to programmatic focus changes
   */
  const createFocusOutHandler = () => {
    return (event) => {
      if (!lockFocus) return;
      
      // If focus moves outside the container, bring it back
      if (container && !container.contains(event.target)) {
        event.stopPropagation();
        
        // Focus the first element if we can't determine where focus went
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      }
    };
  };
  
  // Create the focus out handler
  const focusOutHandler = createFocusOutHandler();
  
  /**
   * Attaches the focus trap handlers to the container
   */
  const attach = () => {
    container.addEventListener('keydown', trapFocusHandler);
    document.addEventListener('focusin', focusOutHandler);
    refreshFocusableElements();
  };
  
  /**
   * Removes the focus trap handlers and restores original focus
   */
  const detach = () => {
    container.removeEventListener('keydown', trapFocusHandler);
    document.removeEventListener('focusin', focusOutHandler);
    
    // Restore focus to the original element when the trap is detached
    if (previousActiveElement && previousActiveElement.focus) {
      setTimeout(() => {
        previousActiveElement.focus();
      }, 50);
    }
  };
  
  // Immediately attach when created
  attach();
  
  // Return methods to control the focus trap
  return {
    attach,
    detach,
    refreshFocusableElements
  };
};

/**
 * React hook for creating a focus trap
 * 
 * @param {React.RefObject} containerRef - React ref for the container element
 * @param {Object} options - Options for the focus trap (see createFocusTrap)
 * @param {boolean} options.enabled - Whether the focus trap is enabled
 * @returns {Object} - Methods to control the focus trap
 */
export const useFocusTrap = (containerRef, options = {}) => {
  const { enabled = true, ...trapOptions } = options;
  let focusTrapInstance = null;
  
  const initialize = () => {
    if (!containerRef.current || !enabled) return;
    
    // Create and initialize focus trap
    focusTrapInstance = createFocusTrap(containerRef.current, trapOptions);
  };
  
  const cleanup = () => {
    if (focusTrapInstance) {
      focusTrapInstance.detach();
      focusTrapInstance = null;
    }
  };
  
  const refresh = () => {
    if (focusTrapInstance) {
      focusTrapInstance.refreshFocusableElements();
    }
  };
  
  // This hook should be paired with useEffect in the component using it:
  // useEffect(() => {
  //   const { initialize, cleanup } = focusTrapUtils;
  //   initialize();
  //   return () => cleanup();
  // }, []);
  
  return {
    initialize,
    cleanup,
    refresh
  };
};

/**
 * HOC to add focus trap functionality to a component
 * 
 * @param {React.Component} WrappedComponent - Component to enhance with focus trap
 * @param {Object} options - Focus trap options
 * @returns {React.Component} - Enhanced component with focus trap functionality
 */
export const withFocusTrap = (WrappedComponent, options = {}) => {
  // This should be implemented using React.forwardRef and React.useEffect
  // The implementation would depend on the specific React version and patterns used
  
  return (props) => {
    const containerRef = React.useRef(null);
    const focusTrap = useFocusTrap(containerRef, options);
    
    React.useEffect(() => {
      focusTrap.initialize();
      return () => focusTrap.cleanup();
    }, []);
    
    return (
      <WrappedComponent
        {...props}
        ref={containerRef}
        refreshFocusTrap={focusTrap.refresh}
      />
    );
  };
};

export default {
  getFocusableElements,
  createFocusTrap,
  useFocusTrap,
  withFocusTrap
};
