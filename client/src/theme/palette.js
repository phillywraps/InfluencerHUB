/**
 * Color palette for the Influencer API Key Marketplace
 * 
 * This file defines the color schemes for both light and dark modes,
 * ensuring consistent color usage throughout the application.
 */

// Primary brand colors
const primaryMain = '#3f51b5'; // Indigo
const primaryLight = '#757de8';
const primaryDark = '#002984';

// Secondary brand colors
const secondaryMain = '#f50057'; // Pink
const secondaryLight = '#ff5983';
const secondaryDark = '#bb002f';

// Success colors
const successMain = '#4caf50'; // Green
const successLight = '#80e27e';
const successDark = '#087f23';

// Info colors
const infoMain = '#2196f3'; // Blue
const infoLight = '#6ec6ff';
const infoDark = '#0069c0';

// Warning colors
const warningMain = '#ff9800'; // Orange
const warningLight = '#ffc947';
const warningDark = '#c66900';

// Error colors
const errorMain = '#f44336'; // Red
const errorLight = '#ff7961';
const errorDark = '#ba000d';

// Neutral colors for light mode
const lightNeutral = {
  main: '#f5f5f5',
  contrastText: '#212121',
  paper: '#ffffff',
  divider: 'rgba(0, 0, 0, 0.12)',
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  action: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
  },
};

// Neutral colors for dark mode
const darkNeutral = {
  main: '#212121',
  contrastText: '#ffffff',
  paper: '#121212',
  divider: 'rgba(255, 255, 255, 0.12)',
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  action: {
    active: '#ffffff',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
  },
};

// Light theme palette
const light = {
  mode: 'light',
  primary: {
    main: primaryMain,
    light: primaryLight,
    dark: primaryDark,
    contrastText: '#ffffff',
  },
  secondary: {
    main: secondaryMain,
    light: secondaryLight,
    dark: secondaryDark,
    contrastText: '#ffffff',
  },
  success: {
    main: successMain,
    light: successLight,
    dark: successDark,
    contrastText: '#ffffff',
  },
  info: {
    main: infoMain,
    light: infoLight,
    dark: infoDark,
    contrastText: '#ffffff',
  },
  warning: {
    main: warningMain,
    light: warningLight,
    dark: warningDark,
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  error: {
    main: errorMain,
    light: errorLight,
    dark: errorDark,
    contrastText: '#ffffff',
  },
  text: lightNeutral.text,
  background: lightNeutral.background,
  action: lightNeutral.action,
  divider: lightNeutral.divider,
};

// Dark theme palette
const dark = {
  mode: 'dark',
  primary: {
    main: primaryLight,
    light: primaryMain,
    dark: primaryDark,
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  secondary: {
    main: secondaryLight,
    light: secondaryMain,
    dark: secondaryDark,
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  success: {
    main: successLight,
    light: successMain,
    dark: successDark,
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  info: {
    main: infoLight,
    light: infoMain,
    dark: infoDark,
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  warning: {
    main: warningLight,
    light: warningMain,
    dark: warningDark,
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  error: {
    main: errorLight,
    light: errorMain,
    dark: errorDark,
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  text: darkNeutral.text,
  background: darkNeutral.background,
  action: darkNeutral.action,
  divider: darkNeutral.divider,
};

// Brand color palette
const brandColors = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  tiktok: '#000000',
  linkedin: '#0077B5',
  pinterest: '#E60023',
  snapchat: '#FFFC00',
};

export default {
  light,
  dark,
  brandColors,
};
