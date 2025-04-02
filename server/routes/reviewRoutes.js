const express = require('express');
const router = express.Router();
const {
  createReview,
  getUserReviews,
  getMyReviews,
  getReviewsOfMe,
  respondToReview,
  reportReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/user/:userId', getUserReviews);

// Protected routes
router.use(protect);

// Create a review
router.post('/', createReview);

// Get reviews by the current user
router.get('/my-reviews', getMyReviews);

// Get reviews for the current user
router.get('/reviews-of-me', getReviewsOfMe);

// Respond to a review
router.post('/:reviewId/respond', respondToReview);

// Report a review
router.post('/:reviewId/report', reportReview);

module.exports = router;
