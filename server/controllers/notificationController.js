const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const notificationService = require('../utils/notificationService');
const logger = require('../config/logger');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createAuthorizationError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

// Socket service for real-time notifications
let socketService = null;

// @desc    Get notifications for the current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = wrap(async (req, res) => {
  const { limit = 20, skip = 0, unreadOnly = false } = req.query;
  
  const notifications = await notificationService.getUserNotifications(
    req.user._id,
    {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true'
    }
  );
  
  // Get unread count
  const unreadCount = await notificationService.getUnreadNotificationCount(req.user._id);
  
  return res.json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: notifications
  });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = wrap(async (req, res) => {
  const { id } = req.params;
  
  // Check if notification exists and belongs to the user
  const notification = await Notification.findById(id);
  
  if (!notification) {
    throw createResourceNotFoundError('Notification', id);
  }
  
  if (notification.userId.toString() !== req.user._id.toString()) {
    throw createAuthorizationError('Not authorized to access this notification', {
      notificationId: id,
      userId: req.user._id,
      notificationUserId: notification.userId
    });
  }
  
  // Mark as read
  const updatedNotification = await notificationService.markNotificationAsRead(id);
  
  return res.json({
    success: true,
    data: updatedNotification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = wrap(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user._id);
  
  return res.json({
    success: true,
    message: `Marked ${result.modifiedCount} notifications as read`
  });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = wrap(async (req, res) => {
  const { id } = req.params;
  
  // Check if notification exists and belongs to the user
  const notification = await Notification.findById(id);
  
  if (!notification) {
    throw createResourceNotFoundError('Notification', id);
  }
  
  if (notification.userId.toString() !== req.user._id.toString()) {
    throw createAuthorizationError('Not authorized to access this notification', {
      notificationId: id,
      userId: req.user._id,
      notificationUserId: notification.userId
    });
  }
  
  // Delete notification
  await notificationService.deleteNotification(id);
  
  return res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadNotificationCount = wrap(async (req, res) => {
  const count = await notificationService.getUnreadNotificationCount(req.user._id);
  
  return res.json({
    success: true,
    data: { count }
  });
});

// @desc    Create a test notification (for development only)
// @route   POST /api/notifications/test
// @access  Private (Admin only)
const createTestNotification = wrap(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Only admins can create test notifications', {
      userRole: req.user.role,
      requiredRole: 'admin'
    });
  }
  
  const { type, title, message, actionLink, actionText } = req.body;
  
  const notificationData = {
    userId: req.user._id,
    type: type || 'system',
    title: title || 'Test Notification',
    message: message || 'This is a test notification.',
    actionLink: actionLink || '',
    actionText: actionText || '',
    sendEmail: false
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  // Send real-time notification if socket service is available
  sendRealTimeNotification(notification);
  
  return res.status(201).json({
    success: true,
    data: notification
  });
});

/**
 * Set the socket service for real-time notifications
 * @param {Object} service - NotificationSocketService instance 
 */
const setSocketService = (service) => {
  socketService = service;
  logger.info('NotificationSocketService initialized for NotificationController');
};

/**
 * Send a notification via WebSocket if user is connected
 * @param {Object} notification - Notification object
 * @param {Object} options - Additional options
 * @private
 */
const sendRealTimeNotification = (notification, options = {}) => {
  if (socketService && notification && notification.userId) {
    // Send via socket if possible
    socketService.sendNotification(notification.userId.toString(), notification, options);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  createTestNotification,
  setSocketService
};
