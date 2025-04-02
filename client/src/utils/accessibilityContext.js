/**
 * Accessibility Context
 * 
 * This context provides application-wide accessibility settings, preferences,
 * and utility functions to enhance accessibility across components.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  announceToScreenReader, 
  detectScreenReader,
  applyAccessibleFocusStyles
} from './focusManagement';
import { 
  transformTheme,
  TRANSFORMATION_MATRICES 
} from './colorBlindUtils';

// Create context with default values
const AccessibilityContext = createContext({
  // Display settings
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  keyboardMode: false,
  isDarkMode: false,
  
  // Color blind settings
  colorBlindMode: 'normal', // 'normal', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'
  
  // Screen reader
  isScreenReaderEnabled: false,
  screenReaderType: null,
  
  // Methods
  setHighContrast: () => {},
  setReduceMotion: () => {},
  setLargeText: () => {},
  setKeyboardMode: () => {},
  setColorBlindMode: () => {},
  setDarkMode: () => {},
  
  // Utilities
  announce: () => {},
  applyColorBlindTransformation: () => {},
  resetSettings: () => {},
});

/**
 * Accessibility Provider Component
 * 
 * Wraps the application to provide accessibility context and functionality
 */
export const AccessibilityProvider = ({ children, theme, onThemeChange }) => {
  // Initialize states, with preference for system settings where available
  const [highContrast, setHighContrast] = useState(() => {
    const saved = localStorage.getItem('a11y_highContrast');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [reduceMotion, setReduceMotion] = useState(() => {
    // Check system preference first, then fallback to saved setting
    if (typeof window !== 'undefined') {
      const systemPrefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (systemPrefersReducedMotion) return true;
    }
    
    const saved = localStorage.getItem('a11y_reduceMotion');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [largeText, setLargeText] = useState(() => {
    const saved = localStorage.getItem('a11y_largeText');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [keyboardMode, setKeyboardMode] = useState(false);

  const [colorBlindMode, setColorBlindMode] = useState(() => {
    const saved = localStorage.getItem('a11y_colorBlindMode');
    return saved || 'normal';
  });
  
  const [isDarkMode, setDarkMode] = useState(() => {
    // Check system preference first, then fallback to saved setting
    if (typeof window !== 'undefined') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) return true;
    }
    
    const saved = localStorage.getItem('a11y_darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isScreenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [screenReaderType, setScreenReaderType] = useState(null);
  
  // Update localStorage when preferences change
  useEffect(() => {
    localStorage.setItem('a11y_highContrast', JSON.stringify(highContrast));
  }, [highContrast]);
  
  useEffect(() => {
    localStorage.setItem('a11y_reduceMotion', JSON.stringify(reduceMotion));
  }, [reduceMotion]);
  
  useEffect(() => {
    localStorage.setItem('a11y_largeText', JSON.stringify(largeText));
  }, [largeText]);
  
  useEffect(() => {
    localStorage.setItem('a11y_colorBlindMode', colorBlindMode);
  }, [colorBlindMode]);
  
  useEffect(() => {
    localStorage.setItem('a11y_darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  
  // Apply theme transformations when settings change
  useEffect(() => {
    if (theme && onThemeChange) {
      const transformedTheme = {
        ...theme,
        // Apply color blind transformations
        palette: colorBlindMode !== 'normal' 
          ? transformTheme(theme).palette 
          : theme.palette,
      };
      
      // Call the theme change callback
      onThemeChange(transformedTheme);
    }
  }, [theme, colorBlindMode, onThemeChange]);
  
  // Monitor for keyboard usage to enable keyboard focus mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setKeyboardMode(true);
      }
    };
    
    const handleMouseDown = () => {
      setKeyboardMode(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  // Apply body classes for global CSS hooks
  useEffect(() => {
    document.body.classList.toggle('high-contrast-mode', highContrast);
    document.body.classList.toggle('reduce-motion', reduceMotion);
    document.body.classList.toggle('large-text', largeText);
    document.body.classList.toggle('keyboard-mode', keyboardMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    // Add color blind mode class
    const colorBlindClasses = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
    colorBlindClasses.forEach(cls => {
      document.body.classList.toggle(`color-blind-${cls}`, colorBlindMode === cls);
    });
  }, [highContrast, reduceMotion, largeText, keyboardMode, isDarkMode, colorBlindMode]);
  
  // Apply accessible focus styles
  useEffect(() => {
    applyAccessibleFocusStyles(keyboardMode ? ':focus' : ':focus-visible');
  }, [keyboardMode]);
  
  // Listen for system preference changes
  useEffect(() => {
    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (e) => {
      if (e.matches) {
        setReduceMotion(true);
      }
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    
    // Dark mode preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => {
      setDarkMode(e.matches);
    };
    darkModeQuery.addEventListener('change', handleDarkModeChange);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);
  
  // Detect screen reader on mount
  useEffect(() => {
    const srType = detectScreenReader();
    setScreenReaderType(srType);
    setScreenReaderEnabled(!!srType);
    
    // Add skip to content link for screen readers and keyboard navigation
    if (document && document.body) {
      const skipLink = document.createElement('a');
      skipLink.id = 'skip-to-content';
      skipLink.href = '#main-content';
      skipLink.className = 'sr-only sr-only-focusable';
      skipLink.textContent = 'Skip to content';
      
      if (document.body.firstChild) {
        document.body.insertBefore(skipLink, document.body.firstChild);
      } else {
        document.body.appendChild(skipLink);
      }
    }
  }, []);
  
  // Announce messages to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    if (!message) return;
    announceToScreenReader(message, priority);
  }, []);
  
  // Apply color blind transformation to a color
  const applyColorBlindTransformation = useCallback((color) => {
    // This will be imported from colorBlindUtils
    if (colorBlindMode === 'normal') return color;
    
    // Lazy import of transformColor from colorBlindUtils
    const transformColor = require('./colorBlindUtils').transformColor;
    return transformColor(color, colorBlindMode);
  }, [colorBlindMode]);
  
  // Reset all accessibility settings to defaults
  const resetSettings = useCallback(() => {
    setHighContrast(false);
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setLargeText(false);
    setColorBlindMode('normal');
    setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    localStorage.removeItem('a11y_highContrast');
    localStorage.removeItem('a11y_reduceMotion');
    localStorage.removeItem('a11y_largeText');
    localStorage.removeItem('a11y_colorBlindMode');
    localStorage.removeItem('a11y_darkMode');
  }, []);
  
  const contextValue = {
    // State
    highContrast,
    reduceMotion,
    largeText,
    keyboardMode,
    isDarkMode,
    colorBlindMode,
    isScreenReaderEnabled,
    screenReaderType,
    
    // Setters
    setHighContrast,
    setReduceMotion,
    setLargeText,
    setKeyboardMode,
    setColorBlindMode,
    setDarkMode,
    
    // Utilities
    announce,
    applyColorBlindTransformation,
    resetSettings,
  };
  
  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to use accessibility context
 */
export const useAccessibility = () => useContext(AccessibilityContext);

export default AccessibilityContext;
