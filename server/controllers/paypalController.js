const asyncHandler = require('../utils/asyncHandler');
const Rental = require('../models/rentalModel');
const Transaction = require('../models/transactionModel');
const paypalService = require('../utils/paypalService');
const logger = require('../config/logger');

/**
 * @desc    Create a PayPal order for one-time payment
 * @route   POST /api/payments/paypal/create-order
 * @access  Private
 */
const createPayPalOrder = asyncHandler(async (req, res) => {
  const { rentalId } = req.body;
  
  // Get rental details
  const rental = await Rental.findById(rentalId);
  
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }
  
  // Check if user is authorized to pay for this rental
  if (rental.advertiser.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to pay for this rental');
  }
  
  // Check if rental is pending
  if (rental.status !== 'pending') {
    res.status(400);
    throw new Error('Rental is not in pending status');
  }
  
  // Check if payment is already completed
  if (rental.payment.status === 'completed') {
    res.status(400);
    throw new Error('Payment is already completed');
  }
  
  try {
    // Create PayPal order
    const order = await paypalService.createOrder({
      amount: rental.rentalFee.toString(),
      currency: 'USD',
      description: `API Key Rental: ${rental.socialAccount.platform} - ${rental.duration} days`
    });
    
    // Return order details
    res.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        links: order.links,
        amount: rental.rentalFee,
        currency: 'USD'
      }
    });
  } catch (error) {
    logger.error('Error creating PayPal order:', error);
    res.status(500);
    throw new Error('Failed to create PayPal order');
  }
});

/**
 * @desc    Capture a PayPal payment
 * @route   POST /api/payments/paypal/capture-payment
 * @access  Private
 */
const capturePayPalPayment = asyncHandler(async (req, res) => {
  const { orderId, rentalId } = req.body;
  
  if (!orderId || !rentalId) {
    res.status(400);
    throw new Error('Order ID and Rental ID are required');
  }
  
  // Get rental details
  const rental = await Rental.findById(rentalId);
  
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }
  
  // Check if user is authorized to pay for this rental
  if (rental.advertiser.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to pay for this rental');
  }
  
  try {
    // Capture payment
    const captureData = await paypalService.capturePayment(orderId);
    
    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      rental: rentalId,
      amount: rental.rentalFee,
      currency: 'USD',
      paymentMethod: 'paypal',
      paymentType: 'one-time',
      status: 'completed',
      paymentDetails: {
        orderId: captureData.id,
        captureId: captureData.purchase_units[0].payments.captures[0].id,
        payerId: captureData.payer.payer_id
      }
    });
    
    await transaction.save();
    
    // Update rental payment status
    rental.payment.status = 'completed';
    rental.payment.transactionId = transaction._id;
    rental.payment.method = 'paypal';
    rental.payment.type = 'one-time';
    rental.payment.paidAt = Date.now();
    
    await rental.save();
    
    // Return success response
    res.json({
      success: true,
      data: {
        transactionId: transaction._id,
        status: 'completed'
      }
    });
  } catch (error) {
    logger.error('Error capturing PayPal payment:', error);
    res.status(500);
    throw new Error('Failed to capture PayPal payment');
  }
});

/**
 * @desc    Create a PayPal subscription
 * @route   POST /api/payments/paypal/create-subscription
 * @access  Private
 */
const createPayPalSubscription = asyncHandler(async (req, res) => {
  const { rentalId, subscriptionPeriod } = req.body;
  
  if (!rentalId || !subscriptionPeriod) {
    res.status(400);
    throw new Error('Rental ID and subscription period are required');
  }
  
  // Validate subscription period
  if (!['monthly', 'quarterly', 'yearly'].includes(subscriptionPeriod)) {
    res.status(400);
    throw new Error('Invalid subscription period. Must be monthly, quarterly, or yearly');
  }
  
  // Get rental details
  const rental = await Rental.findById(rentalId);
  
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }
  
  // Check if user is authorized to pay for this rental
  if (rental.advertiser.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to pay for this rental');
  }
  
  // Check if rental is pending
  if (rental.status !== 'pending') {
    res.status(400);
    throw new Error('Rental is not in pending status');
  }
  
  // Check if payment is already completed
  if (rental.payment.status === 'completed') {
    res.status(400);
    throw new Error('Payment is already completed');
  }
  
  try {
    // Calculate subscription amount based on period
    let amount = rental.rentalFee;
    if (subscriptionPeriod === 'quarterly') {
      amount = (rental.rentalFee * 3 * 0.9).toFixed(2); // 10% discount for quarterly
    } else if (subscriptionPeriod === 'yearly') {
      amount = (rental.rentalFee * 12 * 0.8).toFixed(2); // 20% discount for yearly
    }
    
    // Create subscription plan
    const plan = await paypalService.createPlan({
      name: `API Key Rental: ${rental.socialAccount.platform}`,
      description: `${subscriptionPeriod.charAt(0).toUpperCase() + subscriptionPeriod.slice(1)} subscription for ${rental.socialAccount.platform} API Key`,
      amount: amount.toString(),
      currency: 'USD',
      interval: subscriptionPeriod
    });
    
    // Create subscription
    const subscription = await paypalService.createSubscription(plan.id);
    
    // Return subscription details
    res.json({
      success: true,
      data: {
        id: subscription.id,
        status: subscription.status,
        links: subscription.links,
        amount: amount,
        currency: 'USD',
        subscriptionPeriod
      }
    });
  } catch (error) {
    logger.error('Error creating PayPal subscription:', error);
    res.status(500);
    throw new Error('Failed to create PayPal subscription');
  }
});

