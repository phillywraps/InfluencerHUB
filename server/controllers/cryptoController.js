/**
 * Cryptocurrency Payment Controller
 * Handles cryptocurrency payment operations
 */

const mongoose = require('mongoose');
const cryptoPaymentService = require('../utils/cryptoPaymentService');
const Transaction = require('../models/transactionModel');
const Rental = require('../models/rentalModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');
const logger = require('../config/logger');
const crypto = require('crypto');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createAuthorizationError,
  createThirdPartyApiError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

/**
 * Create a cryptocurrency payment charge
 * @route POST /api/payments/crypto/charges
 * @access Private
 */
const createCharge = wrap(async (req, res) => {
  const { amount, currency, cryptoCurrency, name, description, rentalId, subscriptionId } = req.body;

  if (!amount || !currency) {
    throw createValidationError('Amount and currency are required', {
      missing: {
        amount: !amount,
        currency: !currency
      }
    });
  }

  let rental = null;
  let subscription = null;

  // If rental ID is provided, verify it
  if (rentalId) {
    rental = await Rental.findById(rentalId)
      .populate('advertiser')
      .populate('influencer')
      .populate('socialAccount');

    if (!rental) {
      throw createResourceNotFoundError('Rental', rentalId);
    }

    // Verify the user is the advertiser for this rental
    if (rental.advertiser._id.toString() !== req.user._id.toString()) {
      throw createAuthorizationError('Not authorized to make payment for this rental', {
        rentalId,
        userId: req.user._id,
        advertiserId: rental.advertiser._id
      });
    }
  }

  // If subscription ID is provided, verify it
  if (subscriptionId) {
    subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      throw createResourceNotFoundError('Subscription', subscriptionId);
    }

    // Verify the user is authorized for this subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      throw createAuthorizationError('Not authorized to make payment for this subscription', {
        subscriptionId,
        userId: req.user._id,
        subscriptionUserId: subscription.user
      });
    }
  }

  try {
    // Generate a unique external ID for tracking
    const externalId = `${req.user._id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Create charge with Coinbase Commerce
    const charge = await cryptoPaymentService.createCharge({
      name: name || 'API Key Rental',
      description: description || 'Cryptocurrency payment for API key rental',
      amount,
      currency,
      cryptoCurrency,
      externalId,
      userId: req.user._id.toString(),
      rentalId: rentalId || null
    });

    // Store transaction in database
    const transaction = new Transaction({
      user: req.user._id,
      rental: rentalId || null,
      subscription: subscriptionId || null,
      paymentMethod: 'crypto',
      paymentType: subscriptionId ? 'subscription' : 'one-time',
      amount,
      currency,
      cryptoCurrency: charge.cryptoCurrency,
      status: 'pending',
      orderNumber: charge.id,
      externalReference: externalId,
      description: charge.name,
      metadata: {
        chargeId: charge.id,
        cryptoAmount: charge.cryptoAmount
      }
    });

    await transaction.save();

    // Return charge details
    return res.json({
      success: true,
      message: 'Cryptocurrency charge created successfully',
      data: {
        id: charge.id,
        amount,
        currency,
        cryptoAmount: charge.cryptoAmount,
        cryptoCurrency: charge.cryptoCurrency,
        status: charge.status,
        checkoutUrl: charge.checkoutUrl,
        expiresAt: charge.expiresAt,
        address: charge.address,
        qrCodes: charge.qrCodes
      }
    });
  } catch (error) {
    logger.error(`Error creating cryptocurrency charge: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Coinbase Commerce',
      'Failed to create cryptocurrency payment',
      {
        error: error.message,
        rentalId,
        subscriptionId
      },
      error
    );
  }
});

/**
 * Get charge details
 * @route GET /api/payments/crypto/charges/:chargeId
 * @access Private
 */
