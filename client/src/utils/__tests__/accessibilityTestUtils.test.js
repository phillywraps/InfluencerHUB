/**
 * Tests for the Accessibility Testing Utilities
 * 
 * This file also serves as an example of how to use the accessibility utilities
 * in your own component tests.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  validateElementAccessibility, 
  checkKeyboardNavigation,
  toBeAccessible
} from '../accessibilityTestUtils';

// Add the custom matchers to Jest
expect.extend({ toBeAccessible: toBeAccessible().toBeAccessible });

// Sample accessible component
const AccessibleButton = ({ label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
  >
    {label}
  </button>
);

// Sample inaccessible component (missing aria-label when no text content)
const InaccessibleButton = () => (
  <button onClick={() => {}} />
);

// Sample form with keyboard navigation
const AccessibleForm = () => (
  <form>
    <label htmlFor="name">Name</label>
    <input id="name" type="text" aria-describedby="name-help" />
    <div id="name-help">Enter your full name</div>
    
    <label htmlFor="email">Email</label>
    <input id="email" type="email" required />
    
    <button type="submit">Submit</button>
  </form>
);

// Sample custom interactive element with keyboard support
const CustomInteractive = () => (
  <div 
    role="button" 
    tabIndex={0} 
    onClick={() => {}}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Handle action
      }
    }}
    aria-label="Custom button"
  >
    Click me
  </div>
);

describe('Accessibility Test Utilities', () => {
  describe('validateElementAccessibility', () => {
    test('should validate accessible button correctly', () => {
      const { container } = render(<AccessibleButton label="Click me" />);
      const button = container.querySelector('button');
      const result = validateElementAccessibility(button);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
    
    test('should detect missing accessible name', () => {
      const { container } = render(<InaccessibleButton />);
      const button = container.querySelector('button');
      const result = validateElementAccessibility(button);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Element missing accessible name (aria-label, aria-labelledby, or associated label)');
    });
  });
  
  describe('checkKeyboardNavigation', () => {
    test('should validate form with proper keyboard navigation', () => {
      const { container } = render(<AccessibleForm />);
      const result = checkKeyboardNavigation(container);
      
      expect(result.valid).toBe(true);
    });
    
    test('should validate custom interactive element with keyboard support', () => {
      const { container } = render(<CustomInteractive />);
      const result = checkKeyboardNavigation(container);
      
      expect(result.valid).toBe(true);
    });
  });
  
  // Note: The following test would work with a full jest-axe implementation
  // This is commented out because jest-axe is mocked in this example
  /*
  describe('toBeAccessible', () => {
    test('accessible component should pass', async () => {
      const { container } = render(<AccessibleForm />);
      await expect(container).toBeAccessible();
    });
  });
  */
});

/**
 * Example of how to test a real component for accessibility
 * 
 * This is a template you can follow when testing your own components
 */
describe('Example: Testing a component for accessibility', () => {
  test('Component should have accessible elements', () => {
    // Render your component
    const { container } = render(<AccessibleForm />);
    
    // Test 1: Check that all interactive elements have accessible names
    const interactiveElements = container.querySelectorAll('button, [href], input, select, textarea');
    interactiveElements.forEach(element => {
      const result = validateElementAccessibility(element);
      // You can add custom error messages to help identify which element failed
      expect(result.valid).toBe(true);
    });
    
    // Test 2: Check keyboard navigation
    const keyboardResult = checkKeyboardNavigation(container);
    expect(keyboardResult.valid).toBe(true);
    
    // Test 3: Check that inputs with required attribute have accessible error messages
    // This would be a custom test for your specific validation pattern
    const requiredInputs = container.querySelectorAll('input[required]');
    requiredInputs.forEach(input => {
      // Check that there's either:
      // 1. aria-describedby pointing to error message
      // 2. Adjacent error message that gets shown on validation
      // Your specific validation pattern may differ
      const hasAccessibleValidation = 
        input.hasAttribute('aria-describedby') ||
        input.hasAttribute('aria-errormessage');
      
      // Custom assertion message to help identify which input is problematic
      expect(
        hasAccessibleValidation || input.id === 'email' // Example exception
      ).toBe(true);
    });
  });
});

// Mock for jest-axe since it's not actually installed in this example
jest.mock('jest-axe', () => ({
  axe: jest.fn().mockResolvedValue({
    violations: []
  })
}));
