const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes that require authentication
const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if email is verified
      if (!req.user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please verify your email to access this resource.',
          requiresVerification: true
        });
      }
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Middleware to restrict access to specific user types
const restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `User type '${req.user.userType}' is not authorized to access this resource`
      });
    }
    next();
  };
};

// Middleware for influencer-only routes
const influencerOnly = (req, res, next) => {
  if (req.user.userType !== 'influencer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This route is for influencers only.'
    });
  }
  next();
};

// Middleware for advertiser-only routes
const advertiserOnly = (req, res, next) => {
  if (req.user.userType !== 'advertiser') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This route is for advertisers only.'
    });
  }
  next();
};

// Middleware for admin-only routes
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This route is for admins only.'
    });
  }
  next();
};

module.exports = { 
  protect, 
  restrictTo,
  influencerOnly,
  advertiserOnly,
  adminOnly
};
