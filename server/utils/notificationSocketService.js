const notificationService = require('./notificationService');
const logger = require('../config/logger');
const User = require('../models/userModel');
const accessibilityMetadata = require('./accessibilityMetadata');
const { ErrorTypes } = require('../middleware/errorMiddleware');

/**
 * Custom error for WebSocket operations
 */
class SocketOperationError extends Error {
  constructor(message, userId, details = {}) {
    super(message);
    this.name = 'SocketOperationError';
    this.userId = userId;
    this.details = details;
    this.code = ErrorTypes.SOCKET_ERROR;
  }
}

/**
 * NotificationSocketService - Extends WebSocketService to handle real-time notifications
 * with full accessibility support
 */
class NotificationSocketService {
  constructor(webSocketService) {
    this.webSocketService = webSocketService;
    this.registerSocketEvents();
  }

  /**
   * Register notification-specific socket events
   */
  registerSocketEvents() {
    // Add notification-specific events to the connection handler
    const io = this.webSocketService.io;
    const connections = this.webSocketService.connections;

    io.on('connection', (socket) => {
      const userId = socket.user._id.toString();

      // Join user's personal notification room
      socket.join(`user:${userId}:notifications`);
      
      // Handle join_notifications event
      socket.on('join_notifications', async () => {
        try {
          // Get unread notification count
          const unreadCount = await notificationService.getUnreadNotificationCount(userId);
          
          // Send the unread count to the user
          socket.emit('notification_count', { unreadCount });
          
          logger.info(`User ${userId} joined notification channel, unread count: ${unreadCount}`);
        } catch (error) {
          const socketError = new SocketOperationError(
            `Error joining notifications for user ${userId}`, 
            userId, 
            { originalError: error.message }
          );
          logger.error(socketError.message, { error });
          socket.emit('error', { 
            message: 'Failed to join notifications',
            code: socketError.code,
            details: { userId }
          });
        }
      });
    });
  }

  /**
   * Send a notification to a user via websocket
   * @param {String} userId - User ID to receive the notification
   * @param {Object} notification - Notification object
   * @param {Object} options - Additional options
   * @param {String} options.importance - Accessibility importance: 'polite' or 'assertive'
   * @param {Boolean} options.vibrate - Whether device should vibrate (default by notification type)
   * @returns {Boolean} - Whether notification was sent successfully
   */
  sendNotification(userId, notification, options = {}) {
    try {
      if (!userId) {
        throw new SocketOperationError('Missing userId for notification', 'unknown', {
          notificationTitle: notification?.title || 'unknown'
        });
      }

      if (!notification) {
        throw new SocketOperationError('Invalid notification object', userId);
      }

      const connections = this.webSocketService.connections;
      
      // Only proceed if user is connected
      if (connections.has(userId)) {
        // Add accessibility metadata (screen reader importance, haptic feedback)
        const accessibilityOptions = this.getAccessibilityOptions(notification, options);
        
        const notificationData = {
          ...notification,
          accessibility: accessibilityOptions
        };
        
        // Emit to user's notification room
        this.webSocketService.io.to(`user:${userId}:notifications`)
          .emit('notification_received', notificationData);
        
        logger.info(`Sent realtime notification to user ${userId}: ${notification.title}`);
        return true;
      }
      
      logger.info(`User ${userId} not connected, skipping realtime notification`);
      return false;
    } catch (error) {
      const logError = error instanceof SocketOperationError ? 
        error : 
        new SocketOperationError(`Error sending notification to user ${userId}`, userId, { 
          originalError: error.message,
          notificationTitle: notification?.title || 'unknown'
        });
      
      logger.error(logError.message, { error: logError });
      return false;
    }
  }

