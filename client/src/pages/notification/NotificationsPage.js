import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Paper,
  Divider,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Grid,
  Alert,
  Pagination
} from '@mui/material';
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
  deleteNotification
} from '../../redux/slices/notificationSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, totalCount } = useSelector(
    (state) => state.notification
  );
  
  const [page, setPage] = useState(1);
  const [markingRead, setMarkingRead] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'subscription', 'payment'
  
  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => {
    loadNotifications();
  }, [page, filter, dispatch]);
  
  const loadNotifications = () => {
    const unreadOnly = filter === 'unread';
    dispatch(
      getNotifications({
        limit: ITEMS_PER_PAGE,
        skip: (page - 1) * ITEMS_PER_PAGE,
        unreadOnly
      })
    );
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handleMarkAsRead = async (notificationId) => {
    setMarkingRead(notificationId);
    await dispatch(markNotificationAsRead(notificationId));
    setMarkingRead(false);
  };
  
  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    await dispatch(markAllNotificationsAsRead());
    setMarkingAllRead(false);
  };
  
  const handleDeleteNotification = async (notificationId) => {
    setDeleting(notificationId);
    await dispatch(deleteNotification(notificationId));
    setDeleting(false);
    
    // If we deleted the last item on the page, go back one page
    if (notifications.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      // Reload current page
      loadNotifications();
    }
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate to the action link if provided
    if (notification.actionLink) {
      navigate(notification.actionLink);
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
  
  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    if (filter === 'subscription') 
      return notifications.filter(n => 
        n.type.includes('subscription') || 
        n.title.toLowerCase().includes('subscription')
      );
    if (filter === 'payment') 
      return notifications.filter(n => 
        n.type.includes('payment') || 
        n.title.toLowerCase().includes('payment')
      );
    return notifications;
  };
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  if (loading && notifications.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? 'Marking...' : 'Mark all as read'}
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item>
            <Chip
              label={`All (${totalCount})`}
              onClick={() => setFilter('all')}
              color={filter === 'all' ? 'primary' : 'default'}
              clickable
            />
          </Grid>
          <Grid item>
            <Chip
              label={`Unread (${unreadCount})`}
              onClick={() => setFilter('unread')}
              color={filter === 'unread' ? 'primary' : 'default'}
              clickable
            />
          </Grid>
          <Grid item>
            <Chip
              label="Subscriptions"
              onClick={() => setFilter('subscription')}
              color={filter === 'subscription' ? 'primary' : 'default'}
              clickable
              icon={<SubscriptionsIcon />}
            />
          </Grid>
          <Grid item>
            <Chip
              label="Payments"
              onClick={() => setFilter('payment')}
              color={filter === 'payment' ? 'primary' : 'default'}
              clickable
              icon={<PaymentIcon />}
            />
          </Grid>
        </Grid>
        
        {error ? (
          <ErrorMessage
            message="Failed to load notifications"
            error={error}
            showRetryButton
            onRetry={loadNotifications}
          />
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications found</Typography>
          </Box>
        ) : (
          <>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {getFilteredNotifications().map((notification) => (
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
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.paper' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
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
                          >
                            {markingRead === notification._id ? (
                              <CircularProgress size={20} />
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
                        >
                          {deleting === notification._id ? (
                            <CircularProgress size={20} />
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
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage;
