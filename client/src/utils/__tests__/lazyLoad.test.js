import React from 'react';
import { render, screen } from '@testing-library/react';
import lazyLoad, { prefetchComponents } from '../lazyLoad';

// Mock React.lazy and Suspense
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    lazy: jest.fn(factory => {
      const Component = props => {
        const LazyComponent = () => <div>Lazy Loaded Component</div>;
        return <LazyComponent {...props} />;
      };
      Component.displayName = 'LazyComponent';
      return Component;
    }),
    Suspense: ({ children, fallback }) => children,
  };
});

// Mock for a component to import
jest.mock('../dummyComponent', () => ({
  __esModule: true,
  default: () => <div>Dummy Component</div>
}), { virtual: true });

describe('lazyLoad utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call React.lazy with the given factory function', () => {
    const importFn = () => import('../dummyComponent');
    const LazyComponent = lazyLoad(importFn);
    
    expect(React.lazy).toHaveBeenCalledTimes(1);
    expect(React.lazy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should render the lazy loaded component', () => {
    const importFn = () => import('../dummyComponent');
    const LazyComponent = lazyLoad(importFn);
    
    render(<LazyComponent />);
    expect(screen.getByText('Lazy Loaded Component')).toBeInTheDocument();
  });

  it('should create a component with the correct displayName', () => {
    const importFn = () => import('../dummyComponent');
    const LazyComponent = lazyLoad(importFn, { 
      componentName: 'TestComponent' 
    });
    
    expect(LazyComponent.displayName).toBe('lazy(TestComponent)');
  });

  it('should handle component options correctly', () => {
    const importFn = () => import('../dummyComponent');
    const fallback = <div>Loading...</div>;
    
    const LazyComponent = lazyLoad(importFn, {
      fallback,
      prefetch: true,
      componentName: 'TestComponent'
    });
    
    expect(LazyComponent.displayName).toBe('lazy(TestComponent)');
    expect(LazyComponent.prefetch).toBe(true);
  });
});

describe('prefetchComponents', () => {
  it('should call import for each component to prefetch', async () => {
    const mockImports = {
      component1: jest.fn(() => Promise.resolve({ default: () => {} })),
      component2: jest.fn(() => Promise.resolve({ default: () => {} }))
    };
    
    await prefetchComponents(mockImports);
    
    expect(mockImports.component1).toHaveBeenCalledTimes(1);
    expect(mockImports.component2).toHaveBeenCalledTimes(1);
  });

  it('should handle errors in prefetching gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockImports = {
      failingComponent: jest.fn(() => Promise.reject(new Error('Failed to load')))
    };
    
    await prefetchComponents(mockImports);
    
    expect(mockImports.failingComponent).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });
});
