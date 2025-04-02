/**
 * Tests for Color Blind Utilities
 * 
 * These tests verify that the color blind utility functions work correctly
 * for transforming colors to simulate different types of color blindness
 * and for enhancing contrast for accessibility.
 */

import {
  hexToRgb,
  rgbToHex,
  transformColor,
  transformTheme,
  enhanceContrast,
  simulateProtanopia,
  simulateDeuteranopia,
  simulateTritanopia,
  simulateAchromatopsia,
  TRANSFORMATION_MATRICES
} from '../../../utils/colorBlindUtils';

describe('Color Blind Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert hex colors to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });
    
    it('should work with or without # prefix', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });
  });
  
  describe('rgbToHex', () => {
    it('should convert RGB values to hex color codes', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });
    
    it('should handle intermediate values correctly', () => {
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
      expect(rgbToHex(15, 51, 85)).toBe('#0f3355');
    });
  });
  
  describe('transformColor', () => {
    it('should return the same color when using normal vision', () => {
      expect(transformColor('#ff0000', 'normal')).toBe('#ff0000');
      expect(transformColor('#00ff00', 'normal')).toBe('#00ff00');
      expect(transformColor('#0000ff', 'normal')).toBe('#0000ff');
    });
    
    it('should transform red colors for protanopia', () => {
      const red = '#ff0000';
      const transformedRed = transformColor(red, 'protanopia');
      // In protanopia, pure red looks more brownish/yellow
      expect(transformedRed).not.toBe(red);
      
      // Convert to RGB to check approximate values
      const { r, g, b } = hexToRgb(transformedRed);
      
      // Red should be reduced and green should be present
      expect(r).toBeLessThan(255);
      expect(g).toBeGreaterThan(0);
    });
    
    it('should transform green colors for deuteranopia', () => {
      const green = '#00ff00';
      const transformedGreen = transformColor(green, 'deuteranopia');
      // In deuteranopia, pure green looks more yellowish
      expect(transformedGreen).not.toBe(green);
      
      // Convert to RGB to check approximate values
      const { r, g, b } = hexToRgb(transformedGreen);
      
      // Green should be changed and red might be present
      expect(g).not.toBe(255);
      expect(r).toBeGreaterThan(0);
    });
    
    it('should make colors grayscale for achromatopsia', () => {
      const colorful = '#ff5500';
      const transformedColor = transformColor(colorful, 'achromatopsia');
      
      // Convert to RGB to check gray values
      const { r, g, b } = hexToRgb(transformedColor);
      
      // In grayscale, R, G, and B should be roughly equal
      expect(Math.abs(r - g)).toBeLessThan(5);
      expect(Math.abs(g - b)).toBeLessThan(5);
      expect(Math.abs(r - b)).toBeLessThan(5);
    });
    
    it('should handle invalid inputs gracefully', () => {
      // Invalid color
      expect(transformColor('not-a-color', 'protanopia')).toBe('not-a-color');
      
      // Invalid type - should default to normal
      expect(transformColor('#ff0000', 'not-a-type')).toBe('#ff0000');
      
      // Null values
      expect(transformColor(null, 'protanopia')).toBe(null);
    });
  });
  
  describe('enhanceContrast', () => {
    it('should not modify colors that already have sufficient contrast', () => {
      // Black text on white background has a contrast ratio way above 4.5
      expect(enhanceContrast('#000000', '#ffffff')).toBe('#000000');
    });
    
    it('should increase contrast for low-contrast combinations', () => {
      // Light gray on white has poor contrast
      const originalColor = '#bbbbbb';
      const enhancedColor = enhanceContrast(originalColor, '#ffffff');
      
      // Enhanced color should be darker to improve contrast
      const original = hexToRgb(originalColor);
      const enhanced = hexToRgb(enhancedColor);
      
      // Check that the enhanced color is darker
      expect(enhanced.r + enhanced.g + enhanced.b).toBeLessThan(original.r + original.g + original.b);
    });
    
    it('should lighten colors on dark backgrounds', () => {
      // Dark blue on black has poor contrast
      const originalColor = '#000066';
      const enhancedColor = enhanceContrast(originalColor, '#000000');
      
      // Enhanced color should be lighter to improve contrast
      const original = hexToRgb(originalColor);
      const enhanced = hexToRgb(enhancedColor);
      
      // Check that the enhanced color is lighter
      expect(enhanced.r + enhanced.g + enhanced.b).toBeGreaterThan(original.r + original.g + original.b);
    });
  });
  
  describe('transformTheme', () => {
    const mockTheme = {
      palette: {
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0'
        },
        secondary: {
          main: '#dc004e',
          light: '#ff4081',
          dark: '#9a0036'
        },
        error: {
          main: '#f44336',
          light: '#e57373',
          dark: '#d32f2f'
        }
      }
    };
    
    it('should return the original theme for normal vision', () => {
      const transformedTheme = transformTheme(mockTheme, 'normal');
      expect(transformedTheme).toEqual(mockTheme);
    });
    
    it('should transform all palette colors for protanopia', () => {
      const transformedTheme = transformTheme(mockTheme, 'protanopia');
      
      // Check that colors were transformed
      expect(transformedTheme.palette.primary.main).not.toBe(mockTheme.palette.primary.main);
      expect(transformedTheme.palette.secondary.main).not.toBe(mockTheme.palette.secondary.main);
      expect(transformedTheme.palette.error.main).not.toBe(mockTheme.palette.error.main);
      
      // Verify structure was maintained
      expect(transformedTheme.palette.primary).toHaveProperty('main');
      expect(transformedTheme.palette.primary).toHaveProperty('light');
      expect(transformedTheme.palette.primary).toHaveProperty('dark');
    });
    
    it('should handle themes with missing properties gracefully', () => {
      const incompleteTheme = {
        palette: {
          primary: {
            main: '#1976d2'
            // Missing light and dark
          }
        }
        // Missing secondary and error
      };
      
      // This should not throw an error
      const transformedTheme = transformTheme(incompleteTheme, 'deuteranopia');
      
      // Verify it transformed the available color
      expect(transformedTheme.palette.primary.main).not.toBe(incompleteTheme.palette.primary.main);
    });
  });
  
  describe('Simulator functions', () => {
    const testColor = '#ff0000'; // Pure red
    
    it('should simulate protanopia correctly', () => {
      const result = simulateProtanopia(testColor);
      expect(result).toBe(transformColor(testColor, 'protanopia'));
    });
    
    it('should simulate deuteranopia correctly', () => {
      const result = simulateDeuteranopia(testColor);
      expect(result).toBe(transformColor(testColor, 'deuteranopia'));
    });
    
    it('should simulate tritanopia correctly', () => {
      const result = simulateTritanopia(testColor);
      expect(result).toBe(transformColor(testColor, 'tritanopia'));
    });
    
    it('should simulate achromatopsia correctly', () => {
      const result = simulateAchromatopsia(testColor);
      expect(result).toBe(transformColor(testColor, 'achromatopsia'));
    });
  });
  
  describe('TRANSFORMATION_MATRICES', () => {
    it('should have all required color blind types', () => {
      expect(TRANSFORMATION_MATRICES).toHaveProperty('normal');
      expect(TRANSFORMATION_MATRICES).toHaveProperty('protanopia');
      expect(TRANSFORMATION_MATRICES).toHaveProperty('deuteranopia');
      expect(TRANSFORMATION_MATRICES).toHaveProperty('tritanopia');
      expect(TRANSFORMATION_MATRICES).toHaveProperty('achromatopsia');
    });
    
    it('should have matrices of the correct format', () => {
      // Each matrix should have 20 elements (4x5 matrix)
      Object.values(TRANSFORMATION_MATRICES).forEach(matrix => {
        expect(matrix.length).toBe(20);
      });
    });
    
    it('should have identity matrix for normal vision', () => {
      const normalMatrix = TRANSFORMATION_MATRICES.normal;
      
      // Check identity matrix pattern (1s on main diagonal, 0s elsewhere)
      expect(normalMatrix[0]).toBe(1); // R -> R = 1
      expect(normalMatrix[6]).toBe(1); // G -> G = 1
      expect(normalMatrix[12]).toBe(1); // B -> B = 1
      expect(normalMatrix[18]).toBe(1); // A -> A = 1
      
      // Check some off-diagonal elements
      expect(normalMatrix[1]).toBe(0); // R -> G = 0
      expect(normalMatrix[2]).toBe(0); // R -> B = 0
      expect(normalMatrix[5]).toBe(0); // G -> R = 0
    });
  });
});
