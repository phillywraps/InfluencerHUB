const Influencer = require('../models/influencerModel');
const User = require('../models/userModel');
const payoutService = require('../utils/payoutService');
const notificationService = require('../utils/notificationService');

// @desc    Get influencer balance
// @route   GET /api/payouts/balance
// @access  Private (Influencer only)
const getBalance = async (req, res) => {
  try {
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Get balance
    const balance = await payoutService.getBalance(influencer._id);
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get balance transactions
// @route   GET /api/payouts/transactions
// @access  Private (Influencer only)
const getBalanceTransactions = async (req, res) => {
  try {
    // Get query parameters
    const { type, status, startDate, endDate } = req.query;
    
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Get balance transactions
    const transactions = await payoutService.getBalanceTransactions(influencer._id, {
      type,
      status,
      startDate,
      endDate
    });
    
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting balance transactions:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a payout
// @route   POST /api/payouts
// @access  Private (Influencer only)
const createPayout = async (req, res) => {
  try {
    const { amount, payoutMethodId, description } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout amount'
      });
    }
    
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Check if influencer has enough balance
    if (influencer.balance.available < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // Create payout
    const { payout, balanceTransaction } = await payoutService.createPayout(influencer._id, {
      amount,
      payoutMethodId,
      description
    });
    
    res.status(201).json({
      success: true,
      data: {
        payout,
        balanceTransaction
      }
    });
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get payout methods
// @route   GET /api/payouts/methods
// @access  Private (Influencer only)
const getPayoutMethods = async (req, res) => {
  try {
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Get payout methods
    const payoutMethods = await payoutService.getPayoutMethods(influencer._id);
    
    res.json({
      success: true,
      count: payoutMethods.length,
      data: payoutMethods
    });
  } catch (error) {
    console.error('Error getting payout methods:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add a payout method
// @route   POST /api/payouts/methods
// @access  Private (Influencer only)
const addPayoutMethod = async (req, res) => {
  try {
    const { type, details, isDefault } = req.body;
    
    // Validate type
    if (!type || !['bank_account', 'paypal', 'stripe', 'crypto', 'other'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout method type'
      });
    }
    
    // Validate details
    if (!details) {
      return res.status(400).json({
        success: false,
        message: 'Payout method details are required'
      });
    }
    
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Add payout method
    const updatedInfluencer = await payoutService.addPayoutMethod(influencer._id, {
      type,
      details,
      isDefault
    });
    
    // Get the newly added payout method
    const newPayoutMethod = updatedInfluencer.payoutMethods[updatedInfluencer.payoutMethods.length - 1];
    
    res.status(201).json({
      success: true,
      data: newPayoutMethod
    });
  } catch (error) {
    console.error('Error adding payout method:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a payout method
// @route   DELETE /api/payouts/methods/:methodId
// @access  Private (Influencer only)
const deletePayoutMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Check if payout method exists
    const payoutMethod = influencer.payoutMethods.id(methodId);
    
    if (!payoutMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payout method not found'
      });
    }
    
    // Delete payout method
    await payoutService.deletePayoutMethod(influencer._id, methodId);
    
    res.json({
      success: true,
      message: 'Payout method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payout method:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update payout schedule
// @route   PUT /api/payouts/schedule
// @access  Private (Influencer only)
const updatePayoutSchedule = async (req, res) => {
  try {
    const { frequency, minimumAmount, dayOfWeek, dayOfMonth } = req.body;
    
    // Validate frequency
    if (frequency && !['manual', 'weekly', 'biweekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout frequency'
      });
    }
    
    // Validate minimumAmount
    if (minimumAmount !== undefined && minimumAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount cannot be negative'
      });
    }
    
    // Validate dayOfWeek
    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return res.status(400).json({
        success: false,
        message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
      });
    }
    
    // Validate dayOfMonth
    if (dayOfMonth !== undefined && (dayOfMonth < 1 || dayOfMonth > 31)) {
      return res.status(400).json({
        success: false,
        message: 'Day of month must be between 1 and 31'
      });
    }
    
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Update payout schedule
    const updatedInfluencer = await payoutService.updatePayoutSchedule(influencer._id, {
      frequency,
      minimumAmount,
      dayOfWeek,
      dayOfMonth
    });
    
    res.json({
      success: true,
      data: updatedInfluencer.payoutSchedule
    });
  } catch (error) {
    console.error('Error updating payout schedule:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Process automatic payouts (for cron job)
// @route   POST /api/payouts/process-automatic
// @access  Private (Admin only)
const processAutomaticPayouts = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can process automatic payouts'
      });
    }
    
    // Process automatic payouts
    const processedPayouts = await payoutService.processAutomaticPayouts();
    
    res.json({
      success: true,
      count: processedPayouts.length,
      data: processedPayouts
    });
  } catch (error) {
    console.error('Error processing automatic payouts:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update payout status (for webhook or admin)
// @route   PUT /api/payouts/:payoutId/status
// @access  Private (Admin only)
const updatePayoutStatus = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { influencerId, status } = req.body;
    
    // Validate status
    if (!status || !['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout status'
      });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update payout status'
      });
    }
    
    // Update payout status
    const updatedInfluencer = await payoutService.updatePayoutStatus(influencerId, payoutId, status);
    
    // Find the updated balance transaction
    const balanceTransaction = updatedInfluencer.balanceTransactions.find(
      transaction => transaction.payoutId === payoutId
    );
    
    res.json({
      success: true,
      data: {
        status,
        balanceTransaction
      }
    });
  } catch (error) {
    console.error('Error updating payout status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getBalance,
  getBalanceTransactions,
  createPayout,
  getPayoutMethods,
  addPayoutMethod,
  deletePayoutMethod,
  updatePayoutSchedule,
  processAutomaticPayouts,
  updatePayoutStatus
};