/**
 * @desc    Execute a PayPal subscription
 * @route   POST /api/payments/paypal/execute-subscription
 * @access  Private
 */
const executePayPalSubscription = asyncHandler(async (req, res) => {
  const { token, rentalId } = req.body;
  
  if (!token || !rentalId) {
    res.status(400);
    throw new Error('Subscription token and Rental ID are required');
  }
  
  // Get rental details
  const rental = await Rental.findById(rentalId);
  
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }
  
  // Check if user is authorized to pay for this rental
  if (rental.advertiser.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to pay for this rental');
  }
  
  try {
    // Get subscription details
    const subscriptionDetails = await paypalService.getSubscription(token);
    
    if (subscriptionDetails.status !== 'ACTIVE' && subscriptionDetails.status !== 'APPROVED') {
      res.status(400);
      throw new Error('Subscription is not active');
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      rental: rentalId,
      amount: parseFloat(subscriptionDetails.billing_info.last_payment.amount.value),
      currency: subscriptionDetails.billing_info.last_payment.amount.currency_code,
      paymentMethod: 'paypal',
      paymentType: 'subscription',
      status: 'completed',
      paymentDetails: {
        subscriptionId: subscriptionDetails.id,
        planId: subscriptionDetails.plan_id,
        payerId: subscriptionDetails.subscriber.payer_id
      }
    });
    
    await transaction.save();
    
    // Update rental payment status
    rental.payment.status = 'completed';
    rental.payment.transactionId = transaction._id;
    rental.payment.method = 'paypal';
    rental.payment.type = 'subscription';
    rental.payment.paidAt = Date.now();
    rental.payment.subscriptionId = subscriptionDetails.id;
    
    await rental.save();
    
    // Return success response
    res.json({
      success: true,
      data: {
        transactionId: transaction._id,
        subscriptionId: subscriptionDetails.id,
        status: 'completed'
      }
    });
  } catch (error) {
    logger.error('Error executing PayPal subscription:', error);
    res.status(500);
    throw new Error('Failed to execute PayPal subscription');
  }
});

/**
 * @desc    Cancel a PayPal subscription
 * @route   POST /api/payments/paypal/cancel-subscription
 * @access  Private
 */
const cancelPayPalSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId, reason } = req.body;
  
  if (!subscriptionId) {
    res.status(400);
    throw new Error('Subscription ID is required');
  }
  
  try {
    // Find rental with this subscription
    const rental = await Rental.findOne({ 'payment.subscriptionId': subscriptionId });
    
    if (!rental) {
      res.status(404);
      throw new Error('Rental with this subscription not found');
    }
    
    // Check if user is authorized to cancel this subscription
    if (rental.advertiser.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to cancel this subscription');
    }
    
    // Cancel subscription
    await paypalService.cancelSubscription(subscriptionId, reason);
    
    // Update rental payment status
    rental.payment.status = 'cancelled';
    rental.payment.cancelledAt = Date.now();
    
    await rental.save();
    
    // Return success response
    res.json({
      success: true,
      data: {
        status: 'cancelled'
      }
    });
  } catch (error) {
    logger.error('Error cancelling PayPal subscription:', error);
    res.status(500);
    throw new Error('Failed to cancel PayPal subscription');
  }
});

/**
 * @desc    Handle PayPal webhook events
 * @route   POST /api/payments/paypal/webhook
 * @access  Public
 */
