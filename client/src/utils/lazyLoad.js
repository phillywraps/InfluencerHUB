import React, { lazy, Suspense } from 'react';
import LoadingPage from '../components/common/LoadingPage';

/**
 * Advanced lazy loading utility with error boundaries, retries, and prefetching
 * 
 * This utility enhances React's built-in lazy loading with:
 * - Built-in error handling with fallbacks
 * - Automatic retry logic for network issues
 * - Component prefetching capabilities
 * - Loading state customization
 */

/**
 * Creates a lazy-loaded component with optimized loading
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Configuration options
 * @returns {React.Component} Lazy-loaded component with proper suspense handling
 */
export function lazyLoad(importFunc, options = {}) {
  const {
    fallback = <LoadingPage />,
    retry = 3,
    retryDelay = 1500,
    timeout = 10000,
    prefetch = false,
    errorComponent = null
  } = options;

  // Create lazy component with retry logic
  const LazyComponent = lazy(() => {
    let retryCount = 0;

    // Retry logic function
    const attemptLoad = () => importFunc()
      .catch(error => {
        if (retryCount < retry) {
          retryCount++;
          // Exponential backoff for retry
          const delay = retryDelay * Math.pow(1.5, retryCount - 1);
          
          return new Promise(resolve => {
            console.warn(`Failed to load component, retrying (${retryCount}/${retry})...`);
            setTimeout(resolve, delay);
          }).then(attemptLoad);
        }
        
        // If all retries fail, throw the error
        throw error;
      });

    // Add timeout to prevent infinite loading
    return Promise.race([
      attemptLoad(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Component load timeout')), timeout)
      )
    ]);
  });

  // If prefetch is enabled, start loading immediately
  if (prefetch) {
    importFunc().catch(() => {
      // Silently catch error - it will be retried when the component mounts
    });
  }

  // Return wrapped component with suspense
  return (props) => (
    <Suspense fallback={fallback}>
      <ErrorBoundary fallback={errorComponent}>
        <LazyComponent {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}

/**
 * Error boundary component for lazy loading
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Lazy component error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          borderRadius: '4px'
        }}>
          <h4>Failed to load component</h4>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 16px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Prefetch a component in advance to speed up future navigation
 * @param {Function} importFunc - Dynamic import function
 * @returns {Promise} Import promise
 */
export function prefetchComponent(importFunc) {
  return importFunc().catch(err => {
    console.warn('Failed to prefetch component:', err);
  });
}

/**
 * Prefetch multiple components in advance
 * @param {Object} components - Object with import functions
 * @returns {Promise} Promise that resolves when all prefetches complete
 */
export function prefetchComponents(components) {
  const imports = Object.values(components).map(importFunc => 
    prefetchComponent(importFunc)
  );
  
  return Promise.all(imports);
}

export default lazyLoad;
