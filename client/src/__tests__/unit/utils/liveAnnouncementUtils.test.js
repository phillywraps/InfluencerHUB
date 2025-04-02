import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  LiveAnnouncementProvider,
  useLiveAnnouncement,
  LiveRegionAnnouncer,
  POLITENESS,
  ANNOUNCEMENT_PRIORITY
} from '../../../utils/liveAnnouncementUtils';
import { AccessibilityContext } from '../../../utils/accessibilityContext';

// Mock accessibilityContext
const mockAccessibilityContext = {
  screenReaderEnabled: true,
  highContrastMode: false,
  reducedMotion: false,
};

const AccessibilityProvider = ({ children, contextValue }) => (
  <AccessibilityContext.Provider value={contextValue || mockAccessibilityContext}>
    {children}
  </AccessibilityContext.Provider>
);

// Test component for using the hook
function TestComponent({ message, politeness, priority, duration }) {
  const { announce } = useLiveAnnouncement();
  
  const handleClick = () => {
    announce(message, { politeness, priority, duration });
  };
  
  return (
    <button onClick={handleClick} data-testid="announce-button">
      Announce
    </button>
  );
}

describe('LiveAnnouncementUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  
  test('announces message in polite live region', async () => {
    render(
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
          <TestComponent 
            message="Test polite announcement" 
            politeness={POLITENESS.POLITE}
          />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    // Verify polite region exists but is empty
    const politeRegion = screen.getByText('', { selector: '[aria-live="polite"]' });
    expect(politeRegion).toBeInTheDocument();
    expect(politeRegion).toHaveTextContent('');
    
    // Trigger announcement
    screen.getByTestId('announce-button').click();
    
    // Check that the message appears in the polite region
    expect(politeRegion).toHaveTextContent('Test polite announcement');
    
    // Fast-forward past message duration
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    // Message should be cleared
    expect(politeRegion).toHaveTextContent('');
  });
  
  test('announces message in assertive live region', async () => {
    render(
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
          <TestComponent 
            message="Test assertive announcement" 
            politeness={POLITENESS.ASSERTIVE}
          />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    // Verify assertive region exists but is empty
    const assertiveRegion = screen.getByText('', { selector: '[aria-live="assertive"]' });
    expect(assertiveRegion).toBeInTheDocument();
    expect(assertiveRegion).toHaveTextContent('');
    
    // Trigger announcement
    screen.getByTestId('announce-button').click();
    
    // Check that the message appears in the assertive region
    expect(assertiveRegion).toHaveTextContent('Test assertive announcement');
    
    // Fast-forward past message duration
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    // Message should be cleared
    expect(assertiveRegion).toHaveTextContent('');
  });
  
  test('respects message priority order', async () => {
    render(
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
          <TestComponent 
            message="Low priority message" 
            politeness={POLITENESS.POLITE}
            priority={ANNOUNCEMENT_PRIORITY.LOW}
          />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    const politeRegion = screen.getByText('', { selector: '[aria-live="polite"]' });
    const announceButton = screen.getByTestId('announce-button');
    
    // Announce low priority message
    announceButton.click();
    expect(politeRegion).toHaveTextContent('Low priority message');
    
    // Replace component with high priority one
    const { rerender } = render(
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
          <TestComponent 
            message="High priority message" 
            politeness={POLITENESS.POLITE}
            priority={ANNOUNCEMENT_PRIORITY.HIGH}
          />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    // Announce high priority message before low priority one finishes
    screen.getByTestId('announce-button').click();
    
    // The high priority message should replace the low priority one
    expect(politeRegion).toHaveTextContent('High priority message');
    
    // Fast-forward past message duration
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    // Low priority message should be shown after high priority one completes
    expect(politeRegion).toHaveTextContent('');
  });
  
  test('NOW priority overrides all other messages immediately', async () => {
    render(
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
          <TestComponent 
            message="Medium priority message" 
            politeness={POLITENESS.POLITE}
            priority={ANNOUNCEMENT_PRIORITY.MEDIUM}
          />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    const politeRegion = screen.getByText('', { selector: '[aria-live="polite"]' });
    const announceButton = screen.getByTestId('announce-button');
    
    // Announce medium priority message
    announceButton.click();
    expect(politeRegion).toHaveTextContent('Medium priority message');
    
    // Replace component with NOW priority one
    const { rerender } = render(
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
          <TestComponent 
            message="NOW priority message" 
            politeness={POLITENESS.POLITE}
            priority={ANNOUNCEMENT_PRIORITY.NOW}
          />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    // Announce NOW priority message
    screen.getByTestId('announce-button').click();
    
    // The NOW priority message should replace all other messages
    expect(politeRegion).toHaveTextContent('NOW priority message');
    
    // Fast-forward past message duration
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    // No other messages should be shown after NOW message completes
    expect(politeRegion).toHaveTextContent('');
  });
  
  test('LiveRegionAnnouncer announces when value changes', async () => {
    const TestWithAnnouncer = ({ value }) => {
      return (
        <div>
          <p data-testid="value-display">{value}</p>
          <LiveRegionAnnouncer 
            value={value} 
            getMessage={(newVal) => `Value changed to ${newVal}`}
          />
        </div>
      );
    };
    
    const { rerender } = render(
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
          <TestWithAnnouncer value={5} />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    const politeRegion = screen.getByText('', { selector: '[aria-live="polite"]' });
    expect(politeRegion).toHaveTextContent('');
    
    // Change the value
    rerender(
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
          <TestWithAnnouncer value={10} />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    // Announcer should announce the change
    expect(politeRegion).toHaveTextContent('Value changed to 10');
    
    // Fast-forward past message duration
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    // Message should be cleared
    expect(politeRegion).toHaveTextContent('');
  });
  
  test('respects screenReaderEnabled setting', async () => {
    // Render with screen reader disabled
    render(
      <AccessibilityProvider contextValue={{ ...mockAccessibilityContext, screenReaderEnabled: false }}>
        <LiveAnnouncementProvider>
          <TestComponent 
            message="This should not be announced" 
            politeness={POLITENESS.POLITE}
          />
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    );
    
    const politeRegion = screen.getByText('', { selector: '[aria-live="polite"]' });
    
    // Trigger announcement
    screen.getByTestId('announce-button').click();
    
    // Message should not appear because screen reader is disabled
    expect(politeRegion).toHaveTextContent('');
    
    // Fast-forward just to be sure
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    // Still no message
    expect(politeRegion).toHaveTextContent('');
  });
  
  test('throws error when hook used outside provider', () => {
    // Silence the error in the console
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Attempt to render component using hook without provider
    expect(() => {
      render(<TestComponent message="Test" />);
    }).toThrow('useLiveAnnouncement must be used within a LiveAnnouncementProvider');
    
    // Restore console.error
    console.error.mockRestore();
  });
});
