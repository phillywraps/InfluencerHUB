const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { protect, influencerOnly, adminOnly } = require('../middleware/authMiddleware');

/**
 * Verification Routes
 * Base URL: /api/verifications
 */

// Public routes
// None

// Protected routes (all users)
// None

// Protected routes (influencers only)
router.post(
  '/identity',
  protect,
  influencerOnly,
  verificationController.initiateIdentityVerification
);

router.post(
  '/:id/documents',
  protect,
  influencerOnly,
  verificationController.uploadVerificationDocuments
);

router.post(
  '/social-account',
  protect,
  influencerOnly,
  verificationController.initiateSocialAccountVerification
);

router.post(
  '/social-account/verify',
  protect,
  influencerOnly,
  verificationController.verifySocialAccount
);

router.post(
  '/:id/resend-code',
  protect,
  influencerOnly,
  verificationController.resendVerificationCode
);

router.get(
  '/status',
  protect,
  influencerOnly,
  verificationController.getVerificationStatus
);

router.get(
  '/',
  protect,
  influencerOnly,
  verificationController.getInfluencerVerifications
);

// Protected routes (influencers or admins)
router.get(
  '/:id',
  protect,
  (req, res, next) => {
    if (req.user.userType === 'influencer' || req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This route is for influencers or admins only.'
      });
    }
  },
  verificationController.getVerificationById
);

// Protected routes (admins only)
router.get(
  '/admin/pending',
  protect,
  adminOnly,
  verificationController.getPendingVerifications
);

router.post(
  '/:id/review',
  protect,
  adminOnly,
  verificationController.reviewIdentityVerification
);

module.exports = router;
