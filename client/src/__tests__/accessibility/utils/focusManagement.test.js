/**
 * Tests for Focus Management Utilities
 * 
 * These tests verify that the focus management utilities work correctly
 * for accessibility features such as screen reader announcements,
 * focus trapping, and keyboard navigation.
 */

import {
  announceToScreenReader,
  getFirstFocusableElement,
  trapFocus,
  applyAccessibleFocusStyles,
  setupKeyboardShortcuts,
  addKeyboardShortcutIndicators
} from '../../../utils/focusManagement';

// Setup DOM elements for testing
const setupDOM = () => {
  // Clear previous DOM setup
  document.body.innerHTML = '';
  
  // Create test container
  const container = document.createElement('div');
  container.innerHTML = `
    <button id="button1">Button 1</button>
    <input id="input1" type="text" />
    <div id="not-focusable">Not Focusable</div>
    <a id="link1" href="#test">Link 1</a>
    <button id="button2" disabled>Disabled Button</button>
    <select id="select1">
      <option>Option 1</option>
    </select>
  `;
  document.body.appendChild(container);
  
  return container;
};

describe('Focus Management Utilities', () => {
  // Spy on DOM methods
  let addEventListenerSpy;
  let removeEventListenerSpy;
  let appendChildSpy;
  
  beforeEach(() => {
    // Create DOM elements for testing
    setupDOM();
    
    // Spy on document methods
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    appendChildSpy = jest.spyOn(document.body, 'appendChild');
    
    // Clear previous calls
    addEventListenerSpy.mockClear();
    removeEventListenerSpy.mockClear();
    appendChildSpy.mockClear();
  });
  
  afterEach(() => {
    // Restore document methods
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    appendChildSpy.mockRestore();
  });
  
  describe('announceToScreenReader', () => {
    it('should create aria-live regions if they do not exist', () => {
      announceToScreenReader('Test announcement');
      
      // Check that aria-live regions were created
      const politeRegion = document.getElementById('aria-live-polite');
      const assertiveRegion = document.getElementById('aria-live-assertive');
      
      expect(politeRegion).not.toBeNull();
      expect(assertiveRegion).not.toBeNull();
      
      // Verify region attributes
      expect(politeRegion.getAttribute('aria-live')).toBe('polite');
      expect(assertiveRegion.getAttribute('aria-live')).toBe('assertive');
      
      // Should have appended to document.body
      expect(appendChildSpy).toHaveBeenCalledTimes(2);
    });
    
    it('should use existing aria-live regions if they exist', () => {
      // Create the regions first
      announceToScreenReader('First announcement');
      appendChildSpy.mockClear(); // Clear previous calls
      
      // Make another announcement
      announceToScreenReader('Second announcement');
      
      // Should not have created new regions
      expect(appendChildSpy).not.toHaveBeenCalled();
      
      // Should have updated the existing region
      const politeRegion = document.getElementById('aria-live-polite');
      expect(politeRegion.textContent).toBe(''); // Initially cleared
      
      // Wait for the setTimeout to fire
      jest.runAllTimers();
      
      expect(politeRegion.textContent).toBe('Second announcement');
    });
    
    it('should use the assertive region for assertive announcements', () => {
      announceToScreenReader('Important announcement', 'assertive');
      
      const assertiveRegion = document.getElementById('aria-live-assertive');
      expect(assertiveRegion).not.toBeNull();
      
      // Wait for the setTimeout to fire
      jest.runAllTimers();
      
      expect(assertiveRegion.textContent).toBe('Important announcement');
    });
    
    it('should ignore empty announcements', () => {
      announceToScreenReader('');
      
      // Should not have created regions
      expect(appendChildSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('getFirstFocusableElement', () => {
    it('should find the first focusable element in a container', () => {
      const container = document.body.firstChild;
      const firstFocusable = getFirstFocusableElement(container);
      
      // The first focusable element should be button1
      expect(firstFocusable.id).toBe('button1');
    });
    
    it('should skip disabled elements', () => {
      // Create a container where the first element is disabled
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="disabledButton" disabled>Disabled</button>
        <button id="enabledButton">Enabled</button>
      `;
      document.body.appendChild(container);
      
      const firstFocusable = getFirstFocusableElement(container);
      
      // Should skip the disabled button
      expect(firstFocusable.id).toBe('enabledButton');
    });
    
    it('should return null if no focusable elements are found', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div>Not focusable</div>
        <span>Not focusable either</span>
      `;
      document.body.appendChild(container);
      
      const firstFocusable = getFirstFocusableElement(container);
      
      // Should return null
      expect(firstFocusable).toBeNull();
    });
    
    it('should handle null container', () => {
      const firstFocusable = getFirstFocusableElement(null);
      expect(firstFocusable).toBeNull();
    });
  });
  
  describe('trapFocus', () => {
    it('should add keyboard event listener', () => {
      const container = document.body.firstChild;
      
      trapFocus(container);
      
      // Should have added event listener for keydown
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
    
    it('should return cleanup function that removes event listener', () => {
      const container = document.body.firstChild;
      
      const cleanup = trapFocus(container);
      
      // Call cleanup function
      cleanup();
      
      // Should have removed event listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
    
    it('should focus first element when initialized', () => {
      const container = document.body.firstChild;
      const firstButton = document.getElementById('button1');
      
      // Spy on focus method
      const focusSpy = jest.spyOn(firstButton, 'focus');
      
      trapFocus(container);
      
      // Should have focused the first element
      expect(focusSpy).toHaveBeenCalled();
    });
    
    it('should handle Escape key if onEscape callback provided', () => {
      const container = document.body.firstChild;
      const onEscapeMock = jest.fn();
      
      // Set up event handler
      trapFocus(container, onEscapeMock);
      
      // Get the event handler function (second argument to addEventListener)
      const eventHandler = addEventListenerSpy.mock.calls[0][1];
      
      // Simulate Escape key event
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(escapeEvent, 'preventDefault', { value: jest.fn() });
      
      eventHandler(escapeEvent);
      
      // Should have called onEscape
      expect(onEscapeMock).toHaveBeenCalled();
      expect(escapeEvent.preventDefault).toHaveBeenCalled();
    });
    
    it('should handle empty container gracefully', () => {
      const container = document.createElement('div');
      
      // This should not throw an error
      const cleanup = trapFocus(container);
      
      // Cleanup should be a no-op function
      expect(cleanup).toBeInstanceOf(Function);
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('applyAccessibleFocusStyles', () => {
    it('should create style element if it does not exist', () => {
      applyAccessibleFocusStyles();
      
      const styleElement = document.getElementById('accessible-focus-styles');
      expect(styleElement).not.toBeNull();
      expect(styleElement.tagName).toBe('STYLE');
    });
    
    it('should update existing style element if it exists', () => {
      // Create the style element first
      applyAccessibleFocusStyles(':focus');
      
      // Get the current style content
      const styleElement = document.getElementById('accessible-focus-styles');
      const originalContent = styleElement.textContent;
      
      // Apply with different selector
      applyAccessibleFocusStyles('.custom-focus');
      
      // Should have updated the existing style element
      expect(styleElement.textContent).not.toBe(originalContent);
      expect(styleElement.textContent).toContain('.custom-focus');
    });
  });
  
  describe('setupKeyboardShortcuts', () => {
    it('should add keydown event listener to element', () => {
      const element = document.getElementById('button1');
      const shortcuts = { 'a': jest.fn() };
      
      // Spy on element's addEventListener
      const addEventListenerElementSpy = jest.spyOn(element, 'addEventListener');
      
      setupKeyboardShortcuts(element, shortcuts);
      
      // Should have added event listener for keydown
      expect(addEventListenerElementSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
    
    it('should handle key presses based on shortcuts map', () => {
      const element = document.getElementById('button1');
      const shortcutMock = jest.fn();
      const shortcuts = { 'a': shortcutMock };
      
      setupKeyboardShortcuts(element, shortcuts);
      
      // Get the event handler (first argument to addEventListener)
      const addEventListenerElementSpy = jest.spyOn(element, 'addEventListener');
      const eventHandler = addEventListenerElementSpy.mock.calls[0][1];
      
      // Simulate a keydown event
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
      eventHandler(keyEvent);
      
      // Should have called the shortcut handler
      expect(shortcutMock).toHaveBeenCalledWith(keyEvent);
    });
    
    it('should handle modifier key combinations', () => {
      const element = document.getElementById('button1');
      const shortcutMock = jest.fn();
      const shortcuts = { 'Control+a': shortcutMock };
      
      setupKeyboardShortcuts(element, shortcuts);
      
      // Get the event handler
      const addEventListenerElementSpy = jest.spyOn(element, 'addEventListener');
      const eventHandler = addEventListenerElementSpy.mock.calls[0][1];
      
      // Simulate a keydown event with modifier
      const keyEvent = new KeyboardEvent('keydown', { 
        key: 'a', 
        ctrlKey: true 
      });
      
      // Mock key identifiers
      Object.defineProperty(keyEvent, 'key', { value: 'a' });
      Object.defineProperty(keyEvent, 'ctrlKey', { value: true });
      
      eventHandler(keyEvent);
      
      // Should have called the shortcut handler
      expect(shortcutMock).toHaveBeenCalledWith(keyEvent);
    });
    
    it('should return cleanup function', () => {
      const element = document.getElementById('button1');
      const shortcuts = { 'a': jest.fn() };
      
      // Spy on element's removeEventListener
      const removeEventListenerElementSpy = jest.spyOn(element, 'removeEventListener');
      
      const cleanup = setupKeyboardShortcuts(element, shortcuts);
      
      // Call cleanup
      cleanup();
      
      // Should have removed event listener
      expect(removeEventListenerElementSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
  
  describe('addKeyboardShortcutIndicators', () => {
    it('should add visual indicators to matching elements', () => {
      const container = document.body.firstChild;
      const shortcutMap = {
        '#button1': 'Alt+B',
        '#input1': 'Ctrl+I'
      };
      
      addKeyboardShortcutIndicators(container, shortcutMap);
      
      // Check button1 has the indicator
      const button1 = document.getElementById('button1');
      expect(button1.querySelector('.keyboard-shortcut-indicator')).not.toBeNull();
      expect(button1.querySelector('.keyboard-shortcut-indicator').textContent).toBe('Alt+B');
      
      // Check input1 has the indicator
      const input1 = document.getElementById('input1');
      expect(input1.querySelector('.keyboard-shortcut-indicator')).not.toBeNull();
      expect(input1.querySelector('.keyboard-shortcut-indicator').textContent).toBe('Ctrl+I');
      
      // Check aria-keyshortcuts attribute
      expect(button1.getAttribute('aria-keyshortcuts')).toBe('Alt+B');
      expect(input1.getAttribute('aria-keyshortcuts')).toBe('Ctrl+I');
    });
    
    it('should handle missing elements gracefully', () => {
      const container = document.body.firstChild;
      const shortcutMap = {
        '#nonexistent': 'Alt+X'
      };
      
      // This should not throw an error
      addKeyboardShortcutIndicators(container, shortcutMap);
      
      // No indicators should have been added
      expect(document.querySelector('.keyboard-shortcut-indicator')).toBeNull();
    });
    
    it('should handle null container gracefully', () => {
      const shortcutMap = {
        '#button1': 'Alt+B'
      };
      
      // This should not throw an error
      addKeyboardShortcutIndicators(null, shortcutMap);
      
      // No indicators should have been added
      expect(document.querySelector('.keyboard-shortcut-indicator')).toBeNull();
    });
    
    it('should set aria-hidden on indicators for screen readers', () => {
      const container = document.body.firstChild;
      const shortcutMap = {
        '#button1': 'Alt+B'
      };
      
      addKeyboardShortcutIndicators(container, shortcutMap);
      
      // Check aria-hidden attribute
      const indicator = document.querySelector('.keyboard-shortcut-indicator');
      expect(indicator.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
