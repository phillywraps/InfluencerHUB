import React from 'react';
import { render, act } from '@testing-library/react';
import {
  memoWithOptions,
  RenderCountContext,
  RenderCountProvider,
  useRenderCount,
  usePropChanges,
  deepCompare,
  useRenderTiming,
  memoWithForceUpdate,
  useNamedCallback
} from '../memoHelper';

// Mock performance.now for consistent testing
const originalPerformanceNow = performance.now;
beforeAll(() => {
  let time = 0;
  performance.now = jest.fn(() => {
    time += 10; // Increase by 10ms each call for predictable results
    return time;
  });
});

afterAll(() => {
  performance.now = originalPerformanceNow;
});

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  jest.clearAllMocks();
});

// Set up process.env for development testing
const originalNodeEnv = process.env.NODE_ENV;
beforeEach(() => {
  process.env.NODE_ENV = 'development';
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe('memoWithOptions', () => {
  it('should create a memoized component with display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';
    
    const MemoizedComponent = memoWithOptions(TestComponent);
    
    expect(MemoizedComponent.displayName).toBe('Memo(TestComponent)');
    expect(React.memo).toHaveBeenCalled();
  });
  
  it('should log renders when logReRenders is true', () => {
    const TestComponent = () => <div>Test</div>;
    const MemoizedComponent = memoWithOptions(TestComponent, { logReRenders: true });
    
    render(<MemoizedComponent />);
    
    expect(console.log).toHaveBeenCalledWith('Rendering Component');
  });
  
  it('should use custom comparison function when provided', () => {
    const TestComponent = () => <div>Test</div>;
    const areEqual = jest.fn(() => true);
    
    memoWithOptions(TestComponent, { areEqual });
    
    expect(React.memo).toHaveBeenCalledWith(expect.any(Function), areEqual);
  });
});

describe('RenderCountProvider and useRenderCount', () => {
  const TestComponent = ({ id }) => {
    const renderCount = useRenderCount(id);
    return <div data-testid="count">{renderCount}</div>;
  };
  
  it('should track component render counts', () => {
    const { getByTestId, rerender } = render(
      <RenderCountProvider>
        <TestComponent id="test-component" />
      </RenderCountProvider>
    );
    
    // First render
    expect(getByTestId('count').textContent).toBe('1');
    
    // Force re-render
    rerender(
      <RenderCountProvider>
        <TestComponent id="test-component" />
      </RenderCountProvider>
    );
    
    // Count should increase
    expect(getByTestId('count').textContent).toBe('2');
  });
  
  it('should track different components separately', () => {
    const { getByTestId } = render(
      <RenderCountProvider>
        <TestComponent id="component-1" />
        <TestComponent id="component-2" />
      </RenderCountProvider>
    );
    
    // Both should be on their first render
    const counts = document.querySelectorAll('[data-testid="count"]');
    expect(counts[0].textContent).toBe('1');
    expect(counts[1].textContent).toBe('1');
  });
});

describe('usePropChanges', () => {
  const TestComponent = ({ testProp1, testProp2 }) => {
    const changes = usePropChanges({ testProp1, testProp2 });
    return (
      <div data-testid="changes">
        {Object.keys(changes).length > 0 ? JSON.stringify(changes) : 'no changes'}
      </div>
    );
  };
  
  it('should detect when props change', () => {
    const { getByTestId, rerender } = render(
      <TestComponent testProp1="initial" testProp2={42} />
    );
    
    // First render should show no changes
    expect(getByTestId('changes').textContent).toBe('no changes');
    
    // Update props
    rerender(<TestComponent testProp1="updated" testProp2={42} />);
    
    // Should detect testProp1 changed, but not testProp2
    const changes = JSON.parse(getByTestId('changes').textContent);
    expect(changes).toHaveProperty('testProp1');
    expect(changes).not.toHaveProperty('testProp2');
    expect(changes.testProp1.from).toBe('initial');
    expect(changes.testProp1.to).toBe('updated');
  });
  
  it('should detect removed props', () => {
    const { getByTestId, rerender } = render(
      <TestComponent testProp1="value" testProp2={42} />
    );
    
    // First render should show no changes
    expect(getByTestId('changes').textContent).toBe('no changes');
    
    // Remove one prop
    rerender(<TestComponent testProp1="value" />);
    
    // Should detect testProp2 was removed
    const changes = JSON.parse(getByTestId('changes').textContent);
    expect(changes).toHaveProperty('testProp2');
    expect(changes.testProp2.from).toBe(42);
    expect(changes.testProp2.to).toBeUndefined();
  });
});

describe('deepCompare', () => {
  it('should return true for deeply equal objects', () => {
    const objA = { a: 1, b: { c: 2 } };
    const objB = { a: 1, b: { c: 2 } };
    
    expect(deepCompare(objA, objB)).toBe(true);
  });
  
  it('should return false for different objects', () => {
    const objA = { a: 1, b: { c: 2 } };
    const objB = { a: 1, b: { c: 3 } };
    
    expect(deepCompare(objA, objB)).toBe(false);
  });
  
  it('should handle circular references gracefully', () => {
    const objA = { a: 1 };
    const objB = { a: 1 };
    objA.self = objA; // Create circular reference
    objB.self = objB; // Create circular reference
    
    expect(deepCompare(objA, objB)).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('useRenderTiming', () => {
  const TestComponent = ({ enabled = true }) => {
    useRenderTiming('TimedComponent', enabled);
    return <div>Timed Component</div>;
  };
  
  it('should log render time for component', () => {
    render(<TestComponent />);
    
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/TimedComponent rendered in \d+\.\d+ms/));
  });
  
  it('should not log when disabled', () => {
    render(<TestComponent enabled={false} />);
    
    expect(console.log).not.toHaveBeenCalled();
  });
});

describe('memoWithForceUpdate', () => {
  const TestComponent = ({ value, forceUpdateRef }) => {
    return <div data-testid="value">{value}</div>;
  };
  
  it('should create a memoized component that can be force updated', () => {
    const MemoizedComponent = memoWithForceUpdate(TestComponent);
    const forceUpdateRef = { current: null };
    
    const { getByTestId, rerender } = render(
      <MemoizedComponent value="initial" forceUpdateRef={forceUpdateRef} />
    );
    
    // Component should show initial value
    expect(getByTestId('value').textContent).toBe('initial');
    
    // Update prop, but component shouldn't re-render due to memoization
    rerender(<MemoizedComponent value="updated" forceUpdateRef={forceUpdateRef} />);
    expect(getByTestId('value').textContent).toBe('initial');
    
    // Force update should cause re-render
    act(() => {
      forceUpdateRef.current();
    });
    
    expect(getByTestId('value').textContent).toBe('updated');
  });
});

describe('useNamedCallback', () => {
  it('should return a memoized callback', () => {
    const callback = jest.fn();
    let result;
    
    const TestComponent = () => {
      result = useNamedCallback(callback, [], 'testCallback');
      return null;
    };
    
    render(<TestComponent />);
    
    // Should be a function
    expect(typeof result).toBe('function');
    
    // The callback should be memoized
    const firstResult = result;
    render(<TestComponent />);
    expect(result).toBe(firstResult);
    
    // Should have the specified name in development mode
    expect(result.name).toBe('testCallback');
  });
});
