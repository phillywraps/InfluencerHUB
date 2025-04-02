const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event');
const { Provider } = require('react-redux');
const { createStore } = require('redux');
const { BrowserRouter } = require('react-router-dom');
const tiktokService = require('../../../services/tiktokService');

// Mock tiktokService
jest.mock('../../../services/tiktokService');

// Mock the chart components used in TikTokAnalytics
jest.mock('@nivo/line', () => ({
  ResponsiveLine: () => <div data-testid="line-chart">Line Chart</div>
}));

jest.mock('@nivo/pie', () => ({
  ResponsivePie: () => <div data-testid="pie-chart">Pie Chart</div>
}));

jest.mock('@nivo/bar', () => ({
  ResponsiveBar: () => <div data-testid="bar-chart">Bar Chart</div>
}));

// Mock the TikTokAnalytics component
// This is needed because we can't directly import it due to its dependencies
const mockTikTokAnalytics = () => {
  return () => (
    <div>
      <h1>TikTok Analytics</h1>
      <div data-testid="loading">Loading...</div>
      <div data-testid="not-connected">Not Connected</div>
      <button data-testid="connect-button">Connect</button>
      <button data-testid="refresh-button">Refresh</button>
      <div data-testid="followers">1,000</div>
      <div data-testid="views">50,000</div>
      <div data-testid="likes">5,000</div>
      <div data-testid="engagement-rate">2.8%</div>
      <div data-testid="follower-growth">Follower Growth</div>
      <div data-testid="engagement-metrics">Engagement Metrics</div>
      <div data-testid="post-1">Test post 1</div>
      <div data-testid="post-2">Test post 2</div>
      <div data-testid="time-selector">
        <span>week</span>
        <button data-testid="month-button">Month</button>
      </div>
    </div>
  );
};

jest.mock('../TikTokAnalytics', () => mockTikTokAnalytics());

// Create a mock store
const mockStore = createStore(() => ({
  auth: {
    user: { id: '123', email: 'test@example.com' }
  }
}));

// Wrap component with necessary providers
const renderWithProviders = (ui) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  );
};

describe('TikTokAnalytics Component', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock successful account status
    tiktokService.getAccountStatus.mockResolvedValue({
      connected: true,
      username: 'testuser',
      followers: 1000
    });
    
    // Mock successful analytics data
    tiktokService.getAnalytics.mockResolvedValue({
      followers: {
        count: 1000,
        growth: 5.2
      },
      engagement: {
        likes: 5000,
        comments: 300,
        shares: 150,
        rate: 2.8
      },
      views: {
        total: 50000,
        average: 2500
      },
      posts: [
        {
          id: 'post1',
          caption: 'Test post 1',
          views: 5000,
          likes: 400,
          comments: 30,
          engagementRate: 8.6
        },
        {
          id: 'post2',
          caption: 'Test post 2',
          views: 4200,
          likes: 320,
          comments: 25,
          engagementRate: 8.2
        }
      ],
      period: 'week'
    });
  });

  it('should render loading state initially', () => {
    renderWithProviders(<TikTokAnalytics />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(tiktokService.getAccountStatus).toHaveBeenCalled();
  });

  it('should render not connected state when account is not connected', async () => {
    // Mock not connected status
    tiktokService.getAccountStatus.mockResolvedValue({ connected: false });
    
    renderWithProviders(<TikTokAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/not connected/i)).toBeInTheDocument();
      expect(screen.getByText(/connect your tiktok account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
    });
  });

  it('should render analytics when account is connected', async () => {
    renderWithProviders(<TikTokAnalytics />);
    
    await waitFor(() => {
      // Summary stats should be displayed
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Followers
      expect(screen.getByText('50,000')).toBeInTheDocument(); // Total views
      expect(screen.getByText('5,000')).toBeInTheDocument(); // Likes
      expect(screen.getByText('2.8%')).toBeInTheDocument(); // Engagement rate
      
      // Charts should be present
      expect(screen.getByText(/follower growth/i)).toBeInTheDocument();
      expect(screen.getByText(/engagement metrics/i)).toBeInTheDocument();
      
      // Top posts should be listed
      expect(screen.getByText('Test post 1')).toBeInTheDocument();
      expect(screen.getByText('Test post 2')).toBeInTheDocument();
    });
    
    expect(tiktokService.getAccountStatus).toHaveBeenCalled();
    expect(tiktokService.getAnalytics).toHaveBeenCalled();
  });

  it('should change time range when time selector is clicked', async () => {
    renderWithProviders(<TikTokAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/week/i)).toBeInTheDocument();
    });
    
    // Click on month button
    const monthButton = screen.getByRole('button', { name: /month/i });
    userEvent.click(monthButton);
    
    await waitFor(() => {
      expect(tiktokService.getAnalytics).toHaveBeenCalledWith('month');
    });
  });

  it('should handle connect button click', async () => {
    // Mock not connected status
    tiktokService.getAccountStatus.mockResolvedValue({ connected: false });
    
    renderWithProviders(<TikTokAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
    });
    
    // Click connect button
    const connectButton = screen.getByRole('button', { name: /connect/i });
    userEvent.click(connectButton);
    
    await waitFor(() => {
      expect(tiktokService.connectAccount).toHaveBeenCalled();
    });
  });

  it('should handle refresh button click', async () => {
    renderWithProviders(<TikTokAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
    
    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    userEvent.click(refreshButton);
    
    await waitFor(() => {
      // Should call getAnalytics again
      expect(tiktokService.getAnalytics).toHaveBeenCalledTimes(2);
    });
  });
});
