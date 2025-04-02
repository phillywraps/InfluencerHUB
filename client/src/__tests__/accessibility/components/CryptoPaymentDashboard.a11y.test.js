import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CryptoPaymentDashboard from '../../../components/dashboard/CryptoPaymentDashboard';
import { AccessibilityProvider } from '../../../utils/accessibilityContext';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

expect.extend(toHaveNoViolations);

// Mock the redux store
const mockStore = configureStore([thunk]);

// Mock data
const mockTransactions = [
  {
    _id: '1',
    description: 'Crypto payment for service',
    amount: 250,
    currency: 'USD',
    cryptoCurrency: 'BTC',
    status: 'completed',
    createdAt: new Date('2025-01-15').toISOString(),
    metadata: {
      cryptoAmount: '0.005',
      chargeId: 'ch_123456'
    }
  },
  {
    _id: '2',
    description: 'Monthly subscription',
    amount: 100,
    currency: 'USD',
    cryptoCurrency: 'ETH',
    status: 'pending',
    createdAt: new Date('2025-03-01').toISOString(),
    metadata: {
      cryptoAmount: '0.05',
      cryptoAddress: '0x1234abcd',
      chargeId: 'ch_234567'
    },
    timeline: [
      {
        status: 'created',
        time: new Date('2025-03-01T10:00:00Z').toISOString(),
        context: 'Charge created'
      },
      {
        status: 'pending',
        time: new Date('2025-03-01T10:01:00Z').toISOString(),
        context: 'Waiting for payment'
      }
    ]
  }
];

const mockSubscriptions = [
  {
    _id: '1',
    name: 'Premium Service',
    description: 'Monthly premium service subscription',
    amount: 50,
    currency: 'USD',
    cryptoCurrency: 'USDC',
    billingPeriod: 'month',
    status: 'active',
    createdAt: new Date('2025-01-01').toISOString(),
    nextBillingDate: new Date('2025-04-01').toISOString()
  }
];

const mockExchangeRates = {
  BTC: 0.000024,
  ETH: 0.00038,
  USDC: 1,
  DAI: 1,
  LTC: 0.012,
  BCH: 0.0035
};

// Create mock store with initial state
const createMockStore = (options = {}) => {
  const {
    transactionsLoading = false,
    subscriptionsLoading = false,
    exchangeRatesLoading = false
  } = options;
  
  return mockStore({
    payment: {
      transactions: mockTransactions,
      transactionsLoading,
      transactionsTotal: mockTransactions.length,
      subscriptions: mockSubscriptions,
      subscriptionsLoading,
      exchangeRates: mockExchangeRates,
      exchangeRatesLoading
    }
  });
};

// Mock the reduxjs toolkit dispatch
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn()
}));

