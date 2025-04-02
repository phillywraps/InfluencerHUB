import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setErrorAlert, setSuccessAlert } from '../../redux/slices/alertSlice';
import { logError } from '../../services/errorService';

/**
 * Higher Order Component (HOC) for standardized API request handling
 * 
 * Provides:
 * - Loading state management
 * - Standardized error handling with alert display
 * - Success message display
 * - Automatic error logging
 * 
 * @param {React.Component} Component - The component to enhance
 * @param {Object} options - Configuration options
 * @param {boolean} options.showSuccessAlerts - Whether to show success alerts (default: true)
 * @param {boolean} options.showErrorAlerts - Whether to show error alerts (default: true)
 * @param {string} options.componentName - Name for logging purposes
 * @returns {React.FunctionComponent} - Enhanced component with API handling
 */
const withApiHandler = (Component, options = {}) => {
  const {
    showSuccessAlerts = true,
    showErrorAlerts = true,
    componentName = Component.displayName || Component.name || 'Component'
  } = options;

  const WithApiHandlerWrapper = (props) => {
    const dispatch = useDispatch();
    const [loadingStates, setLoadingStates] = useState({});

    // Start loading for a specific operation
    const startLoading = (operation = 'default') => {
      setLoadingStates(prev => ({ ...prev, [operation]: true }));
    };

    // Stop loading for a specific operation
    const stopLoading = (operation = 'default') => {
      setLoadingStates(prev => ({ ...prev, [operation]: false }));
    };

    // Check if a specific operation is loading
    const isLoading = (operation = 'default') => {
      return !!loadingStates[operation];
    };

    // Check if any operation is loading
    const isAnyLoading = () => {
      return Object.values(loadingStates).some(state => state);
    };

    /**
     * Handle API requests with standardized error handling and loading states
     * 
     * @param {Function} apiCall - API call function that returns a promise
     * @param {Object} options - Handler options
     * @param {string} options.operation - Name of the operation for loading state tracking
     * @param {string} options.successMessage - Message to show on success
     * @param {string} options.errorMessage - Fallback error message
     * @param {Function} options.onSuccess - Callback function on success
     * @param {Function} options.onError - Callback function on error
     * @param {boolean} options.throwError - Whether to throw the error after handling
     * @returns {Promise} - The original API call promise
     */
    const handleApiRequest = async (apiCall, options = {}) => {
      const {
        operation = 'default',
        successMessage,
        errorMessage = 'An error occurred while processing your request',
        onSuccess,
        onError,
        throwError = false,
      } = options;

      try {
        // Start loading state
        startLoading(operation);
        
        // Execute the API call
        const result = await apiCall();
        
        // Show success message if provided
        if (successMessage && showSuccessAlerts) {
          dispatch(setSuccessAlert(successMessage));
        }
        
        // Execute success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Return the result
        return result;
      } catch (error) {
        // Log the error
        logError(`${componentName} | ${operation}`, error, { props });
        
        // Show error alert
        if (showErrorAlerts) {
          dispatch(setErrorAlert(error || errorMessage));
        }
        
        // Execute error callback if provided
        if (onError) {
          onError(error);
        }
        
        // Rethrow the error if requested
        if (throwError) {
          throw error;
        }
        
        // Return null to indicate failure
        return null;
      } finally {
        // Stop loading state regardless of outcome
        stopLoading(operation);
      }
    };

    return (
      <Component
        {...props}
        handleApiRequest={handleApiRequest}
        isLoading={isLoading}
        isAnyLoading={isAnyLoading}
        loadingStates={loadingStates}
      />
    );
  };

  // Set display name for debugging
  WithApiHandlerWrapper.displayName = `withApiHandler(${componentName})`;
  
  return WithApiHandlerWrapper;
};

export default withApiHandler;
