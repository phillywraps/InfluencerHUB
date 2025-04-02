const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessageAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Conversation routes
router.get('/conversations', getConversations);
router.get('/conversations/:userId', getOrCreateConversation);

// Message routes
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.put('/:messageId/read', markMessageAsRead);

module.exports = router;
