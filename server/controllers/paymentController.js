const User = require('../models/userModel');
const Advertiser = require('../models/advertiserModel');
const Influencer = require('../models/influencerModel');
const Rental = require('../models/rentalModel');
const Transaction = require('../models/transactionModel');
const paymentService = require('../utils/paymentService');
const notificationService = require('../utils/notificationService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../config/logger');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createAuthorizationError,
  createThirdPartyApiError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

// @desc    Create a payment intent for a rental
// @route   POST /api/payments/create-intent
// @access  Private (Advertiser only)
const createPaymentIntent = wrap(async (req, res) => {
  const { rentalId, paymentMethodId } = req.body;
  
  // Get advertiser
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Get rental
  const rental = await Rental.findById(rentalId);
  
  if (!rental) {
    throw createResourceNotFoundError('Rental', rentalId);
  }
  
  // Check if rental belongs to this advertiser
  if (rental.advertiserId.toString() !== advertiser._id.toString()) {
    throw createAuthorizationError('Not authorized to access this rental', {
      rentalId,
      advertiserId: advertiser._id,
      rentalAdvertiserId: rental.advertiserId
    });
  }
  
  // Check if rental is pending
  if (rental.status !== 'pending') {
    throw createValidationError('Rental is not in pending status', {
      rentalId,
      currentStatus: rental.status,
      requiredStatus: 'pending'
    });
  }
  
  // Check if payment is already completed
  if (rental.payment.status === 'completed') {
    throw createValidationError('Payment is already completed for this rental', {
      rentalId,
      paymentStatus: rental.payment.status
    });
  }
  
  // Get or create Stripe customer
  let stripeCustomerId;
  
  if (advertiser.stripeCustomerId) {
    stripeCustomerId = advertiser.stripeCustomerId;
  } else {
    // Get user for email
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw createResourceNotFoundError('User', req.user._id);
    }
    
    try {
      // Create Stripe customer
      stripeCustomerId = await paymentService.createCustomer(user);
      
      // Save Stripe customer ID to advertiser
      advertiser.stripeCustomerId = stripeCustomerId;
      await advertiser.save();
    } catch (error) {
      throw createThirdPartyApiError(
        'Stripe',
        'Failed to create customer',
        { userId: req.user._id, error: error.message },
        error
      );
    }
  }
  
  try {
    // Create payment intent
    const { paymentIntent, transaction } = await paymentService.createPaymentIntent(
      rental,
      stripeCustomerId,
      paymentMethodId
    );
    
    // Update rental with payment intent ID
    rental.payment.method = 'credit_card';
    rental.payment.transactionId = transaction._id;
    await rental.save();
    
    // Create payment success notification if payment intent is successful
    if (paymentIntent.status === 'succeeded') {
      await notificationService.createPaymentSuccessNotification(
        transaction,
        req.user
      );
    }
    
    return res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: transaction.amount,
        currency: transaction.currency
      }
    });
  } catch (error) {
    logger.error('Error creating payment intent:', { error, rentalId, userId: req.user._id });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to create payment intent',
      { rentalId, error: error.message },
      error
    );
  }
});

