/**
 * Performance optimization utilities for React components
 * 
 * This module provides functions and utilities to optimize React component
 * rendering performance through careful memoization and render tracking.
 */

import React, { useState, useRef, useEffect } from 'react';

/**
 * Enhanced memo utility that adds display names and debugging
 * 
 * This wraps React.memo with additional functionality:
 * - Automatically adds display names for component debugging
 * - Can log re-renders when in development mode
 * - Supports custom comparison functions
 * 
 * @param {React.FC} Component - The component to memoize
 * @param {Object} options - Options to configure the memoization
 * @param {Function} options.areEqual - Custom comparison function (like React.memo second arg)
 * @param {Boolean} options.logReRenders - Whether to log re-renders in development
 * @returns {React.NamedExoticComponent} Memoized component
 */
export const memoWithOptions = (Component, options = {}) => {
  const { areEqual, logReRenders = false } = options;
  
  // Get a display name for better debugging
  const displayName = Component.displayName || Component.name || 'Component';
  
  // Create a wrapper that can log renders if needed
  const WrappedComponent = (props) => {
    if (process.env.NODE_ENV === 'development' && logReRenders) {
      console.log(`Rendering ${displayName}`);
    }
    return <Component {...props} />;
  };
  
  // Set proper display name for DevTools
  WrappedComponent.displayName = `Memo(${displayName})`;
  
  // Memoize with optional custom comparison
  const MemoizedComponent = areEqual 
    ? React.memo(WrappedComponent, areEqual) 
    : React.memo(WrappedComponent);
  
  return MemoizedComponent;
};

/**
 * Context for tracking render counts in development environment
 */
export const RenderCountContext = React.createContext({
  counts: {},
  increment: () => {}
});

/**
 * Provider component for tracking render counts
 */
export const RenderCountProvider = ({ children }) => {
  const [counts, setCounts] = useState({});
  
  const increment = (componentId) => {
    setCounts(prev => ({
      ...prev,
      [componentId]: (prev[componentId] || 0) + 1
    }));
  };
  
  return (
    <RenderCountContext.Provider value={{ counts, increment }}>
      {children}
    </RenderCountContext.Provider>
  );
};

/**
 * Custom hook to track component renders during development
 * Use this to identify components that re-render too frequently
 * 
 * @param {string} componentId - Unique identifier for the component
 * @returns {number} The number of times the component has rendered
 */
export const useRenderCount = (componentId) => {
  const { counts, increment } = React.useContext(RenderCountContext);
  const renderCount = counts[componentId] || 0;
  
  // Only track in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      increment(componentId);
    }
  }, [componentId, increment]);
  
  return renderCount;
};

/**
 * Hook to detect when component props change
 * Helps identify which props are causing re-renders
 * 
 * @param {Object} props - Component props to track changes on
 * @returns {Object} Object showing which props changed since last render
 */
export const usePropChanges = (props) => {
  const prevProps = useRef({});
  const changes = {};
  
  // Skip on first render
  if (Object.keys(prevProps.current).length) {
    for (const key in props) {
      if (props[key] !== prevProps.current[key]) {
        changes[key] = {
          from: prevProps.current[key],
          to: props[key]
        };
      }
    }
    
    // Check for removed props
    for (const key in prevProps.current) {
      if (!(key in props)) {
        changes[key] = {
          from: prevProps.current[key],
          to: undefined
        };
      }
    }
  }
  
  // Store current props for next comparison
  useEffect(() => {
    prevProps.current = props;
  });
  
  return changes;
};

/**
 * Deep comparison function for React.memo or useEffect dependencies
 * Use with caution as deep comparisons are expensive
 * 
 * @param {*} prevProps - Previous props or value
 * @param {*} nextProps - Next props or value
 * @returns {boolean} Whether the values are deeply equal
 */
export const deepCompare = (prevProps, nextProps) => {
  try {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  } catch (e) {
    // Fallback to shallow compare if circular reference or other JSON error
    console.warn('deepCompare fallback to shallow compare due to:', e);
    return Object.keys(prevProps).length === Object.keys(nextProps).length &&
      Object.keys(prevProps).every(key => prevProps[key] === nextProps[key]);
  }
};

/**
 * Hook to measure component render time
 * 
 * @param {string} componentName - Name of component for logging
 * @param {boolean} enabled - Whether timing is enabled 
 */
export const useRenderTiming = (componentName, enabled = process.env.NODE_ENV === 'development') => {
  const startTimeRef = useRef(0);
  
  useEffect(() => {
    if (enabled) {
      const renderTime = performance.now() - startTimeRef.current;
      console.log(`${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
  });
  
  if (enabled) {
    startTimeRef.current = performance.now();
  }
};

/**
 * Similar to React.memo but with an option to force updates
 * Useful for components that usually don't need to re-render
 * but sometimes need to force an update
 * 
 * @param {React.FC} Component - The component to memoize
 */
export const memoWithForceUpdate = (Component) => {
  const MemoizedComponent = React.memo(Component);
  
  const ForceUpdateWrapper = (props) => {
    const [, forceRender] = useState(0);
    
    // Expose force update method through ref
    useEffect(() => {
      if (props.forceUpdateRef) {
        props.forceUpdateRef.current = () => forceRender(prev => prev + 1);
      }
    }, [props.forceUpdateRef]);
    
    return <MemoizedComponent {...props} />;
  };
  
  ForceUpdateWrapper.displayName = `MemoWithForce(${Component.displayName || Component.name || 'Component'})`;
  
  return ForceUpdateWrapper;
};

/**
 * Create a memoized callback with named display in React DevTools
 * Wraps useCallback with a meaningful name for debugging
 * 
 * @param {Function} callback - The callback to memoize 
 * @param {Array} dependencies - Dependency array for the callback
 * @param {string} name - Name for the callback in DevTools
 * @returns {Function} Memoized callback
 */
export const useNamedCallback = (callback, dependencies, name) => {
  const memoizedCallback = React.useCallback(callback, dependencies);
  
  if (process.env.NODE_ENV === 'development' && name) {
    try {
      // Use Object.defineProperty to name the function for debugging
      Object.defineProperty(memoizedCallback, 'name', { value: name });
    } catch (e) {
      // Ignore errors, naming is just for debugging
    }
  }
  
  return memoizedCallback;
};
