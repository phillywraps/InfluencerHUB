const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  createTestNotification
} = require('../controllers/notificationController');

// Protected routes
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadNotificationCount);
router.put('/:id/read', protect, markNotificationAsRead);
router.put('/read-all', protect, markAllNotificationsAsRead);
router.delete('/:id', protect, deleteNotification);

// Admin routes
router.post('/test', protect, adminOnly, createTestNotification);

module.exports = router;
