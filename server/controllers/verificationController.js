const Verification = require('../models/verificationModel');
const Influencer = require('../models/influencerModel');
const User = require('../models/userModel');
const verificationService = require('../utils/verificationService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verification Controller
 * Handles verification-related API endpoints
 */
const verificationController = {
  /**
   * @desc    Initiate identity verification
   * @route   POST /api/verifications/identity
   * @access  Private (Influencers only)
   */
  initiateIdentityVerification: asyncHandler(async (req, res) => {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      res.status(404);
      throw new Error('Influencer profile not found');
    }

    // Create a new verification request
    const verification = await verificationService.createVerification({
      influencerId: influencer._id,
      type: 'identity',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: verification,
    });
  }),

  /**
   * @desc    Upload identity verification documents
   * @route   POST /api/verifications/:id/documents
   * @access  Private (Influencers only)
   */
  uploadVerificationDocuments: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      res.status(400);
      throw new Error('Please provide at least one document');
    }

    const verification = await Verification.findById(id);
    
    if (!verification) {
      res.status(404);
      throw new Error('Verification request not found');
    }

    // Check if the verification belongs to the user
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer || verification.influencerId.toString() !== influencer._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to upload documents for this verification');
    }

    // Add the documents to the verification
    verification.documents = documents;
    await verification.save();

    res.status(200).json({
      success: true,
      data: verification,
    });
  }),

  /**
   * @desc    Initiate social account verification
   * @route   POST /api/verifications/social-account
   * @access  Private (Influencers only)
   */
  initiateSocialAccountVerification: asyncHandler(async (req, res) => {
    const { socialAccountId } = req.body;

    if (!socialAccountId) {
      res.status(400);
      throw new Error('Please provide a social account ID');
    }

    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      res.status(404);
      throw new Error('Influencer profile not found');
    }

    // Check if the social account exists
    const socialAccount = influencer.socialAccounts.id(socialAccountId);
    
    if (!socialAccount) {
      res.status(404);
      throw new Error('Social account not found');
    }

    // Create a new verification request
    const verification = await verificationService.createVerification({
      influencerId: influencer._id,
      type: 'social_account',
      socialAccountId,
      status: 'pending',
    });

    // Send verification code
    await verificationService.sendVerificationCode(verification, req.user);

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email',
      data: {
        verificationId: verification._id,
      },
    });
  }),

  /**
   * @desc    Verify social account with code
   * @route   POST /api/verifications/social-account/verify
   * @access  Private (Influencers only)
   */
  verifySocialAccount: asyncHandler(async (req, res) => {
    const { verificationId, code } = req.body;

    if (!verificationId || !code) {
      res.status(400);
      throw new Error('Please provide verification ID and code');
    }

    const verification = await Verification.findById(verificationId);
    
    if (!verification || verification.type !== 'social_account') {
      res.status(404);
      throw new Error('Verification not found');
    }

    // Check if the verification belongs to the user
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer || verification.influencerId.toString() !== influencer._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to verify this social account');
    }

    // Verify the social account
    try {
      await verificationService.verifySocialAccount(
        influencer._id,
        verification.socialAccountId,
        code
      );

      res.status(200).json({
        success: true,
        message: 'Social account verified successfully',
      });
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }),

  /**
   * @desc    Resend verification code
   * @route   POST /api/verifications/:id/resend-code
   * @access  Private (Influencers only)
   */
  resendVerificationCode: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const verification = await Verification.findById(id);
    
    if (!verification) {
      res.status(404);
      throw new Error('Verification not found');
    }

    // Check if the verification belongs to the user
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer || verification.influencerId.toString() !== influencer._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to resend code for this verification');
    }

    // Send verification code
    await verificationService.sendVerificationCode(verification, req.user);

    res.status(200).json({
      success: true,
      message: 'Verification code resent to your email',
    });
  }),

  /**
   * @desc    Get verification status
   * @route   GET /api/verifications/status
   * @access  Private (Influencers only)
   */
  getVerificationStatus: asyncHandler(async (req, res) => {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      res.status(404);
      throw new Error('Influencer profile not found');
    }

    // Get verification status
    const status = await verificationService.getInfluencerVerificationStatus(influencer._id);

    res.status(200).json({
      success: true,
      data: status,
    });
  }),

  /**
   * @desc    Get all verifications for an influencer
   * @route   GET /api/verifications
   * @access  Private (Influencers only)
   */
  getInfluencerVerifications: asyncHandler(async (req, res) => {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      res.status(404);
      throw new Error('Influencer profile not found');
    }

    // Get all verifications
    const verifications = await Verification.getInfluencerVerifications(influencer._id);

    res.status(200).json({
      success: true,
      data: verifications,
    });
  }),

  /**
   * @desc    Get verification by ID
   * @route   GET /api/verifications/:id
   * @access  Private (Influencers or Admins)
   */
  getVerificationById: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const verification = await Verification.findById(id)
      .populate('influencerId', 'userId')
      .populate({
        path: 'influencerId',
        populate: {
          path: 'userId',
          select: 'username email',
        },
      });
    
    if (!verification) {
      res.status(404);
      throw new Error('Verification not found');
    }

    // Check if the user is authorized to view this verification
    if (req.user.role !== 'admin') {
      const influencer = await Influencer.findOne({ userId: req.user._id });
      
      if (!influencer || verification.influencerId._id.toString() !== influencer._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this verification');
      }
    }

    res.status(200).json({
      success: true,
      data: verification,
    });
  }),

  /**
   * @desc    Get all pending verifications (Admin only)
   * @route   GET /api/verifications/admin/pending
   * @access  Private (Admins only)
   */
  getPendingVerifications: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get pending verifications
    const result = await verificationService.getPendingVerifications(page, limit);

    res.status(200).json({
      success: true,
      data: result.verifications,
      pagination: result.pagination,
    });
  }),

  /**
   * @desc    Review identity verification (Admin only)
   * @route   POST /api/verifications/:id/review
   * @access  Private (Admins only)
   */
  reviewIdentityVerification: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approved, notes } = req.body;

    if (approved === undefined) {
      res.status(400);
      throw new Error('Please provide approval status');
    }

    // Review the verification
    try {
      const verification = await verificationService.reviewIdentityVerification(
        id,
        req.user._id,
        approved,
        notes
      );

      res.status(200).json({
        success: true,
        message: approved ? 'Verification approved' : 'Verification rejected',
        data: verification,
      });
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }),
};

module.exports = verificationController;
