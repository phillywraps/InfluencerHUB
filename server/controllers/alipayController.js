/**
 * Alipay Payment Controller
 * Handles Alipay payment operations
 */

const mongoose = require('mongoose');
const alipayService = require('../utils/alipayService');
const Transaction = require('../models/transactionModel');
const Rental = require('../models/rentalModel');
const User = require('../models/userModel');
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
 * Create an Alipay payment order
 * @route POST /api/payments/alipay/create-order
 * @access Private
 */
const createAlipayOrder = wrap(async (req, res) => {
  const { rentalId } = req.body;

  if (!rentalId) {
    throw createValidationError('Rental ID is required', { 
      missing: ['rentalId'] 
    });
  }

  // Find rental
  const rental = await Rental.findById(rentalId)
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

  // Generate a unique order number
  const orderNumber = alipayService.generateOrderNumber();

  // Create order subject and body descriptions
  const subject = `API Key Rental: ${rental.socialAccount.platform}`;
  const body = `Rental fee for ${rental.socialAccount.platform} API key from ${rental.influencer.username} for ${rental.duration} days`;

  try {
    // Create Alipay order
    const order = await alipayService.createOrder({
      orderNumber,
      amount: rental.rentalFee,
      subject,
      body,
    });

    // Store transaction in database
    const transaction = new Transaction({
      user: req.user._id,
      rental: rentalId,
      paymentMethod: 'alipay',
      paymentType: 'one-time',
      amount: rental.rentalFee,
      currency: 'USD',
      status: 'pending',
      orderNumber: orderNumber,
      description: subject,
    });

    await transaction.save();

    // Return order details
    return res.json({
      success: true,
      message: 'Alipay order created successfully',
      data: {
        orderNumber: order.orderNumber,
        qrCodeUrl: order.qrCodeUrl,
        status: order.status,
        amount: rental.rentalFee,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error creating Alipay order: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Alipay',
      'Failed to create Alipay payment',
      { error: error.message, rentalId },
      error
    );
  }
});

/**
 * Check Alipay payment status
 * @route GET /api/payments/alipay/check-status/:orderNumber
 * @access Private
 */
const checkAlipayStatus = wrap(async (req, res) => {
  const { orderNumber } = req.params;

  if (!orderNumber) {
    throw createValidationError('Order number is required', {
      missing: ['orderNumber']
    });
  }

  try {
    // Check order status with Alipay
    const orderStatus = await alipayService.checkOrderStatus(orderNumber);

    // Find transaction
    const transaction = await Transaction.findOne({ orderNumber });

    if (!transaction) {
      throw createResourceNotFoundError('Transaction with order number', orderNumber);
    }

    // Verify user is owner of transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      throw createAuthorizationError('Not authorized to check status for this transaction', {
        orderNumber,
        userId: req.user._id,
        transactionUserId: transaction.user
      });
    }

    // Update transaction status if needed
    if (orderStatus.status !== transaction.status) {
      transaction.status = orderStatus.status;
      
      // If payment is complete, update rental status
      if (orderStatus.status === 'COMPLETE') {
        transaction.paymentComplete = true;
        transaction.completedAt = new Date();
        
        // Also update the rental if found
        if (transaction.rental) {
          const rental = await Rental.findById(transaction.rental);
          if (rental) {
            // Only update if rental is in pending state
            if (rental.status === 'pending') {
              rental.paymentStatus = 'paid';
              await rental.save();
            }
          }
        }
      }
      
      await transaction.save();
    }

    // Return status
    return res.json({
      success: true,
      message: 'Alipay status retrieved successfully',
      data: {
        orderNumber: orderStatus.orderNumber,
        status: orderStatus.status,
        transaction: {
          id: transaction._id,
          status: transaction.status,
          paymentComplete: transaction.paymentComplete || false,
        },
      },
    });
  } catch (error) {
    logger.error(`Error checking Alipay status: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Alipay',
      'Failed to check Alipay status',
      { orderNumber, error: error.message },
      error
    );
  }
});

/**
 * Cancel Alipay payment order
 * @route POST /api/payments/alipay/cancel-order
 * @access Private
 */
const cancelAlipayOrder = wrap(async (req, res) => {
  const { orderNumber } = req.body;

  if (!orderNumber) {
    throw createValidationError('Order number is required', {
      missing: ['orderNumber']
    });
  }

  try {
    // Find transaction
    const transaction = await Transaction.findOne({ orderNumber });

    if (!transaction) {
      throw createResourceNotFoundError('Transaction with order number', orderNumber);
    }

    // Verify user is owner of transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      throw createAuthorizationError('Not authorized to cancel this transaction', {
        orderNumber,
        userId: req.user._id,
        transactionUserId: transaction.user
      });
    }

    // Cancel order with Alipay
    const cancelResult = await alipayService.cancelOrder(orderNumber);

    // Update transaction
    transaction.status = 'CANCELLED';
    await transaction.save();

    // Return cancel result
    return res.json({
      success: true,
      message: 'Alipay order cancelled successfully',
      data: {
        orderNumber: cancelResult.orderNumber,
        status: cancelResult.status,
        action: cancelResult.action,
      },
    });
  } catch (error) {
    logger.error(`Error cancelling Alipay order: ${error.message}`, { error });
    throw createThirdPartyApiError(
      'Alipay',
      'Failed to cancel Alipay payment',
      { orderNumber, error: error.message },
      error
    );
  }
});

/**
 * Handle Alipay webhook notifications
 * @route POST /api/payments/alipay/webhook
 * @access Public
 */
const handleAlipayWebhook = wrap(async (req, res) => {
  try {
    // Process the notification
    const notification = await alipayService.processNotification(req.body);

    // Find transaction
    const transaction = await Transaction.findOne({ orderNumber: notification.orderNumber });

    if (!transaction) {
      logger.error(`Webhook error: Transaction not found for order ${notification.orderNumber}`);
      return res.status(200).send('success'); // Always return success to Alipay
    }

    // Update transaction status
    transaction.status = notification.status;
    
    // If payment is complete, update relevant details
    if (notification.status === 'COMPLETE') {
      transaction.paymentComplete = true;
      transaction.completedAt = new Date();
      transaction.paymentDetails = {
        alipayTradeNo: notification.alipayTradeNo,
        buyerId: notification.buyerId,
      };
      
      // Update rental if associated
      if (transaction.rental) {
        const rental = await Rental.findById(transaction.rental);
        if (rental) {
          // Only update if still in pending state
          if (rental.status === 'pending') {
            rental.paymentStatus = 'paid';
            await rental.save();
          }
        }
      }
    }
    
    await transaction.save();
    logger.info(`Alipay webhook processed for order ${notification.orderNumber}`, { status: notification.status });
    
    // Always return success to Alipay
    return res.status(200).send('success');
  } catch (error) {
    logger.error(`Error processing Alipay webhook: ${error.message}`, { error });
    // Always return success to Alipay even on error
    return res.status(200).send('success');
  }
});

module.exports = {
  createAlipayOrder,
  checkAlipayStatus,
  cancelAlipayOrder,
  handleAlipayWebhook,
};
