/**
 * Theme Context for the Influencer API Key Marketplace
 * 
 * This context provides theme-related state and functionality throughout the application,
 * including theme mode (light/dark) preference management.
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from './index';

// Create the theme context
export const ThemeContext = createContext({
  mode: 'light',
  toggleColorMode: () => {},
  setMode: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Try to get the user's preferred theme mode from localStorage
  const getInitialMode = () => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) {
      return savedMode;
    }
    
    // Check if the user's system prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light mode
    return 'light';
  };
  
  const [mode, setMode] = useState(getInitialMode);
  
  // Toggle between light and dark mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Save the theme mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);
  
  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const systemPrefersDark = e.matches;
      // Only update if the user hasn't manually set a preference
      if (!localStorage.getItem('themeMode')) {
        setMode(systemPrefersDark ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Get the theme based on the current mode
  const theme = getTheme(mode);
  
  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
