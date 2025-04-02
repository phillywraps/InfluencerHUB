import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';
import ThemeSwitcher from '../../../components/theme/ThemeSwitcher';
import { ThemeContext } from '../../../theme/ThemeContext';
import { AccessibilityProvider } from '../../../utils/accessibilityContext';

// Add jest-axe custom matchers
expect.extend(toHaveNoViolations);

// Create a theme for testing
const theme = createTheme();

// Mock the focus trap utility
const mockInitialize = jest.fn();
const mockCleanup = jest.fn();

jest.mock('../../../utils/focusTrapUtils', () => {
  return {
    useFocusTrap: () => ({
      initialize: mockInitialize,
      cleanup: mockCleanup
    })
  };
});

// Mock the announce function for screen readers
const mockAnnounce = jest.fn();
jest.mock('../../../utils/accessibilityContext', () => {
  const actual = jest.requireActual('../../../utils/accessibilityContext');
  return {
    ...actual,
    useAccessibility: () => ({
      isScreenReaderEnabled: true,
      announce: mockAnnounce,
      reduceMotionEnabled: false,
      largeTextEnabled: false,
      highContrastEnabled: false
    })
  };
});

// Create a wrapper component with all required providers and mocks
const renderWithProviders = (ui, { themeMode = 'light' } = {}) => {
  const setMode = jest.fn();
  
  return {
    setMode,
    ...render(
      <ThemeContext.Provider value={{ mode: themeMode, setMode }}>
        <ThemeProvider theme={theme}>
          <AccessibilityProvider>
            {ui}
          </AccessibilityProvider>
        </ThemeProvider>
      </ThemeContext.Provider>
    )
  };
};

describe('ThemeSwitcher Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not have any axe accessibility violations for icon variant', async () => {
    const { container } = renderWithProviders(
      <ThemeSwitcher variant="icon" />
    );
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should not have any axe accessibility violations for toggle variant', async () => {
    const { container } = renderWithProviders(
      <ThemeSwitcher variant="toggle" />
    );
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should not have any axe accessibility violations for menu variant', async () => {
    const { container } = renderWithProviders(
      <ThemeSwitcher variant="menu" />
    );
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Focus Trap Implementation', () => {
    it('should have proper ARIA attributes on the theme menu button', () => {
      renderWithProviders(
        <ThemeSwitcher variant="menu" />
      );
      
      // Find the theme menu button
      const menuButton = screen.getByLabelText('theme settings');
      
      // Check ARIA attributes
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).not.toHaveAttribute('aria-controls'); // Should not have this before menu is open
    });
    
    it('should update ARIA attributes when menu is opened', async () => {
      renderWithProviders(
        <ThemeSwitcher variant="menu" />
      );
      
      // Find the theme menu button
      const menuButton = screen.getByLabelText('theme settings');
      
      // Open the menu
      fireEvent.click(menuButton);
      
      // Check updated ARIA attributes
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(menuButton).toHaveAttribute('aria-controls', 'theme-menu');
    });
    
    it('should initialize focus trap when menu is opened', async () => {
      renderWithProviders(
        <ThemeSwitcher variant="menu" />
      );
      
      // Find the theme menu button
      const menuButton = screen.getByLabelText('theme settings');
      
      // Open the menu
      fireEvent.click(menuButton);
      
      // Verify focus trap was initialized
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
      });
      
      // Check that screen reader announcement was made
      expect(mockAnnounce).toHaveBeenCalledWith('Theme settings menu opened', 'polite');
    });
    
    it('should cleanup focus trap when menu is closed', async () => {
      renderWithProviders(
        <ThemeSwitcher variant="menu" />
      );
      
      // Find the theme menu button
      const menuButton = screen.getByLabelText('theme settings');
      
      // Open the menu
      fireEvent.click(menuButton);
      
      // Close the menu (click outside to trigger onClose)
      fireEvent.click(document.body);
      
      // Verify focus trap was cleaned up
      expect(mockCleanup).toHaveBeenCalled();
      
      // Check that screen reader announcement was made
      expect(mockAnnounce).toHaveBeenCalledWith('Theme settings menu closed', 'polite');
    });
    
    it('should provide proper ARIA attributes for menu items', async () => {
      renderWithProviders(
        <ThemeSwitcher variant="menu" />,
        { themeMode: 'dark' }
      );
      
      // Open the menu
      const menuButton = screen.getByLabelText('theme settings');
      fireEvent.click(menuButton);
      
      // Check menu items have proper ARIA attributes
      const lightModeMenuItem = screen.getByRole('menuitem', { name: /Light mode/i });
      const darkModeMenuItem = screen.getByRole('menuitem', { name: /Dark mode/i });
      const systemMenuItem = screen.getByRole('menuitem', { name: /System default/i });
      
      // Check that current mode is correctly indicated
      expect(lightModeMenuItem).toHaveAttribute('aria-checked', 'false');
      expect(darkModeMenuItem).toHaveAttribute('aria-checked', 'true');
      expect(systemMenuItem).toHaveAttribute('aria-checked', 'false');
    });
  });
  
  describe('Toggle Variant Accessibility', () => {
    it('should have proper ARIA attributes on the toggle button', () => {
      renderWithProviders(
        <ThemeSwitcher variant="toggle" />
      );
      
      // Find and test the switch component
      const toggleSwitch = screen.getByRole('checkbox');
      expect(toggleSwitch).toBeInTheDocument();
    });
    
    it('should provide accessible text for screen readers', () => {
      renderWithProviders(
        <ThemeSwitcher variant="toggle" showLabel={true} />
      );
      
      // Find and test the mode labels are visible
      const modeText = screen.getByText(/Light Mode|Dark Mode/);
      expect(modeText).toBeInTheDocument();
    });
  });
  
  describe('Icon Variant Accessibility', () => {
    it('should have proper ARIA attributes on the icon button', () => {
      renderWithProviders(
        <ThemeSwitcher />
      );
      
      // Test for the default icon variant
      const iconButton = screen.getByRole('button');
      
      // In light mode, the button should be for toggling to dark mode
      expect(iconButton).toHaveAttribute('aria-label', 'Toggle dark mode');
      expect(iconButton).toHaveAttribute('aria-pressed', 'false');
    });
    
    it('should update ARIA attributes when in dark mode', () => {
      renderWithProviders(
        <ThemeSwitcher />,
        { themeMode: 'dark' }
      );
      
      // Test for the default icon variant in dark mode
      const iconButton = screen.getByRole('button');
      
      // In dark mode, the button should be for toggling to light mode
      expect(iconButton).toHaveAttribute('aria-label', 'Toggle light mode');
      expect(iconButton).toHaveAttribute('aria-pressed', 'true');
    });
    
    it('should toggle theme when clicked', () => {
      const { setMode } = renderWithProviders(
        <ThemeSwitcher />
      );
      
      // Click the theme toggle button
      const iconButton = screen.getByRole('button');
      fireEvent.click(iconButton);
      
      // Check that setMode was called with the opposite mode
      expect(setMode).toHaveBeenCalledWith('dark');
    });
  });
});