const handlePayPalWebhook = asyncHandler(async (req, res) => {
  const headers = req.headers;
  const body = JSON.stringify(req.body);
  
  try {
    // Verify webhook signature
    const isValid = await paypalService.verifyWebhook(headers, body);
    
    if (!isValid) {
      logger.error('Invalid PayPal webhook signature');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }
    
    const event = req.body;
    const eventType = event.event_type;
    
    logger.info(`Received PayPal webhook: ${eventType}`);
    
    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.SALE.COMPLETED':
        // Handle payment completion
        await handlePaymentCompleted(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Handle subscription cancellation
        await handleSubscriptionCancelled(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // Handle subscription expiration
        await handleSubscriptionExpired(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Handle subscription suspension
        await handleSubscriptionSuspended(event);
        break;
        
      default:
        logger.info(`Unhandled PayPal webhook event type: ${eventType}`);
    }
    
    // Return 200 response to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error handling PayPal webhook:', error);
    res.status(500).json({ message: 'Error handling webhook' });
  }
});

// Helper functions for webhook event handling

/**
 * Handle payment completed webhook event
 * @param {Object} event Webhook event data
 */
const handlePaymentCompleted = async (event) => {
  const resource = event.resource;
  const subscriptionId = resource.billing_agreement_id;
  
  if (!subscriptionId) {
    logger.info('No subscription ID in payment completed event');
    return;
  }
  
  try {
    // Find rental with this subscription
    const rental = await Rental.findOne({ 'payment.subscriptionId': subscriptionId });
    
    if (!rental) {
      logger.error(`Rental with subscription ID ${subscriptionId} not found`);
      return;
    }
    
    // Create transaction record if it doesn't exist
    const existingTransaction = await Transaction.findOne({
      rental: rental._id,
      'paymentDetails.transactionId': resource.id
    });
    
    if (!existingTransaction) {
      const transaction = new Transaction({
        user: rental.advertiser,
        rental: rental._id,
        amount: parseFloat(resource.amount.total),
        currency: resource.amount.currency,
        paymentMethod: 'paypal',
        paymentType: 'subscription',
        status: 'completed',
        paymentDetails: {
          subscriptionId: subscriptionId,
          transactionId: resource.id
        }
      });
      
      await transaction.save();
      
      logger.info(`Created transaction record for subscription payment: ${transaction._id}`);
    }
  } catch (error) {
    logger.error('Error handling payment completed webhook:', error);
  }
};

/**
 * Handle subscription cancelled webhook event
 * @param {Object} event Webhook event data
 */
const handleSubscriptionCancelled = async (event) => {
  const resource = event.resource;
  const subscriptionId = resource.id;
  
  try {
    // Find rental with this subscription
    const rental = await Rental.findOne({ 'payment.subscriptionId': subscriptionId });
    
    if (!rental) {
      logger.error(`Rental with subscription ID ${subscriptionId} not found`);
      return;
    }
    
    // Update rental payment status
    rental.payment.status = 'cancelled';
    rental.payment.cancelledAt = Date.now();
    
    await rental.save();
    
    logger.info(`Updated rental payment status to cancelled for subscription: ${subscriptionId}`);
  } catch (error) {
    logger.error('Error handling subscription cancelled webhook:', error);
  }
};

/**
 * Handle subscription expired webhook event
 * @param {Object} event Webhook event data
 */
const handleSubscriptionExpired = async (event) => {
  const resource = event.resource;
  const subscriptionId = resource.id;
  
  try {
    // Find rental with this subscription
    const rental = await Rental.findOne({ 'payment.subscriptionId': subscriptionId });
    
    if (!rental) {
      logger.error(`Rental with subscription ID ${subscriptionId} not found`);
      return;
    }
    
    // Update rental payment status
    rental.payment.status = 'expired';
    rental.payment.expiredAt = Date.now();
    
    await rental.save();
    
    logger.info(`Updated rental payment status to expired for subscription: ${subscriptionId}`);
  } catch (error) {
    logger.error('Error handling subscription expired webhook:', error);
  }
};

/**
 * Handle subscription suspended webhook event
 * @param {Object} event Webhook event data
 */
const handleSubscriptionSuspended = async (event) => {
  const resource = event.resource;
  const subscriptionId = resource.id;
  
  try {
    // Find rental with this subscription
    const rental = await Rental.findOne({ 'payment.subscriptionId': subscriptionId });
    
    if (!rental) {
      logger.error(`Rental with subscription ID ${subscriptionId} not found`);
      return;
    }
    
    // Update rental payment status
    rental.payment.status = 'suspended';
    rental.payment.suspendedAt = Date.now();
    
    await rental.save();
    
    logger.info(`Updated rental payment status to suspended for subscription: ${subscriptionId}`);
  } catch (error) {
    logger.error('Error handling subscription suspended webhook:', error);
  }
};

module.exports = {
  createPayPalOrder,
  capturePayPalPayment,
  createPayPalSubscription,
  executePayPalSubscription,
  cancelPayPalSubscription,
  handlePayPalWebhook
};
