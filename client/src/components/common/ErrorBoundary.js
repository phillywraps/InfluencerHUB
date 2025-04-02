import React from 'react';
import { withRouter } from './withRouter';
import ErrorMessage from './ErrorMessage';
import { logError } from '../../services/errorService';

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree.
 * Logs the error to our error tracking system and displays a fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our error tracking service
    logError('React Error Boundary', error, {
      ...errorInfo,
      componentStack: errorInfo.componentStack,
      path: this.props.location?.pathname,
    });
    
    this.setState({
      errorInfo
    });
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
    
    // Navigate to a safe route if needed
    if (this.props.resetPath) {
      this.props.navigate(this.props.resetPath);
    }
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="error-boundary-container">
          <ErrorMessage
            message={this.props.fallbackMessage || "We encountered an unexpected error"}
            error={this.state.error}
            showRetryButton={true}
            onRetry={this.resetError}
            showHomeButton={true}
          />
          
          {/* Show component stack trace only in development mode */}
          {isDevelopment && this.state.errorInfo && (
            <div className="error-details">
              <details style={{ whiteSpace: 'pre-wrap', marginTop: 20, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                <summary>Component Stack Trace</summary>
                {this.state.errorInfo.componentStack}
              </details>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Create a HOC to provide router props to class component
export default withRouter(ErrorBoundary);