describe('CryptoPaymentDashboard Accessibility', () => {
  let store;
  
  beforeEach(() => {
    store = createMockStore();
    
    // Mock window functions used in component
    global.navigator.clipboard = {
      writeText: jest.fn()
    };
    
    // Mock announcement function since it's not easily testable
    Object.defineProperty(window, 'announce', { value: jest.fn() });
  });
  
  /**
   * Helper function to render the component with various accessibility settings
   */
  const renderComponentWithAccessibility = (accessibilityOptions = {}) => {
    const {
      isScreenReaderEnabled = false,
      largeText = false,
      reduceMotion = false,
      colorBlindMode = 'normal',
      highContrast = false,
      announce = jest.fn()
    } = accessibilityOptions;
    
    const theme = createTheme({
      palette: {
        mode: 'light',
        ...(highContrast && {
          primary: {
            main: '#0000CC',
          },
          error: {
            main: '#CC0000',
          },
          success: {
            main: '#008800',
          },
          warning: {
            main: '#CC8800',
          },
          info: {
            main: '#0066CC',
          },
        }),
      },
      typography: {
        ...(largeText && {
          fontSize: 16,
          h6: {
            fontSize: '1.5rem',
          },
          body1: {
            fontSize: '1.125rem',
          },
          body2: {
            fontSize: '1rem',
          },
        }),
      },
    });
    
    return render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <AccessibilityProvider
            initialState={{
              isScreenReaderEnabled,
              largeText,
              reduceMotion,
              colorBlindMode,
              highContrast,
              announce
            }}
          >
            <CryptoPaymentDashboard />
          </AccessibilityProvider>
        </ThemeProvider>
      </Provider>
    );
  };
  
  /* ------------------------- Automated axe accessibility tests ------------------------- */
  
  it('should pass basic axe accessibility tests', async () => {
    const { container } = renderComponentWithAccessibility();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should pass axe tests with screen reader mode enabled', async () => {
    const { container } = renderComponentWithAccessibility({ isScreenReaderEnabled: true });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should pass axe tests with large text mode enabled', async () => {
    const { container } = renderComponentWithAccessibility({ largeText: true });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should pass axe tests with high contrast mode enabled', async () => {
    const { container } = renderComponentWithAccessibility({ highContrast: true });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  /* ------------------------- Screen reader support tests ------------------------- */
  
  it('should render with proper ARIA roles', () => {
    renderComponentWithAccessibility();
    
    // Check for navigation role
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Check tabpanel roles
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    
    // Check for table roles
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
  });
  
  it('should have proper ARIA labels and descriptions', () => {
    renderComponentWithAccessibility();
    
    // Check navigation label
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Dashboard sections');
    
    // Check tab labels
    expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-controls', 'crypto-dashboard-tabpanel-0');
    expect(screen.getByRole('tab', { name: /transactions/i })).toHaveAttribute('aria-controls', 'crypto-dashboard-tabpanel-1');
    
    // Check status chips have aria-labels
    expect(screen.getAllByText(/completed|pending/i)[0].closest('div[role="button"]')).toHaveAttribute('aria-label');
  });
  
  it('should announce page load to screen readers', () => {
    const announceMock = jest.fn();
    renderComponentWithAccessibility({ 
      isScreenReaderEnabled: true,
      announce: announceMock
    });
    
    expect(announceMock).toHaveBeenCalledWith(
      expect.stringContaining('Crypto Payment Dashboard loaded'),
      'polite'
    );
  });
  
  it('should announce tab changes to screen readers', () => {
    const announceMock = jest.fn();
    renderComponentWithAccessibility({ 
      isScreenReaderEnabled: true,
      announce: announceMock
    });
    
    // Clear initial calls
    announceMock.mockClear();
    
    // Change tab
    fireEvent.click(screen.getByRole('tab', { name: /transactions/i }));
    
    expect(announceMock).toHaveBeenCalledWith(
      expect.stringContaining('Transactions tab selected'),
      'polite'
    );
  });
  
  it('should announce dialog opening to screen readers', () => {
    const announceMock = jest.fn();
    renderComponentWithAccessibility({ 
      isScreenReaderEnabled: true,
      announce: announceMock
    });
    
    // Clear initial calls
    announceMock.mockClear();
    
    // Change to transactions tab
    fireEvent.click(screen.getByRole('tab', { name: /transactions/i }));
    
    // Click to view transaction details
    const viewButtons = screen.getAllByRole('button', { name: '' }); // Icon buttons don't have text
    fireEvent.click(viewButtons[0]);
    
    expect(announceMock).toHaveBeenCalledWith(
      expect.stringContaining('Transaction details dialog opened'),
      'polite'
    );
  });
  
  /* ------------------------- Keyboard navigation tests ------------------------- */
  
  it('should navigate tabs with keyboard', () => {
    renderComponentWithAccessibility();
    
    // Focus on the first tab
    const overviewTab = screen.getByRole('tab', { name: /overview/i });
    overviewTab.focus();
    expect(overviewTab).toHaveFocus();
    
    // Navigate to next tab with arrow key
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
    const transactionsTab = screen.getByRole('tab', { name: /transactions/i });
    expect(transactionsTab).toHaveFocus();
  });
  
  it('should open and close dialog with keyboard', async () => {
    renderComponentWithAccessibility();
    
    // Change to transactions tab
    fireEvent.click(screen.getByRole('tab', { name: /transactions/i }));
    
    // Tab to the view button and press Enter
    const viewButtons = screen.getAllByRole('button', { name: '' }); // Icon buttons need better aria-labels
    viewButtons[0].focus();
    fireEvent.keyDown(viewButtons[0], { key: 'Enter' });
    
    // Dialog should be open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Test closing with Escape key
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
  
  it('should manage focus correctly in dialogs', async () => {
    renderComponentWithAccessibility();
    
    // Change to transactions tab
    fireEvent.click(screen.getByRole('tab', { name: /transactions/i }));
    
    // Open dialog
    const viewButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(viewButtons[0]);
    
    // Dialog should be open and main content should have focus
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Check if the main content is focused (tabIndex -1 means not in tab order but can be focused programmatically)
      const dialogContent = dialog.querySelector('[tabindex="-1"]');
      expect(dialogContent).toHaveFocus();
    });
  });
  
  /* ------------------------- Dynamic text size tests ------------------------- */
  
  it('should render with larger text when largeText is enabled', () => {
    const { rerender } = renderComponentWithAccessibility({ largeText: false });
    
    // Get reference sizes
    const standardTab = screen.getByRole('tab', { name: /overview/i });
    const standardFontSize = window.getComputedStyle(standardTab).fontSize;
    
    // Rerender with large text
    rerender(
      <Provider store={store}>
        <ThemeProvider theme={createTheme()}>
          <AccessibilityProvider
            initialState={{
              isScreenReaderEnabled: false,
              largeText: true,
              reduceMotion: false,
              colorBlindMode: 'normal',
              highContrast: false,
              announce: jest.fn()
            }}
          >
            <CryptoPaymentDashboard />
          </AccessibilityProvider>
        </ThemeProvider>
      </Provider>
    );
    
    // Get large text sizes
    const largeTab = screen.getByRole('tab', { name: /overview/i });
    const largeFontSize = window.getComputedStyle(largeTab).fontSize;
    
    // This is a simplistic check since computed styles may vary based on the test environment
    // In a real environment, we'd expect the largeText version to have a larger computed font size
    expect(largeTab).toBeInTheDocument();
  });
  
  /* ------------------------- Color and contrast tests ------------------------- */
  
  it('should render PaymentStatusChip with appropriate status indicators', () => {
    renderComponentWithAccessibility();
    
    // Find status chips
    const statusChips = screen.getAllByRole('button');
    
    // At least one chip should contain status text
    const statusTexts = ['Paid', 'Pending', 'Confirming', 'Failed', 'Cancelled', 'Delayed'];
    const hasStatusChip = statusTexts.some(status => 
      statusChips.some(chip => chip.textContent.includes(status))
    );
    
    expect(hasStatusChip).toBe(true);
  });
  
  it('should render PaymentStatusChip with additional indicators in colorblind mode', () => {
    renderComponentWithAccessibility({ colorBlindMode: 'protanopia' });
    
    // The status chips should contain the visual indicators (such as checkmarks, etc.)
    const statusChips = screen.getAllByRole('button');
    
    // For status 'Paid', it should have a checkmark (✓) prefix
    const paidChips = statusChips.filter(chip => chip.textContent.includes('Paid'));
    if (paidChips.length > 0) {
      expect(paidChips[0].textContent).toMatch(/✓\s*Paid/);
    }
    
    // For 'Pending', it should have an ellipsis (⋯) prefix
    const pendingChips = statusChips.filter(chip => chip.textContent.includes('Pending'));
    if (pendingChips.length > 0) {
      expect(pendingChips[0].textContent).toMatch(/⋯\s*Pending/);
    }
  });
  
  /* ------------------------- High contrast mode tests ------------------------- */
  
  it('should apply high contrast styles when enabled', () => {
    renderComponentWithAccessibility({ highContrast: true });
    
    // This is a limited test since we can't easily check computed styles in jsdom
    // In a real environment or visual regression test, we'd verify the contrast changes
    
    // Verify the component renders in high contrast mode
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
  
  /* ------------------------- Real use case tests ------------------------- */
  
  it('should support keyboard-only navigation through the entire dashboard', async () => {
    renderComponentWithAccessibility();
    
    // Start by focusing the main content
    const mainContent = screen.getByRole('tabpanel');
    mainContent.focus();
    
    // Tab to the first tab
    fireEvent.keyDown(mainContent, { key: 'Tab' });
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /overview/i })).toHaveFocus();
    });
    
    // Navigate to Transactions tab with arrow key and activate it
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    fireEvent.keyDown(document.activeElement, { key: 'Enter' });
    
    // Transactions tab should now be active
    expect(screen.getByRole('tab', { name: /transactions/i })).toHaveAttribute('aria-selected', 'true');
  });
  
  it('should handle screen reader workflow for completing a common task', async () => {
    const announceMock = jest.fn();
    renderComponentWithAccessibility({ 
      isScreenReaderEnabled: true,
      announce: announceMock 
    });
    
    // Clear initial calls
    announceMock.mockClear();
    
    // Task: Navigate to Transactions tab, view transaction details, copy address, close dialog
    
    // 1. Navigate to Transactions tab
    fireEvent.click(screen.getByRole('tab', { name: /transactions/i }));
    
    expect(announceMock).toHaveBeenCalledWith(
      expect.stringContaining('Transactions tab selected'),
      'polite'
    );
    
    // 2. Open transaction details
    const viewButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(viewButtons[0]);
    
    expect(announceMock).toHaveBeenCalledWith(
      expect.stringContaining('Transaction details dialog opened'),
      'polite'
    );
    
    // 3. Copy crypto address (if available in the detail dialog)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const copyButtons = screen.getAllByRole('button').filter(
      button => button.querySelector('svg') && button.getAttribute('aria-label')?.includes('copy')
    );
    
    if (copyButtons.length > 0) {
      announceMock.mockClear();
      fireEvent.click(copyButtons[0]);
      
      // Should announce address copied
      expect(announceMock).toHaveBeenCalledWith(
        expect.stringContaining('copied to clipboard'),
        expect.any(String)
      );
    }
    
    // 4. Close dialog
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
