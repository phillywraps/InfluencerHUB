const crypto = require('crypto');
const Verification = require('../models/verificationModel');
const Influencer = require('../models/influencerModel');
const emailService = require('./emailService');
const logger = require('../config/logger');

/**
 * Verification Service
 * Handles verification-related operations
 */
const verificationService = {
  /**
   * Generate a random verification code
   * @returns {string} - 6-digit verification code
   */
  generateVerificationCode: () => {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Generate a verification token
   * @returns {string} - Random token
   */
  generateVerificationToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Create a new verification request
   * @param {Object} data - Verification data
   * @returns {Promise<Object>} - Created verification
   */
  createVerification: async (data) => {
    try {
      // Check if there's already a pending verification of the same type
      const existingVerification = await Verification.findOne({
        influencerId: data.influencerId,
        type: data.type,
        status: 'pending',
      });

      if (existingVerification) {
        // Update the existing verification
        Object.assign(existingVerification, data);
        await existingVerification.save();
        return existingVerification;
      }

      // Create a new verification
      const verification = new Verification(data);
      await verification.save();
      return verification;
    } catch (error) {
      logger.error('Error creating verification:', error);
      throw error;
    }
  },

  /**
   * Send verification code via email
   * @param {Object} verification - Verification document
   * @param {Object} user - User document
   * @returns {Promise<boolean>} - Success status
   */
  sendVerificationCode: async (verification, user) => {
    try {
      // Generate a verification code
      const code = verificationService.generateVerificationCode();
      
      // Set the code and expiration (30 minutes)
      verification.verificationCode = code;
      verification.verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000);
      await verification.save();

      // Send the code via email
      const emailSent = await emailService.sendEmail({
        to: user.email,
        subject: 'Your Verification Code',
        template: 'verification-code',
        context: {
          name: user.username,
          code,
          verificationType: verification.type.replace('_', ' '),
          expiresIn: '30 minutes',
        },
      });

      return emailSent;
    } catch (error) {
      logger.error('Error sending verification code:', error);
      throw error;
    }
  },

  /**
   * Verify a social media account
   * @param {string} influencerId - Influencer ID
   * @param {string} socialAccountId - Social account ID
   * @param {string} code - Verification code
   * @returns {Promise<Object>} - Updated verification
   */
  verifySocialAccount: async (influencerId, socialAccountId, code) => {
    try {
      // Find the verification
      const verification = await Verification.findOne({
        influencerId,
        socialAccountId,
        type: 'social_account',
        status: 'pending',
      });

      if (!verification) {
        throw new Error('Verification not found');
      }

      // Check if the code is valid
      if (!verification.isVerificationCodeValid(code)) {
        throw new Error('Invalid or expired verification code');
      }

      // Update the verification
      verification.status = 'approved';
      verification.verifiedAt = new Date();
      await verification.save();

      // Update the social account
      const influencer = await Influencer.findById(influencerId);
      const socialAccount = influencer.socialAccounts.id(socialAccountId);
      
      if (socialAccount) {
        socialAccount.isVerified = true;
        socialAccount.verifiedAt = new Date();
        await influencer.save();
      }

      return verification;
    } catch (error) {
      logger.error('Error verifying social account:', error);
      throw error;
    }
  },

  /**
   * Verify identity documents
   * @param {string} verificationId - Verification ID
   * @param {string} adminId - Admin user ID
   * @param {boolean} approved - Approval status
   * @param {string} notes - Review notes
   * @returns {Promise<Object>} - Updated verification
   */
  reviewIdentityVerification: async (verificationId, adminId, approved, notes = '') => {
    try {
      // Find the verification
      const verification = await Verification.findById(verificationId);

      if (!verification || verification.type !== 'identity') {
        throw new Error('Identity verification not found');
      }

      // Update the verification
      verification.status = approved ? 'approved' : 'rejected';
      verification.reviewedBy = adminId;
      verification.notes = notes;
      
      if (approved) {
        verification.verifiedAt = new Date();
      } else {
        verification.rejectedAt = new Date();
        verification.rejectionReason = notes;
      }
      
      await verification.save();

      // Update the influencer's verification status
      const influencer = await Influencer.findById(verification.influencerId);
      
      if (influencer) {
        influencer.isIdentityVerified = approved;
        if (approved) {
          influencer.identityVerifiedAt = new Date();
        }
        await influencer.save();
      }

      // Send notification email
      const user = await User.findById(influencer.userId);
      if (user) {
        await emailService.sendEmail({
          to: user.email,
          subject: approved ? 'Identity Verification Approved' : 'Identity Verification Rejected',
          template: approved ? 'identity-approved' : 'identity-rejected',
          context: {
            name: user.username,
            reason: notes,
          },
        });
      }

      return verification;
    } catch (error) {
      logger.error('Error reviewing identity verification:', error);
      throw error;
    }
  },

  /**
   * Check if an influencer is verified
   * @param {string} influencerId - Influencer ID
   * @returns {Promise<Object>} - Verification status
   */
  getInfluencerVerificationStatus: async (influencerId) => {
    try {
      const verifications = await Verification.find({
        influencerId,
        status: 'approved',
      });

      const identityVerified = verifications.some(v => v.type === 'identity');
      
      // Count verified social accounts
      const socialAccountVerifications = verifications.filter(
        v => v.type === 'social_account'
      );
      
      // Get the influencer to check total social accounts
      const influencer = await Influencer.findById(influencerId);
      const totalSocialAccounts = influencer?.socialAccounts?.length || 0;
      
      return {
        isIdentityVerified: identityVerified,
        verifiedSocialAccounts: socialAccountVerifications.length,
        totalSocialAccounts,
        isFullyVerified: identityVerified && socialAccountVerifications.length > 0,
        verifications,
      };
    } catch (error) {
      logger.error('Error getting influencer verification status:', error);
      throw error;
    }
  },

  /**
   * Get all pending verifications
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Paginated verifications
   */
  getPendingVerifications: async (page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;
      
      const verifications = await Verification.find({ status: 'pending' })
        .sort({ createdAt: 1 }) // Oldest first
        .skip(skip)
        .limit(limit)
        .populate('influencerId', 'userId')
        .populate({
          path: 'influencerId',
          populate: {
            path: 'userId',
            select: 'username email',
          },
        });
      
      const total = await Verification.countDocuments({ status: 'pending' });
      
      return {
        verifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting pending verifications:', error);
      throw error;
    }
  },
};

module.exports = verificationService;
