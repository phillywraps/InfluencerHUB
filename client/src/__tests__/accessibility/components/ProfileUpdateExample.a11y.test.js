import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ProfileUpdateExample from '../../../components/examples/ProfileUpdateExample';
import { AccessibilityProvider } from '../../../utils/accessibilityContext';

// Add jest-axe custom matchers
expect.extend(toHaveNoViolations);

// Mock the redux store
const mockStore = configureMockStore();
const store = mockStore({
  alerts: { alerts: [] }
});

// Mock the required context providers and HOCs
jest.mock('../../../components/common/withApiHandler', () => {
  return (Component) => {
    const WithApiHandlerMock = (props) => {
      // Mock the handleApiRequest function to simulate API calls
      const handleApiRequest = jest.fn(async (apiCall, options) => {
        // Simulate loading initial data
        if (options.operation === 'loadProfile') {
          const data = {
            name: 'John Doe',
            email: 'john.doe@example.com',
            bio: 'Software developer'
          };
          if (options.onSuccess) options.onSuccess(data);
          return data;
        }
        
        // Simulate profile update
        if (options.operation === 'updateProfile') {
          if (options.onSuccess) options.onSuccess();
          return { success: true };
        }
        
        return await apiCall();
      });
      
      // Mock the loading states
      const isLoading = (operation) => false;
      const loadingStates = {};
      
      return <Component 
        {...props} 
        handleApiRequest={handleApiRequest} 
        isLoading={isLoading} 
        loadingStates={loadingStates} 
      />;
    };
    
    return WithApiHandlerMock;
  };
});

// Mock the ErrorBoundary component
jest.mock('../../../components/common/ErrorBoundary', () => {
  return ({ children }) => <div data-testid="error-boundary">{children}</div>;
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

// A custom component wrapper to provide all required contexts
const renderWithProviders = (ui) => {
  return render(
    <Provider store={store}>
      <AccessibilityProvider>
        {ui}
      </AccessibilityProvider>
    </Provider>
  );
};

describe('ProfileUpdateExample Accessibility Tests', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should not have any axe accessibility violations', async () => {
    const { container } = renderWithProviders(<ProfileUpdateExample />);
    
    // Wait for the component to load profile data
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper ARIA attributes for form fields', async () => {
    renderWithProviders(<ProfileUpdateExample />);
    
    // Wait for the component to load profile data
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
    
    // Check the name field
    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toHaveAttribute('aria-required', 'true');
    
    // Check the email field
    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toHaveAttribute('aria-required', 'true');
    
    // Check the bio field
    const bioInput = screen.getByLabelText(/Bio/i);
    expect(bioInput).toHaveAttribute('aria-describedby', 'bio-description');
  });
  
  it('should display and properly handle validation errors with accessible messages', async () => {
    renderWithProviders(<ProfileUpdateExample />);
    
    // Wait for the component to load profile data
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
    
    // Clear form fields to trigger validation errors
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitButton);
    
    // Check if validation error messages are displayed
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email format is invalid/i)).toBeInTheDocument();
    });
    
    // Check ARIA attributes on invalid fields
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
    expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
    
    // Check for error summary
    const errorSummary = screen.getByRole('alert');
    expect(errorSummary).toBeInTheDocument();
    expect(errorSummary).toHaveTextContent('There are problems with your submission');
    
    // Check that screen reader announcements were made
    expect(mockAnnounce).toHaveBeenCalled();
    const announceCall = mockAnnounce.mock.calls.find(call => 
      call[0].includes('Form contains') && call[0].includes('errors')
    );
    expect(announceCall).toBeTruthy();
  });
  
  it('should provide accessible fix buttons for each error', async () => {
    renderWithProviders(<ProfileUpdateExample />);
    
    // Wait for the component to load profile data
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
    
    // Clear form fields to trigger validation errors
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitButton);
    
    // Check for the fix buttons
    await waitFor(() => {
      const fixButtons = screen.getAllByRole('button', { name: /Fix/i });
      expect(fixButtons.length).toBeGreaterThan(0);
    });
    
    // Test that fix buttons focus the corresponding input field
    // Since we can't directly test focus in JSDOM, we'll mock Document.prototype.activeElement
    const originalActiveElement = Object.getOwnPropertyDescriptor(
      Document.prototype, 'activeElement'
    );
    
    // Mock focus behavior
    const mockFocus = jest.fn();
    nameInput.focus = mockFocus;
    
    // Click the fix button for the name field
    const fixButtons = screen.getAllByRole('button', { name: /Fix/i });
    fireEvent.click(fixButtons[0]);
    
    // Check if focus was called on the input
    expect(mockFocus).toHaveBeenCalled();
    
    // Restore original implementation
    if (originalActiveElement) {
      Object.defineProperty(Document.prototype, 'activeElement', originalActiveElement);
    }
  });
  
  it('should make validation errors accessible to screen readers via aria-live regions', async () => {
    renderWithProviders(<ProfileUpdateExample />);
    
    // Wait for the component to load profile data
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
    
    // Clear form fields to trigger validation errors
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitButton);
    
    // Check for aria-live region
    await waitFor(() => {
      const errorSummary = screen.getByRole('alert');
      expect(errorSummary).toHaveAttribute('aria-live', 'assertive');
    });
  });
  
  it('should provide visually-hidden text for screen readers', async () => {
    renderWithProviders(<ProfileUpdateExample />);
    
    // Wait for the component to load profile data
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
    
    // Look for visually-hidden elements with error messaging
    const hiddenElements = document.querySelectorAll('.visually-hidden');
    expect(hiddenElements.length).toBeGreaterThan(0);
    
    // Trigger form errors
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: '' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitButton);
    
    // Check for visually-hidden elements with error IDs
    await waitFor(() => {
      const nameError = document.getElementById('name-error');
      expect(nameError).toHaveClass('visually-hidden');
      expect(nameError).toHaveTextContent(/Name is required/i);
    });
  });
  
  it('should maintain accessibility when form is successfully submitted', async () => {
    renderWithProviders(<ProfileUpdateExample />);
    
    // Wait for the component to load profile data
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
    
    // Make a change to enable the submit button
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitButton);
    
    // Check that no errors are displayed
    await waitFor(() => {
      const errorSummary = screen.queryByRole('alert');
      expect(errorSummary).not.toBeInTheDocument();
    });
    
    // Check that inputs have appropriate ARIA attributes
    expect(nameInput).not.toHaveAttribute('aria-invalid');
  });
});
