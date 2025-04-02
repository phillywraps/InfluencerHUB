const Advertiser = require('../models/advertiserModel');
const User = require('../models/userModel');
const logger = require('../config/logger');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createConflictError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

// @desc    Get advertiser profile
// @route   GET /api/advertisers/profile
// @access  Private (Advertiser only)
const getAdvertiserProfile = wrap(async (req, res) => {
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Return without payment details for security
  const sanitizedAdvertiser = await Advertiser.findOne({ userId: req.user._id })
    .select('-paymentMethods.details');
  
  return res.json({
    success: true,
    data: sanitizedAdvertiser
  });
});

// @desc    Update advertiser profile
// @route   PUT /api/advertisers/profile
// @access  Private (Advertiser only)
const updateAdvertiserProfile = wrap(async (req, res) => {
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Update company information
  if (req.body.company) {
    advertiser.company = {
      ...advertiser.company,
      ...req.body.company
    };
  }
  
  // Save updated advertiser
  const updatedAdvertiser = await advertiser.save();
  
  // Return without payment details for security
  const sanitizedAdvertiser = await Advertiser.findOne({ userId: req.user._id })
    .select('-paymentMethods.details');
  
  return res.json({
    success: true,
    data: sanitizedAdvertiser
  });
});

// @desc    Add payment method
// @route   POST /api/advertisers/payment-methods
// @access  Private (Advertiser only)
const addPaymentMethod = wrap(async (req, res) => {
  const { type, details, isDefault } = req.body;
  
  if (!type || !details) {
    throw createValidationError('Payment type and details are required', {
      fields: { type: !type, details: !details }
    });
  }
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // If this is the first payment method or isDefault is true, set all others to false
  if (isDefault || advertiser.paymentMethods.length === 0) {
    advertiser.paymentMethods.forEach(method => {
      method.isDefault = false;
    });
  }
  
  // Add new payment method
  advertiser.paymentMethods.push({
    type,
    details,
    isDefault: isDefault || advertiser.paymentMethods.length === 0
  });
  
  // Save updated advertiser
  await advertiser.save();
  
  // Return without payment details for security
  const sanitizedAdvertiser = await Advertiser.findOne({ userId: req.user._id })
    .select('-paymentMethods.details');
  
  return res.status(201).json({
    success: true,
    data: sanitizedAdvertiser
  });
});

// @desc    Update payment method
// @route   PUT /api/advertisers/payment-methods/:methodId
// @access  Private (Advertiser only)
const updatePaymentMethod = wrap(async (req, res) => {
  const { methodId } = req.params;
  const { type, details, isDefault } = req.body;
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the payment method to update
  const methodIndex = advertiser.paymentMethods.findIndex(
    method => method._id.toString() === methodId
  );
  
  if (methodIndex === -1) {
    throw createResourceNotFoundError('Payment method', methodId);
  }
  
  // Update payment method fields
  if (type) {
    advertiser.paymentMethods[methodIndex].type = type;
  }
  
  if (details) {
    advertiser.paymentMethods[methodIndex].details = details;
  }
  
  // If setting this method as default, set all others to false
  if (isDefault) {
    advertiser.paymentMethods.forEach((method, index) => {
      method.isDefault = index === methodIndex;
    });
  }
  
  // Save updated advertiser
  await advertiser.save();
  
  // Return without payment details for security
  const sanitizedAdvertiser = await Advertiser.findOne({ userId: req.user._id })
    .select('-paymentMethods.details');
  
  return res.json({
    success: true,
    data: sanitizedAdvertiser
  });
});

// @desc    Delete payment method
// @route   DELETE /api/advertisers/payment-methods/:methodId
// @access  Private (Advertiser only)
const deletePaymentMethod = wrap(async (req, res) => {
  const { methodId } = req.params;
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the payment method to delete
  const methodIndex = advertiser.paymentMethods.findIndex(
    method => method._id.toString() === methodId
  );
  
  if (methodIndex === -1) {
    throw createResourceNotFoundError('Payment method', methodId);
  }
  
  // Check if this is the default method
  const isDefault = advertiser.paymentMethods[methodIndex].isDefault;
  
  // Remove the payment method
  advertiser.paymentMethods.splice(methodIndex, 1);
  
  // If this was the default method and there are other methods, set the first one as default
  if (isDefault && advertiser.paymentMethods.length > 0) {
    advertiser.paymentMethods[0].isDefault = true;
  }
  
  // Save updated advertiser
  await advertiser.save();
  
  return res.json({
    success: true,
    message: 'Payment method removed successfully'
  });
});

