/**
 * Mobile Payment Controller
 * Handles mobile-specific payment methods (Apple Pay, Google Pay)
 */

const paymentService = require('../utils/paymentService');
const Transaction = require('../models/transactionModel');
const Rental = require('../models/rentalModel');
const logger = require('../config/logger');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createAuthorizationError,
  createThirdPartyApiError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

/**
 * Process Apple Pay payment
 * @route POST /api/payments/mobile/apple-pay
 * @access Private
 */
const processApplePayment = wrap(async (req, res) => {
  const { paymentData, rentalDetails } = req.body;
  
  if (!paymentData || !rentalDetails || !rentalDetails.rentalId) {
    throw createValidationError('Invalid request. Payment data and rental details are required.', {
      missing: {
        paymentData: !paymentData,
        rentalDetails: !rentalDetails,
        rentalId: rentalDetails && !rentalDetails.rentalId
      }
    });
  }
  
  // Find the rental
  const rental = await Rental.findById(rentalDetails.rentalId);
  
  if (!rental) {
    throw createResourceNotFoundError('Rental', rentalDetails.rentalId);
  }
  
  // Verify user is authorized to pay for this rental
  if (rental.advertiserId.toString() !== req.user._id.toString()) {
    throw createAuthorizationError('You are not authorized to pay for this rental', {
      rentalId: rentalDetails.rentalId,
      userId: req.user._id,
      advertiserId: rental.advertiserId
    });
  }
  
  // Process the Apple Pay payment through Stripe
  const customerId = req.user.stripeCustomerId;
  
  try {
    // Create a payment method from Apple Pay token
    const paymentMethod = await paymentService.createPaymentMethod(customerId, {
      token: paymentData.token
    });
    
    // Create and confirm payment intent
    const { paymentIntent, transaction } = await paymentService.createPaymentIntent(
      rental,
      customerId,
      paymentMethod.id
    );
    
    const confirmation = await paymentService.confirmPaymentIntent(paymentIntent.id);
    
    // Return the transaction data
    return res.json({
      success: true,
      data: {
        id: confirmation.transaction._id,
        method: 'apple_pay',
        amount: rental.payment.amount,
        currency: rental.payment.currency,
        status: confirmation.transaction.status,
        createdAt: confirmation.transaction.createdAt,
        rentalId: rental._id,
        transactionId: confirmation.transaction._id
      }
    });
  } catch (error) {
    logger.error('Error processing Apple Pay payment:', error);
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to process Apple Pay payment',
      { error: error.message, rentalId: rentalDetails.rentalId },
      error
    );
  }
});

/**
 * Process Google Pay payment
 * @route POST /api/payments/mobile/google-pay
 * @access Private
 */
const processGooglePayment = wrap(async (req, res) => {
  const { paymentData, rentalDetails } = req.body;
  
  if (!paymentData || !rentalDetails || !rentalDetails.rentalId) {
    throw createValidationError('Invalid request. Payment data and rental details are required.', {
      missing: {
        paymentData: !paymentData,
        rentalDetails: !rentalDetails,
        rentalId: rentalDetails && !rentalDetails.rentalId
      }
    });
  }
  
  // Find the rental
  const rental = await Rental.findById(rentalDetails.rentalId);
  
  if (!rental) {
    throw createResourceNotFoundError('Rental', rentalDetails.rentalId);
  }
  
  // Verify user is authorized to pay for this rental
  if (rental.advertiserId.toString() !== req.user._id.toString()) {
    throw createAuthorizationError('You are not authorized to pay for this rental', {
      rentalId: rentalDetails.rentalId,
      userId: req.user._id,
      advertiserId: rental.advertiserId
    });
  }
  
  // Process the Google Pay payment through Stripe
  const customerId = req.user.stripeCustomerId;
  
  try {
    // Create a payment method from Google Pay token
    const paymentMethod = await paymentService.createPaymentMethod(customerId, {
      token: paymentData.token
    });
    
    // Create and confirm payment intent
    const { paymentIntent, transaction } = await paymentService.createPaymentIntent(
      rental,
      customerId,
      paymentMethod.id
    );
    
    const confirmation = await paymentService.confirmPaymentIntent(paymentIntent.id);
    
    // Return the transaction data
    return res.json({
      success: true,
      data: {
        id: confirmation.transaction._id,
        method: 'google_pay',
        amount: rental.payment.amount,
        currency: rental.payment.currency,
        status: confirmation.transaction.status,
        createdAt: confirmation.transaction.createdAt,
        rentalId: rental._id,
        transactionId: confirmation.transaction._id
      }
    });
  } catch (error) {
    logger.error('Error processing Google Pay payment:', error);
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to process Google Pay payment',
      { error: error.message, rentalId: rentalDetails.rentalId },
      error
    );
  }
});

/**
 * Get mobile payment methods (Apple Pay, Google Pay)
 * @route GET /api/payments/mobile/methods
 * @access Private
 */
const getMobilePaymentMethods = wrap(async (req, res) => {
  // For mobile payment methods like Apple Pay and Google Pay,
  // we don't need to store them in our database as they're 
  // managed by the device
  const methods = [];
  
  // We can check if the user is on iOS or Android based on user agent
  const userAgent = req.headers['user-agent'] || '';
  
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    // iOS device - can potentially use Apple Pay
    methods.push({
      id: 'apay_default',
      type: 'apple_pay',
      isDefault: false,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    });
  } else if (userAgent.includes('Android')) {
    // Android device - can potentially use Google Pay
    methods.push({
      id: 'gpay_default',
      type: 'google_pay',
      isDefault: false,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    });
  }
  
  return res.json({
    success: true,
    data: methods
  });
});

/**
 * Get mobile payment transactions
 * @route GET /api/payments/mobile/transactions
 * @access Private
 */
const getMobilePaymentTransactions = wrap(async (req, res) => {
  // Get all transactions for the user that used mobile payment methods
  const transactions = await Transaction.find({
    userId: req.user._id,
    $or: [
      { paymentMethod: 'apple_pay' },
      { paymentMethod: 'google_pay' }
    ]
  })
  .populate({
    path: 'rentalId',
    select: 'platform influencerId',
    populate: {
      path: 'influencerId',
      select: 'username name'
    }
  })
  .sort({ createdAt: -1 });
  
  // Format the transaction data for the response
  const formattedTransactions = transactions.map(tx => {
    if (!tx.rentalId) {
      return {
        id: tx._id,
        method: tx.paymentMethod,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        createdAt: tx.createdAt,
        description: tx.description
      };
    }
    
    return {
      id: tx._id,
      method: tx.paymentMethod,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      createdAt: tx.createdAt,
      rentalId: tx.rentalId._id,
      influencer: tx.rentalId.influencerId ? {
        id: tx.rentalId.influencerId._id,
        name: tx.rentalId.influencerId.name,
        username: tx.rentalId.influencerId.username
      } : null,
      platform: tx.rentalId.platform,
      description: tx.description
    };
  });
  
  return res.json({
    success: true,
    data: formattedTransactions
  });
});

module.exports = {
  processApplePayment,
  processGooglePayment,
  getMobilePaymentMethods,
  getMobilePaymentTransactions
};
