const Review = require('../models/reviewModel');
const Rental = require('../models/rentalModel');
const Influencer = require('../models/influencerModel');
const Advertiser = require('../models/advertiserModel');
const User = require('../models/userModel');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { rentalId, rating, comment } = req.body;
    
    // Check if rental exists
    const rental = await Rental.findById(rentalId);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Check if rental is completed
    if (rental.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed rentals'
      });
    }
    
    // Check if user is authorized to review this rental
    let isAuthorized = false;
    let reviewedId;
    
    if (req.user.userType === 'influencer') {
      const influencer = await Influencer.findOne({ userId: req.user._id });
      isAuthorized = influencer && rental.influencerId.toString() === influencer._id.toString();
      
      if (isAuthorized) {
        // Influencer is reviewing advertiser
        const advertiser = await Advertiser.findById(rental.advertiserId);
        reviewedId = advertiser.userId;
      }
    } else if (req.user.userType === 'advertiser') {
      const advertiser = await Advertiser.findOne({ userId: req.user._id });
      isAuthorized = advertiser && rental.advertiserId.toString() === advertiser._id.toString();
      
      if (isAuthorized) {
        // Advertiser is reviewing influencer
        const influencer = await Influencer.findById(rental.influencerId);
        reviewedId = influencer.userId;
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this rental'
      });
    }
    
    // Check if user has already reviewed this rental
    const existingReview = await Review.findOne({
      reviewerId: req.user._id,
      rentalId
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this rental'
      });
    }
    
    // Create review
    const review = await Review.create({
      reviewerId: req.user._id,
      reviewedId,
      rentalId,
      rating,
      comment
    });
    
    // Mark rental as reviewed
    rental.isReviewed = true;
    await rental.save();
    
    // Update user's average rating
    const averageRating = await Review.calculateAverageRating(reviewedId);
    
    if (req.user.userType === 'influencer') {
      // Update advertiser's rating
      const advertiser = await Advertiser.findById(rental.advertiserId);
      advertiser.ratings = averageRating;
      await advertiser.save();
    } else {
      // Update influencer's rating
      const influencer = await Influencer.findById(rental.influencerId);
      influencer.ratings = averageRating;
      await influencer.save();
    }
    
    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get reviews
    const reviews = await Review.find({ reviewedId: userId, isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'reviewerId',
        select: 'username profile userType'
      });
    
    // Get total count
    const totalReviews = await Review.countDocuments({ reviewedId: userId, isPublic: true });
    
    res.json({
      success: true,
      count: reviews.length,
      totalPages: Math.ceil(totalReviews / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get reviews by the current user
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get reviews
    const reviews = await Review.find({ reviewerId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'reviewedId',
        select: 'username profile userType'
      });
    
    // Get total count
    const totalReviews = await Review.countDocuments({ reviewerId: req.user._id });
    
    res.json({
      success: true,
      count: reviews.length,
      totalPages: Math.ceil(totalReviews / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get reviews for the current user
// @route   GET /api/reviews/reviews-of-me
// @access  Private
const getReviewsOfMe = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get reviews
    const reviews = await Review.find({ reviewedId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'reviewerId',
        select: 'username profile userType'
      });
    
    // Get total count
    const totalReviews = await Review.countDocuments({ reviewedId: req.user._id });
    
    res.json({
      success: true,
      count: reviews.length,
      totalPages: Math.ceil(totalReviews / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Respond to a review
// @route   POST /api/reviews/:reviewId/respond
// @access  Private
const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    
    // Check if review exists
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user is the one being reviewed
    if (review.reviewedId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewed user can respond to this review'
      });
    }
    
    // Add response
    review.response = {
      content,
      createdAt: Date.now()
    };
    
    // Save updated review
    await review.save();
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:reviewId/report
// @access  Private
const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    // Check if review exists
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user is the one being reviewed
    if (review.reviewedId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewed user can report this review'
      });
    }
    
    // Mark as reported
    review.isReported = true;
    review.reportReason = reason;
    
    // Save updated review
    await review.save();
    
    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createReview,
  getUserReviews,
  getMyReviews,
  getReviewsOfMe,
  respondToReview,
  reportReview
};
