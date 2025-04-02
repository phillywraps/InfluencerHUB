/**
 * Jest setup file that runs before all tests
 * 
 * This file configures the testing environment for Jest.
 * It's executed before any tests run and is used to set up:
 * - Global test configurations
 * - Custom matchers
 * - Global DOM testing libraries
 * - Mock implementations for browser APIs
 */

// Import Jest DOM for DOM testing assertions like toBeInTheDocument()
import '@testing-library/jest-dom';

// Add fetch polyfill for tests
require('whatwg-fetch');

// Mock the window.matchMedia function which is not implemented in JSDOM
// This prevents errors when components use media queries
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

// Mock window.scrollTo to prevent errors 
window.scrollTo = jest.fn();

// Mock ResizeObserver that's not implemented in JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Intersection Observer API
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [0],
}));

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Ignore specific React testing library errors
  const ignoreMessages = [
    'Warning: ReactDOM.render is no longer supported',
    'Warning: useLayoutEffect does nothing on the server',
  ];
  
  if (ignoreMessages.some(msg => args[0].includes(msg))) {
    return;
  }
  
  originalConsoleError(...args);
};
