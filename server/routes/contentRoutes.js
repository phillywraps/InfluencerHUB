const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
  getContentItems,
  getContentItem,
  createContent,
  updateContentStatus,
  deleteContent,
  getContentComments,
  addContentComment,
  deleteContentComment,
  getContentActivities
} = require('../controllers/contentController');

// Base Route: /api/teams/:teamId/collaborationSpaces/:spaceId/content

// Content routes
router.route('/')
  .get(protect, getContentItems)
  .post(protect, createContent);

router.route('/:contentId')
  .get(protect, getContentItem)
  .delete(protect, deleteContent);

router.route('/:contentId/status')
  .put(protect, updateContentStatus);

// Comments routes
router.route('/:contentId/comments')
  .get(protect, getContentComments)
  .post(protect, addContentComment);

router.route('/:contentId/comments/:commentId')
  .delete(protect, deleteContentComment);

// Activities routes
router.route('/:contentId/activities')
  .get(protect, getContentActivities);

module.exports = router;
