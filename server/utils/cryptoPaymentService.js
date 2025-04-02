/**
 * Cryptocurrency Payment Service
 * 
 * Provides methods for integrating with Coinbase Commerce API for cryptocurrency payments
 */

const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/cryptoConfig');
const logger = require('../config/logger');

/**
 * Coinbase Commerce API Service
 */
const cryptoPaymentService = {
  /**
   * Initialize API client with authentication
   * @returns {Object} Axios instance configured for Coinbase Commerce API
   */
  _getApiClient: () => {
    const apiClient = axios.create({
      baseURL: 'https://api.commerce.coinbase.com',
      headers: {
        'X-CC-Api-Key': config.crypto.apiKey,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json'
      }
    });
    
    return apiClient;
  },

  /**
   * Generate a random charge ID
   * @returns {string} Random charge ID
   */
  generateChargeId: () => {
    return `CRYPTO_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  },

  /**
   * Verify webhook signature from Coinbase Commerce
   * @param {string} signature The signature from the webhook header
   * @param {string} body The raw request body as string
   * @returns {boolean} Whether the signature is valid
   */
  verifyWebhookSignature: (signature, body) => {
    try {
      const hmac = crypto.createHmac('sha256', config.crypto.webhookSecret);
      hmac.update(body);
      const computedSignature = hmac.digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  },

  /**
   * Create a new charge for cryptocurrency payment
   * @param {Object} chargeData Charge details
   * @param {string} chargeData.name Product or service name
   * @param {string} chargeData.description Description
   * @param {number} chargeData.amount Amount in fiat currency
   * @param {string} chargeData.currency Fiat currency code (e.g., USD)
   * @param {string} chargeData.cryptoCurrency Preferred crypto currency (optional)
   * @param {string} chargeData.externalId External reference ID
   * @returns {Promise<Object>} Created charge details
   */
  createCharge: async (chargeData) => {
    try {
      const apiClient = cryptoPaymentService._getApiClient();
      
      // Pricing type can be fixed_price or no_price
      const payload = {
        name: chargeData.name,
        description: chargeData.description,
        pricing_type: 'fixed_price',
        local_price: {
          amount: chargeData.amount.toString(),
          currency: chargeData.currency
        },
        metadata: {
          externalId: chargeData.externalId,
          customer_id: chargeData.userId || null,
          rentalId: chargeData.rentalId || null
        },
        redirect_url: config.crypto.redirectUrl || null,
        cancel_url: config.crypto.cancelUrl || null
      };
      
      // Set preferred cryptocurrency if specified
      if (chargeData.cryptoCurrency) {
        payload.pricing = {
          [chargeData.cryptoCurrency.toLowerCase()]: {
            amount: "auto",
            currency: chargeData.currency
          }
        };
      }
      
      const response = await apiClient.post('/charges', payload);
      
      if (response.status !== 201) {
        throw new Error(`Failed to create charge: ${response.statusText}`);
      }
      
      const charge = response.data.data;
      
      // Map the response to our standard format
      return {
        id: charge.id,
        code: charge.code,
        status: charge.timeline[charge.timeline.length - 1]?.status || 'pending',
        name: charge.name,
        description: charge.description,
        amount: parseFloat(charge.pricing.local.amount),
        currency: charge.pricing.local.currency,
        cryptoAmount: charge.pricing[Object.keys(charge.pricing)[0]].amount,
        cryptoCurrency: Object.keys(charge.pricing)[0].toUpperCase(),
        checkoutUrl: charge.hosted_url,
        expiresAt: charge.expires_at,
        createdAt: charge.created_at,
        updatedAt: charge.updated_at,
        paymentAddresses: charge.addresses,
        address: charge.addresses[Object.keys(charge.addresses)[0]] || null,
        qrCodes: charge.qr_codes || {},
        externalId: charge.metadata?.externalId || null
      };
    } catch (error) {
      logger.error('Error creating cryptocurrency charge:', error);
      throw error;
    }
  },

  /**
   * Get charge details
   * @param {string} chargeId The ID of the charge
   * @returns {Promise<Object>} Charge details
   */
  getCharge: async (chargeId) => {
    try {
      const apiClient = cryptoPaymentService._getApiClient();
      
      const response = await apiClient.get(`/charges/${chargeId}`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to get charge: ${response.statusText}`);
      }
      
      const charge = response.data.data;
      
      // Get the latest status from timeline
      let status = 'pending';
      if (charge.timeline && charge.timeline.length > 0) {
        const sortedTimeline = [...charge.timeline].sort((a, b) => 
          new Date(b.time) - new Date(a.time)
        );
        status = sortedTimeline[0].status;
      }
      
      // Map the response to our standard format
      return {
        id: charge.id,
        code: charge.code,
        status: status,
        name: charge.name,
        description: charge.description,
        amount: parseFloat(charge.pricing.local.amount),
        currency: charge.pricing.local.currency,
        cryptoAmounts: Object.keys(charge.pricing)
          .filter(key => key !== 'local')
          .reduce((acc, key) => {
            acc[key.toUpperCase()] = charge.pricing[key].amount;
            return acc;
          }, {}),
        checkoutUrl: charge.hosted_url,
        expiresAt: charge.expires_at,
        createdAt: charge.created_at,
        updatedAt: charge.updated_at,
        paymentAddresses: charge.addresses,
        externalId: charge.metadata?.externalId || null,
        timeline: charge.timeline
      };
    } catch (error) {
      logger.error('Error getting cryptocurrency charge:', error);
      throw error;
    }
  },

  /**
   * Cancel an existing charge
   * @param {string} chargeId The ID of the charge
   * @returns {Promise<Object>} Canceled charge details
   */
  cancelCharge: async (chargeId) => {
    try {
      const apiClient = cryptoPaymentService._getApiClient();
      
      const response = await apiClient.post(`/charges/${chargeId}/cancel`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to cancel charge: ${response.statusText}`);
      }
      
      const charge = response.data.data;
      
      // Map the response to our standard format
      return {
        id: charge.id,
        status: 'canceled',
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error canceling cryptocurrency charge:', error);
      throw error;
    }
  },

  /**
   * Resolve a charge (mark it as complete)
   * @param {string} chargeId The ID of the charge
   * @returns {Promise<Object>} Resolved charge details
   */
  resolveCharge: async (chargeId) => {
    try {
      const apiClient = cryptoPaymentService._getApiClient();
      
      const response = await apiClient.post(`/charges/${chargeId}/resolve`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to resolve charge: ${response.statusText}`);
      }
      
      const charge = response.data.data;
      
      // Map the response to our standard format
      return {
        id: charge.id,
        status: 'completed',
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error resolving cryptocurrency charge:', error);
      throw error;
    }
  },

  /**
   * List all supported cryptocurrencies
   * @returns {Promise<Array>} List of supported cryptocurrencies
   */
  getSupportedCurrencies: async () => {
    try {
      // These could be fetched from Coinbase Commerce API
      // For now, return a static list of common cryptocurrencies
      return [
        {
          code: 'BTC',
          name: 'Bitcoin',
          logo: 'https://cdn.coinbase.com/assets/currencies/bitcoin.png'
        },
        {
          code: 'ETH',
          name: 'Ethereum',
          logo: 'https://cdn.coinbase.com/assets/currencies/ethereum.png'
        },
        {
          code: 'USDC',
          name: 'USD Coin',
          logo: 'https://cdn.coinbase.com/assets/currencies/usdc.png'
        },
        {
          code: 'DAI',
          name: 'Dai',
          logo: 'https://cdn.coinbase.com/assets/currencies/dai.png'
        },
        {
          code: 'LTC',
          name: 'Litecoin',
          logo: 'https://cdn.coinbase.com/assets/currencies/litecoin.png'
        },
        {
          code: 'BCH',
          name: 'Bitcoin Cash',
          logo: 'https://cdn.coinbase.com/assets/currencies/bitcoin-cash.png'
        }
      ];
    } catch (error) {
      logger.error('Error getting supported cryptocurrencies:', error);
      throw error;
    }
  },

  /**
   * Get current exchange rates for cryptocurrencies
   * @param {string} currency Base currency code (e.g., USD)
   * @returns {Promise<Object>} Exchange rates
   */
  getExchangeRates: async (currency = 'USD') => {
    try {
      // Fetch exchange rates from Coinbase Commerce
      const apiClient = cryptoPaymentService._getApiClient();
      
      const response = await apiClient.get('/exchange-rates');
      
      if (response.status !== 200) {
        throw new Error(`Failed to get exchange rates: ${response.statusText}`);
      }
      
      const rates = response.data.data.rates;
      
      // If the requested currency is not USD, we need to convert
      if (currency.toUpperCase() !== 'USD') {
        const usdRate = rates[currency.toUpperCase()];
        
        if (!usdRate) {
          throw new Error(`Currency ${currency} not supported`);
        }
        
        // Convert all rates to the requested currency
        const convertedRates = {};
        
        for (const [cryptoCode, rate] of Object.entries(rates)) {
          convertedRates[cryptoCode] = rate / usdRate;
        }
        
        return convertedRates;
      }
      
      return rates;
    } catch (error) {
      logger.error('Error getting cryptocurrency exchange rates:', error);
      throw error;
    }
  },

  /**
   * Create a new subscription for recurring cryptocurrency payments
   * @param {Object} subscriptionData Subscription details
   * @param {string} subscriptionData.name Subscription name
   * @param {string} subscriptionData.description Subscription description
   * @param {number} subscriptionData.amount Amount in fiat currency
   * @param {string} subscriptionData.currency Fiat currency code (e.g., USD)
   * @param {string} subscriptionData.billingPeriod Billing period (daily, weekly, monthly, quarterly, yearly)
   * @param {string} subscriptionData.externalId External reference ID
   * @returns {Promise<Object>} Created subscription details
   */
  createSubscription: async (subscriptionData) => {
    try {
      const apiClient = cryptoPaymentService._getApiClient();
      
      // Map our billing period to Coinbase frequency
      const frequencyMap = {
        daily: { times: 365, interval: 'day' },
        weekly: { times: 52, interval: 'week' },
        monthly: { times: 12, interval: 'month' },
        quarterly: { times: 4, interval: 'month', intervalCount: 3 },
        yearly: { times: 1, interval: 'year' }
      };
      
      const frequency = frequencyMap[subscriptionData.billingPeriod] || { times: 12, interval: 'month' };
      
      const payload = {
        name: subscriptionData.name,
        description: subscriptionData.description,
        pricing_type: 'fixed_price',
        local_price: {
          amount: subscriptionData.amount.toString(),
          currency: subscriptionData.currency
        },
        metadata: {
          externalId: subscriptionData.externalId,
          customer_id: subscriptionData.userId || null,
          influencerId: subscriptionData.influencerId || null,
          socialAccountId: subscriptionData.socialAccountId || null
        },
        billing_cycle: {
          frequency: frequency.times,
          interval: frequency.interval,
          ...(frequency.intervalCount && { interval_count: frequency.intervalCount })
        }
      };
      
      const response = await apiClient.post('/subscriptions', payload);
      
      if (response.status !== 201) {
        throw new Error(`Failed to create subscription: ${response.statusText}`);
      }
      
      const subscription = response.data.data;
      
      // Calculate next billing date
      const nextBillingDate = new Date();
      if (frequency.interval === 'day') {
        nextBillingDate.setDate(nextBillingDate.getDate() + 1);
      } else if (frequency.interval === 'week') {
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
      } else if (frequency.interval === 'month') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + (frequency.intervalCount || 1));
      } else if (frequency.interval === 'year') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }
      
      // Map the response to our standard format
      return {
        id: subscription.id,
        status: subscription.status,
        name: subscription.name,
        description: subscription.description,
        amount: parseFloat(subscription.pricing.local.amount),
        currency: subscription.pricing.local.currency,
        billingPeriod: subscriptionData.billingPeriod,
        nextBillingDate: nextBillingDate.toISOString(),
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
        externalId: subscription.metadata?.externalId || null
      };
    } catch (error) {
      logger.error('Error creating cryptocurrency subscription:', error);
      throw error;
    }
  },

  /**
   * Get subscription details
   * @param {string} subscriptionId The ID of the subscription
   * @returns {Promise<Object>} Subscription details
   */
  getSubscription: async (subscriptionId) => {
    try {
      const apiClient = cryptoPaymentService._getApiClient();
      
      const response = await apiClient.get(`/subscriptions/${subscriptionId}`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to get subscription: ${response.statusText}`);
      }
      
      const subscription = response.data.data;
      
      // Map the response to our standard format
      return {
        id: subscription.id,
        status: subscription.status,
        name: subscription.name,
        description: subscription.description,
        amount: parseFloat(subscription.pricing.local.amount),
        currency: subscription.pricing.local.currency,
        nextBillingDate: subscription.next_payment_date,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
        externalId: subscription.metadata?.externalId || null
      };
    } catch (error) {
      logger.error('Error getting cryptocurrency subscription:', error);
      throw error;
    }
  },

  /**
   * Cancel a subscription
   * @param {string} subscriptionId The ID of the subscription
   * @returns {Promise<Object>} Canceled subscription details
   */
  cancelSubscription: async (subscriptionId) => {
    try {
      const apiClient = cryptoPaymentService._getApiClient();
      
      const response = await apiClient.post(`/subscriptions/${subscriptionId}/cancel`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to cancel subscription: ${response.statusText}`);
      }
      
      const subscription = response.data.data;
      
      // Map the response to our standard format
      return {
        id: subscription.id,
        status: 'canceled',
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error canceling cryptocurrency subscription:', error);
      throw error;
    }
  }
};

module.exports = cryptoPaymentService;