// @desc    Confirm a payment intent
// @route   POST /api/payments/confirm-intent
// @access  Private (Advertiser only)
const confirmPaymentIntent = wrap(async (req, res) => {
  const { paymentIntentId } = req.body;
  
  if (!paymentIntentId) {
    throw createValidationError('Payment Intent ID is required', {
      requiredFields: ['paymentIntentId']
    });
  }
  
  // Get advertiser
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  try {
    // Find transaction by payment intent ID
    const transaction = await Transaction.findOne({ paymentIntentId });
    
    if (!transaction) {
      throw createResourceNotFoundError('Transaction with payment intent ID', paymentIntentId);
    }
    
    // Find rental by transaction ID
    const rental = await Rental.findOne({ 'payment.transactionId': transaction._id });
    
    if (!rental) {
      throw createResourceNotFoundError('Rental with transaction', transaction._id);
    }
    
    // Check if rental belongs to this advertiser
    if (rental.advertiserId.toString() !== advertiser._id.toString()) {
      throw createAuthorizationError('Not authorized to access this payment', {
        transactionId: transaction._id,
        advertiserId: advertiser._id,
        rentalAdvertiserId: rental.advertiserId
      });
    }
    
    // Confirm the payment intent
    const confirmedIntent = await paymentService.confirmPaymentIntent(paymentIntentId);
    
    // Update transaction status
    transaction.status = confirmedIntent.status === 'succeeded' ? 'completed' : 'failed';
    if (confirmedIntent.status === 'succeeded') {
      transaction.completedAt = new Date();
    }
    await transaction.save();
    
    // Update rental payment status
    if (confirmedIntent.status === 'succeeded') {
      rental.payment.status = 'completed';
      rental.payment.completedAt = new Date();
      rental.status = 'active';
      rental.startDate = new Date();
      
      // Calculate end date based on rental period
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + rental.durationDays);
      rental.endDate = endDate;
      
      await rental.save();
      
      // Notify the influencer about the accepted rental
      const influencer = await Influencer.findById(rental.influencerId);
      if (influencer && influencer.userId) {
        await notificationService.createNotification({
          userId: influencer.userId,
          type: 'rental_payment_completed',
          title: 'API Key Rental Payment Completed',
          message: `The payment for your ${rental.platform} API key rental has been completed and the rental is now active.`,
          data: {
            rentalId: rental._id,
            platform: rental.platform,
            amount: transaction.amount,
            currency: transaction.currency
          },
          actionLink: `/rentals/${rental._id}`,
          actionText: 'View Rental Details',
          sendEmail: true
        });
      }
    }
    
    return res.json({
      success: true,
      data: {
        status: confirmedIntent.status,
        paymentIntentId: confirmedIntent.id,
        amount: transaction.amount,
        currency: transaction.currency,
        rentalStatus: rental.status
      }
    });
  } catch (error) {
    logger.error('Error confirming payment intent:', { error, paymentIntentId, userId: req.user._id });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to confirm payment intent',
      { paymentIntentId, error: error.message },
      error
    );
  }
});

