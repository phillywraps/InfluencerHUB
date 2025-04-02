/**
 * Cryptocurrency Payment Service
 * 
 * This service provides methods for working with cryptocurrency payments
 * on the client-side, abstracting away the details of Redux actions
 * and API calls.
 */

import store from '../redux/store';
import {
  fetchCryptoTransactions,
  fetchCryptoSubscriptions,
  fetchExchangeRates,
  createCryptoCharge,
  checkCryptoCharge,
  cancelCryptoCharge,
  createCryptoSubscription,
  cancelCryptoSubscription,
  clearActivePayment
} from '../redux/slices/paymentSlice';
import { addAlert } from '../redux/slices/alertSlice';

/**
 * Client-side service for managing cryptocurrency payments
 */
const cryptoPaymentService = {
  /**
   * Load transaction history
   * 
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Number of items per page
   * @returns {Promise} Promise that resolves to transaction data
   */
  getTransactionHistory: async (options = { page: 1, limit: 10 }) => {
    try {
      const resultAction = await store.dispatch(fetchCryptoTransactions(options));
      if (fetchCryptoTransactions.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to load transaction history');
      }
      return resultAction.payload.data;
    } catch (error) {
      store.dispatch(addAlert({
        type: 'error',
        message: `Failed to load transaction history: ${error.message}`
      }));
      throw error;
    }
  },

  /**
   * Load subscription list
   * 
   * @returns {Promise} Promise that resolves to subscription data
   */
  getSubscriptions: async () => {
    try {
      const resultAction = await store.dispatch(fetchCryptoSubscriptions());
      if (fetchCryptoSubscriptions.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to load subscriptions');
      }
      return resultAction.payload.data;
    } catch (error) {
      store.dispatch(addAlert({
        type: 'error',
        message: `Failed to load subscriptions: ${error.message}`
      }));
      throw error;
    }
  },

  /**
   * Load current exchange rates
   * 
   * @param {string} currency - Base currency (e.g., 'USD')
   * @returns {Promise} Promise that resolves to exchange rate data
   */
  getExchangeRates: async (currency = 'USD') => {
    try {
      const resultAction = await store.dispatch(fetchExchangeRates(currency));
      if (fetchExchangeRates.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to load exchange rates');
      }
      return resultAction.payload.data;
    } catch (error) {
      store.dispatch(addAlert({
        type: 'error',
        message: `Failed to load exchange rates: ${error.message}`
      }));
      throw error;
    }
  },

  /**
   * Create a new payment charge
   * 
   * @param {Object} chargeData - Payment charge data
   * @param {number} chargeData.amount - Amount in fiat currency
   * @param {string} chargeData.currency - Fiat currency code (e.g., 'USD')
   * @param {string} chargeData.cryptoCurrency - Preferred cryptocurrency (optional)
   * @param {string} chargeData.name - Name of the item being purchased
   * @param {string} chargeData.description - Description of the payment
   * @param {string} chargeData.rentalId - ID of the rental (if applicable)
   * @param {string} chargeData.subscriptionId - ID of the subscription (if applicable)
   * @returns {Promise} Promise that resolves to charge data
   */
  createCharge: async (chargeData) => {
    try {
      // Validate required fields
      if (!chargeData.amount || !chargeData.currency) {
        throw new Error('Amount and currency are required');
      }

      const resultAction = await store.dispatch(createCryptoCharge(chargeData));
      if (createCryptoCharge.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to create payment');
      }
      
      store.dispatch(addAlert({
        type: 'success',
        message: 'Payment initiated successfully'
      }));
      
      return resultAction.payload.data;
    } catch (error) {
      store.dispatch(addAlert({
        type: 'error',
        message: `Failed to create payment: ${error.message}`
      }));
      throw error;
    }
  },

  /**
   * Check the status of a payment charge
   * 
   * @param {string} chargeId - ID of the charge to check
   * @param {boolean} showNotification - Whether to show notifications for status updates
   * @returns {Promise} Promise that resolves to charge status data
   */
  checkChargeStatus: async (chargeId, showNotification = false) => {
    try {
      const resultAction = await store.dispatch(checkCryptoCharge(chargeId));
      if (checkCryptoCharge.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to check payment status');
      }
      
      const data = resultAction.payload.data;
      
      if (showNotification) {
        // Show notifications based on status
        if (data.status === 'completed') {
          store.dispatch(addAlert({
            type: 'success',
            message: 'Payment completed successfully!'
          }));
        } else if (data.status === 'confirming') {
          store.dispatch(addAlert({
            type: 'info',
            message: 'Your payment is being confirmed on the blockchain'
          }));
        } else if (data.status === 'failed') {
          store.dispatch(addAlert({
            type: 'error',
            message: 'Payment failed. Please try again.'
          }));
        }
      }
      
      return data;
    } catch (error) {
      if (showNotification) {
        store.dispatch(addAlert({
          type: 'error',
          message: `Failed to check payment status: ${error.message}`
        }));
      }
      throw error;
    }
  },

  /**
   * Cancel a payment charge
   * 
   * @param {string} chargeId - ID of the charge to cancel
   * @returns {Promise} Promise that resolves to cancellation result
   */
  cancelCharge: async (chargeId) => {
    try {
      const resultAction = await store.dispatch(cancelCryptoCharge(chargeId));
      if (cancelCryptoCharge.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to cancel payment');
      }
      
      store.dispatch(addAlert({
        type: 'success',
        message: 'Payment cancelled successfully'
      }));
      
      return resultAction.payload.data;
    } catch (error) {
      store.dispatch(addAlert({
        type: 'error',
        message: `Failed to cancel payment: ${error.message}`
      }));
      throw error;
    }
  },

  /**
   * Create a new subscription
   * 
   * @param {Object} subscriptionData - Subscription data
   * @param {number} subscriptionData.amount - Amount in fiat currency
   * @param {string} subscriptionData.currency - Fiat currency code (e.g., 'USD')
   * @param {string} subscriptionData.cryptoCurrency - Preferred cryptocurrency (optional)
   * @param {string} subscriptionData.billingPeriod - Billing period (daily, weekly, monthly, quarterly, yearly)
   * @param {string} subscriptionData.name - Name of the subscription
   * @param {string} subscriptionData.description - Description of the subscription
   * @param {string} subscriptionData.influencerId - ID of the influencer (if applicable)
   * @param {string} subscriptionData.socialAccountId - ID of the social account (if applicable)
   * @returns {Promise} Promise that resolves to subscription data
   */
  createSubscription: async (subscriptionData) => {
    try {
      // Validate required fields
      if (!subscriptionData.amount || !subscriptionData.currency || !subscriptionData.billingPeriod) {
        throw new Error('Amount, currency, and billing period are required');
      }

      const resultAction = await store.dispatch(createCryptoSubscription(subscriptionData));
      if (createCryptoSubscription.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to create subscription');
      }
      
      store.dispatch(addAlert({
        type: 'success',
        message: 'Subscription created successfully'
      }));
      
      return resultAction.payload.data;
    } catch (error) {
      store.dispatch(addAlert({
        type: 'error',
        message: `Failed to create subscription: ${error.message}`
      }));
      throw error;
    }
  },

  /**
   * Cancel a subscription
   * 
   * @param {string} subscriptionId - ID of the subscription to cancel
   * @returns {Promise} Promise that resolves to cancellation result
   */
  cancelSubscription: async (subscriptionId) => {
    try {
      const resultAction = await store.dispatch(cancelCryptoSubscription(subscriptionId));
      if (cancelCryptoSubscription.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to cancel subscription');
      }
      
      store.dispatch(addAlert({
        type: 'success',
        message: 'Subscription cancelled successfully'
      }));
      
      return resultAction.payload.data;
    } catch (error) {
      store.dispatch(addAlert({
        type: 'error',
        message: `Failed to cancel subscription: ${error.message}`
      }));
      throw error;
    }
  },

  /**
   * Clear the active payment from state
   */
  clearActivePayment: () => {
    store.dispatch(clearActivePayment());
  },

  /**
   * Poll for payment status updates at regular intervals
   * 
   * @param {string} chargeId - ID of the charge to check
   * @param {Function} onStatusChange - Callback function to call when status changes
   * @param {number} intervalMs - Polling interval in milliseconds (default: 5000)
   * @param {number} timeoutMs - Maximum time to poll in milliseconds (default: 1800000 - 30 minutes)
   * @returns {Object} Object with stop() method to stop polling
   */
  pollPaymentStatus: (chargeId, onStatusChange, intervalMs = 5000, timeoutMs = 1800000) => {
    let lastStatus = null;
    let intervalId = null;
    let startTime = Date.now();
    
    const checkStatus = async () => {
      try {
        // Check if we've exceeded the timeout
        if (Date.now() - startTime > timeoutMs) {
          stop();
          onStatusChange({ status: 'timeout', message: 'Polling timed out' });
          return;
        }
        
        // Check payment status
        const response = await cryptoPaymentService.checkChargeStatus(chargeId);
        
        // If status has changed, call the callback
        if (response.status !== lastStatus) {
          lastStatus = response.status;
          onStatusChange(response);
          
          // If we reached a terminal state, stop polling
          if (['completed', 'failed', 'canceled'].includes(response.status)) {
            stop();
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        // Don't stop polling on error, just try again
      }
    };
    
    // Start polling
    checkStatus();
    intervalId = setInterval(checkStatus, intervalMs);
    
    // Function to stop polling
    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    
    return { stop };
  }
};

export default cryptoPaymentService;
