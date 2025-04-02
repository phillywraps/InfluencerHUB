/**
 * Typography configuration for the Influencer API Key Marketplace
 * 
 * This file defines consistent typography styles across the application,
 * including font families, sizes, weights, and line heights.
 */

// Font families
const fontFamily = [
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
].join(',');

// Header font (can be the same as body font or different)
const headerFontFamily = [
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',');

// Monospace font for code blocks, API keys, etc.
const monospaceFontFamily = [
  'Roboto Mono',
  'Consolas',
  'Monaco',
  '"Andale Mono"',
  'monospace',
].join(',');

// Base typography settings
const typography = {
  fontFamily,
  htmlFontSize: 16,
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  
  // Main headers
  h1: {
    fontFamily: headerFontFamily,
    fontWeight: 300,
    fontSize: '2.5rem', // 40px
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
    marginBottom: '0.5em',
  },
  h2: {
    fontFamily: headerFontFamily,
    fontWeight: 300,
    fontSize: '2rem', // 32px
    lineHeight: 1.2,
    letterSpacing: '-0.00833em',
    marginBottom: '0.5em',
  },
  h3: {
    fontFamily: headerFontFamily,
    fontWeight: 400,
    fontSize: '1.75rem', // 28px
    lineHeight: 1.2,
    letterSpacing: '0em',
    marginBottom: '0.5em',
  },
  h4: {
    fontFamily: headerFontFamily,
    fontWeight: 400,
    fontSize: '1.5rem', // 24px
    lineHeight: 1.2,
    letterSpacing: '0.00735em',
    marginBottom: '0.5em',
  },
  h5: {
    fontFamily: headerFontFamily,
    fontWeight: 400,
    fontSize: '1.25rem', // 20px
    lineHeight: 1.2,
    letterSpacing: '0em',
    marginBottom: '0.5em',
  },
  h6: {
    fontFamily: headerFontFamily,
    fontWeight: 500,
    fontSize: '1.125rem', // 18px
    lineHeight: 1.2,
    letterSpacing: '0.0075em',
    marginBottom: '0.5em',
  },
  
  // Body text
  subtitle1: {
    fontFamily,
    fontWeight: 400,
    fontSize: '1rem', // 16px
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontFamily,
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  body1: {
    fontFamily,
    fontWeight: 400,
    fontSize: '1rem', // 16px
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontFamily,
    fontWeight: 400,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  
  // Other styles
  button: {
    fontFamily,
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily,
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontFamily,
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase',
  },
  
  // Monospace (for code, API keys, etc.)
  monospace: {
    fontFamily: monospaceFontFamily,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: '2px 4px',
    borderRadius: '2px',
  },
};

// Responsive typography adjustments
const responsiveTypography = (theme) => ({
  ...typography,
  
  // Adjust heading sizes on small screens
  [theme.breakpoints.down('md')]: {
    h1: {
      ...typography.h1,
      fontSize: '2rem', // 32px on smaller screens
    },
    h2: {
      ...typography.h2,
      fontSize: '1.75rem', // 28px on smaller screens
    },
    h3: {
      ...typography.h3,
      fontSize: '1.5rem', // 24px on smaller screens
    },
    h4: {
      ...typography.h4,
      fontSize: '1.25rem', // 20px on smaller screens
    },
    h5: {
      ...typography.h5,
      fontSize: '1.1rem', // 17.6px on smaller screens
    },
    h6: {
      ...typography.h6,
      fontSize: '1rem', // 16px on smaller screens
    },
  },
});

export { typography as default, responsiveTypography };
