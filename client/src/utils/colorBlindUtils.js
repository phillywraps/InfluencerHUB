/**
 * Color Blind Utilities
 * 
 * This utility provides transformation matrices and functions to simulate
 * different types of color blindness. These transformations can be applied
 * to colors throughout the application to improve accessibility.
 */

// Color vision deficiency transformation matrices
// Based on research by Machado, Oliveira, & Fernandes (2009)
export const TRANSFORMATION_MATRICES = {
  // Normal vision (identity matrix)
  normal: [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0
  ],
  
  // Protanopia (red-blind)
  protanopia: [
    0.567, 0.433, 0, 0, 0,
    0.558, 0.442, 0, 0, 0,
    0, 0.242, 0.758, 0, 0,
    0, 0, 0, 1, 0
  ],
  
  // Deuteranopia (green-blind)
  deuteranopia: [
    0.625, 0.375, 0, 0, 0,
    0.7, 0.3, 0, 0, 0,
    0, 0.3, 0.7, 0, 0,
    0, 0, 0, 1, 0
  ],
  
  // Tritanopia (blue-blind)
  tritanopia: [
    0.95, 0.05, 0, 0, 0,
    0, 0.433, 0.567, 0, 0,
    0, 0.475, 0.525, 0, 0,
    0, 0, 0, 1, 0
  ],
  
  // Achromatopsia (monochromacy)
  achromatopsia: [
    0.299, 0.587, 0.114, 0, 0,
    0.299, 0.587, 0.114, 0, 0,
    0.299, 0.587, 0.114, 0, 0,
    0, 0, 0, 1, 0
  ]
};

/**
 * Convert a hex color code to RGB object
 * @param {string} hex - Hex color code (e.g., "#ff0000")
 * @returns {Object} RGB values {r, g, b}
 */
export const hexToRgb = (hex) => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
};

/**
 * Convert RGB values to hex color code
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {string} Hex color code
 */
export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Apply color blind transformation to a color
 * @param {string} color - Hex color code
 * @param {string} type - Type of color blindness (key from TRANSFORMATION_MATRICES)
 * @returns {string} Transformed hex color
 */
export const transformColor = (color, type = 'normal') => {
  if (!color || !color.startsWith('#')) {
    return color; // Return unchanged if not a valid hex color
  }
  
  // Get transformation matrix
  const matrix = TRANSFORMATION_MATRICES[type] || TRANSFORMATION_MATRICES.normal;
  
  // Convert to RGB
  const { r, g, b } = hexToRgb(color);
  
  // Apply transformation
  const newR = Math.round(r * matrix[0] + g * matrix[1] + b * matrix[2]);
  const newG = Math.round(r * matrix[5] + g * matrix[6] + b * matrix[7]);
  const newB = Math.round(r * matrix[10] + g * matrix[11] + b * matrix[12]);
  
  // Convert back to hex and return
  return rgbToHex(
    Math.min(255, Math.max(0, newR)),
    Math.min(255, Math.max(0, newG)),
    Math.min(255, Math.max(0, newB))
  );
};

/**
 * Apply color blind transformation to a theme object
 * @param {Object} theme - Theme object with color properties
 * @param {string} type - Type of color blindness
 * @returns {Object} Transformed theme object
 */