// @desc    Get user payment methods
// @route   GET /api/payments/methods
// @access  Private
const getPaymentMethods = wrap(async (req, res) => {
  // Get user type
  const user = await User.findById(req.user._id);
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Get customer profile based on user type
  let customerProfile;
  if (user.userType === 'advertiser') {
    customerProfile = await Advertiser.findOne({ userId: req.user._id });
  } else if (user.userType === 'influencer') {
    customerProfile = await Influencer.findOne({ userId: req.user._id });
  } else {
    throw createValidationError('Invalid user type for payment methods', {
      userType: user.userType
    });
  }
  
  if (!customerProfile) {
    throw createResourceNotFoundError('Customer profile', req.user._id);
  }
  
  // Check if customer has Stripe ID
  if (!customerProfile.stripeCustomerId) {
    return res.json({
      success: true,
      data: {
        paymentMethods: []
      }
    });
  }
  
  try {
    // Get payment methods from Stripe
    const paymentMethods = await paymentService.getPaymentMethods(customerProfile.stripeCustomerId);
    
    return res.json({
      success: true,
      data: {
        paymentMethods: paymentMethods.map(method => ({
          id: method.id,
          type: method.type,
          brand: method.card ? method.card.brand : null,
          last4: method.card ? method.card.last4 : null,
          expMonth: method.card ? method.card.exp_month : null,
          expYear: method.card ? method.card.exp_year : null,
          isDefault: method.metadata && method.metadata.isDefault === 'true'
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching payment methods:', { error, userId: req.user._id });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to retrieve payment methods',
      { userId: req.user._id, error: error.message },
      error
    );
  }
});

// @desc    Add a new payment method
// @route   POST /api/payments/methods
// @access  Private
const addPaymentMethod = wrap(async (req, res) => {
  const { paymentMethodId, setAsDefault } = req.body;
  
  if (!paymentMethodId) {
    throw createValidationError('Payment Method ID is required', {
      requiredFields: ['paymentMethodId']
    });
  }
  
  // Get user
  const user = await User.findById(req.user._id);
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Get customer profile based on user type
  let customerProfile;
  if (user.userType === 'advertiser') {
    customerProfile = await Advertiser.findOne({ userId: req.user._id });
  } else if (user.userType === 'influencer') {
    customerProfile = await Influencer.findOne({ userId: req.user._id });
  } else {
    throw createValidationError('Invalid user type for payment methods', {
      userType: user.userType
    });
  }
  
  if (!customerProfile) {
    throw createResourceNotFoundError('Customer profile', req.user._id);
  }
  
  try {
    // Get or create Stripe customer
    let stripeCustomerId;
    
    if (customerProfile.stripeCustomerId) {
      stripeCustomerId = customerProfile.stripeCustomerId;
    } else {
      // Create Stripe customer
      stripeCustomerId = await paymentService.createCustomer(user);
      
      // Save Stripe customer ID to profile
      customerProfile.stripeCustomerId = stripeCustomerId;
      await customerProfile.save();
    }
    
    // Attach payment method to customer
    const paymentMethod = await paymentService.attachPaymentMethod(
      paymentMethodId,
      stripeCustomerId,
      setAsDefault
    );
    
    return res.json({
      success: true,
      data: {
        paymentMethod: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          brand: paymentMethod.card ? paymentMethod.card.brand : null,
          last4: paymentMethod.card ? paymentMethod.card.last4 : null,
          expMonth: paymentMethod.card ? paymentMethod.card.exp_month : null,
          expYear: paymentMethod.card ? paymentMethod.card.exp_year : null,
          isDefault: setAsDefault === true
        }
      },
      message: 'Payment method added successfully'
    });
  } catch (error) {
    logger.error('Error adding payment method:', { error, userId: req.user._id, paymentMethodId });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to add payment method',
      { userId: req.user._id, paymentMethodId, error: error.message },
      error
    );
  }
});

// @desc    Delete a payment method
// @route   DELETE /api/payments/methods/:paymentMethodId
// @access  Private
const deletePaymentMethod = wrap(async (req, res) => {
  const { paymentMethodId } = req.params;
  
  if (!paymentMethodId) {
    throw createValidationError('Payment Method ID is required');
  }
  
  // Get user
  const user = await User.findById(req.user._id);
  if (!user) {
    throw createResourceNotFoundError('User', req.user._id);
  }
  
  // Get customer profile based on user type
  let customerProfile;
  if (user.userType === 'advertiser') {
    customerProfile = await Advertiser.findOne({ userId: req.user._id });
  } else if (user.userType === 'influencer') {
    customerProfile = await Influencer.findOne({ userId: req.user._id });
  } else {
    throw createValidationError('Invalid user type for payment methods', {
      userType: user.userType
    });
  }
  
  if (!customerProfile || !customerProfile.stripeCustomerId) {
    throw createResourceNotFoundError('Customer profile or payment method', req.user._id);
  }
  
  try {
    // Verify payment method belongs to customer
    const paymentMethods = await paymentService.getPaymentMethods(customerProfile.stripeCustomerId);
    
    const paymentMethodExists = paymentMethods.some(method => method.id === paymentMethodId);
    
    if (!paymentMethodExists) {
      throw createResourceNotFoundError('Payment method', paymentMethodId);
    }
    
    // Delete payment method
    await paymentService.detachPaymentMethod(paymentMethodId);
    
    return res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting payment method:', { error, userId: req.user._id, paymentMethodId });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to delete payment method',
      { userId: req.user._id, paymentMethodId, error: error.message },
      error
    );
  }
});

// @desc    Get transaction history
// @route   GET /api/payments/transactions
// @access  Private
const getTransactionHistory = wrap(async (req, res) => {
  const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  // Validate query parameters
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    throw createValidationError('Invalid pagination parameters', {
      page,
      limit,
      message: 'Page and limit must be positive integers'
    });
  }
  
  // Validate sort parameters
  const allowedSortFields = ['createdAt', 'amount', 'status', 'completedAt'];
  if (!allowedSortFields.includes(sortBy)) {
    throw createValidationError('Invalid sort field', {
      sortBy,
      allowedFields: allowedSortFields
    });
  }
  
  if (!['asc', 'desc'].includes(sortOrder)) {
    throw createValidationError('Invalid sort order', {
      sortOrder,
      allowedValues: ['asc', 'desc']
    });
  }
  
  // Build query
  const query = { userId: req.user._id };
  
  // Add status filter if provided
  if (status) {
    query.status = status;
  }
  
  try {
    // Get total count
    const total = await Transaction.countDocuments(query);
    
    // Get paginated transactions
    const transactions = await Transaction.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    
    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching transaction history:', { error, userId: req.user._id });
    throw createThirdPartyApiError(
      'Database',
      'Failed to retrieve transaction history',
      { userId: req.user._id, error: error.message },
      error
    );
  }
});

// @desc    Process a refund
// @route   POST /api/payments/refund
// @access  Private (Admin only)
const processRefund = wrap(async (req, res) => {
  const { transactionId, reason } = req.body;
  
  if (!transactionId) {
    throw createValidationError('Transaction ID is required');
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Only admins can process refunds', { 
      role: req.user.role,
      requiredRole: 'admin'
    });
  }
  
  try {
    // Process refund
    const { refund, transaction } = await paymentService.processRefund(transactionId, reason);
    
    // Get the user who made the payment
    const user = await User.findById(transaction.userId);
    
    if (user) {
      // Create notification for refund
      await notificationService.createNotification({
        userId: user._id,
        type: 'payment_success',
        title: 'Refund Processed',
        message: `A refund of $${transaction.amount} has been processed for your ${transaction.description}. Reason: ${reason || 'Not specified'}`,
        data: {
          transactionId: transaction._id,
          refundId: refund.id,
          amount: transaction.amount,
          currency: transaction.currency,
          reason
        },
        actionLink: '/transactions',
        actionText: 'View Transactions',
        sendEmail: true
      });
    }
    
    return res.json({
      success: true,
      data: {
        refund,
        transaction
      }
    });
  } catch (error) {
    logger.error('Error processing refund:', { error, transactionId });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to process refund',
      { transactionId, reason, error: error.message },
      error
    );
  }
});

