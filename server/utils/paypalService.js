const axios = require('axios');
const logger = require('../config/logger');

// PayPal API URLs
const SANDBOX_BASE_URL = 'https://api-m.sandbox.paypal.com';
const LIVE_BASE_URL = 'https://api-m.paypal.com';

// Determine which base URL to use based on environment
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? LIVE_BASE_URL 
  : SANDBOX_BASE_URL;

// Get client ID and secret based on environment
const getCredentials = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      clientId: process.env.PAYPAL_LIVE_CLIENT_ID,
      clientSecret: process.env.PAYPAL_LIVE_CLIENT_SECRET
    };
  } else {
    return {
      clientId: process.env.PAYPAL_SANDBOX_CLIENT_ID,
      clientSecret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET
    };
  }
};

/**
 * Get PayPal access token
 * @returns {Promise<string>} Access token
 */
const getAccessToken = async () => {
  try {
    const { clientId, clientSecret } = getCredentials();
    
    const response = await axios({
      method: 'post',
      url: `${BASE_URL}/v1/oauth2/token`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: clientId,
        password: clientSecret
      },
      data: 'grant_type=client_credentials'
    });
    
    return response.data.access_token;
  } catch (error) {
    logger.error('Error getting PayPal access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with PayPal');
  }
};

/**
 * Create a PayPal order for one-time payment
 * @param {Object} orderData Order data
 * @param {string} orderData.amount Amount to charge
 * @param {string} orderData.currency Currency code (e.g., USD)
 * @param {string} orderData.description Description of the order
 * @returns {Promise<Object>} PayPal order details
 */
const createOrder = async (orderData) => {
  try {
    const accessToken = await getAccessToken();
    
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: orderData.currency || 'USD',
            value: orderData.amount
          },
          description: orderData.description || 'API Key Rental'
        }
      ],
      application_context: {
        brand_name: 'Influencer API Key Marketplace',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      }
    };
    
    const response = await axios({
      method: 'post',
      url: `${BASE_URL}/v2/checkout/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: payload
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error creating PayPal order:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal order');
  }
};

/**
 * Capture a PayPal payment
 * @param {string} orderId PayPal order ID to capture
 * @returns {Promise<Object>} Capture details
 */
const capturePayment = async (orderId) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error capturing PayPal payment:', error.response?.data || error.message);
    throw new Error('Failed to capture PayPal payment');
  }
};

/**
 * Create a PayPal subscription plan
 * @param {Object} planData Plan data
 * @param {string} planData.name Plan name
 * @param {string} planData.description Plan description
 * @param {string} planData.amount Amount to charge
 * @param {string} planData.currency Currency code (e.g., USD)
 * @param {string} planData.interval Billing interval (MONTH, YEAR, etc.)
 * @returns {Promise<Object>} Plan details
 */
const createPlan = async (planData) => {
  try {
    const accessToken = await getAccessToken();
    
    // First create a product
    const productResponse = await axios({
      method: 'post',
      url: `${BASE_URL}/v1/catalogs/products`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        name: planData.name || 'API Key Rental Subscription',
        description: planData.description || 'Subscription for API Key Rental',
        type: 'SERVICE',
        category: 'SOFTWARE'
      }
    });
    
    const productId = productResponse.data.id;
    
    // Then create a billing plan for the product
    const frequency = planData.interval === 'yearly' ? 'YEAR' : 
                      planData.interval === 'quarterly' ? 'QUARTER' : 'MONTH';
    
    const planResponse = await axios({
      method: 'post',
      url: `${BASE_URL}/v1/billing/plans`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        product_id: productId,
        name: `${planData.name || 'API Key Rental'} - ${frequency}`,
        description: planData.description || `${frequency} subscription for API Key Rental`,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: frequency,
              interval_count: 1
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: planData.amount,
                currency_code: planData.currency || 'USD'
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: planData.currency || 'USD'
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        }
      }
    });
    
    return planResponse.data;
  } catch (error) {
    logger.error('Error creating PayPal plan:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal subscription plan');
  }
};

/**
 * Create a PayPal subscription
 * @param {string} planId PayPal plan ID
 * @returns {Promise<Object>} Subscription details
 */
const createSubscription = async (planId) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${BASE_URL}/v1/billing/subscriptions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        plan_id: planId,
        application_context: {
          brand_name: 'Influencer API Key Marketplace',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${process.env.FRONTEND_URL}/subscription/success`,
          cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`
        }
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error creating PayPal subscription:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal subscription');
  }
};

/**
 * Get subscription details
 * @param {string} subscriptionId PayPal subscription ID
 * @returns {Promise<Object>} Subscription details
 */
const getSubscription = async (subscriptionId) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'get',
      url: `${BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error getting PayPal subscription:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal subscription details');
  }
};

/**
 * Cancel a PayPal subscription
 * @param {string} subscriptionId PayPal subscription ID
 * @param {string} reason Reason for cancellation
 * @returns {Promise<Object>} Cancellation details
 */
const cancelSubscription = async (subscriptionId, reason) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        reason: reason || 'Cancelled by user'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error cancelling PayPal subscription:', error.response?.data || error.message);
    throw new Error('Failed to cancel PayPal subscription');
  }
};

/**
 * Verify webhook signature
 * @param {Object} headers Request headers
 * @param {string} body Request body as string
 * @returns {Promise<boolean>} Whether the webhook is valid
 */
const verifyWebhook = async (headers, body) => {
  try {
    const accessToken = await getAccessToken();
    
    const webhookId = process.env.PAYPAL_WEBHOOK_SECRET;
    
    const response = await axios({
      method: 'post',
      url: `${BASE_URL}/v1/notifications/verify-webhook-signature`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_time: headers['paypal-transmission-time'],
        transmission_sig: headers['paypal-transmission-sig'],
        auth_algo: headers['paypal-auth-algo']
      }
    });
    
    return response.data.verification_status === 'SUCCESS';
  } catch (error) {
    logger.error('Error verifying PayPal webhook:', error.response?.data || error.message);
    return false;
  }
};

module.exports = {
  createOrder,
  capturePayment,
  createPlan,
  createSubscription,
  getSubscription,
  cancelSubscription,
  verifyWebhook
};