export const transformTheme = (theme, type = 'normal') => {
  // If normal vision, return original theme
  if (type === 'normal') return { ...theme };
  
  // Initialize transformed theme
  const newTheme = { ...theme };
  
  // Transform palette colors (assumed theme structure is like Material-UI)
  if (newTheme.palette) {
    const palette = newTheme.palette;
    
    // Transform primary colors
    if (palette.primary) {
      palette.primary = {
        ...palette.primary,
        main: transformColor(palette.primary.main, type),
        light: transformColor(palette.primary.light, type),
        dark: transformColor(palette.primary.dark, type),
      };
    }
    
    // Transform secondary colors
    if (palette.secondary) {
      palette.secondary = {
        ...palette.secondary,
        main: transformColor(palette.secondary.main, type),
        light: transformColor(palette.secondary.light, type),
        dark: transformColor(palette.secondary.dark, type),
      };
    }
    
    // Transform error colors
    if (palette.error) {
      palette.error = {
        ...palette.error,
        main: transformColor(palette.error.main, type),
        light: transformColor(palette.error.light, type),
        dark: transformColor(palette.error.dark, type),
      };
    }
    
    // Transform warning colors
    if (palette.warning) {
      palette.warning = {
        ...palette.warning,
        main: transformColor(palette.warning.main, type),
        light: transformColor(palette.warning.light, type),
        dark: transformColor(palette.warning.dark, type),
      };
    }
    
    // Transform info colors
    if (palette.info) {
      palette.info = {
        ...palette.info,
        main: transformColor(palette.info.main, type),
        light: transformColor(palette.info.light, type),
        dark: transformColor(palette.info.dark, type),
      };
    }
    
    // Transform success colors
    if (palette.success) {
      palette.success = {
        ...palette.success,
        main: transformColor(palette.success.main, type),
        light: transformColor(palette.success.light, type),
        dark: transformColor(palette.success.dark, type),
      };
    }
  }
  
  return newTheme;
};

/**
 * Get an enhanced contrast ratio by adjusting brightness
 * @param {string} foreground - Foreground color hex
 * @param {string} background - Background color hex
 * @param {number} targetRatio - Target contrast ratio (typically 4.5 for WCAG AA)
 * @returns {string} Adjusted foreground color hex
 */
export const enhanceContrast = (foreground, background, targetRatio = 4.5) => {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  // Calculate relative luminance (per WCAG 2.0)
  const getLuminance = (r, g, b) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Calculate contrast ratio
  const ratio = fgLum > bgLum 
    ? (fgLum + 0.05) / (bgLum + 0.05)
    : (bgLum + 0.05) / (fgLum + 0.05);
  
  // If contrast ratio is already sufficient, return original color
  if (ratio >= targetRatio) {
    return foreground;
  }
  
  // Adjust foreground color to achieve target contrast
  // This is a simplified approach - more sophisticated algorithms exist
  const adjustBrightness = (color, factor) => {
    return {
      r: Math.min(255, Math.max(0, Math.round(color.r * factor))),
      g: Math.min(255, Math.max(0, Math.round(color.g * factor))),
      b: Math.min(255, Math.max(0, Math.round(color.b * factor)))
    };
  };
  
  // Determine if we need to lighten or darken
  const needToDarken = fgLum > bgLum;
  
  // Iteratively adjust brightness until we reach target contrast
  let adjustedFg = { ...fgRgb };
  let currentRatio = ratio;
  let factor = needToDarken ? 0.9 : 1.1;  // Start with 10% adjustment
  
  for (let i = 0; i < 10; i++) {  // Limit iterations to prevent infinite loop
    adjustedFg = adjustBrightness(adjustedFg, factor);
    const newLum = getLuminance(adjustedFg.r, adjustedFg.g, adjustedFg.b);
    currentRatio = newLum > bgLum
      ? (newLum + 0.05) / (bgLum + 0.05)
      : (bgLum + 0.05) / (newLum + 0.05);
    
    if (currentRatio >= targetRatio) {
      break;
    }
    
    // Adjust the factor based on how close we are
    factor = needToDarken ? Math.min(factor * 0.9, 0.1) : Math.max(factor * 1.1, 10);
  }
  
  return rgbToHex(adjustedFg.r, adjustedFg.g, adjustedFg.b);
};

// Export individual blindness simulation functions for convenience
export const simulateProtanopia = (color) => transformColor(color, 'protanopia');
export const simulateDeuteranopia = (color) => transformColor(color, 'deuteranopia');
export const simulateTritanopia = (color) => transformColor(color, 'tritanopia');
export const simulateAchromatopsia = (color) => transformColor(color, 'achromatopsia');
