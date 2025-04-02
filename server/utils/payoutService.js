const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Influencer = require('../models/influencerModel');
const Transaction = require('../models/transactionModel');
const Rental = require('../models/rentalModel');
const notificationService = require('./notificationService');
const User = require('../models/userModel');

/**
 * Payout Service - Handles all payout-related operations
 */
const payoutService = {
  /**
   * Calculate earnings for a rental payment
   * @param {Object} transaction - Transaction object
   * @param {Object} rental - Rental object
   * @returns {Promise<Object>} - Earnings object
   */
  calculateEarnings: async (transaction, rental) => {
    try {
      // Get platform fee percentage
      const platformFeePercentage = transaction.platformFee?.percentage || 10;
      
      // Calculate platform fee amount
      const platformFeeAmount = (transaction.amount * platformFeePercentage) / 100;
      
      // Calculate influencer earnings
      const influencerEarnings = transaction.amount - platformFeeAmount;
      
      return {
        total: transaction.amount,
        platformFee: platformFeeAmount,
        influencerEarnings,
        currency: transaction.currency
      };
    } catch (error) {
      console.error('Error calculating earnings:', error);
      throw new Error('Failed to calculate earnings');
    }
  },

  /**
   * Process a rental payment and update influencer balance
   * @param {Object} transaction - Transaction object
   * @param {Object} rental - Rental object
   * @returns {Promise<Object>} - Updated influencer object
   */
  processRentalPayment: async (transaction, rental) => {
    try {
      // Calculate earnings
      const earnings = await payoutService.calculateEarnings(transaction, rental);
      
      // Get influencer
      const influencer = await Influencer.findById(rental.influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      // Create balance transaction
      const balanceTransaction = {
        type: 'rental_payment',
        amount: earnings.influencerEarnings,
        currency: transaction.currency,
        status: 'completed',
        description: `Earnings from ${rental.platform} API key rental`,
        rentalId: rental._id,
        transactionId: transaction._id,
        platformFee: {
          amount: earnings.platformFee,
          percentage: transaction.platformFee?.percentage || 10
        }
      };
      
      // Add balance transaction to influencer
      influencer.balanceTransactions.push(balanceTransaction);
      
      // Update influencer balance
      influencer.balance.available += earnings.influencerEarnings;
      influencer.balance.lastUpdated = new Date();
      
      // Save influencer
      await influencer.save();
      
      // Get user for notification
      const user = await User.findById(influencer.userId);
      
      if (user) {
        // Create notification for earnings
        await notificationService.createNotification({
          userId: user._id,
          type: 'payment_success',
          title: 'New Earnings',
          message: `You've earned $${earnings.influencerEarnings.toFixed(2)} from your ${rental.platform} API key rental.`,
          data: {
            rentalId: rental._id,
            transactionId: transaction._id,
            amount: earnings.influencerEarnings,
            currency: transaction.currency
          },
          actionLink: '/dashboard',
          actionText: 'View Dashboard',
          sendEmail: true
        });
      }
      
      return influencer;
    } catch (error) {
      console.error('Error processing rental payment:', error);
      throw new Error('Failed to process rental payment');
    }
  },

  /**
   * Create a payout to an influencer
   * @param {String} influencerId - Influencer ID
   * @param {Object} payoutData - Payout data
   * @returns {Promise<Object>} - Payout object
   */
  createPayout: async (influencerId, payoutData) => {
    try {
      // Get influencer
      const influencer = await Influencer.findById(influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      // Check if influencer has enough balance
      if (influencer.balance.available < payoutData.amount) {
        throw new Error('Insufficient balance');
      }
      
      // Get default payout method
      const defaultPayoutMethod = influencer.payoutMethods.find(method => method.isDefault);
      
      if (!defaultPayoutMethod && !payoutData.payoutMethodId) {
        throw new Error('No default payout method found');
      }
      
      // Get payout method
      const payoutMethod = payoutData.payoutMethodId 
        ? influencer.payoutMethods.id(payoutData.payoutMethodId)
        : defaultPayoutMethod;
      
      if (!payoutMethod) {
        throw new Error('Payout method not found');
      }
      
      let payout;
      
      // Process payout based on method type
      switch (payoutMethod.type) {
        case 'stripe':
          // Create Stripe payout
          payout = await stripe.payouts.create({
            amount: Math.round(payoutData.amount * 100), // Convert to cents
            currency: influencer.balance.currency.toLowerCase(),
            destination: payoutMethod.details.stripeAccountId,
            metadata: {
              influencerId: influencer._id.toString()
            }
          });
          break;
          
        case 'paypal':
          // For PayPal, we would integrate with PayPal API
          // This is a placeholder for now
          payout = {
            id: `paypal_${Date.now()}`,
            amount: payoutData.amount,
            currency: influencer.balance.currency,
            status: 'pending',
            destination: payoutMethod.details.email
          };
          break;
          
        case 'bank_account':
          // For bank account, we would integrate with a banking API
          // This is a placeholder for now
          payout = {
            id: `bank_${Date.now()}`,
            amount: payoutData.amount,
            currency: influencer.balance.currency,
            status: 'pending',
            destination: `${payoutMethod.details.bankName} - ${payoutMethod.details.accountHolderName}`
          };
          break;
          
        case 'crypto':
          // For crypto, we would integrate with a crypto payment processor
          // This is a placeholder for now
          payout = {
            id: `crypto_${Date.now()}`,
            amount: payoutData.amount,
            currency: influencer.balance.currency,
            status: 'pending',
            destination: `${payoutMethod.details.cryptoCurrency} - ${payoutMethod.details.walletAddress}`
          };
          break;
          
        default:
          throw new Error('Unsupported payout method type');
      }
      
      // Create balance transaction
      const balanceTransaction = {
        type: 'payout',
        amount: -payoutData.amount, // Negative amount for payout
        currency: influencer.balance.currency,
        status: 'pending',
        description: payoutData.description || 'Payout to influencer',
        payoutId: payout.id,
        metadata: {
          payoutMethod: payoutMethod.type,
          destination: payout.destination
        }
      };
      
      // Add balance transaction to influencer
      influencer.balanceTransactions.push(balanceTransaction);
      
      // Update influencer balance
      influencer.balance.available -= payoutData.amount;
      influencer.balance.pending += payoutData.amount;
      influencer.balance.lastUpdated = new Date();
      
      // Save influencer
      await influencer.save();
      
      // Get user for notification
      const user = await User.findById(influencer.userId);
      
      if (user) {
        // Create notification for payout
        await notificationService.createNotification({
          userId: user._id,
          type: 'payout_initiated',
          title: 'Payout Initiated',
          message: `Your payout of $${payoutData.amount.toFixed(2)} has been initiated. It may take 1-3 business days to process.`,
          data: {
            payoutId: payout.id,
            amount: payoutData.amount,
            currency: influencer.balance.currency,
            status: 'pending'
          },
          actionLink: '/dashboard',
          actionText: 'View Dashboard',
          sendEmail: true
        });
      }
      
      return {
        payout,
        balanceTransaction: influencer.balanceTransactions[influencer.balanceTransactions.length - 1]
      };
    } catch (error) {
      console.error('Error creating payout:', error);
      throw new Error('Failed to create payout');
    }
  },

  /**
   * Update payout status
   * @param {String} influencerId - Influencer ID
   * @param {String} payoutId - Payout ID
   * @param {String} status - New status
   * @returns {Promise<Object>} - Updated influencer object
   */
  updatePayoutStatus: async (influencerId, payoutId, status) => {
    try {
      // Get influencer
      const influencer = await Influencer.findById(influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      // Find balance transaction for this payout
      const balanceTransaction = influencer.balanceTransactions.find(
        transaction => transaction.payoutId === payoutId
      );
      
      if (!balanceTransaction) {
        throw new Error('Balance transaction not found');
      }
      
      // Update balance transaction status
      balanceTransaction.status = status;
      
      // If payout is completed, move from pending to available
      if (status === 'completed') {
        // Update influencer balance
        influencer.balance.pending -= Math.abs(balanceTransaction.amount);
        influencer.balance.lastUpdated = new Date();
        
        // Get user for notification
        const user = await User.findById(influencer.userId);
        
        if (user) {
          // Create notification for completed payout
          await notificationService.createNotification({
            userId: user._id,
            type: 'payout_completed',
            title: 'Payout Completed',
            message: `Your payout of $${Math.abs(balanceTransaction.amount).toFixed(2)} has been completed.`,
            data: {
              payoutId,
              amount: Math.abs(balanceTransaction.amount),
              currency: balanceTransaction.currency,
              status: 'completed'
            },
            actionLink: '/dashboard',
            actionText: 'View Dashboard',
            sendEmail: true
          });
        }
      } else if (status === 'failed' || status === 'cancelled') {
        // If payout failed or was cancelled, move from pending back to available
        influencer.balance.pending -= Math.abs(balanceTransaction.amount);
        influencer.balance.available += Math.abs(balanceTransaction.amount);
        influencer.balance.lastUpdated = new Date();
        
        // Get user for notification
        const user = await User.findById(influencer.userId);
        
        if (user) {
          // Create notification for failed payout
          await notificationService.createNotification({
            userId: user._id,
            type: 'payout_failed',
            title: status === 'failed' ? 'Payout Failed' : 'Payout Cancelled',
            message: `Your payout of $${Math.abs(balanceTransaction.amount).toFixed(2)} has ${status === 'failed' ? 'failed' : 'been cancelled'}. The funds have been returned to your available balance.`,
            data: {
              payoutId,
              amount: Math.abs(balanceTransaction.amount),
              currency: balanceTransaction.currency,
              status
            },
            actionLink: '/dashboard',
            actionText: 'View Dashboard',
            sendEmail: true
          });
        }
      }
      
      // Save influencer
      await influencer.save();
      
      return influencer;
    } catch (error) {
      console.error('Error updating payout status:', error);
      throw new Error('Failed to update payout status');
    }
  },

  /**
   * Add a payout method for an influencer
   * @param {String} influencerId - Influencer ID
   * @param {Object} payoutMethodData - Payout method data
   * @returns {Promise<Object>} - Updated influencer object
   */
  addPayoutMethod: async (influencerId, payoutMethodData) => {
    try {
      // Get influencer
      const influencer = await Influencer.findById(influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      // Create payout method
      const payoutMethod = {
        type: payoutMethodData.type,
        isDefault: payoutMethodData.isDefault || influencer.payoutMethods.length === 0,
        details: payoutMethodData.details,
        status: payoutMethodData.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // If this is the default method, set all others to non-default
      if (payoutMethod.isDefault) {
        influencer.payoutMethods.forEach(method => {
          method.isDefault = false;
        });
      }
      
      // Add payout method to influencer
      influencer.payoutMethods.push(payoutMethod);
      
      // Save influencer
      await influencer.save();
      
      // Get user for notification
      const user = await User.findById(influencer.userId);
      
      if (user) {
        // Create notification for new payout method
        await notificationService.createNotification({
          userId: user._id,
          type: 'system',
          title: 'Payout Method Added',
          message: `A new payout method (${payoutMethod.type}) has been added to your account.`,
          data: {
            payoutMethodId: payoutMethod._id,
            type: payoutMethod.type
          },
          actionLink: '/profile',
          actionText: 'View Profile',
          sendEmail: false
        });
      }
      
      return influencer;
    } catch (error) {
      console.error('Error adding payout method:', error);
      throw new Error('Failed to add payout method');
    }
  },

  /**
   * Delete a payout method
   * @param {String} influencerId - Influencer ID
   * @param {String} payoutMethodId - Payout method ID
   * @returns {Promise<Object>} - Updated influencer object
   */
  deletePayoutMethod: async (influencerId, payoutMethodId) => {
    try {
      // Get influencer
      const influencer = await Influencer.findById(influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      // Find payout method
      const payoutMethodIndex = influencer.payoutMethods.findIndex(
        method => method._id.toString() === payoutMethodId
      );
      
      if (payoutMethodIndex === -1) {
        throw new Error('Payout method not found');
      }
      
      // Check if this is the default method
      const isDefault = influencer.payoutMethods[payoutMethodIndex].isDefault;
      
      // Remove payout method
      influencer.payoutMethods.splice(payoutMethodIndex, 1);
      
      // If this was the default method and there are other methods, set the first one as default
      if (isDefault && influencer.payoutMethods.length > 0) {
        influencer.payoutMethods[0].isDefault = true;
      }
      
      // Save influencer
      await influencer.save();
      
      // Get user for notification
      const user = await User.findById(influencer.userId);
      
      if (user) {
        // Create notification for deleted payout method
        await notificationService.createNotification({
          userId: user._id,
          type: 'system',
          title: 'Payout Method Removed',
          message: 'A payout method has been removed from your account.',
          actionLink: '/profile',
          actionText: 'View Profile',
          sendEmail: false
        });
      }
      
      return influencer;
    } catch (error) {
      console.error('Error deleting payout method:', error);
      throw new Error('Failed to delete payout method');
    }
  },

  /**
   * Get payout methods for an influencer
   * @param {String} influencerId - Influencer ID
   * @returns {Promise<Array>} - Array of payout methods
   */
  getPayoutMethods: async (influencerId) => {
    try {
      // Get influencer
      const influencer = await Influencer.findById(influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      return influencer.payoutMethods;
    } catch (error) {
      console.error('Error getting payout methods:', error);
      throw new Error('Failed to get payout methods');
    }
  },

  /**
   * Get balance transactions for an influencer
   * @param {String} influencerId - Influencer ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of balance transactions
   */
  getBalanceTransactions: async (influencerId, filters = {}) => {
    try {
      // Get influencer
      const influencer = await Influencer.findById(influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      // Apply filters
      let transactions = influencer.balanceTransactions;
      
      if (filters.type) {
        transactions = transactions.filter(transaction => transaction.type === filters.type);
      }
      
      if (filters.status) {
        transactions = transactions.filter(transaction => transaction.status === filters.status);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        transactions = transactions.filter(transaction => new Date(transaction.createdAt) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        transactions = transactions.filter(transaction => new Date(transaction.createdAt) <= endDate);
      }
      
      // Sort by date (newest first)
      transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return transactions;
    } catch (error) {
      console.error('Error getting balance transactions:', error);
      throw new Error('Failed to get balance transactions');
    }
  },

  /**
   * Get balance for an influencer
   * @param {String} influencerId - Influencer ID
   * @returns {Promise<Object>} - Balance object
   */
  getBalance: async (influencerId) => {
    try {
      // Get influencer
      const influencer = await Influencer.findById(influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      return influencer.balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get balance');
    }
  },

  /**
   * Process automatic payouts based on payout schedule
   * @returns {Promise<Array>} - Array of processed payouts
   */
  processAutomaticPayouts: async () => {
    try {
      const processedPayouts = [];
      
      // Get all influencers with automatic payout schedules
      const influencers = await Influencer.find({
        'payoutSchedule.frequency': { $ne: 'manual' }
      });
      
      for (const influencer of influencers) {
        // Skip if next payout date is in the future
        if (influencer.payoutSchedule.nextPayoutDate && new Date(influencer.payoutSchedule.nextPayoutDate) > new Date()) {
          continue;
        }
        
        // Skip if available balance is less than minimum amount
        if (influencer.balance.available < influencer.payoutSchedule.minimumAmount) {
          continue;
        }
        
        // Process payout
        try {
          const { payout } = await payoutService.createPayout(influencer._id, {
            amount: influencer.balance.available,
            description: 'Automatic scheduled payout'
          });
          
          processedPayouts.push({
            influencerId: influencer._id,
            payoutId: payout.id,
            amount: influencer.balance.available,
            currency: influencer.balance.currency
          });
          
          // Calculate next payout date
          let nextPayoutDate = new Date();
          
          switch (influencer.payoutSchedule.frequency) {
            case 'weekly':
              // Set to next occurrence of the specified day of week
              nextPayoutDate.setDate(nextPayoutDate.getDate() + (7 - nextPayoutDate.getDay() + influencer.payoutSchedule.dayOfWeek) % 7);
              break;
              
            case 'biweekly':
              // Set to 2 weeks from now, on the specified day of week
              nextPayoutDate.setDate(nextPayoutDate.getDate() + 14 + (7 - nextPayoutDate.getDay() + influencer.payoutSchedule.dayOfWeek) % 7);
              break;
              
            case 'monthly':
              // Set to next month, on the specified day of month
              nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
              nextPayoutDate.setDate(Math.min(influencer.payoutSchedule.dayOfMonth, new Date(nextPayoutDate.getFullYear(), nextPayoutDate.getMonth() + 1, 0).getDate()));
              break;
          }
          
          // Update next payout date
          influencer.payoutSchedule.nextPayoutDate = nextPayoutDate;
          await influencer.save();
        } catch (error) {
          console.error(`Error processing automatic payout for influencer ${influencer._id}:`, error);
          // Continue with next influencer
        }
      }
      
      return processedPayouts;
    } catch (error) {
      console.error('Error processing automatic payouts:', error);
      throw new Error('Failed to process automatic payouts');
    }
  },

  /**
   * Update payout schedule for an influencer
   * @param {String} influencerId - Influencer ID
   * @param {Object} scheduleData - Payout schedule data
   * @returns {Promise<Object>} - Updated influencer object
   */
  updatePayoutSchedule: async (influencerId, scheduleData) => {
    try {
      // Get influencer
      const influencer = await Influencer.findById(influencerId);
      
      if (!influencer) {
        throw new Error('Influencer not found');
      }
      
      // Update payout schedule
      influencer.payoutSchedule.frequency = scheduleData.frequency || influencer.payoutSchedule.frequency;
      influencer.payoutSchedule.minimumAmount = scheduleData.minimumAmount || influencer.payoutSchedule.minimumAmount;
      
      if (scheduleData.dayOfWeek !== undefined) {
        influencer.payoutSchedule.dayOfWeek = scheduleData.dayOfWeek;
      }
      
      if (scheduleData.dayOfMonth !== undefined) {
        influencer.payoutSchedule.dayOfMonth = scheduleData.dayOfMonth;
      }
      
      // Calculate next payout date if frequency is not manual
      if (influencer.payoutSchedule.frequency !== 'manual') {
        let nextPayoutDate = new Date();
        
        switch (influencer.payoutSchedule.frequency) {
          case 'weekly':
            // Set to next occurrence of the specified day of week
            nextPayoutDate.setDate(nextPayoutDate.getDate() + (7 - nextPayoutDate.getDay() + influencer.payoutSchedule.dayOfWeek) % 7);
            break;
            
          case 'biweekly':
            // Set to 2 weeks from now, on the specified day of week
            nextPayoutDate.setDate(nextPayoutDate.getDate() + 14 + (7 - nextPayoutDate.getDay() + influencer.payoutSchedule.dayOfWeek) % 7);
            break;
            
          case 'monthly':
            // Set to next month, on the specified day of month
            nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
            nextPayoutDate.setDate(Math.min(influencer.payoutSchedule.dayOfMonth, new Date(nextPayoutDate.getFullYear(), nextPayoutDate.getMonth() + 1, 0).getDate()));
            break;
        }
        
        influencer.payoutSchedule.nextPayoutDate = nextPayoutDate;
      } else {
        // If manual, clear next payout date
        influencer.payoutSchedule.nextPayoutDate = null;
      }
      
      // Save influencer
      await influencer.save();
      
      // Get user for notification
      const user = await User.findById(influencer.userId);
      
      if (user) {
        // Create notification for updated payout schedule
        await notificationService.createNotification({
          userId: user._id,
          type: 'system',
          title: 'Payout Schedule Updated',
          message: `Your payout schedule has been updated to ${influencer.payoutSchedule.frequency}.`,
          data: {
            frequency: influencer.payoutSchedule.frequency,
            minimumAmount: influencer.payoutSchedule.minimumAmount,
            nextPayoutDate: influencer.payoutSchedule.nextPayoutDate
          },
          actionLink: '/profile',
          actionText: 'View Profile',
          sendEmail: false
        });
      }
      
      return influencer;
    } catch (error) {
      console.error('Error updating payout schedule:', error);
      throw new Error('Failed to update payout schedule');
    }
  }
};

module.exports = payoutService;