// @desc    Create a subscription
// @route   POST /api/payments/subscriptions
// @access  Private (Advertiser only)
const createSubscription = wrap(async (req, res) => {
  const { rentalId, paymentMethodId, priceId } = req.body;
  
  if (!rentalId || !paymentMethodId || !priceId) {
    throw createValidationError('Required fields missing', {
      requiredFields: ['rentalId', 'paymentMethodId', 'priceId']
    });
  }
  
  // Get advertiser
  const advertiser = await Advertiser.findOne({ userId: req.user._id });
  
  if (!advertiser) {
    throw createResourceNotFoundError('Advertiser', req.user._id);
  }
  
  // Get rental
  const rental = await Rental.findById(rentalId);
  
  if (!rental) {
    throw createResourceNotFoundError('Rental', rentalId);
  }
  
  // Check if rental belongs to this advertiser
  if (rental.advertiserId.toString() !== advertiser._id.toString()) {
    throw createAuthorizationError('Not authorized to access this rental', {
      rentalId,
      advertiserId: advertiser._id,
      rentalAdvertiserId: rental.advertiserId
    });
  }
  
  // Check if rental is pending
  if (rental.status !== 'pending') {
    throw createValidationError('Rental is not in pending status', {
      rentalId,
      currentStatus: rental.status,
      requiredStatus: 'pending'
    });
  }
  
  // Get or create Stripe customer
  let stripeCustomerId;
  
  if (advertiser.stripeCustomerId) {
    stripeCustomerId = advertiser.stripeCustomerId;
  } else {
    // Get user for email
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw createResourceNotFoundError('User', req.user._id);
    }
    
    try {
      // Create Stripe customer
      stripeCustomerId = await paymentService.createCustomer(user);
      
      // Save Stripe customer ID to advertiser
      advertiser.stripeCustomerId = stripeCustomerId;
      await advertiser.save();
    } catch (error) {
      throw createThirdPartyApiError(
        'Stripe',
        'Failed to create customer',
        { userId: req.user._id, error: error.message },
        error
      );
    }
  }
  
  try {
    // Create subscription
    const { subscription, transaction } = await paymentService.createSubscription(
      rental,
      stripeCustomerId,
      paymentMethodId,
      priceId
    );
    
    // Update rental with subscription info
    rental.payment.method = 'subscription';
    rental.payment.transactionId = transaction._id;
    rental.payment.subscriptionId = subscription.id;
    rental.payment.subscriptionStatus = subscription.status;
    
    // If subscription is active, update rental status
    if (subscription.status === 'active') {
      rental.payment.status = 'completed';
      rental.payment.completedAt = new Date();
      rental.status = 'active';
      rental.startDate = new Date();
      
      // For subscription, end date is not set as it's recurring
      rental.endDate = null;
      
      // Create notification for influencer
      const influencer = await Influencer.findById(rental.influencerId);
      if (influencer && influencer.userId) {
        await notificationService.createNotification({
          userId: influencer.userId,
          type: 'rental_payment_completed',
          title: 'Subscription Started',
          message: `A subscription has been started for your ${rental.platform} API key rental.`,
          data: {
            rentalId: rental._id,
            platform: rental.platform,
            subscriptionId: subscription.id
          },
          actionLink: `/rentals/${rental._id}`,
          actionText: 'View Rental Details',
          sendEmail: true
        });
      }
    }
    
    await rental.save();
    
    return res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        rentalStatus: rental.status
      }
    });
  } catch (error) {
    logger.error('Error creating subscription:', { error, rentalId, userId: req.user._id });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to create subscription',
      { rentalId, error: error.message },
      error
    );
  }
});

