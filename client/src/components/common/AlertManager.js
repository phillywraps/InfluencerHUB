import React, { useState, useEffect, useCallback, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Alert, 
  Snackbar, 
  Stack, 
  Button,
  IconButton,
  Typography,
  Slide,
  Box,
  useTheme
} from '@mui/material';
import { removeAlert } from '../../redux/slices/alertSlice';
import CloseIcon from '@mui/icons-material/Close';
import { logError } from '../../services/errorService';

// Constants for alert animation and timing
const DEFAULT_AUTO_HIDE_DURATION = 6000;
const TRANSITION_DURATION = 300;
const ALERT_LIMIT = 4; // Maximum number of alerts to show at once

/**
 * Enhanced Alert Manager Component
 * Handles displaying alerts globally within the application
 * Supports custom actions, animations, and accessibility features
 */
const AlertManager = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { alerts } = useSelector((state) => state.alert);
  const [exiting, setExiting] = useState({});

  // Only show a limited number of alerts at once
  const visibleAlerts = alerts.slice(0, ALERT_LIMIT);
  const hiddenCount = Math.max(0, alerts.length - ALERT_LIMIT);

  // Handle alert close with animation
  const handleClose = useCallback((id) => {
    // Set exiting state to animate out
    setExiting(prev => ({ ...prev, [id]: true }));
    
    // Remove after animation completes
    setTimeout(() => {
      dispatch(removeAlert(id));
      setExiting(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }, TRANSITION_DURATION);
  }, [dispatch]);

  // Use effect to handle automatic dismissal
  useEffect(() => {
    // Set up timers for auto-dismiss
    const timers = alerts
      .filter(alert => alert.timeout !== 0)
      .map(alert => {
        const timeoutDuration = alert.timeout || DEFAULT_AUTO_HIDE_DURATION;
        return setTimeout(() => {
          handleClose(alert.id);
        }, timeoutDuration);
      });

    // Clean up timers on component unmount
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [alerts, handleClose]);

  // Render nothing if no alerts
  if (visibleAlerts.length === 0) {
    return null;
  }

  // Get alert variant based on theme
  const getAlertVariant = (type) => {
    // Use filled style for error and success, outlined for others
    return ['error', 'success'].includes(type) ? 'filled' : 'outlined';
  };

  // Get alert icon color (for specific styling)
  const getIconColor = (type) => {
    return type === 'error' ? theme.palette.error.main : 
           type === 'warning' ? theme.palette.warning.main :
           type === 'info' ? theme.palette.info.main :
           theme.palette.success.main;
  };

  return (
    <Stack 
      spacing={1} 
      sx={{ 
        width: { xs: '100%', sm: '400px' }, 
        maxWidth: '100%',
        position: 'fixed', 
        top: { xs: 0, sm: 70 }, 
        right: 0, 
        zIndex: 9999,
        p: 1,
      }}
    >
      {visibleAlerts.map((alert) => (
        <Slide
          key={alert.id}
          direction="left"
          in={!exiting[alert.id]}
          mountOnEnter
          unmountOnExit
          timeout={TRANSITION_DURATION}
        >
          <Alert
            severity={alert.type}
            variant={getAlertVariant(alert.type)}
            elevation={3}
            icon={alert.icon}
            role="alert"
            aria-live="assertive"
            sx={{
              width: '100%',
              boxShadow: 2,
              display: 'flex',
              alignItems: 'center',
              // Custom styles based on alert type
              '& .MuiAlert-icon': {
                color: getIconColor(alert.type),
                alignSelf: 'center',
              },
              '& .MuiAlert-message': {
                overflow: 'hidden'
              }
            }}
            action={
              <Box>
                {/* Render custom action button if provided */}
                {alert.action && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => {
                      try {
                        alert.action.onClick();
                      } catch (error) {
                        logError('AlertAction', error);
                      }
                      if (alert.action.closeOnClick !== false) {
                        handleClose(alert.id);
                      }
                    }}
                  >
                    {alert.action.label}
                  </Button>
                )}
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => handleClose(alert.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <Box>
              {/* Title if provided */}
              {alert.title && (
                <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold' }}>
                  {alert.title}
                </Typography>
              )}
              
              {/* Message - truncate if too long */}
              <Typography 
                variant="body2" 
                component="div"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  ...(alert.title ? { mt: 0.5 } : {})
                }}
              >
                {alert.message}
              </Typography>
            </Box>
          </Alert>
        </Slide>
      ))}

      {/* Show count of additional alerts if we have more than the limit */}
      {hiddenCount > 0 && (
        <Slide 
          direction="left" 
          in={true} 
          mountOnEnter 
          unmountOnExit
        >
          <Alert
            severity="info"
            variant="outlined"
            sx={{ width: '100%' }}
          >
            <Typography variant="body2">
              +{hiddenCount} more {hiddenCount === 1 ? 'notification' : 'notifications'}
            </Typography>
          </Alert>
        </Slide>
      )}
    </Stack>
  );
};

export default AlertManager;
