const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  enableTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
  verifyTwoFactorLogin,
  generateNewRecoveryCodes
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const {
  loginRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
  registrationRateLimiter
} = require('../middleware/rateLimiterMiddleware');

// Public routes with rate limiting
router.post('/register', registrationRateLimiter, registerUser);
router.post('/login', loginRateLimiter, loginUser);
router.post('/verify-2fa', loginRateLimiter, verifyTwoFactorLogin);
router.get('/verify-email/:token', emailVerificationRateLimiter, verifyEmail);
router.post('/resend-verification', emailVerificationRateLimiter, resendVerificationEmail);
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/reset-password/:token', passwordResetRateLimiter, resetPassword);

// Protected routes (require authentication)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, changePassword);

// Two-factor authentication routes
router.post('/enable-2fa', protect, enableTwoFactor);
router.post('/verify-2fa-setup', protect, verifyTwoFactorSetup);
router.post('/disable-2fa', protect, disableTwoFactor);
router.post('/generate-recovery-codes', protect, generateNewRecoveryCodes);

module.exports = router;
