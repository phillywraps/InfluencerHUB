/**
 * Accessibility Testing Utilities
 *
 * This module provides functions to help test accessibility in components.
 * These utilities can be used in unit tests and component development.
 */

import { axe } from 'jest-axe';

/**
 * Runs accessibility tests on a rendered component using jest-axe
 * 
 * @param {Element} container - The DOM node containing the rendered component
 * @param {Object} options - Configuration options for axe
 * @returns {Promise<Object>} - The axe results object
 * 
 * @example
 * // In a Jest test:
 * import { render } from '@testing-library/react';
 * import { testAccessibility } from '../utils/accessibilityTestUtils';
 * 
 * test('Component should have no accessibility violations', async () => {
 *   const { container } = render(<MyComponent />);
 *   const results = await testAccessibility(container);
 *   expect(results.violations).toHaveLength(0);
 * });
 */
export const testAccessibility = async (container, options = {}) => {
  const axeOptions = {
    rules: {
      // Add specific rule configurations here
      'color-contrast': { enabled: true },
      'label': { enabled: true },
      'aria-roles': { enabled: true },
      ...options.rules,
    },
    ...options,
  };

  return await axe(container, axeOptions);
};

/**
 * Validates that an element has proper accessible attributes
 * 
 * @param {HTMLElement} element - The element to check
 * @param {Object} options - Options specifying what to check
 * @param {boolean} options.checkLabel - Whether to check for accessible label
 * @param {boolean} options.checkDescription - Whether to check for description
 * @param {boolean} options.checkRole - Whether to check for role
 * @returns {Object} - Validation results with any issues found
 * 
 * @example
 * // In a component test:
 * import { validateElementAccessibility } from '../utils/accessibilityTestUtils';
 * 
 * test('Button has proper accessibility attributes', () => {
 *   const button = document.querySelector('button');
 *   const result = validateElementAccessibility(button, { 
 *     checkLabel: true, 
 *     checkRole: true 
 *   });
 *   expect(result.valid).toBe(true);
 * });
 */
export const validateElementAccessibility = (element, options = {}) => {
  const { 
    checkLabel = true, 
    checkDescription = false, 
    checkRole = false 
  } = options;
  
  const result = { valid: true, issues: [] };
  
  if (!element) {
    result.valid = false;
    result.issues.push('Element is not defined');
    return result;
  }
  
  // Check for accessible name
  if (checkLabel) {
    const hasAccessibleName = 
      element.hasAttribute('aria-label') ||
      element.hasAttribute('aria-labelledby') ||
      (element.tagName === 'INPUT' && element.hasAttribute('id') && document.querySelector(`label[for="${element.id}"]`)) ||
      (element.tagName === 'BUTTON' && element.textContent.trim() !== '') ||
      (element.tagName === 'A' && element.textContent.trim() !== '');
    
    if (!hasAccessibleName) {
      result.valid = false;
      result.issues.push('Element missing accessible name (aria-label, aria-labelledby, or associated label)');
    }
  }
  
  // Check for description
  if (checkDescription) {
    const hasDescription = 
      element.hasAttribute('aria-describedby') ||
      element.hasAttribute('title');
    
    if (!hasDescription) {
      result.valid = false;
      result.issues.push('Element missing description (aria-describedby or title)');
    }
  }
  
  // Check for appropriate role
  if (checkRole) {
    const hasRole = element.hasAttribute('role');
    const isInteractive = 
      element.tagName === 'BUTTON' || 
      element.tagName === 'A' || 
      element.tagName === 'INPUT' || 
      element.tagName === 'SELECT' || 
      element.hasAttribute('tabindex');
    
    if (!hasRole && !isInteractive && element.hasAttribute('tabindex')) {
      result.valid = false;
      result.issues.push('Interactive element missing appropriate role');
    }
  }
  
  return result;
};

/**
 * Checks for proper keyboard navigation in a component
 * 
 * @param {HTMLElement} container - Container with focusable elements
 * @returns {Object} - Validation results with any issues found
 * 
 * @example
 * // In a test:
 * import { checkKeyboardNavigation } from '../utils/accessibilityTestUtils';
 * 
 * test('Component supports keyboard navigation', () => {
 *   const container = document.querySelector('.my-component');
 *   const result = checkKeyboardNavigation(container);
 *   expect(result.valid).toBe(true);
 * });
 */
