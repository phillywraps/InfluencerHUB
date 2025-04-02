const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/transactionModel');
const Rental = require('../models/rentalModel');
const Advertiser = require('../models/advertiserModel');
const Influencer = require('../models/influencerModel');

/**
 * Payment Service - Handles all Stripe API interactions
 */
const paymentService = {
  /**
   * Create a Stripe customer for a user
   * @param {Object} user - User object
   * @returns {Promise<String>} - Stripe customer ID
   */
  createCustomer: async (user) => {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user._id.toString()
        }
      });
      
      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create payment customer');
    }
  },

  /**
   * Create a payment method and attach it to a customer
   * @param {String} customerId - Stripe customer ID
   * @param {Object} paymentMethodData - Payment method data
   * @returns {Promise<Object>} - Payment method object
   */
  createPaymentMethod: async (customerId, paymentMethodData) => {
    try {
      // If token is provided, use it to create a payment method
      let paymentMethod;
      
      if (paymentMethodData.token) {
        paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: paymentMethodData.token
          }
        });
      } else if (paymentMethodData.id) {
        // If payment method ID is provided, retrieve it
        paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodData.id);
      } else {
        throw new Error('Invalid payment method data');
      }
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId
      });
      
      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw new Error('Failed to create payment method');
    }
  },

  /**
   * Create a payment intent for a rental
   * @param {Object} rental - Rental object
   * @param {String} customerId - Stripe customer ID
   * @param {String} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} - Payment intent object
   */
  createPaymentIntent: async (rental, customerId, paymentMethodId) => {
    try {
      // Calculate platform fee (10% of rental fee)
      const platformFeePercentage = 10;
      const platformFeeAmount = Math.round(rental.payment.amount * (platformFeePercentage / 100));
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(rental.payment.amount * 100), // Convert to cents
        currency: rental.payment.currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        description: `Rental payment for ${rental.platform} API key`,
        metadata: {
          rentalId: rental._id.toString(),
          platform: rental.platform,
          advertiserId: rental.advertiserId.toString(),
          influencerId: rental.influencerId.toString()
        },
        application_fee_amount: Math.round(platformFeeAmount * 100) // Convert to cents
      });
      
      // Create transaction record
      const transaction = await Transaction.create({
        userId: rental.advertiserId,
        rentalId: rental._id,
        amount: rental.payment.amount,
        currency: rental.payment.currency,
        status: 'pending',
        paymentMethod: 'credit_card',
        paymentIntentId: paymentIntent.id,
        stripeCustomerId: customerId,
        paymentMethodId: paymentMethodId,
        description: `Rental payment for ${rental.platform} API key`,
        platformFee: {
          amount: platformFeeAmount,
          percentage: platformFeePercentage
        }
      });
      
      return {
        paymentIntent,
        transaction
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  },

  /**
   * Confirm a payment intent
   * @param {String} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} - Payment intent object
   */
  confirmPaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      
      // Update transaction status
      const transaction = await Transaction.findOne({ paymentIntentId });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      transaction.status = paymentIntent.status === 'succeeded' ? 'completed' : 'pending';
      
      if (paymentIntent.status === 'succeeded') {
        // Update rental payment status
        const rental = await Rental.findById(transaction.rentalId);
        
        if (rental) {
          rental.payment.status = 'completed';
          rental.payment.transactionId = transaction._id;
          rental.status = 'active';
          
          await rental.save();
        }
      }
      
      await transaction.save();
      
      return {
        paymentIntent,
        transaction
      };
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw new Error('Failed to confirm payment');
    }
  },

  /**
   * Process a refund for a transaction
   * @param {String} transactionId - Transaction ID
   * @param {String} reason - Refund reason
   * @returns {Promise<Object>} - Refund object
   */
  processRefund: async (transactionId, reason) => {
    try {
      const transaction = await Transaction.findById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      if (transaction.status !== 'completed') {
        throw new Error('Cannot refund a transaction that is not completed');
      }
      
      // Process refund through Stripe
      const refund = await stripe.refunds.create({
        payment_intent: transaction.paymentIntentId,
        reason: reason || 'requested_by_customer'
      });
      
      // Update transaction status
      transaction.status = 'refunded';
      transaction.refundReason = reason;
      
      await transaction.save();
      
      // Update rental payment status
      const rental = await Rental.findById(transaction.rentalId);
      
      if (rental) {
        rental.payment.status = 'refunded';
        
        await rental.save();
      }
      
      return {
        refund,
        transaction
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  },

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe event object
   * @returns {Promise<Object>} - Response object
   */
  handleWebhookEvent: async (event) => {
    try {
      let response = { received: true };
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          
          // Update transaction status
          const transaction = await Transaction.findOne({ paymentIntentId: paymentIntent.id });
          
          if (transaction) {
            transaction.status = 'completed';
            
            // Update rental payment status
            const rental = await Rental.findById(transaction.rentalId);
            
            if (rental) {
              rental.payment.status = 'completed';
              rental.payment.transactionId = transaction._id;
              rental.status = 'active';
              
              await rental.save();
            }
            
            await transaction.save();
            
            response.transaction = transaction;
          }
          break;
          
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          
          // Update transaction status
          const failedTransaction = await Transaction.findOne({ paymentIntentId: failedPaymentIntent.id });
          
          if (failedTransaction) {
            failedTransaction.status = 'failed';
            failedTransaction.errorMessage = failedPaymentIntent.last_payment_error?.message || 'Payment failed';
            
            await failedTransaction.save();
            
            response.transaction = failedTransaction;
          }
          break;
      }
      
      return response;
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw new Error('Failed to handle webhook event');
    }
  },

  /**
   * Get payment methods for a customer
   * @param {String} customerId - Stripe customer ID
   * @returns {Promise<Array>} - Array of payment methods
   */
  getPaymentMethods: async (customerId) => {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      return paymentMethods.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new Error('Failed to get payment methods');
    }
  },

  /**
   * Delete a payment method
   * @param {String} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} - Deleted payment method
   */
  deletePaymentMethod: async (paymentMethodId) => {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
      
      return paymentMethod;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw new Error('Failed to delete payment method');
    }
  },

  /**
   * Create a subscription for a rental
   * @param {Object} rental - Rental object
   * @param {String} customerId - Stripe customer ID
   * @param {String} paymentMethodId - Payment method ID
   * @param {String} subscriptionPeriod - Subscription period (monthly, quarterly, yearly)
   * @returns {Promise<Object>} - Subscription object
   */
  createSubscription: async (rental, customerId, paymentMethodId, subscriptionPeriod) => {
    try {
      // Calculate platform fee (10% of rental fee)
      const platformFeePercentage = 10;
      const platformFeeAmount = Math.round(rental.payment.amount * (platformFeePercentage / 100));
      
      // Determine billing interval based on subscription period
      let interval = 'month';
      let intervalCount = 1;
      
      switch (subscriptionPeriod) {
        case 'monthly':
          interval = 'month';
          intervalCount = 1;
          break;
        case 'quarterly':
          interval = 'month';
          intervalCount = 3;
          break;
        case 'yearly':
          interval = 'year';
          intervalCount = 1;
          break;
        default:
          interval = 'month';
          intervalCount = 1;
      }
      
      // Create a product for the rental
      const product = await stripe.products.create({
        name: `${rental.platform} API Key Rental`,
        description: `Subscription for ${rental.platform} API key rental`,
        metadata: {
          rentalId: rental._id.toString(),
          platform: rental.platform
        }
      });
      
      // Create a price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(rental.payment.amount * 100), // Convert to cents
        currency: rental.payment.currency.toLowerCase(),
        recurring: {
          interval,
          interval_count: intervalCount
        },
        metadata: {
          rentalId: rental._id.toString(),
          platform: rental.platform
        }
      });
      
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: price.id
          }
        ],
        default_payment_method: paymentMethodId,
        metadata: {
          rentalId: rental._id.toString(),
          platform: rental.platform,
          advertiserId: rental.advertiserId.toString(),
          influencerId: rental.influencerId.toString()
        },
        application_fee_percent: platformFeePercentage
      });
      
      // Create transaction record
      const transaction = await Transaction.create({
        userId: rental.advertiserId,
        rentalId: rental._id,
        amount: rental.payment.amount,
        currency: rental.payment.currency,
        status: subscription.status === 'active' ? 'completed' : 'pending',
        paymentMethod: 'credit_card',
        subscriptionId: subscription.id,
        isSubscription: true,
        subscriptionStatus: subscription.status,
        subscriptionPeriod: subscriptionPeriod,
        stripeCustomerId: customerId,
        paymentMethodId: paymentMethodId,
        description: `Subscription payment for ${rental.platform} API key`,
        platformFee: {
          amount: platformFeeAmount,
          percentage: platformFeePercentage
        }
      });
      
      // Update rental with subscription information
      rental.payment.isSubscription = true;
      rental.payment.subscriptionId = subscription.id;
      rental.payment.subscriptionStatus = subscription.status;
      rental.payment.subscriptionPeriod = subscriptionPeriod;
      rental.payment.transactionId = transaction._id;
      
      if (subscription.status === 'active') {
        rental.payment.status = 'completed';
        rental.status = 'active';
      }
      
      if (subscription.current_period_end) {
        rental.payment.nextBillingDate = new Date(subscription.current_period_end * 1000);
      }
      
      await rental.save();
      
      return {
        subscription,
        transaction,
        rental
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  },

  /**
   * Cancel a subscription
   * @param {String} subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Canceled subscription
   */
  cancelSubscription: async (subscriptionId) => {
    try {
      const subscription = await stripe.subscriptions.del(subscriptionId);
      
      // Update rental with subscription status
      const rental = await Rental.findOne({ 'payment.subscriptionId': subscriptionId });
      
      if (rental) {
        rental.payment.subscriptionStatus = 'canceled';
        
        await rental.save();
      }
      
      return {
        subscription,
        rental
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  },

  /**
   * Handle subscription webhook events
   * @param {Object} event - Stripe event object
   * @returns {Promise<Object>} - Response object
   */
  handleSubscriptionWebhookEvent: async (event) => {
    try {
      let response = { received: true };
      
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object;
          
          // Update rental with subscription status
          const rental = await Rental.findOne({ 'payment.subscriptionId': subscription.id });
          
          if (rental) {
            rental.payment.subscriptionStatus = subscription.status;
            
            if (subscription.current_period_end) {
              rental.payment.nextBillingDate = new Date(subscription.current_period_end * 1000);
            }
            
            await rental.save();
            
            response.rental = rental;
          }
          break;
          
        case 'customer.subscription.deleted':
          const canceledSubscription = event.data.object;
          
          // Update rental with subscription status
          const canceledRental = await Rental.findOne({ 'payment.subscriptionId': canceledSubscription.id });
          
          if (canceledRental) {
            canceledRental.payment.subscriptionStatus = 'canceled';
            
            await canceledRental.save();
            
            response.rental = canceledRental;
          }
          break;
          
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          
          if (invoice.subscription) {
            // Find rental by subscription ID
            const invoiceRental = await Rental.findOne({ 'payment.subscriptionId': invoice.subscription });
            
            if (invoiceRental) {
              // Create transaction record for this payment
              const transaction = await Transaction.create({
                userId: invoiceRental.advertiserId,
                rentalId: invoiceRental._id,
                amount: invoice.amount_paid / 100, // Convert from cents
                currency: invoice.currency,
                status: 'completed',
                paymentMethod: 'credit_card',
                subscriptionId: invoice.subscription,
                isSubscription: true,
                subscriptionStatus: 'active',
                subscriptionPeriod: invoiceRental.payment.subscriptionPeriod,
                description: `Subscription payment for ${invoiceRental.platform} API key`,
                platformFee: {
                  amount: (invoice.amount_paid / 100) * 0.1, // 10% platform fee
                  percentage: 10
                }
              });
              
              // Add to billing history
              invoiceRental.payment.billingHistory.push({
                date: new Date(),
                amount: invoice.amount_paid / 100,
                status: 'completed',
                transactionId: transaction._id
              });
              
              await invoiceRental.save();
              
              response.transaction = transaction;
              response.rental = invoiceRental;
            }
          }
          break;
          
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          
          if (failedInvoice.subscription) {
            // Find rental by subscription ID
            const failedRental = await Rental.findOne({ 'payment.subscriptionId': failedInvoice.subscription });
            
            if (failedRental) {
              // Create transaction record for this failed payment
              const failedTransaction = await Transaction.create({
                userId: failedRental.advertiserId,
                rentalId: failedRental._id,
                amount: failedInvoice.amount_due / 100, // Convert from cents
                currency: failedInvoice.currency,
                status: 'failed',
                paymentMethod: 'credit_card',
                subscriptionId: failedInvoice.subscription,
                isSubscription: true,
                subscriptionStatus: 'past_due',
                subscriptionPeriod: failedRental.payment.subscriptionPeriod,
                description: `Failed subscription payment for ${failedRental.platform} API key`,
                errorMessage: failedInvoice.last_payment_error?.message || 'Payment failed'
              });
              
              // Add to billing history
              failedRental.payment.billingHistory.push({
                date: new Date(),
                amount: failedInvoice.amount_due / 100,
                status: 'failed',
                transactionId: failedTransaction._id
              });
              
              // Update subscription status
              failedRental.payment.subscriptionStatus = 'past_due';
              
              await failedRental.save();
              
              response.transaction = failedTransaction;
              response.rental = failedRental;
            }
          }
          break;
      }
      
      return response;
    } catch (error) {
      console.error('Error handling subscription webhook event:', error);
      throw new Error('Failed to handle subscription webhook event');
    }
  }
};

module.exports = paymentService;
