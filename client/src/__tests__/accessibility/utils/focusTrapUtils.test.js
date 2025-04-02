import {
  getFocusableElements,
  createFocusTrap,
  useFocusTrap,
  withFocusTrap
} from '../../../utils/focusTrapUtils';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock document methods needed for focus management
document.body.createTextRange = () => ({
  getBoundingClientRect: () => ({}),
  getClientRects: () => []
});

// Helper to setup a test DOM structure
const setupTestDOM = () => {
  // Create a dialog container with focusable elements
  const container = document.createElement('div');
  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-modal', 'true');
  
  // Create a variety of focusable elements
  const button1 = document.createElement('button');
  button1.textContent = 'Button 1';
  button1.setAttribute('data-testid', 'button1');
  
  const input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('data-testid', 'input');
  
  const link = document.createElement('a');
  link.setAttribute('href', '#');
  link.textContent = 'Link';
  link.setAttribute('data-testid', 'link');
  
  const button2 = document.createElement('button');
  button2.textContent = 'Button 2';
  button2.setAttribute('data-testid', 'button2');
  
  // Create a disabled button (should not be focusable)
  const disabledButton = document.createElement('button');
  disabledButton.textContent = 'Disabled Button';
  disabledButton.disabled = true;
  disabledButton.setAttribute('data-testid', 'disabled-button');
  
  // Append all elements to the container
  container.appendChild(button1);
  container.appendChild(input);
  container.appendChild(link);
  container.appendChild(button2);
  container.appendChild(disabledButton);
  
  // Append container to the document
  document.body.appendChild(container);
  
  return {
    container,
    button1,
    input,
    link,
    button2,
    disabledButton,
    cleanup: () => {
      document.body.removeChild(container);
    }
  };
};

// Mock React.useRef and React.useEffect for the React hook tests
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  
  return {
    ...originalReact,
    useRef: jest.fn(() => ({ current: document.createElement('div') })),
    useEffect: jest.fn((callback) => callback())
  };
});