// @desc    Get all campaigns
// @route   GET /api/advertisers/campaigns
// @access  Private (Advertiser only)
const getCampaigns = wrap(async (req, res) => {
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  return res.json({
    success: true,
    data: advertiser.campaigns
  });
});

// @desc    Get campaign by ID
// @route   GET /api/advertisers/campaigns/:campaignId
// @access  Private (Advertiser only)
const getCampaignById = wrap(async (req, res) => {
  const { campaignId } = req.params;
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the campaign
  const campaign = advertiser.campaigns.id(campaignId);
  
  if (!campaign) {
    throw createResourceNotFoundError('Campaign', campaignId);
  }
  
  return res.json({
    success: true,
    data: campaign
  });
});

// @desc    Add campaign
// @route   POST /api/advertisers/campaigns
// @access  Private (Advertiser only)
const addCampaign = wrap(async (req, res) => {
  const { 
    name, 
    description, 
    objective,
    startDate, 
    endDate,
    budget,
    targetAudience,
    tags
  } = req.body;
  
  // Validate required fields
  if (!name) {
    throw createValidationError('Campaign name is required', {
      fields: { name: !name }
    });
  }
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Add new campaign
  const newCampaign = {
    name,
    description,
    objective: objective || 'awareness',
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    status: 'draft'
  };

  // Add budget if provided
  if (budget) {
    newCampaign.budget = {
      total: budget.total || 0,
      spent: budget.spent || 0,
      currency: budget.currency || 'USD'
    };
  }

  // Add target audience if provided
  if (targetAudience) {
    newCampaign.targetAudience = targetAudience;
  }

  // Add tags if provided
  if (tags && Array.isArray(tags)) {
    newCampaign.tags = tags;
  }
  
  advertiser.campaigns.push(newCampaign);
  
  // Save updated advertiser
  await advertiser.save();
  
  return res.status(201).json({
    success: true,
    data: advertiser.campaigns[advertiser.campaigns.length - 1]
  });
});

// @desc    Update campaign
// @route   PUT /api/advertisers/campaigns/:campaignId
// @access  Private (Advertiser only)
const updateCampaign = wrap(async (req, res) => {
  const { campaignId } = req.params;
  const { 
    name, 
    description, 
    objective,
    startDate, 
    endDate, 
    status,
    budget,
    targetAudience,
    tags
  } = req.body;
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the campaign to update
  const campaign = advertiser.campaigns.id(campaignId);
  
  if (!campaign) {
    throw createResourceNotFoundError('Campaign', campaignId);
  }
  
  // Update campaign fields
  if (name) campaign.name = name;
  if (description) campaign.description = description;
  if (objective) campaign.objective = objective;
  if (startDate) campaign.startDate = new Date(startDate);
  if (endDate) campaign.endDate = new Date(endDate);
  if (status) campaign.status = status;
  
  // Update budget if provided
  if (budget) {
    campaign.budget = {
      ...campaign.budget,
      ...budget
    };
  }

  // Update target audience if provided
  if (targetAudience) {
    campaign.targetAudience = {
      ...campaign.targetAudience,
      ...targetAudience
    };
  }

  // Update tags if provided
  if (tags && Array.isArray(tags)) {
    campaign.tags = tags;
  }
  
  // Save updated advertiser
  await advertiser.save();
  
  return res.json({
    success: true,
    data: campaign
  });
});

// @desc    Delete campaign
// @route   DELETE /api/advertisers/campaigns/:campaignId
// @access  Private (Advertiser only)
const deleteCampaign = wrap(async (req, res) => {
  const { campaignId } = req.params;
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the campaign to delete
  const campaignIndex = advertiser.campaigns.findIndex(
    campaign => campaign._id.toString() === campaignId
  );
  
  if (campaignIndex === -1) {
    throw createResourceNotFoundError('Campaign', campaignId);
  }
  
  // Remove the campaign
  advertiser.campaigns.splice(campaignIndex, 1);
  
  // Save updated advertiser
  await advertiser.save();
  
  return res.json({
    success: true,
    message: 'Campaign removed successfully'
  });
});

// @desc    Update campaign metrics
// @route   PUT /api/advertisers/campaigns/:campaignId/metrics
// @access  Private (Advertiser only)
const updateCampaignMetrics = wrap(async (req, res) => {
  const { campaignId } = req.params;
  const { metrics } = req.body;
  
  if (!metrics) {
    throw createValidationError('Metrics are required', {
      fields: { metrics: !metrics }
    });
  }
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the campaign to update
  const campaign = advertiser.campaigns.id(campaignId);
  
  if (!campaign) {
    throw createResourceNotFoundError('Campaign', campaignId);
  }
  
  // Update metrics
  campaign.metrics = {
    ...campaign.metrics,
    ...metrics
  };
  
  // Save updated advertiser
  await advertiser.save();
  
  return res.json({
    success: true,
    data: campaign
  });
});