const getCharge = wrap(async (req, res) => {
  const { chargeId } = req.params;

  if (!chargeId) {
    throw createValidationError('Charge ID is required', {
      missing: ['chargeId']
    });
  }

  try {
    // Find transaction
    const transaction = await Transaction.findOne({ 
      orderNumber: chargeId,
      paymentMethod: 'crypto'
    });

    if (!transaction) {
      throw createResourceNotFoundError('Transaction with charge ID', chargeId);
    }

    // Verify user is owner of transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      throw createAuthorizationError('Not authorized to view this transaction', {
        chargeId,
        userId: req.user._id,
        transactionUserId: transaction.user
      });
    }

    // Get charge details from Coinbase Commerce
    const chargeDetails = await cryptoPaymentService.getCharge(chargeId);

    // Update transaction status if needed
    if (chargeDetails.status !== transaction.status) {
      transaction.status = chargeDetails.status;
      
      // If payment is complete, update rental status
      if (chargeDetails.status === 'completed') {
        transaction.paymentComplete = true;
        transaction.completedAt = new Date();
        
        // Also update the rental if found
        if (transaction.rental) {
          const rental = await Rental.findById(transaction.rental);
          if (rental && rental.status === 'pending') {
            rental.paymentStatus = 'paid';
            await rental.save();
          }
        }
      }
      
      await transaction.save();
    }

    // Return status
    return res.json({
      success: true,
      message: 'Charge details retrieved successfully',
      data: {
        id: chargeDetails.id,
        status: chargeDetails.status,
        amount: chargeDetails.amount,
        currency: chargeDetails.currency,
        cryptoAmounts: chargeDetails.cryptoAmounts,
        expiresAt: chargeDetails.expiresAt,
        createdAt: chargeDetails.createdAt,
        updatedAt: chargeDetails.updatedAt,
        timeline: chargeDetails.timeline || [],
        transaction: {
          id: transaction._id,
          status: transaction.status,
          paymentComplete: transaction.paymentComplete || false
        }
      }
    });
  } catch (error) {
    logger.error(`Error retrieving charge: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Coinbase Commerce',
      'Failed to retrieve charge',
      { chargeId, error: error.message },
      error
    );
  }
});

/**
 * Cancel a cryptocurrency payment charge
 * @route POST /api/payments/crypto/charges/:chargeId/cancel
 * @access Private
 */
const cancelCharge = wrap(async (req, res) => {
  const { chargeId } = req.params;

  if (!chargeId) {
    throw createValidationError('Charge ID is required', {
      missing: ['chargeId']
    });
  }

  try {
    // Find transaction
    const transaction = await Transaction.findOne({ 
      orderNumber: chargeId,
      paymentMethod: 'crypto'
    });

    if (!transaction) {
      throw createResourceNotFoundError('Transaction with charge ID', chargeId);
    }

    // Verify user is owner of transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      throw createAuthorizationError('Not authorized to cancel this transaction', {
        chargeId,
        userId: req.user._id,
        transactionUserId: transaction.user
      });
    }

    // Cancel charge with Coinbase Commerce
    const cancelResult = await cryptoPaymentService.cancelCharge(chargeId);

    // Update transaction
    transaction.status = 'canceled';
    await transaction.save();

    // Return cancel result
    return res.json({
      success: true,
      message: 'Charge cancelled successfully',
      data: {
        id: cancelResult.id,
        status: cancelResult.status,
        updatedAt: cancelResult.updatedAt
      }
    });
  } catch (error) {
    logger.error(`Error cancelling charge: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Coinbase Commerce',
      'Failed to cancel charge',
      { chargeId, error: error.message },
      error
    );
  }
});

/**
 * Resolve a cryptocurrency payment charge
 * @route POST /api/payments/crypto/charges/:chargeId/resolve
 * @access Private
 */
const resolveCharge = wrap(async (req, res) => {
  const { chargeId } = req.params;

  if (!chargeId) {
    throw createValidationError('Charge ID is required', {
      missing: ['chargeId']
    });
  }

  try {
    // Find transaction
    const transaction = await Transaction.findOne({ 
      orderNumber: chargeId,
      paymentMethod: 'crypto'
    });

    if (!transaction) {
      throw createResourceNotFoundError('Transaction with charge ID', chargeId);
    }

    // Only admin can manually resolve charges
    if (!req.user.isAdmin) {
      throw createAuthorizationError('Not authorized to resolve charges', {
        chargeId,
        userId: req.user._id,
        isAdmin: req.user.isAdmin
      });
    }

    // Resolve charge with Coinbase Commerce
    const resolveResult = await cryptoPaymentService.resolveCharge(chargeId);

    // Update transaction
    transaction.status = 'completed';
    transaction.paymentComplete = true;
    transaction.completedAt = new Date();
    
    // Also update the rental if found
    if (transaction.rental) {
      const rental = await Rental.findById(transaction.rental);
      if (rental && rental.status === 'pending') {
        rental.paymentStatus = 'paid';
        await rental.save();
      }
    }
    
    await transaction.save();

    // Return resolve result
    return res.json({
      success: true,
      message: 'Charge resolved successfully',
      data: {
        id: resolveResult.id,
        status: resolveResult.status,
        updatedAt: resolveResult.updatedAt
      }
    });
  } catch (error) {
    logger.error(`Error resolving charge: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Coinbase Commerce',
      'Failed to resolve charge',
      { chargeId, error: error.message },
      error
    );
  }
});

/**
 * Get supported cryptocurrencies
 * @route GET /api/payments/crypto/currencies
 * @access Public
 */
const getSupportedCurrencies = wrap(async (req, res) => {
  try {
    const currencies = await cryptoPaymentService.getSupportedCurrencies();
    
    return res.json({
      success: true,
      message: 'Supported cryptocurrencies retrieved successfully',
      data: currencies
    });
  } catch (error) {
    logger.error(`Error retrieving supported cryptocurrencies: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Coinbase Commerce',
      'Failed to retrieve supported cryptocurrencies',
      { error: error.message },
      error
    );
  }
});

