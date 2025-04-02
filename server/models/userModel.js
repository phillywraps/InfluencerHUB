const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  userType: {
    type: String,
    required: true,
    enum: ['influencer', 'advertiser']
  },
  profile: {
    name: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true
    },
    avatar: {
      type: String
    },
    location: {
      type: String,
      trim: true
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorTempToken: {
    type: String,
    select: false
  },
  twoFactorTempTokenExpires: {
    type: Date
  },
  recoveryCodes: {
    type: [String],
    select: false
  },
  recoveryCodesUsed: {
    type: [Boolean],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, userType: this.userType, isEmailVerified: this.isEmailVerified },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  // Token expires in 24 hours
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Token expires in 1 hour
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  
  return resetToken;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  // Check for a future lockUntil timestamp
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, reset the count
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    return await this.save();
  }
  
  // Otherwise increment login attempts
  this.loginAttempts += 1;
  
  // Lock the account if we've reached max attempts (5)
  if (this.loginAttempts >= 5) {
    // Lock for 1 hour
    this.lockUntil = Date.now() + 60 * 60 * 1000;
  }
  
  return await this.save();
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return await this.save();
};

// Generate 2FA temporary token
userSchema.methods.generateTwoFactorTempToken = function() {
  const tempToken = crypto.randomBytes(20).toString('hex');
  
  this.twoFactorTempToken = crypto
    .createHash('sha256')
    .update(tempToken)
    .digest('hex');
    
  // Token expires in 10 minutes
  this.twoFactorTempTokenExpires = Date.now() + 10 * 60 * 1000;
  
  return tempToken;
};

// Generate recovery codes
userSchema.methods.generateRecoveryCodes = function() {
  const codes = [];
  const usedStatus = [];
  
  // Generate 10 recovery codes
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(10).toString('hex').toUpperCase();
    // Format as XXXX-XXXX-XXXX
    const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 12)}`;
    codes.push(formattedCode);
    usedStatus.push(false);
  }
  
  this.recoveryCodes = codes;
  this.recoveryCodesUsed = usedStatus;
  
  return codes;
};

// Verify recovery code
userSchema.methods.verifyRecoveryCode = function(code) {
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  
  for (let i = 0; i < this.recoveryCodes.length; i++) {
    const storedCode = this.recoveryCodes[i].replace(/-/g, '');
    
    if (storedCode === normalizedCode && !this.recoveryCodesUsed[i]) {
      // Mark code as used
      this.recoveryCodesUsed[i] = true;
      return true;
    }
  }
  
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
