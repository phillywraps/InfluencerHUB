const mongoose = require('mongoose');

/**
 * Verification Model
 * Stores verification information for influencers
 */
const verificationSchema = new mongoose.Schema(
  {
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Influencer',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['identity', 'social_account', 'professional'],
      required: true,
    },
    documents: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    socialAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialAccount',
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
verificationSchema.index({ influencerId: 1, type: 1 });
verificationSchema.index({ status: 1 });

// Virtual for checking if verification is expired
verificationSchema.virtual('isExpired').get(function () {
  if (this.status === 'approved') {
    // Verifications are valid for 1 year
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    return Date.now() > this.verifiedAt.getTime() + oneYearInMs;
  }
  return false;
});

// Method to check if verification code is valid
verificationSchema.methods.isVerificationCodeValid = function (code) {
  return (
    this.verificationCode === code &&
    this.verificationCodeExpires > Date.now()
  );
};

// Static method to get all verifications for an influencer
verificationSchema.statics.getInfluencerVerifications = async function (influencerId) {
  return this.find({ influencerId }).sort({ createdAt: -1 });
};

// Static method to check if an influencer is fully verified
verificationSchema.statics.isInfluencerVerified = async function (influencerId) {
  const verifications = await this.find({
    influencerId,
    status: 'approved',
  });
  
  // Check if the influencer has all required verification types
  const hasIdentityVerification = verifications.some(v => v.type === 'identity');
  const hasSocialAccountVerification = verifications.some(v => v.type === 'social_account');
  
  return hasIdentityVerification && hasSocialAccountVerification;
};

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
