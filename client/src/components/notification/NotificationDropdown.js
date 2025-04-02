import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccessibility } from '../../utils/accessibilityContext';
import { useFocusTrap } from '../../utils/focusTrapUtils';
import { useLiveAnnouncement, POLITENESS, ANNOUNCEMENT_PRIORITY } from '../../utils/liveAnnouncementUtils';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  CircularProgress,
  Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import PaymentIcon from '@mui/icons-material/Payment';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from '../../redux/slices/notificationSlice';

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error } = useSelector((state) => state.notification);
  const [anchorEl, setAnchorEl] = useState(null);
  const [markingRead, setMarkingRead] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [deleting, setDeleting] = useState(null);
  
  // Refs for focus management
  const menuRef = useRef(null);
  const notificationButtonRef = useRef(null);
  
  // Access accessibility context
  const { isScreenReaderEnabled } = useAccessibility();
  
  // Use live announcement system
  const { announce } = useLiveAnnouncement();
  
  // Use focus trap for keyboard navigation
  const focusTrap = useFocusTrap(menuRef, {
    enabled: Boolean(anchorEl),
    onEscape: () => setAnchorEl(null),
    autoFocus: true
  });

  // Fetch unread count on mount
  useEffect(() => {
    dispatch(getUnreadNotificationCount());
  }, [dispatch]);
  
  // Initialize focus trap when menu opens, cleanup when it closes
  useEffect(() => {
    if (anchorEl) {
      // Initialize focus trap after the menu is rendered
      setTimeout(() => {
        focusTrap.initialize();
        
        // Announce to screen readers
        announce('Notifications menu opened', {
          politeness: POLITENESS.POLITE,
          priority: ANNOUNCEMENT_PRIORITY.MEDIUM
        });
      }, 50);
    }
    
    return () => {
      focusTrap.cleanup();
    };
  }, [anchorEl, focusTrap, isScreenReaderEnabled, announce]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
    // Fetch notifications when opening the dropdown
    if (notifications.length === 0 && !loading) {
      dispatch(getNotifications({ limit: 10, skip: 0 }));
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    
    // Return focus to notification button
    if (notificationButtonRef.current) {
      setTimeout(() => {
        notificationButtonRef.current.focus();
      }, 50);
    }
    
    // Announce to screen readers
    announce('Notifications menu closed', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.MEDIUM
    });
  };

  const handleMarkAsRead = async (notificationId) => {
    setMarkingRead(notificationId);
    
    // Announce loading state to screen readers
    announce('Marking notification as read', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.LOW
    });
    
    await dispatch(markNotificationAsRead(notificationId));
    setMarkingRead(false);
    
    // Announce completion to screen readers
    announce('Notification marked as read', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.LOW
    });
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    
    // Announce to screen readers
    announce('Marking all notifications as read', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.MEDIUM
    });
    
    await dispatch(markAllNotificationsAsRead());
    setMarkingAllRead(false);
    
    // Announce completion to screen readers
    announce('All notifications marked as read', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.MEDIUM
    });
  };

  const handleDeleteNotification = async (notificationId) => {
    setDeleting(notificationId);
    
    // Announce to screen readers
    announce('Deleting notification', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.MEDIUM
    });
    
    await dispatch(deleteNotification(notificationId));
    setDeleting(false);
    
    // Announce completion to screen readers
    announce('Notification deleted', {
      politeness: POLITENESS.POLITE,
      priority: ANNOUNCEMENT_PRIORITY.MEDIUM
    });
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate to the action link if provided
    if (notification.actionLink) {
      navigate(notification.actionLink);
      handleCloseMenu();
      
      // Announce to screen readers
      announce(`Navigating to ${notification.title}`, {
        politeness: POLITENESS.ASSERTIVE,
        priority: ANNOUNCEMENT_PRIORITY.HIGH
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'subscription_renewal':
      case 'subscription_canceled':
      case 'subscription_created':
      case 'subscription_updated':
        return <SubscriptionsIcon color="primary" />;
      case 'payment_method_expiring':
        return <CreditCardIcon color="warning" />;
      case 'payment_success':
        return <PaymentIcon color="success" />;
      case 'payment_failed':
        return <PaymentIcon color="error" />;
      case 'rental_expiring':
      case 'rental_expired':
        return <ErrorIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleOpenMenu}
          aria-label={`${unreadCount} unread notifications`}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl)}
          aria-controls={anchorEl ? 'notifications-menu' : undefined}
          ref={notificationButtonRef}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            overflow: 'auto',
            // Improved focus outline
            '& *:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px'
            }
          },
          ref: menuRef
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        MenuListProps={{
          'aria-label': 'Notifications list',
          'aria-live': 'polite',
          role: 'menu'
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? 'Marking...' : 'Mark all as read'}
            </Button>
          )}
        </Box>
        <Divider />

        {loading && notifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }} role="status" aria-live="polite">
            <CircularProgress size={24} aria-label="Loading notifications" />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }} role="alert">
            <Typography color="error">Failed to load notifications</Typography>
            <Button
              size="small"
              onClick={() => dispatch(getNotifications({ limit: 10, skip: 0 }))}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }} role="status">
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  alignItems="flex-start"
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.isRead ? 'inherit' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                  role="menuitem"
                  aria-label={`${notification.title}${!notification.isRead ? ', unread' : ''}`}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'background.paper' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        color="text.primary"
                        sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{
                            display: 'inline',
                            fontWeight: notification.isRead ? 'normal' : 'medium'
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          {formatTimestamp(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!notification.isRead && (
                    <Tooltip title="Mark as read">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification._id);
                        }}
                        disabled={markingRead === notification._id}
                        aria-label="Mark as read"
                      >
                        {markingRead === notification._id ? (
                          <CircularProgress size={20} aria-label="Marking as read" />
                        ) : (
                          <MarkEmailReadIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification._id);
                        }}
                        disabled={deleting === notification._id}
                        sx={{ ml: 1 }}
                        aria-label="Delete notification"
                      >
                        {deleting === notification._id ? (
                          <CircularProgress size={20} aria-label="Deleting notification" />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}

        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <Button
            size="small"
            onClick={() => {
              navigate('/notifications');
              handleCloseMenu();
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationDropdown;