// @desc    Add rental to campaign
// @route   PUT /api/advertisers/campaigns/:campaignId/rentals/:rentalId
// @access  Private (Advertiser only)
const addRentalToCampaign = wrap(async (req, res) => {
  const { campaignId, rentalId } = req.params;
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the campaign
  const campaign = advertiser.campaigns.id(campaignId);
  
  if (!campaign) {
    throw createResourceNotFoundError('Campaign', campaignId);
  }
  
  // Check if rental exists
  const Rental = require('../models/rentalModel');
  const rental = await Rental.findOne({
    _id: rentalId,
    advertiserId: advertiser._id
  });
  
  if (!rental) {
    throw createResourceNotFoundError('Rental', rentalId, new Error('Rental not found or does not belong to this advertiser'));
  }
  
  // Check if rental is already in campaign
  if (campaign.rentals.includes(rentalId)) {
    throw createConflictError('Rental is already in this campaign', {
      campaignId,
      rentalId
    });
  }
  
  // Add rental to campaign
  campaign.rentals.push(rentalId);
  
  // Update rental with campaign ID
  rental.campaignId = campaignId;
  await rental.save();
  
  // Save updated advertiser
  await advertiser.save();
  
  return res.json({
    success: true,
    data: campaign
  });
});

// @desc    Remove rental from campaign
// @route   DELETE /api/advertisers/campaigns/:campaignId/rentals/:rentalId
// @access  Private (Advertiser only)
const removeRentalFromCampaign = wrap(async (req, res) => {
  const { campaignId, rentalId } = req.params;
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the campaign
  const campaign = advertiser.campaigns.id(campaignId);
  
  if (!campaign) {
    throw createResourceNotFoundError('Campaign', campaignId);
  }
  
  // Check if rental is in campaign
  const rentalIndex = campaign.rentals.findIndex(
    rental => rental.toString() === rentalId
  );
  
  if (rentalIndex === -1) {
    throw createValidationError('Rental is not in this campaign', {
      campaignId,
      rentalId
    });
  }
  
  // Remove rental from campaign
  campaign.rentals.splice(rentalIndex, 1);
  
  // Update rental to remove campaign ID
  const Rental = require('../models/rentalModel');
  const rental = await Rental.findById(rentalId);
  
  if (rental) {
    rental.campaignId = undefined;
    await rental.save();
  }
  
  // Save updated advertiser
  await advertiser.save();
  
  return res.json({
    success: true,
    data: campaign
  });
});

// @desc    Get campaign analytics
// @route   GET /api/advertisers/campaigns/:campaignId/analytics
// @access  Private (Advertiser only)
const getCampaignAnalytics = wrap(async (req, res) => {
  const { campaignId } = req.params;
  
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Find the campaign
  const campaign = advertiser.campaigns.id(campaignId);
  
  if (!campaign) {
    throw createResourceNotFoundError('Campaign', campaignId);
  }
  
  // Get rentals for this campaign
  const Rental = require('../models/rentalModel');
  const rentals = await Rental.find({
    campaignId: campaignId
  }).populate('influencerId', 'username profile');
  
  // Calculate analytics
  const totalSpent = campaign.budget.spent;
  const totalBudget = campaign.budget.total;
  const budgetRemaining = totalBudget - totalSpent;
  const budgetPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Calculate performance metrics
  const impressions = campaign.metrics.impressions || 0;
  const clicks = campaign.metrics.clicks || 0;
  const conversions = campaign.metrics.conversions || 0;
  
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const cpa = conversions > 0 ? totalSpent / conversions : 0;
  
  // Get platform distribution
  const platformDistribution = {};
  rentals.forEach(rental => {
    if (!platformDistribution[rental.platform]) {
      platformDistribution[rental.platform] = 0;
    }
    platformDistribution[rental.platform]++;
  });
  
  return res.json({
    success: true,
    data: {
      campaign: campaign,
      rentals: rentals,
      analytics: {
        budget: {
          total: totalBudget,
          spent: totalSpent,
          remaining: budgetRemaining,
          percentUsed: budgetPercentUsed
        },
        performance: {
          impressions,
          clicks,
          conversions,
          ctr,
          conversionRate,
          cpa
        },
        platforms: platformDistribution,
        rentalCount: rentals.length
      }
    }
  });
});

module.exports = {
  getAdvertiserProfile,
  updateAdvertiserProfile,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getCampaigns,
  getCampaignById,
  addCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignMetrics,
  addRentalToCampaign,
  removeRentalFromCampaign,
  getCampaignAnalytics
};