/**
 * Get cryptocurrency exchange rates
 * @route GET /api/payments/crypto/rates
 * @access Public
 */
const getExchangeRates = wrap(async (req, res) => {
  const { currency = 'USD' } = req.query;
  
  try {
    const rates = await cryptoPaymentService.getExchangeRates(currency);
    
    return res.json({
      success: true,
      message: 'Exchange rates retrieved successfully',
      data: rates,
      baseCurrency: currency
    });
  } catch (error) {
    logger.error(`Error retrieving exchange rates: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Coinbase Commerce',
      'Failed to retrieve exchange rates',
      { currency, error: error.message },
      error
    );
  }
});

/**
 * Get payment history for the current user
 * @route GET /api/payments/crypto/history
 * @access Private
 */
const getPaymentHistory = wrap(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    // Find all crypto transactions for this user
    const transactions = await Transaction.find({
      user: req.user._id,
      paymentMethod: 'crypto'
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('rental', 'apiKey socialAccount duration')
      .populate('subscription', 'name billingPeriod nextBillingDate');
    
    // Get total count
    const total = await Transaction.countDocuments({
      user: req.user._id,
      paymentMethod: 'crypto'
    });
    
    return res.json({
      success: true,
      message: 'Payment history retrieved successfully',
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Error retrieving payment history: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Database',
      'Failed to retrieve payment history',
      { error: error.message },
      error
    );
  }
});

/**
 * Create a cryptocurrency subscription
 * @route POST /api/payments/crypto/subscriptions
 * @access Private
 */
const createSubscription = wrap(async (req, res) => {
  const { 
    amount, 
    currency, 
    cryptoCurrency, 
    billingPeriod,
    name, 
    description, 
    influencerId,
    socialAccountId
  } = req.body;

  if (!amount || !currency || !billingPeriod) {
    throw createValidationError('Amount, currency, and billing period are required', {
      missing: {
        amount: !amount,
        currency: !currency,
        billingPeriod: !billingPeriod
      }
    });
  }

  try {
    // Generate a unique external ID for tracking
    const externalId = `SUB_${req.user._id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Create subscription with Coinbase Commerce
    const subscription = await cryptoPaymentService.createSubscription({
      name: name || 'API Key Subscription',
      description: description || 'Recurring cryptocurrency payment for API key access',
      amount,
      currency,
      billingPeriod,
      externalId,
      userId: req.user._id.toString(),
      influencerId,
      socialAccountId
    });

    // Store in our database
    const subscriptionModel = new Subscription({
      user: req.user._id,
      influencer: influencerId,
      socialAccount: socialAccountId,
      paymentMethod: 'crypto',
      amount,
      currency,
      cryptoCurrency,
      billingPeriod,
      status: subscription.status,
      name: subscription.name,
      description: subscription.description,
      nextBillingDate: subscription.nextBillingDate,
      externalId: subscription.id,
      metadata: {
        subscriptionId: subscription.id
      }
    });

    await subscriptionModel.save();

    // Return subscription details
    return res.status(201).json({
      success: true,
      message: 'Cryptocurrency subscription created successfully',
      data: {
        id: subscriptionModel._id,
        externalId: subscription.id,
        amount,
        currency,
        cryptoCurrency,
        billingPeriod,
        status: subscription.status,
        nextBillingDate: subscription.nextBillingDate,
        createdAt: subscription.createdAt
      }
    });
  } catch (error) {
    logger.error(`Error creating cryptocurrency subscription: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Coinbase Commerce',
      'Failed to create cryptocurrency subscription',
      { error: error.message, influencerId, socialAccountId },
      error
    );
  }
});

/**
 * Cancel a cryptocurrency subscription
 * @route POST /api/payments/crypto/subscriptions/:subscriptionId/cancel
 * @access Private
 */
const cancelSubscription = wrap(async (req, res) => {
  const { subscriptionId } = req.params;

  if (!subscriptionId) {
    throw createValidationError('Subscription ID is required', {
      missing: ['subscriptionId']
    });
  }

  try {
    // Find subscription
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      throw createResourceNotFoundError('Subscription', subscriptionId);
    }

    // Verify user is owner of subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      throw createAuthorizationError('Not authorized to cancel this subscription', {
        subscriptionId,
        userId: req.user._id,
        subscriptionUserId: subscription.user
      });
    }

    // Cancel subscription with Coinbase Commerce
    const cancelResult = await cryptoPaymentService.cancelSubscription(subscription.externalId);

    // Update subscription
    subscription.status = 'canceled';
    await subscription.save();

    // Return cancel result
    return res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        id: subscription._id,
        status: 'canceled',
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error cancelling subscription: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Coinbase Commerce',
      'Failed to cancel subscription',
      { subscriptionId, error: error.message },
      error
    );
  }
});

/**
 * Handle cryptocurrency payment webhook
 * @route POST /api/payments/crypto/webhook
 * @access Public
 */
const handleWebhook = wrap(async (req, res) => {
  const signature = req.headers['x-cc-webhook-signature'];
  
  if (!signature) {
    logger.warn('Missing webhook signature');
    return res.status(400).send('Missing signature');
  }

  try {
    // Convert request body to string if it's not already
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    // Verify signature
    const isValid = cryptoPaymentService.verifyWebhookSignature(signature, rawBody);
    
    if (!isValid) {
      logger.warn('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    // Process the event
    const event = req.body;
    const eventType = event.type;
    const data = event.data;
    
    logger.info(`Received cryptocurrency webhook: ${eventType}`, { chargeId: data.id });

    // Handle different event types
    switch (eventType) {
      case 'charge:created':
        // Not much to do here as we create the charge ourselves
        break;
        
      case 'charge:confirmed':
      case 'charge:pending':
      case 'charge:failed':
      case 'charge:delayed':
      case 'charge:resolved':
        await processChargeStatusChange(data, eventType.split(':')[1]);
        break;
        
      case 'charge:cancelled':
        await processChargeStatusChange(data, 'canceled');
        break;
        
      default:
        logger.warn(`Unhandled webhook event: ${eventType}`);
    }

    // Always return 200 so Coinbase doesn't retry
    return res.status(200).send('Webhook received');
  } catch (error) {
    logger.error(`Error processing cryptocurrency webhook: ${error.message}`, { error });
    // Still return success to avoid retries
    return res.status(200).send('Error handled');
  }
});

/**
 * Process charge status change from webhook
 * @param {Object} data Charge data from webhook
 * @param {string} status New status
 */
const processChargeStatusChange = async (data, status) => {
  try {
    // Map webhook status to our status
    const statusMap = {
      'pending': 'pending',
      'confirmed': 'confirming',
      'resolved': 'completed',
      'failed': 'failed',
      'delayed': 'delayed',
      'canceled': 'canceled'
    };
    
    const mappedStatus = statusMap[status] || status;
    
    // Find the transaction
    const transaction = await Transaction.findOne({ 
      orderNumber: data.id,
      paymentMethod: 'crypto'
    });
    
    if (!transaction) {
      logger.warn(`Transaction not found for chargeId: ${data.id}`);
      return;
    }
    
    // Update the transaction
    transaction.status = mappedStatus;
    
    // If completed, update rental status
    if (mappedStatus === 'completed') {
      transaction.paymentComplete = true;
      transaction.completedAt = new Date();
      
      // Update rental if associated
      if (transaction.rental) {
        const rental = await Rental.findById(transaction.rental);
        if (rental && rental.status === 'pending') {
          rental.paymentStatus = 'paid';
          await rental.save();
          
          logger.info(`Rental ${rental._id} marked as paid via cryptocurrency webhook`);
        }
      }
    }
    
    await transaction.save();
    logger.info(`Transaction ${transaction._id} status updated to ${mappedStatus} via webhook`);
  } catch (error) {
    logger.error(`Error processing charge status change: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  createCharge,
  getCharge,
  cancelCharge,
  resolveCharge,
  getSupportedCurrencies,
  getExchangeRates,
  getPaymentHistory,
  createSubscription,
  cancelSubscription,
  handleWebhook
};