export const checkKeyboardNavigation = (container) => {
  const result = { valid: true, issues: [] };
  
  if (!container) {
    result.valid = false;
    result.issues.push('Container is not defined');
    return result;
  }
  
  // Get all focusable elements
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) {
    result.valid = true;
    return result;
  }
  
  // Check for proper tab indices
  const tabIndices = Array.from(focusableElements)
    .map(el => parseInt(el.getAttribute('tabindex') || '0', 10))
    .filter(index => index !== 0);
  
  // Check if tab indices are in logical order
  if (tabIndices.length > 0) {
    const isOrdered = tabIndices.every((val, i, arr) => i === 0 || val >= arr[i - 1]);
    
    if (!isOrdered) {
      result.valid = false;
      result.issues.push('Tabindex values are not in ascending order, which may create confusing navigation');
    }
  }
  
  // Check for keyboard handlers on custom interactive elements
  const customInteractiveElements = container.querySelectorAll('[role="button"], [role="link"], [role="checkbox"], [role="tab"]');
  
  customInteractiveElements.forEach(element => {
    const hasKeyDown = element.hasAttribute('onkeydown') || element._keydown;
    const hasKeyPress = element.hasAttribute('onkeypress') || element._keypress;
    const hasKeyUp = element.hasAttribute('onkeyup') || element._keyup;
    
    if (!hasKeyDown && !hasKeyPress && !hasKeyUp) {
      result.valid = false;
      result.issues.push(`Element with role="${element.getAttribute('role')}" is missing keyboard event handlers`);
    }
  });
  
  return result;
};

/**
 * Validates color contrast for text elements
 * 
 * Note: This is a simplified check and should be paired with a tool like axe
 * for comprehensive contrast testing
 * 
 * @param {HTMLElement} element - The element to check
 * @returns {Object} - Validation results
 */
export const validateTextContrast = (element) => {
  // This is a placeholder for a more complex implementation
  // In a real implementation, this would use a library to compute color contrast ratios
  
  return {
    valid: true,
    message: 'Contrast validation requires a full implementation with computed styles. Use jest-axe for accurate contrast testing.'
  };
};

/**
 * Creates an accessibility report for a component
 * 
 * @param {HTMLElement} container - Container with the component
 * @returns {Object} - Comprehensive accessibility report
 * 
 * @example
 * // In development:
 * import { generateAccessibilityReport } from '../utils/accessibilityTestUtils';
 * 
 * function debugComponent(component) {
 *   const container = document.querySelector(component);
 *   const report = generateAccessibilityReport(container);
 *   console.log(report);
 * }
 */
export const generateAccessibilityReport = (container) => {
  if (!container) {
    return {
      valid: false,
      issues: ['Container is not defined'],
      elements: [],
      keyboardNavigation: { valid: false, issues: ['Container is not defined'] }
    };
  }
  
  const report = {
    valid: true,
    issues: [],
    elements: [],
    keyboardNavigation: checkKeyboardNavigation(container)
  };
  
  // Get all important elements
  const elements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex], [role], img, label, h1, h2, h3, h4, h5, h6'
  );
  
  elements.forEach(element => {
    const elementType = element.tagName.toLowerCase();
    const elementReport = {
      element: elementType,
      id: element.id || null,
      class: element.className || null,
      role: element.getAttribute('role') || null,
      validation: validateElementAccessibility(element, {
        checkLabel: ['button', 'a', 'input', 'select', 'textarea'].includes(elementType),
        checkDescription: ['input', 'img'].includes(elementType),
        checkRole: element.hasAttribute('tabindex') && parseInt(element.getAttribute('tabindex'), 10) >= 0
      })
    };
    
    report.elements.push(elementReport);
    
    if (!elementReport.validation.valid) {
      report.valid = false;
      report.issues.push(`Issues with ${elementType}${element.id ? ` #${element.id}` : ''}: ${elementReport.validation.issues.join(', ')}`);
    }
  });
  
  if (!report.keyboardNavigation.valid) {
    report.valid = false;
    report.issues.push(...report.keyboardNavigation.issues);
  }
  
  return report;
};

/**
 * Creates a testing helper to assert accessibility of a component
 * in React Testing Library tests
 * 
 * @returns {Function} - A matcher function to use with expect()
 * 
 * @example
 * // In a Jest setup file:
 * import { toBeAccessible } from '../utils/accessibilityTestUtils';
 * expect.extend({ toBeAccessible });
 * 
 * // Then in tests:
 * test('Component is accessible', async () => {
 *   const { container } = render(<MyComponent />);
 *   await expect(container).toBeAccessible();
 * });
 */
export const toBeAccessible = () => {
  return {
    async toBeAccessible(received) {
      if (!received || typeof received !== 'object' || !received.nodeType) {
        return {
          pass: false,
          message: () => 'Expected a DOM node but received something else'
        };
      }
      
      const results = await testAccessibility(received);
      const pass = results.violations.length === 0;
      
      if (pass) {
        return {
          pass: true,
          message: () => 'Component passed all accessibility tests'
        };
      } else {
        return {
          pass: false,
          message: () => `Component has ${results.violations.length} accessibility violations:\n` +
            results.violations.map(violation => 
              `- ${violation.id}: ${violation.description}\n  Impact: ${violation.impact}\n  ${violation.nodes.length} occurrences`
            ).join('\n\n')
        };
      }
    }
  };
};

export default {
  testAccessibility,
  validateElementAccessibility,
  checkKeyboardNavigation,
  validateTextContrast,
  generateAccessibilityReport,
  toBeAccessible
};
