const User = require('../models/userModel');
const Influencer = require('../models/influencerModel');
const Advertiser = require('../models/advertiserModel');
const emailService = require('../utils/emailService');
const twoFactorService = require('../utils/twoFactorService');
const crypto = require('crypto');
const { 
  wrap, 
  createValidationError,
  createResourceNotFoundError,
  createAuthenticationError,
  createAuthorizationError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = wrap(async (req, res) => {
  const { username, email, password, userType } = req.body;
  
  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw createValidationError(
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
      { field: 'password', requirement: 'Password complexity not met' }
    );
  }
  
  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  
  if (userExists) {
    throw createValidationError(
      'User with this email or username already exists',
      { email, username }
    );
  }
  
  // Create user
  const user = await User.create({
    username,
    email,
    password,
    userType
  });
  
  // Create associated profile based on user type
  if (userType === 'influencer') {
    await Influencer.create({
      userId: user._id
    });
  } else if (userType === 'advertiser') {
    await Advertiser.create({
      userId: user._id
    });
  }
  
  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();
  
  // Send verification email
  await emailService.sendVerificationEmail({
    to: user.email,
    username: user.username,
    token: verificationToken
  });
  
  // Generate JWT token
  const token = user.generateAuthToken();
  
  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      profile: user.profile,
      isEmailVerified: user.isEmailVerified,
      token
    },
    message: 'Registration successful. Please check your email to verify your account.'
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = wrap(async (req, res) => {
  const { email, password, twoFactorCode } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email }).select('+password +twoFactorSecret');
  
  // If no user found, return generic error
  if (!user) {
    throw createAuthenticationError('Invalid email or password');
  }
  
  // Check if account is locked
  if (user.isLocked()) {
    const lockTime = new Date(user.lockUntil);
    throw createAuthenticationError(
      `Account is locked due to too many failed attempts. Try again after ${lockTime.toLocaleTimeString()}`,
      { lockUntil: user.lockUntil }
    );
  }
  
  // Check if password matches
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    // Increment login attempts on failure
    await user.incrementLoginAttempts();
    
    throw createAuthenticationError('Invalid email or password');
  }
  
  // Check if email is verified
  if (!user.isEmailVerified) {
    throw createAuthenticationError(
      'Please verify your email address before logging in',
      { requiresVerification: true }
    );
  }
  
  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // If no 2FA code provided, return a response indicating 2FA is required
    if (!twoFactorCode) {
      // Generate a temporary token for 2FA verification
      const tempToken = user.generateTwoFactorTempToken();
      await user.save();
      
      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        tempToken,
        message: 'Two-factor authentication code required'
      });
    }
    
    // Verify the 2FA code
    const isValidCode = twoFactorService.verifyToken(twoFactorCode, user.twoFactorSecret);
    
    if (!isValidCode) {
      throw createAuthenticationError('Invalid two-factor authentication code');
    }
  }
  
  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  
  // Update last login timestamp
  user.lastLogin = Date.now();
  await user.save();
  
  // Generate token
  const token = user.generateAuthToken();
  
  res.json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      profile: user.profile,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      token
    }
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = wrap(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  res.json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      profile: user.profile
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = wrap(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Update basic user info
  user.username = req.body.username || user.username;
  user.email = req.body.email || user.email;
  
  // Update profile fields
  user.profile.name = req.body.name || user.profile.name;
  user.profile.bio = req.body.bio || user.profile.bio;
  user.profile.avatar = req.body.avatar || user.profile.avatar;
  user.profile.location = req.body.location || user.profile.location;
  
  // Save updated user
  const updatedUser = await user.save();
  
  // Generate new token
  const token = updatedUser.generateAuthToken();
  
  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      userType: updatedUser.userType,
      profile: updatedUser.profile,
      token
    }
  });
});

// @desc    Change user password
// @route   PUT /api/users/password
// @access  Private
const changePassword = wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Find user
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Check if current password is correct
  if (!(await user.matchPassword(currentPassword))) {
    throw createAuthenticationError('Current password is incorrect');
  }
  
  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw createValidationError(
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
      { field: 'newPassword', requirement: 'Password complexity not met' }
    );
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Verify email address
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = wrap(async (req, res) => {
  const { token } = req.params;
  
  // Hash the token from the URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with matching token and token not expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw createValidationError('Invalid or expired verification token', { token });
  }
  
  // Update user
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  
  // Send welcome email
  await emailService.sendWelcomeEmail({
    to: user.email,
    username: user.username,
    userType: user.userType
  });
  
  // Generate new token with updated verification status
  const authToken = user.generateAuthToken();
  
  res.json({
    success: true,
    message: 'Email verified successfully',
    data: {
      token: authToken,
      isEmailVerified: true
    }
  });
});

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Public
const resendVerificationEmail = wrap(async (req, res) => {
  const { email } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    throw createResourceNotFoundError('User with email', email);
  }
  
  // Check if email is already verified
  if (user.isEmailVerified) {
    throw createValidationError('Email is already verified', { email });
  }
  
  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();
  
  // Send verification email
  await emailService.sendVerificationEmail({
    to: user.email,
    username: user.username,
    token: verificationToken
  });
  
  res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
});

// @desc    Request password reset
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = wrap(async (req, res) => {
  const { email } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    throw createResourceNotFoundError('User with email', email);
  }
  
  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();
  
  // Send password reset email
  await emailService.sendPasswordResetEmail({
    to: user.email,
    username: user.username,
    token: resetToken
  });
  
  res.json({
    success: true,
    message: 'Password reset email sent successfully'
  });
});

