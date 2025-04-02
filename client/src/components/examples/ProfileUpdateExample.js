import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress,
  Divider,
  Grid,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import withApiHandler from '../common/withApiHandler';
import ErrorBoundary from '../common/ErrorBoundary';
import { useDispatch } from 'react-redux';
import { setInfoAlert, setAlertWithAction } from '../../redux/slices/alertSlice';
import { useAccessibility } from '../../utils/accessibilityContext';
import { useLiveAnnouncement, POLITENESS, ANNOUNCEMENT_PRIORITY } from '../../utils/liveAnnouncementUtils';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Example component demonstrating the error handling and feedback system
 * 
 * This component shows:
 * 1. Use of ErrorBoundary for component-level error handling
 * 2. Use of withApiHandler HOC for API request handling
 * 3. Loading state management
 * 4. Success and error alerts
 * 5. Form validation with user feedback
 */
const ProfileUpdateExample = ({ handleApiRequest, isLoading, loadingStates }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  
  // Access accessibility context
  const { isScreenReaderEnabled } = useAccessibility();
  
  // Use live announcement system
  const { announce } = useLiveAnnouncement();
  
  // Refs for form fields and error summary
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const bioInputRef = useRef(null);
  const errorSummaryRef = useRef(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Simulate loading initial data
  useEffect(() => {
    const loadUserProfile = async () => {
      await handleApiRequest(
        // This would be a real API call in a production app
        async () => {
          // Simulate API request
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock response data
          return {
            name: 'John Doe',
            email: 'john.doe@example.com',
            bio: 'Software developer and tech enthusiast.'
          };
        },
        {
          operation: 'loadProfile',
          errorMessage: 'Failed to load profile data',
          onSuccess: (data) => {
            setFormData(data);
            // After initial load, we don't consider the form changed
            setHasChanges(false);
          }
        }
      );
    };
    
    loadUserProfile();
    
    // Show an example info alert when component mounts
    dispatch(setInfoAlert({
      title: 'Profile Update Form',
      message: 'This is an example component demonstrating the error handling system.'
    }));
  }, [handleApiRequest, dispatch]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Mark that user has made changes
    setHasChanges(true);
  };
  
  // Validate form data with enhanced error handling
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required. Please enter your name.';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required. Please enter your email address.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email format is invalid. Please enter a valid email address (e.g., name@example.com).';
    }
    
    // Set errors in state
    setFormErrors(errors);
    
    // If we have errors, show error summary and announce to screen readers
    if (Object.keys(errors).length > 0) {
      setShowErrorSummary(true);
      
      // Focus the error summary for screen readers
      setTimeout(() => {
        if (errorSummaryRef.current) {
          errorSummaryRef.current.focus();
        }
      }, 100);
      
      // Announce errors to screen readers
      const errorCount = Object.keys(errors).length;
      announce(
        `Form contains ${errorCount} ${errorCount === 1 ? 'error' : 'errors'}. Please correct the highlighted fields and resubmit.`,
        {
          politeness: POLITENESS.ASSERTIVE,
          priority: ANNOUNCEMENT_PRIORITY.HIGH
        }
      );
    }
    
    return Object.keys(errors).length === 0;
  };
  
  // Focus the first field with an error
  const focusFirstError = () => {
    if (formErrors.name && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (formErrors.email && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      // Focus the first error field for keyboard users
      focusFirstError();
      return;
    }
    
    // Announce form submission
    announce('Submitting form...', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.MEDIUM
    });
    
    // Clear any previous error summary when submitting valid form
    setShowErrorSummary(false);
    
    // Call API using our withApiHandler HOC
    const result = await handleApiRequest(
      // This would be a real API call in a production app
      async () => {
        // Simulate API request with random success/failure
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Random failure for demonstration purposes (33% chance)
        if (Math.random() < 0.33) {
          throw new Error('Network error occurred while updating profile');
        }
        
        // Success case
        return { success: true };
      },
      {
        operation: 'updateProfile',
        successMessage: 'Profile updated successfully',
        errorMessage: 'Failed to update profile',
        onSuccess: () => {
          setHasChanges(false);
          // Announce success to screen readers
          announce('Profile updated successfully', {
            politeness: POLITENESS.POLITE,
            priority: ANNOUNCEMENT_PRIORITY.MEDIUM
          });
        }
      }
    );
    
    if (result) {
      // Additional success handling if needed
      console.log('Profile update successful');
    }
  };
  
  // Handle page unload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        // Show browser dialog
        e.preventDefault();
        e.returnValue = '';
        
        // Also show our custom alert
        dispatch(setAlertWithAction(
          {
            type: 'warning',
            title: 'Unsaved Changes',
            message: 'You have unsaved changes that will be lost if you leave.'
          },
          {
            label: 'Save Now',
            onClick: () => handleSubmit({ preventDefault: () => {} }),
            closeOnClick: false
          }
        ));
      }
    };
    
    // Add event listener for beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges, dispatch, handleSubmit]);
  
  // Simulate an error for demonstration purposes
  const simulateError = () => {
    try {
      // Announce before attempting the operation
      announce('Simulating an error for demonstration purposes', {
        politeness: POLITENESS.POLITE,
        priority: ANNOUNCEMENT_PRIORITY.LOW
      });
      
      // This will trigger the error boundary
      throw new Error('This is a simulated error in the component');
    } catch (error) {
      // Announce the error before propagating it
      announce('A critical error has occurred', {
        politeness: POLITENESS.ASSERTIVE,
        priority: ANNOUNCEMENT_PRIORITY.NOW
      });
      
      // This error will be caught by ErrorBoundary
      throw error;
    }
  };
  
  // Show loading state while initially loading profile data
  if (isLoading('loadProfile') && !formData.name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Update Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This example demonstrates the error handling and feedback system.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Accessibility-enhanced error summary */}
      {showErrorSummary && Object.keys(formErrors).length > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          ref={errorSummaryRef}
          tabIndex={-1}
          aria-live="assertive"
        >
          <AlertTitle>There are problems with your submission</AlertTitle>
          <List dense disablePadding>
            {Object.entries(formErrors).map(([field, message]) => (
              <ListItem key={field} disableGutters>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <ErrorIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={message}
                  primaryTypographyProps={{ 
                    component: "span",
                    variant: "body2"
                  }}
                />
                <Button 
                  size="small" 
                  onClick={() => {
                    if (field === 'name' && nameInputRef.current) {
                      nameInputRef.current.focus();
                    } else if (field === 'email' && emailInputRef.current) {
                      emailInputRef.current.focus();
                    } else if (field === 'bio' && bioInputRef.current) {
                      bioInputRef.current.focus();
                    }
                  }}
                >
                  Fix
                </Button>
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} noValidate aria-label="Profile update form">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={(e) => {
                handleChange(e);
                // Announce when field is corrected
                if (formErrors.name && e.target.value.trim()) {
                  announce('Name field updated', {
                    politeness: POLITENESS.POLITE,
                    priority: ANNOUNCEMENT_PRIORITY.LOW
                  });
                }
              }}
              fullWidth
              error={!!formErrors.name}
              helperText={formErrors.name}
              inputRef={nameInputRef}
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? "name-error" : undefined}
              InputProps={{
                "aria-errormessage": formErrors.name ? "name-error" : undefined
              }}
              required
              inputProps={{
                "aria-required": "true"
              }}
            />
            {formErrors.name && (
              <span id="name-error" className="visually-hidden">
                {formErrors.name}
              </span>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                handleChange(e);
                // Announce when field is corrected
                if (formErrors.email && /\S+@\S+\.\S+/.test(e.target.value)) {
                  announce('Email field updated with valid email format', {
                    politeness: POLITENESS.POLITE,
                    priority: ANNOUNCEMENT_PRIORITY.LOW
                  });
                }
              }}
              fullWidth
              error={!!formErrors.email}
              helperText={formErrors.email}
              inputRef={emailInputRef}
              aria-invalid={!!formErrors.email}
              aria-describedby={formErrors.email ? "email-error" : undefined}
              InputProps={{
                "aria-errormessage": formErrors.email ? "email-error" : undefined
              }}
              required
              inputProps={{
                "aria-required": "true"
              }}
            />
            {formErrors.email && (
              <span id="email-error" className="visually-hidden">
                {formErrors.email}
              </span>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              inputRef={bioInputRef}
              aria-describedby="bio-description"
            />
            <span id="bio-description" className="visually-hidden">
              Enter a short biography about yourself
            </span>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isLoading('updateProfile') || !hasChanges}
            startIcon={isLoading('updateProfile') ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading('updateProfile') ? 'Saving...' : 'Save Changes'}
            <span className="visually-hidden">
              {hasChanges ? 'Save your profile changes' : 'No changes to save'}
            </span>
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            onClick={simulateError}
            aria-label="Simulate error for testing"
          >
            Simulate Error
          </Button>
        </Box>
      </form>
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Debug Information:
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Loading States: {Object.entries(loadingStates)
              .filter(([_, value]) => value)
              .map(([key]) => key)
              .join(', ') || 'None'}
          </Typography>
        </Alert>
        <Alert severity="info">
          <Typography variant="body2">
            Form has changes: {hasChanges ? 'Yes' : 'No'}
          </Typography>
        </Alert>
      </Box>
    </Paper>
  );
};

// Wrap with ErrorBoundary and withApiHandler
const WrappedExample = (props) => (
  <ErrorBoundary fallbackMessage="Something went wrong with the profile form">
    <ProfileUpdateExample {...props} />
  </ErrorBoundary>
);

// Add global styles for screen reader only content
const style = document.createElement('style');
style.innerHTML = `
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
`;
document.head.appendChild(style);

export default withApiHandler(WrappedExample, {
  componentName: 'ProfileUpdateExample',
  showSuccessAlerts: true
});
