import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';
import RealTimeAnalyticsDashboard from '../../../components/dashboard/RealTimeAnalyticsDashboard';
import { AccessibilityProvider } from '../../../utils/accessibilityContext';

// Add jest-axe custom matchers
expect.extend(toHaveNoViolations);

// Mock the redux store
const mockStore = configureMockStore();
const store = mockStore({
  user: { userType: 'influencer' },
  alerts: { alerts: [] }
});

// Create a theme for testing
const theme = createTheme();

// Mock the websocket service
jest.mock('../../../services/websocketService', () => {
  return {
    useWebSocket: () => ({
      isConnected: true,
      requestData: jest.fn(),
      lastMessage: null
    })
  };
});

// Mock the required components imported by RealTimeAnalyticsDashboard
jest.mock('../../../components/dashboard/AnalyticsDashboard', () => {
  return {
    CustomTooltip: () => <div data-testid="custom-tooltip" />,
    RechartsChart: () => <div data-testid="recharts-chart" />,
    StatCard: ({ title, value }) => (
      <div data-testid="stat-card">
        <div>{title}</div>
        <div>{value}</div>
      </div>
    ),
    DateRangeSelector: ({ onChange }) => (
      <div data-testid="date-range-selector">
        <button onClick={() => onChange('Last 7 Days')}>Select Range</button>
      </div>
    ),
    ExportButton: () => <div data-testid="export-button" />,
    ChartCard: ({ title }) => <div data-testid="chart-card">{title}</div>
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

// Create a wrapper component with all required providers
const renderWithProviders = (ui, initialData = {}) => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <AccessibilityProvider>
          {ui}
        </AccessibilityProvider>
      </ThemeProvider>
    </Provider>
  );
};

describe('RealTimeAnalyticsDashboard Accessibility Tests', () => {
  const initialData = {
    totalAmount: '15000',
    activeRentals: 24,
    avgDuration: 14,
    totalUsers: 150,
    earningsData: [
      { month: 'Jan', amount: 1200 },
      { month: 'Feb', amount: 1500 }
    ],
    platformData: [
      { name: 'Instagram', value: 45 },
      { name: 'TikTok', value: 35 },
      { name: 'YouTube', value: 20 }
    ],
    rentalDurationData: [
      { duration: '1-3 days', count: 12 },
      { duration: '4-7 days', count: 35 },
      { duration: '8-14 days', count: 20 },
      { duration: '15-30 days', count: 8 },
      { duration: '30+ days', count: 4 }
    ],
    insights: [
      {
        type: 'positive',
        title: 'Instagram Growth',
        description: 'Your Instagram audience has grown by 15% this month.'
      },
      {
        type: 'negative',
        title: 'Twitter Engagement',
        description: 'Twitter engagement has decreased by 5% this month.'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not have any axe accessibility violations', async () => {
    const { container } = renderWithProviders(
      <RealTimeAnalyticsDashboard userType="influencer" initialData={initialData} />
    );
    
    // Wait for component to fully render
    await waitFor(() => {
      expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
    });
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Notification Menu Accessibility', () => {
    it('should have proper ARIA attributes on the notification button', async () => {
      renderWithProviders(
        <RealTimeAnalyticsDashboard userType="influencer" initialData={initialData} />
      );
      
      // Find the notifications button
      const notificationButton = screen.getByLabelText(/Recent updates/i);
      
      // Check ARIA attributes
      expect(notificationButton).toHaveAttribute('aria-haspopup', 'menu');
      expect(notificationButton).toHaveAttribute('aria-expanded', 'false');
      expect(notificationButton).not.toHaveAttribute('aria-controls'); // Should not have this before menu is open
    });
    
    it('should update ARIA attributes when notification menu is opened', async () => {
      renderWithProviders(
        <RealTimeAnalyticsDashboard userType="influencer" initialData={initialData} />
      );
      
      // Find the notifications button
      const notificationButton = screen.getByLabelText(/Recent updates/i);
      
      // Open the menu
      fireEvent.click(notificationButton);
      
      // Check updated ARIA attributes
      expect(notificationButton).toHaveAttribute('aria-expanded', 'true');
      expect(notificationButton).toHaveAttribute('aria-controls', 'notification-menu');
      
      // Check menu ARIA attributes
      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-label', 'Recent dashboard updates');
    });
    
    it('should initialize focus trap when notification menu is opened', async () => {
      renderWithProviders(
        <RealTimeAnalyticsDashboard userType="influencer" initialData={initialData} />
      );
      
      // Find the notifications button
      const notificationButton = screen.getByLabelText(/Recent updates/i);
      
      // Open the menu
      fireEvent.click(notificationButton);
      
      // Verify focus trap was initialized
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
      });
      
      // Check that screen reader announcement was made
      expect(mockAnnounce).toHaveBeenCalledWith('Recent updates menu opened', 'polite');
    });
    
    it('should cleanup focus trap when notification menu is closed', async () => {
      renderWithProviders(
        <RealTimeAnalyticsDashboard userType="influencer" initialData={initialData} />
      );
      
      // Find the notifications button
      const notificationButton = screen.getByLabelText(/Recent updates/i);
      
      // Open the menu
      fireEvent.click(notificationButton);
      
      // Close the menu (click outside to trigger onClose)
      fireEvent.click(document.body);
      
      // Verify focus trap was cleaned up
      expect(mockCleanup).toHaveBeenCalled();
      
      // Check that screen reader announcement was made
      expect(mockAnnounce).toHaveBeenCalledWith('Recent updates menu closed', 'polite');
    });
    
    it('should provide proper ARIA attributes for menu items', async () => {
      // Mock initial data with recent updates
      const dataWithUpdates = {
        ...initialData,
        recentUpdates: [
          { message: 'Analytics data updated', timestamp: new Date() },
          { message: 'Earnings data updated', timestamp: new Date() }
        ]
      };
      
      renderWithProviders(
        <RealTimeAnalyticsDashboard userType="influencer" initialData={dataWithUpdates} />
      );
      
      // Set recentUpdates state to simulate updates
      const dashboardInstance = screen.getByText(/Analytics Dashboard/i).closest('div');
      
      // Open the notifications menu
      const notificationButton = screen.getByLabelText(/Recent updates/i);
      fireEvent.click(notificationButton);
      
      // Check that menu items have proper attributes
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
      
      // Check "Clear All" button is accessible
      const clearAllButton = screen.getByRole('button', { name: /Clear all recent updates/i });
      expect(clearAllButton).toBeInTheDocument();
    });
  });
  
  describe('Real-time Status Indicators', () => {
    it('should have accessible status indicators with proper contrast', async () => {
      renderWithProviders(
        <RealTimeAnalyticsDashboard userType="influencer" initialData={initialData} />
      );
      
      // Check the connected status indicator
      const statusIndicator = screen.getByText(/Connected/i);
      expect(statusIndicator).toBeInTheDocument();
      
      // The status has proper semantic meaning (green for connected)
      const statusContainer = statusIndicator.closest('div');
      expect(statusContainer).toHaveStyle('background-color: rgb(237, 247, 237)'); // light green
    });
    
    it('should have accessible toggle for real-time updates', async () => {
      renderWithProviders(
        <RealTimeAnalyticsDashboard userType="influencer" initialData={initialData} />
      );
      
      // Check the real-time toggle button
      const toggleButton = screen.getByRole('button', { name: /Disable real-time updates/i });
      expect(toggleButton).toBeInTheDocument();
      
      // The button should have a tooltip with clear instructions
      expect(toggleButton).toHaveAccessibleDescription(/Disable real-time updates/i);
    });
  });
  
  describe('Responsive Display', () => {
    it('should maintain accessibility when loading charts', async () => {
      renderWithProviders(
        <RealTimeAnalyticsDashboard userType="influencer" initialData={{}} />
      );
      
      // Check that loading indicators are accessible
      const loadingIndicators = screen.getAllByTestId('stat-card');
      expect(loadingIndicators.length).toBeGreaterThan(0);
      
      // Should not show error messages
      const errorMessages = screen.queryAllByText(/error/i);
      expect(errorMessages.length).toBe(0);
    });
  });
});
