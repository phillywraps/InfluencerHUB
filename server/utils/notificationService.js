const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const emailService = require('./emailService');
const queryOptimizer = require('./queryOptimizer');
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Create batch loaders for efficient data fetching
const userLoader = queryOptimizer.createBatchLoader(User, '_id', {
  fields: ['_id', 'email', 'name', 'preferences'],
  cacheResults: true,
  ttl: 300 // 5 minutes cache
});

/**
 * Notification Service - Handles creating and managing notifications
 */
const notificationService = {
/**
 * Create a notification
 * @param {Object} notificationData - Notification data
 * @param {Object} options - Additional options
 * @param {boolean} options.sendRealTime - Whether to send real-time notification (default: true)
 * @param {Object} options.accessibilityOptions - Accessibility options for real-time delivery
 * @returns {Promise<Object>} - Created notification
 */
createNotification: async (notificationData, options = {}) => {
  try {
    // Set defaults for options
    const { 
      sendRealTime = true,
      accessibilityOptions = {}
    } = options;
    
    const notification = await Notification.create(notificationData);
    
    // If email notifications are enabled for this type, send an email
    if (notificationData.sendEmail) {
      const user = await User.findById(notificationData.userId);
      
      if (user && user.email) {
        await emailService.sendEmail({
          to: user.email,
          subject: notificationData.title,
          text: notificationData.message,
          html: `
            <h2>${notificationData.title}</h2>
            <p>${notificationData.message}</p>
            ${notificationData.actionLink ? `<a href="${notificationData.actionLink}">${notificationData.actionText || 'View Details'}</a>` : ''}
          `
        });
      }
    }
    
    // If real-time notifications are enabled, send to connected users via WebSocket
    if (sendRealTime) {
      // Import controller to avoid circular dependency
      const notificationController = require('../controllers/notificationController');
      
      // Set importance based on notification type for accessibility
      let importance;
      switch (notification.type) {
        case 'error':
        case 'payment_failed':
        case 'warning':
          importance = 'assertive';
          break;
        default:
          importance = 'polite';
      }
      
      // Send the notification via WebSocket if the user is connected
      notificationController.sendRealTimeNotification(
        notification, 
        { 
          importance,
          ...accessibilityOptions 
        }
      );
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
},

  /**
   * Create a subscription renewal notification
   * @param {Object} subscription - Subscription data
   * @param {Object} user - User data
   * @param {Number} daysUntilRenewal - Days until renewal
   * @returns {Promise<Object>} - Created notification
   */
  createSubscriptionRenewalNotification: async (subscription, user, daysUntilRenewal) => {
    try {
      const rentalId = subscription.rentalId || subscription.metadata?.rentalId;
      const platform = subscription.platform || subscription.metadata?.platform;
      
      const notificationData = {
        userId: user._id,
        type: 'subscription_renewal',
        title: `Subscription Renewal in ${daysUntilRenewal} days`,
        message: `Your subscription for the ${platform} API key will renew in ${daysUntilRenewal} days. The amount of $${subscription.amount || subscription.plan?.amount / 100} will be charged to your payment method.`,
        data: {
          subscriptionId: subscription.id,
          rentalId,
          platform,
          renewalDate: subscription.current_period_end,
          amount: subscription.amount || subscription.plan?.amount / 100
        },
        actionLink: `/subscriptions`,
        actionText: 'Manage Subscription',
        sendEmail: true
      };
      
      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating subscription renewal notification:', error);
      throw new Error('Failed to create subscription renewal notification');
    }
  },

  /**
   * Create a payment method expiring notification
   * @param {Object} paymentMethod - Payment method data
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Created notification
   */
  createPaymentMethodExpiringNotification: async (paymentMethod, user) => {
    try {
      const notificationData = {
        userId: user._id,
        type: 'payment_method_expiring',
        title: 'Payment Method Expiring Soon',
        message: `Your payment method (${paymentMethod.card.brand} ending in ${paymentMethod.card.last4}) will expire at the end of ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}. Please update your payment method to avoid interruption of service.`,
        data: {
          paymentMethodId: paymentMethod.id,
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year
        },
        actionLink: '/payment-methods',
        actionText: 'Update Payment Method',
        sendEmail: true
      };
      
      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating payment method expiring notification:', error);
      throw new Error('Failed to create payment method expiring notification');
    }
  },

  /**
   * Create a payment success notification
   * @param {Object} transaction - Transaction data
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Created notification
   */
  createPaymentSuccessNotification: async (transaction, user) => {
    try {
      const isSubscription = transaction.isSubscription || false;
      
      const notificationData = {
        userId: user._id,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your ${isSubscription ? 'subscription' : 'one-time'} payment of $${transaction.amount} for the ${transaction.description} was successful.`,
        data: {
          transactionId: transaction._id,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          isSubscription,
          subscriptionId: transaction.subscriptionId
        },
        actionLink: '/transactions',
        actionText: 'View Transaction',
        sendEmail: true
      };
      
      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating payment success notification:', error);
      throw new Error('Failed to create payment success notification');
    }
  },

  /**
   * Create a payment failed notification
   * @param {Object} transaction - Transaction data
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Created notification
   */
  createPaymentFailedNotification: async (transaction, user) => {
    try {
      const isSubscription = transaction.isSubscription || false;
      
      const notificationData = {
        userId: user._id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Your ${isSubscription ? 'subscription' : 'one-time'} payment of $${transaction.amount} for the ${transaction.description} has failed. Please update your payment method.`,
        data: {
          transactionId: transaction._id,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          isSubscription,
          subscriptionId: transaction.subscriptionId,
          errorMessage: transaction.errorMessage
        },
        actionLink: isSubscription ? '/subscriptions' : '/payment-methods',
        actionText: isSubscription ? 'Manage Subscription' : 'Update Payment Method',
        sendEmail: true
      };
      
      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating payment failed notification:', error);
      throw new Error('Failed to create payment failed notification');
    }
  },

    /**
   * Get notifications for a user with optimized querying and pagination
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of notifications
   */
  getUserNotifications: async (userId, options = {}) => {
    try {
      const { 
        limit = 20, 
        skip = 0, 
        unreadOnly = false,
        cursor = null,
        fields = 'title,message,type,createdAt,isRead,actionLink,actionText'
      } = options;

      // Use cursor-based pagination if cursor is provided
      if (cursor) {
        const filter = { userId };
        if (unreadOnly) {
          filter.isRead = false;
        }

        const paginationOptions = {
          limit,
          cursor,
          sortField: 'createdAt',
          sortDirection: 'desc',
          fields,
          cacheKey: `notifications:${userId}:${unreadOnly ? 'unread' : 'all'}`
        };

        const result = await queryOptimizer.paginateWithCursor(
          Notification,
          filter,
          paginationOptions
        );

        return result;
      }
      
      // Use traditional pagination if no cursor is provided (legacy support)
      const query = { userId };
      
      if (unreadOnly) {
        query.isRead = false;
      }
      
      // Use queryOptimizer for caching and performance tracking
      const cacheKey = `notifications:${userId}:${unreadOnly ? 'unread' : 'all'}:${skip}:${limit}`;
      
      let notificationQuery = Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Apply field selection if specified
      if (fields) {
        notificationQuery = queryOptimizer.selectFields(notificationQuery, fields);
      }
      
      const notifications = await queryOptimizer.executeQuery(
        notificationQuery, 
        cacheKey,
        { ttl: 60 } // Short TTL since notifications change frequently
      );
      
      return notifications;
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  },

  /**
   * Mark a notification as read with cache invalidation
   * @param {String} notificationId - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      // Execute update with optimized query
      const notification = await queryOptimizer.executeQuery(
        Notification.findByIdAndUpdate(
          notificationId,
          { isRead: true },
          { new: true }
        ),
        null, // No cache for updates
        { skipCache: true }
      );
      
      // Clear notification cache for this user to reflect changes
      if (notification) {
        // Clear all cached notifications for this user
        const userIdString = notification.userId.toString();
        queryOptimizer.clearQueryCache(`notifications:${userIdString}`);
        
        // Update unread count cache
        queryOptimizer.clearQueryCache(`unread-count:${userIdString}`);
        
        // Update unread count via WebSocket for the user
        const notificationController = require('../controllers/notificationController');
        setTimeout(() => {
          notificationController.sendRealTimeNotification && 
          notificationController.socketService && 
          notificationController.socketService.handleNotificationRead &&
          notificationController.socketService.handleNotificationRead(
            userIdString, 
            notificationId
          );
        }, 0);
      }
      
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  },

  /**
   * Mark all notifications as read for a user with cache invalidation
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Update result
   */
  markAllNotificationsAsRead: async (userId) => {
    try {
      // Convert to mongoose ObjectId if string
      const userIdObj = typeof userId === 'string' ? mongoose.Types.ObjectId(userId) : userId;
      
      // Execute update with optimized query (skip cache for updates)
      const result = await queryOptimizer.executeQuery(
        Notification.updateMany(
          { userId: userIdObj, isRead: false },
          { isRead: true }
        ),
        null,
        { skipCache: true }
      );
      
      // Clear cache for this user
      const userIdString = userIdObj.toString();
      queryOptimizer.clearQueryCache(`notifications:${userIdString}`);
      queryOptimizer.clearQueryCache(`unread-count:${userIdString}`);
      
      // Update unread count via WebSocket
      if (result.modifiedCount > 0) {
        const notificationController = require('../controllers/notificationController');
        setTimeout(() => {
          notificationController.sendRealTimeNotification && 
          notificationController.socketService && 
          notificationController.socketService.updateUnreadCountForUser &&
          notificationController.socketService.updateUnreadCountForUser(userIdString);
        }, 0);
      }
      
      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  },

  /**
   * Delete a notification
   * @param {String} notificationId - Notification ID
   * @returns {Promise<Object>} - Deleted notification
   */
  deleteNotification: async (notificationId) => {
    try {
      const notification = await Notification.findByIdAndDelete(notificationId);
      
      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  },

  /**
   * Get unread notification count for a user with caching
   * @param {String} userId - User ID
   * @returns {Promise<Number>} - Unread notification count
   */
  getUnreadNotificationCount: async (userId) => {
    try {
      // Convert to mongoose ObjectId if string
      const userIdObj = typeof userId === 'string' ? mongoose.Types.ObjectId(userId) : userId;
      const userIdString = userIdObj.toString();
      
      // Use cache for unread counts as they are frequently accessed
      const cacheKey = `unread-count:${userIdString}`;
      
      const count = await queryOptimizer.executeQuery(
        Notification.countDocuments({ userId: userIdObj, isRead: false }),
        cacheKey,
        { ttl: 60 } // Short TTL since notifications change frequently
      );
      
      return count;
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      throw new Error('Failed to get unread notification count');
    }
  },
  
  /**
   * Batch preload notifications and related data for user
   * Used for dashboard and app initialization to reduce multiple queries
   * 
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Preloaded data
   */
  preloadUserNotificationData: async (userId) => {
    try {
      // Preload user data including notifications
      return await queryOptimizer.preloadUserData(
        userId, 
        ['notifications', 'preferences']
      );
    } catch (error) {
      logger.error('Error preloading notification data:', error);
      throw new Error('Failed to preload notification data');
    }
  },
  
  /**
   * Get notification statistics for admin dashboard
   * 
   * @returns {Promise<Object>} - Notification statistics
   */
  getNotificationStats: async () => {
    try {
      const pipeline = [
        {
          $group: {
            _id: { 
              type: '$type',
              isRead: '$isRead'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            readCount: {
              $sum: {
                $cond: [{ $eq: ['$_id.isRead', true] }, '$count', 0]
              }
            },
            unreadCount: {
              $sum: {
                $cond: [{ $eq: ['$_id.isRead', false] }, '$count', 0]
              }
            },
            total: { $sum: '$count' }
          }
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            readCount: 1,
            unreadCount: 1,
            total: 1,
            readRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $divide: ['$readCount', '$total'] }
              ]
            }
          }
        }
      ];
      
      return await queryOptimizer.executeOptimizedAggregation(
        Notification,
        pipeline,
        {
          cacheKey: 'notification-stats',
          ttl: 3600 // Cache for 1 hour
        }
      );
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw new Error('Failed to get notification statistics');
    }
  }
};

module.exports = notificationService;