// @desc    Reset password
// @route   POST /api/users/reset-password/:token
// @access  Public
const resetPassword = wrap(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw createValidationError(
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
      { field: 'password', requirement: 'Password complexity not met' }
    );
  }
  
  // Hash the token from the URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with matching token and token not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw createValidationError('Invalid or expired reset token', { token });
  }
  
  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  // Reset login attempts
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Verify 2FA code during login
// @route   POST /api/users/verify-2fa
// @access  Public
const verifyTwoFactorLogin = wrap(async (req, res) => {
  const { tempToken, twoFactorCode, recoveryCode } = req.body;
  
  if (!tempToken || (!twoFactorCode && !recoveryCode)) {
    throw createValidationError('Missing required fields', {
      requiredFields: ['tempToken', 'either twoFactorCode or recoveryCode']
    });
  }
  
  // Hash the token from the request
  const hashedToken = crypto
    .createHash('sha256')
    .update(tempToken)
    .digest('hex');
  
  // Find user with matching token and token not expired
  const user = await User.findOne({
    twoFactorTempToken: hashedToken,
    twoFactorTempTokenExpires: { $gt: Date.now() }
  }).select('+twoFactorSecret +recoveryCodes');
  
  if (!user) {
    throw createValidationError('Invalid or expired token', { tempToken });
  }
  
  let isValid = false;
  
  // Check if using recovery code
  if (recoveryCode) {
    isValid = user.verifyRecoveryCode(recoveryCode);
    if (isValid) {
      await user.save(); // Save to update the used recovery code status
    }
  } else {
    // Verify the 2FA code
    isValid = twoFactorService.verifyToken(twoFactorCode, user.twoFactorSecret);
  }
  
  if (!isValid) {
    throw createAuthenticationError(
      recoveryCode ? 'Invalid recovery code' : 'Invalid two-factor authentication code'
    );
  }
  
  // Clear the temporary token
  user.twoFactorTempToken = undefined;
  user.twoFactorTempTokenExpires = undefined;
  
  // Update last login timestamp
  user.lastLogin = Date.now();
  await user.save();
  
  // Generate token
  const token = user.generateAuthToken();
  
  res.json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      profile: user.profile,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      token
    }
  });
});

// @desc    Enable 2FA for a user
// @route   POST /api/users/enable-2fa
// @access  Private
const enableTwoFactor = wrap(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Check if 2FA is already enabled
  if (user.twoFactorEnabled) {
    throw createValidationError('Two-factor authentication is already enabled');
  }
  
  // Generate a new secret
  const secret = twoFactorService.generateSecret(user.username);
  
  // Generate QR code
  const qrCode = await twoFactorService.generateQRCode(secret.otpauth_url);
  
  // Save the secret to the user
  user.twoFactorSecret = secret.base32;
  await user.save();
  
  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode
    },
    message: 'Two-factor authentication setup initiated'
  });
});

// @desc    Verify and complete 2FA setup
// @route   POST /api/users/verify-2fa-setup
// @access  Private
const verifyTwoFactorSetup = wrap(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    throw createValidationError('Token is required', { fields: ['token'] });
  }
  
  const user = await User.findById(req.user._id).select('+twoFactorSecret');
  
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Check if 2FA is already enabled
  if (user.twoFactorEnabled) {
    throw createValidationError('Two-factor authentication is already enabled');
  }
  
  // Verify the token
  const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);
  
  if (!isValid) {
    throw createValidationError('Invalid verification code');
  }
  
  // Generate recovery codes
  const recoveryCodes = user.generateRecoveryCodes();
  
  // Enable 2FA
  user.twoFactorEnabled = true;
  await user.save();
  
  res.json({
    success: true,
    data: {
      recoveryCodes
    },
    message: 'Two-factor authentication enabled successfully'
  });
});

// @desc    Disable 2FA for a user
// @route   POST /api/users/disable-2fa
// @access  Private
const disableTwoFactor = wrap(async (req, res) => {
  const { password, token } = req.body;
  
  if (!password) {
    throw createValidationError('Password is required', { fields: ['password'] });
  }
  
  const user = await User.findById(req.user._id).select('+password +twoFactorSecret');
  
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Check if 2FA is enabled
  if (!user.twoFactorEnabled) {
    throw createValidationError('Two-factor authentication is not enabled');
  }
  
  // Verify password
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    throw createAuthenticationError('Invalid password');
  }
  
  // Verify the token if provided
  if (token) {
    const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);
    
    if (!isValid) {
      throw createAuthenticationError('Invalid verification code');
    }
  }
  
  // Disable 2FA
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.recoveryCodes = undefined;
  user.recoveryCodesUsed = undefined;
  await user.save();
  
  res.json({
    success: true,
    message: 'Two-factor authentication disabled successfully'
  });
});

// @desc    Generate new recovery codes
// @route   POST /api/users/generate-recovery-codes
// @access  Private
const generateNewRecoveryCodes = wrap(async (req, res) => {
  const { password, token } = req.body;
  
  if (!password || !token) {
    throw createValidationError('Password and verification code are required', {
      fields: { password: !password, token: !token }
    });
  }
  
  const user = await User.findById(req.user._id).select('+password +twoFactorSecret');
  
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Check if 2FA is enabled
  if (!user.twoFactorEnabled) {
    throw createValidationError('Two-factor authentication is not enabled');
  }
  
  // Verify password
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    throw createAuthenticationError('Invalid password');
  }
  
  // Verify the token
  const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);
  
  if (!isValid) {
    throw createAuthenticationError('Invalid verification code');
  }
  
  // Generate new recovery codes
  const recoveryCodes = user.generateRecoveryCodes();
  await user.save();
  
  res.json({
    success: true,
    data: {
      recoveryCodes
    },
    message: 'New recovery codes generated successfully'
  });
});

module.exports = {
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
};