describe('Focus Trap Utilities', () => {
  describe('getFocusableElements', () => {
    it('should return all focusable elements in a container', () => {
      const { container, button1, input, link, button2, disabledButton, cleanup } = setupTestDOM();
      
      try {
        const focusableElements = getFocusableElements(container);
        
        // Should find 4 focusable elements (not including the disabled button)
        expect(focusableElements.length).toBe(4);
        expect(focusableElements).toContain(button1);
        expect(focusableElements).toContain(input);
        expect(focusableElements).toContain(link);
        expect(focusableElements).toContain(button2);
        expect(focusableElements).not.toContain(disabledButton);
      } finally {
        cleanup();
      }
    });
    
    it('should handle empty containers', () => {
      const emptyContainer = document.createElement('div');
      const focusableElements = getFocusableElements(emptyContainer);
      expect(focusableElements.length).toBe(0);
    });
    
    it('should handle null or undefined containers', () => {
      expect(getFocusableElements(null)).toEqual([]);
      expect(getFocusableElements(undefined)).toEqual([]);
    });
    
    it('should exclude elements with display: none or visibility: hidden', () => {
      const { container, button1, cleanup } = setupTestDOM();
      
      try {
        // Hide one of the buttons
        button1.style.display = 'none';
        
        const focusableElements = getFocusableElements(container);
        
        // Should not include the hidden button
        expect(focusableElements).not.toContain(button1);
        
        // Test visibility: hidden
        button1.style.display = '';
        button1.style.visibility = 'hidden';
        
        const focusableElements2 = getFocusableElements(container);
        expect(focusableElements2).not.toContain(button1);
      } finally {
        cleanup();
      }
    });
  });
  
  describe('createFocusTrap', () => {
    it('should trap focus within container using Tab key', () => {
      const { container, button1, button2, cleanup } = setupTestDOM();
      
      try {
        // Set initial focus
        button1.focus();
        expect(document.activeElement).toBe(button1);
        
        // Initialize focus trap
        const focusTrap = createFocusTrap(container);
        
        // Simulate Tab key press on last focusable element
        button2.focus();
        fireEvent.keyDown(button2, { key: 'Tab' });
        
        // Focus should cycle back to first element
        expect(document.activeElement).toBe(button1);
        
        // Simulate Shift+Tab on first focusable element
        fireEvent.keyDown(button1, { key: 'Tab', shiftKey: true });
        
        // Focus should cycle to last element
        expect(document.activeElement).toBe(button2);
        
        // Clean up the focus trap
        focusTrap.detach();
      } finally {
        cleanup();
      }
    });
    
    it('should call onEscape when Escape key is pressed', () => {
      const { container, button1, cleanup } = setupTestDOM();
      
      try {
        const onEscapeMock = jest.fn();
        
        // Initialize focus trap with onEscape handler
        const focusTrap = createFocusTrap(container, { onEscape: onEscapeMock });
        
        // Set focus and simulate Escape key
        button1.focus();
        fireEvent.keyDown(button1, { key: 'Escape' });
        
        // onEscape should be called
        expect(onEscapeMock).toHaveBeenCalled();
        
        // Clean up
        focusTrap.detach();
      } finally {
        cleanup();
      }
    });
    
    it('should auto-focus first element when initialized', () => {
      const { container, button1, cleanup } = setupTestDOM();
      
      try {
        // Create a focus trap with autoFocus enabled
        const focusTrap = createFocusTrap(container, { autoFocus: true });
        
        // There's a setTimeout in the implementation, so we need to fast-forward timers
        jest.runAllTimers();
        
        // The first button should be focused
        expect(document.activeElement).toBe(button1);
        
        // Clean up
        focusTrap.detach();
      } finally {
        cleanup();
      }
    });
    
    it('should update focusable elements when refreshed', () => {
      const { container, button1, cleanup } = setupTestDOM();
      
      try {
        // Create focus trap
        const focusTrap = createFocusTrap(container);
        
        // Add a new button to the container
        const newButton = document.createElement('button');
        newButton.textContent = 'New Button';
        container.insertBefore(newButton, button1); // Insert at the beginning
        
        // Refresh the focus trap
        focusTrap.refreshFocusableElements();
        
        // Set focus to the last element and press Tab
        const lastElement = container.querySelector('[data-testid="button2"]');
        lastElement.focus();
        fireEvent.keyDown(lastElement, { key: 'Tab' });
        
        // Focus should now move to the new first element
        expect(document.activeElement).toBe(newButton);
        
        // Clean up
        focusTrap.detach();
      } finally {
        cleanup();
      }
    });
  });
  
  // These tests require more complex mocking of React hooks
  describe('useFocusTrap hook', () => {
    // Basic test to ensure the hook returns the expected functions
    it('should return initialize, cleanup, and refresh functions', () => {
      const containerRef = { current: document.createElement('div') };
      
      const { initialize, cleanup, refresh } = useFocusTrap(containerRef);
      
      expect(typeof initialize).toBe('function');
      expect(typeof cleanup).toBe('function');
      expect(typeof refresh).toBe('function');
    });
    
    it('should not initialize if containerRef.current is null', () => {
      const containerRef = { current: null };
      
      const { initialize } = useFocusTrap(containerRef);
      
      // Should not throw an error
      expect(() => initialize()).not.toThrow();
    });
    
    it('should not initialize if enabled is false', () => {
      const containerRef = { current: document.createElement('div') };
      
      const { initialize } = useFocusTrap(containerRef, { enabled: false });
      
      // Should not throw an error
      expect(() => initialize()).not.toThrow();
    });
  });
  
  // Basic test for the HOC
  describe('withFocusTrap HOC', () => {
    it('should pass ref and refreshFocusTrap prop to wrapped component', () => {
      // Create a simple test component
      const TestComponent = jest.fn(() => <div>Test</div>);
      
      // Wrap it with withFocusTrap
      const WrappedComponent = withFocusTrap(TestComponent);
      
      // Render the wrapped component
      render(<WrappedComponent testProp="test" />);
      
      // Check that the component was called with the expected props
      expect(TestComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          testProp: 'test',
          refreshFocusTrap: expect.any(Function)
        }),
        expect.anything()
      );
    });
  });
  
  // Integration-style tests with real React components
  describe('Focus trap in React components', () => {
    // Example component that uses the focus trap
    const DialogWithFocusTrap = ({ isOpen, onClose, children }) => {
      if (!isOpen) return null;
      
      return (
        <div 
          role="dialog" 
          aria-modal="true"
          data-testid="dialog"
          ref={(el) => {
            if (el) {
              // Simulate what would happen with the useFocusTrap hook
              const focusTrap = createFocusTrap(el, { onEscape: onClose });
              el._focusTrap = focusTrap; // Store for cleanup
            }
          }}
        >
          <button data-testid="close-button" onClick={onClose}>Close</button>
          <input data-testid="text-input" type="text" />
          <button data-testid="submit-button">Submit</button>
          {children}
        </div>
      );
    };
    
    // Cleanup function to properly remove focus traps
    const cleanupDialogFocusTrap = () => {
      const dialog = document.querySelector('[data-testid="dialog"]');
      if (dialog && dialog._focusTrap) {
        dialog._focusTrap.detach();
      }
    };
    
    afterEach(() => {
      cleanupDialogFocusTrap();
    });
    
    it('should trap focus within dialog', () => {
      const handleClose = jest.fn();
      
      render(
        <DialogWithFocusTrap isOpen={true} onClose={handleClose} />
      );
      
      // Get dialog elements
      const closeButton = screen.getByTestId('close-button');
      const textInput = screen.getByTestId('text-input');
      const submitButton = screen.getByTestId('submit-button');
      
      // Focus should initially be on first focusable element
      jest.runAllTimers();
      expect(document.activeElement).toBe(closeButton);
      
      // Tab from last element should cycle to first
      submitButton.focus();
      fireEvent.keyDown(submitButton, { key: 'Tab' });
      expect(document.activeElement).toBe(closeButton);
      
      // Shift+Tab from first element should cycle to last
      closeButton.focus();
      fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(submitButton);
    });
    
    it('should call onClose when Escape is pressed', () => {
      const handleClose = jest.fn();
      
      render(
        <DialogWithFocusTrap isOpen={true} onClose={handleClose} />
      );
      
      // Press Escape key
      const dialog = screen.getByTestId('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      
      // onClose should be called
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