// @desc    Cancel a subscription
// @route   POST /api/payments/subscriptions/:subscriptionId/cancel
// @access  Private
const cancelSubscription = wrap(async (req, res) => {
  const { subscriptionId } = req.params;
  const { cancelImmediately = false } = req.body;
  
  if (!subscriptionId) {
    throw createValidationError('Subscription ID is required');
  }
  
  // Get rental by subscription ID
  const rental = await Rental.findOne({ 'payment.subscriptionId': subscriptionId });
  
  if (!rental) {
    throw createResourceNotFoundError('Rental with subscription', subscriptionId);
  }
  
  // Check user permission
  let hasPermission = false;
  
  // User is the advertiser
  if (rental.advertiserId) {
    const advertiser = await Advertiser.findById(rental.advertiserId);
    if (advertiser && advertiser.userId.toString() === req.user._id.toString()) {
      hasPermission = true;
    }
  }
  
  // User is the influencer
  if (!hasPermission && rental.influencerId) {
    const influencer = await Influencer.findById(rental.influencerId);
    if (influencer && influencer.userId.toString() === req.user._id.toString()) {
      hasPermission = true;
    }
  }
  
  // User is admin
  if (!hasPermission && req.user.role === 'admin') {
    hasPermission = true;
  }
  
  if (!hasPermission) {
    throw createAuthorizationError('Not authorized to cancel this subscription', {
      subscriptionId,
      userId: req.user._id
    });
  }
  
  try {
    // Cancel subscription
    const canceledSubscription = await paymentService.cancelSubscription(
      subscriptionId,
      cancelImmediately
    );
    
    // Update rental
    rental.payment.subscriptionStatus = canceledSubscription.status;
    
    if (cancelImmediately) {
      rental.status = 'cancelled';
      rental.endDate = new Date();
    } else {
      // Will end at period end
      rental.endDate = new Date(canceledSubscription.cancel_at * 1000);
    }
    
    await rental.save();
    
    // Create notifications for both parties
    if (rental.advertiserId) {
      const advertiser = await Advertiser.findById(rental.advertiserId);
      if (advertiser && advertiser.userId) {
        await notificationService.createNotification({
          userId: advertiser.userId,
          type: 'subscription_cancelled',
          title: 'Subscription Cancelled',
          message: cancelImmediately
            ? `Your subscription for the ${rental.platform} API key has been cancelled immediately.`
            : `Your subscription for the ${rental.platform} API key will be cancelled at the end of the current billing period.`,
          data: {
            subscriptionId,
            rentalId: rental._id,
            platform: rental.platform,
            immediatelyCancelled: cancelImmediately,
            endDate: rental.endDate
          },
          actionLink: `/rentals/${rental._id}`,
          actionText: 'View Rental',
          sendEmail: true
        });
      }
    }
    
    if (rental.influencerId) {
      const influencer = await Influencer.findById(rental.influencerId);
      if (influencer && influencer.userId) {
        await notificationService.createNotification({
          userId: influencer.userId,
          type: 'subscription_cancelled',
          title: 'Subscription Cancelled',
          message: cancelImmediately
            ? `The subscription for your ${rental.platform} API key has been cancelled immediately.`
            : `The subscription for your ${rental.platform} API key will be cancelled at the end of the current billing period.`,
          data: {
            subscriptionId,
            rentalId: rental._id,
            platform: rental.platform,
            immediatelyCancelled: cancelImmediately,
            endDate: rental.endDate
          },
          actionLink: `/rentals/${rental._id}`,
          actionText: 'View Rental',
          sendEmail: true
        });
      }
    }
    
    return res.json({
      success: true,
      data: {
        subscriptionId: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledImmediately: cancelImmediately,
        endDate: rental.endDate
      },
      message: cancelImmediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the current billing period'
    });
  } catch (error) {
    logger.error('Error cancelling subscription:', { error, subscriptionId, userId: req.user._id });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to cancel subscription',
      { subscriptionId, error: error.message },
      error
    );
  }
});

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = wrap(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    throw createValidationError('Missing Stripe signature');
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error('Webhook signature verification failed:', { error });
    throw createValidationError('Invalid Stripe signature', { error: error.message });
  }
  
  try {
    // Handle the event
    const response = await paymentService.handleWebhookEvent(event);
    
    // Create notifications based on event type
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const transaction = await Transaction.findOne({ paymentIntentId: paymentIntent.id });
      
      if (transaction) {
        const user = await User.findById(transaction.userId);
        
        if (user) {
          await notificationService.createPaymentSuccessNotification(
            transaction,
            user
          );
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const transaction = await Transaction.findOne({ paymentIntentId: paymentIntent.id });
      
      if (transaction) {
        const user = await User.findById(transaction.userId);
        
        if (user) {
          await notificationService.createNotification({
            userId: user._id,
            type: 'payment_failed',
            title: 'Payment Failed',
            message: `Your payment for ${transaction.description} has failed. Reason: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
            data: {
              transactionId: transaction._id,
              paymentIntentId: paymentIntent.id,
              amount: transaction.amount,
              currency: transaction.currency,
              error: paymentIntent.last_payment_error
            },
            actionLink: '/payments',
            actionText: 'View Payment Details',
            sendEmail: true
          });
        }
      }
    } else if (event.type === 'subscription_schedule.canceled') {
      const schedule = event.data.object;
      const rental = await Rental.findOne({ 'payment.subscriptionId': schedule.subscription });
      
      if (rental) {
        // Update rental status
        rental.status = 'cancelled';
        rental.endDate = new Date();
        await rental.save();
      }
    }
    
    // Return a response to acknowledge receipt of the event
    return res.json({ received: true, type: event.type });
  } catch (error) {
    logger.error('Error handling webhook event:', { error, eventType: event?.type });
    throw createThirdPartyApiError(
      'Stripe',
      'Failed to handle webhook event',
      { eventType: event?.type, error: error.message },
      error
    );
  }
});

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  getTransactionHistory,
  processRefund,
  createSubscription,
  cancelSubscription,
  handleWebhook
};