  /**
   * Send notification to multiple users
   * @param {Array<String>} userIds - User IDs to receive the notification
   * @param {Object} notification - Notification object
   * @param {Object} options - Additional options
   * @returns {Number} - Number of users who received the notification
   */
  sendNotificationToUsers(userIds, notification, options = {}) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      logger.warn('Invalid or empty userIds array for sendNotificationToUsers');
      return 0;
    }
    
    let sentCount = 0;
    
    for (const userId of userIds) {
      if (this.sendNotification(userId, notification, options)) {
        sentCount++;
      }
    }
    
    return sentCount;
  }

  /**
   * Send notification count update to a user
   * @param {String} userId - User ID
   * @param {Number} count - Unread notification count
   * @returns {Boolean} - Whether update was sent successfully
   */
  updateNotificationCount(userId, count) {
    try {
      if (!userId) {
        throw new SocketOperationError('Missing userId for notification count update', 'unknown');
      }
      
      const connections = this.webSocketService.connections;
      
      // Only proceed if user is connected
      if (connections.has(userId)) {
        // Emit to user's notification room
        this.webSocketService.io.to(`user:${userId}:notifications`)
          .emit('notification_count', { unreadCount: count });
        
        return true;
      }
      
      return false;
    } catch (error) {
      const logError = error instanceof SocketOperationError ? 
        error : 
        new SocketOperationError(`Error updating notification count for user ${userId}`, userId, { 
          originalError: error.message,
          count
        });
      
      logger.error(logError.message, { error: logError });
      return false;
    }
  }

  /**
   * Handle notification read event
   * @param {String} userId - User ID
   * @param {String|Array} notificationIds - Notification ID(s) that were read
   */
  handleNotificationRead(userId, notificationIds) {
    try {
      if (!userId) {
        throw new SocketOperationError('Missing userId for handleNotificationRead', 'unknown');
      }
      
      // Update notification count for the user
      this.updateUnreadCountForUser(userId);
    } catch (error) {
      const logError = error instanceof SocketOperationError ? 
        error : 
        new SocketOperationError(`Error handling notification read for user ${userId}`, userId, { 
          originalError: error.message,
          notificationIds: Array.isArray(notificationIds) ? notificationIds.length : notificationIds
        });
      
      logger.error(logError.message, { error: logError });
    }
  }

  /**
   * Update unread count for a user
   * @param {String} userId - User ID
   */
  async updateUnreadCountForUser(userId) {
    try {
      if (!userId) {
        throw new SocketOperationError('Missing userId for updateUnreadCountForUser', 'unknown');
      }
      
      // Get current unread count
      const unreadCount = await notificationService.getUnreadNotificationCount(userId);
      
      // Update via websocket
      this.updateNotificationCount(userId, unreadCount);
    } catch (error) {
      const logError = error instanceof SocketOperationError ? 
        error : 
        new SocketOperationError(`Error updating unread count for user ${userId}`, userId, { 
          originalError: error.message
        });
      
      logger.error(logError.message, { error: logError });
    }
  }

  /**
   * Get accessibility options for a notification
   * @param {Object} notification - Notification object
   * @param {Object} options - Override options
   * @returns {Object} - Accessibility options
   */
  getAccessibilityOptions(notification, options = {}) {
    // Default importance based on notification type
    let importance = options.importance;
    if (!importance) {
      // Set based on notification type
      switch (notification.type) {
        case 'error':
        case 'payment_failed':
          importance = 'assertive';
          break;
        case 'warning':
          importance = 'assertive';
          break;
        default:
          importance = 'polite';
      }
    }
    
    // Default haptic feedback pattern based on notification type
    let hapticPattern = options.hapticPattern;
    if (!hapticPattern) {
      // Set based on notification type
      switch (notification.type) {
        case 'error':
        case 'payment_failed':
          hapticPattern = 'error';
          break;
        case 'warning':
          hapticPattern = 'warning';
          break;
        case 'success':
        case 'payment_success':
          hapticPattern = 'success';
          break;
        default:
          hapticPattern = 'default';
      }
    }
    
    // Add accessibility description for screen readers if not provided
    const accessibilityDescription = options.accessibilityDescription || 
      notification.message || 
      notification.title;
    
    return {
      importance,
      hapticPattern,
      shouldVibrate: options.vibrate !== undefined ? options.vibrate : true,
      accessibilityDescription,
      // Include any other accessibility metadata
      ...accessibilityMetadata.getAccessibilityAttributes(notification)
    };
  }
}

module.exports = NotificationSocketService;
