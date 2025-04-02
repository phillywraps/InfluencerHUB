/**
 * AlipayService
 * 
 * Provides methods for integrating with Alipay payment gateway
 */

const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');
const config = require('../config/alipayConfig');

/**
 * Alipay Service
 */
const alipayService = {
  /**
   * Generate a random order number
   * @returns {string} The random order number
   */
  generateOrderNumber: () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ALI${timestamp}${random}`;
  },

  /**
   * Create signature for Alipay request
   * @param {Object} params - The parameters to sign
   * @returns {string} The signature
   */
  createSignature: (params) => {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== '' && key !== 'sign') {
        acc[key] = params[key];
      }
      return acc;
    }, {});

    // Create string to sign
    const stringToSign = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Create signature using private key
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(stringToSign);
    return sign.sign(config.alipay.privateKey, 'base64');
  },

  /**
   * Verify Alipay response signature
   * @param {Object} params - The response parameters
   * @param {string} signature - The signature to verify
   * @returns {boolean} Whether the signature is valid
   */
  verifySignature: (params, signature) => {
    // Sort parameters alphabetically, excluding sign and sign_type
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== '' && key !== 'sign' && key !== 'sign_type') {
        acc[key] = params[key];
      }
      return acc;
    }, {});

    // Create string to verify
    const stringToVerify = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Verify signature using public key
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(stringToVerify);
    return verify.verify(config.alipay.publicKey, signature, 'base64');
  },

  /**
   * Create an Alipay payment order
   * @param {Object} orderData - The order data
   * @param {string} orderData.orderNumber - The order number
   * @param {number} orderData.amount - The order amount
   * @param {string} orderData.subject - The order subject
   * @param {string} orderData.body - The order body
   * @returns {Promise<Object>} The created order
   */
  createOrder: async (orderData) => {
    try {
      const { orderNumber, amount, subject, body } = orderData;

      // Construct request parameters
      const requestParams = {
        app_id: config.alipay.appId,
        method: 'alipay.trade.precreate',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        version: '1.0',
        notify_url: config.alipay.notifyUrl,
        biz_content: JSON.stringify({
          out_trade_no: orderNumber,
          total_amount: amount.toFixed(2),
          subject: subject,
          body: body,
          timeout_express: '15m', // Payment expires in 15 minutes
        }),
      };

      // Add signature
      requestParams.sign = alipayService.createSignature(requestParams);

      // Send request to Alipay
      const response = await axios.post(
        config.alipay.gatewayUrl,
        querystring.stringify(requestParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Parse and verify response
      const responseData = response.data;
      
      if (responseData.alipay_trade_precreate_response.code !== '10000') {
        throw new Error(`Alipay error: ${responseData.alipay_trade_precreate_response.sub_msg || 'Unknown error'}`);
      }

      // Verify signature
      const signature = responseData.sign;
      const signValid = alipayService.verifySignature(
        responseData.alipay_trade_precreate_response,
        signature
      );

      if (!signValid) {
        throw new Error('Invalid Alipay response signature');
      }

      // Return QR code URL and order number
      return {
        orderNumber,
        qrCodeUrl: responseData.alipay_trade_precreate_response.qr_code,
        status: 'PENDING',
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating Alipay order:', error);
      throw error;
    }
  },

  /**
   * Check the status of an Alipay order
   * @param {string} orderNumber - The order number
   * @returns {Promise<Object>} The order status
   */
  checkOrderStatus: async (orderNumber) => {
    try {
      // Construct request parameters
      const requestParams = {
        app_id: config.alipay.appId,
        method: 'alipay.trade.query',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        version: '1.0',
        biz_content: JSON.stringify({
          out_trade_no: orderNumber,
        }),
      };

      // Add signature
      requestParams.sign = alipayService.createSignature(requestParams);

      // Send request to Alipay
      const response = await axios.post(
        config.alipay.gatewayUrl,
        querystring.stringify(requestParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Parse and verify response
      const responseData = response.data;
      
      if (responseData.alipay_trade_query_response.code !== '10000') {
        // If order doesn't exist or other error
        if (responseData.alipay_trade_query_response.code === '40004') {
          return { status: 'NOT_FOUND' };
        }
        throw new Error(`Alipay error: ${responseData.alipay_trade_query_response.sub_msg || 'Unknown error'}`);
      }

      // Verify signature
      const signature = responseData.sign;
      const signValid = alipayService.verifySignature(
        responseData.alipay_trade_query_response,
        signature
      );

      if (!signValid) {
        throw new Error('Invalid Alipay response signature');
      }

      // Map Alipay trade status to our status
      const tradeStatus = responseData.alipay_trade_query_response.trade_status;
      let status;
      
      switch (tradeStatus) {
        case 'WAIT_BUYER_PAY':
          status = 'PENDING';
          break;
        case 'TRADE_CLOSED':
          status = 'CANCELLED';
          break;
        case 'TRADE_SUCCESS':
        case 'TRADE_FINISHED':
          status = 'COMPLETE';
          break;
        default:
          status = 'UNKNOWN';
      }

      // Return status and details
      return {
        orderNumber,
        status,
        alipayTradeNo: responseData.alipay_trade_query_response.trade_no || null,
        buyerId: responseData.alipay_trade_query_response.buyer_user_id || null,
        totalAmount: responseData.alipay_trade_query_response.total_amount || 0,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error checking Alipay order status:', error);
      throw error;
    }
  },

  /**
   * Cancel an Alipay order
   * @param {string} orderNumber - The order number
   * @returns {Promise<Object>} The cancel result
   */
  cancelOrder: async (orderNumber) => {
    try {
      // Construct request parameters
      const requestParams = {
        app_id: config.alipay.appId,
        method: 'alipay.trade.cancel',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        version: '1.0',
        biz_content: JSON.stringify({
          out_trade_no: orderNumber,
        }),
      };

      // Add signature
      requestParams.sign = alipayService.createSignature(requestParams);

      // Send request to Alipay
      const response = await axios.post(
        config.alipay.gatewayUrl,
        querystring.stringify(requestParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Parse and verify response
      const responseData = response.data;
      
      if (responseData.alipay_trade_cancel_response.code !== '10000') {
        throw new Error(`Alipay error: ${responseData.alipay_trade_cancel_response.sub_msg || 'Unknown error'}`);
      }

      // Verify signature
      const signature = responseData.sign;
      const signValid = alipayService.verifySignature(
        responseData.alipay_trade_cancel_response,
        signature
      );

      if (!signValid) {
        throw new Error('Invalid Alipay response signature');
      }

      // Return cancel result
      return {
        orderNumber,
        status: 'CANCELLED',
        action: responseData.alipay_trade_cancel_response.action, // 'close' or 'refund'
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error canceling Alipay order:', error);
      throw error;
    }
  },

  /**
   * Process Alipay webhook notification
   * @param {Object} notifyData - The notification data
   * @returns {Promise<Object>} The processed notification
   */
  processNotification: async (notifyData) => {
    try {
      // Verify signature
      const signature = notifyData.sign;
      delete notifyData.sign;
      delete notifyData.sign_type;
      
      const signValid = alipayService.verifySignature(notifyData, signature);
      
      if (!signValid) {
        throw new Error('Invalid Alipay notification signature');
      }

      // Extract notification data
      const orderNumber = notifyData.out_trade_no;
      const tradeStatus = notifyData.trade_status;
      const alipayTradeNo = notifyData.trade_no;
      const totalAmount = parseFloat(notifyData.total_amount);
      const buyerId = notifyData.buyer_id;
      
      // Map Alipay trade status to our status
      let status;
      
      switch (tradeStatus) {
        case 'WAIT_BUYER_PAY':
          status = 'PENDING';
          break;
        case 'TRADE_CLOSED':
          status = 'CANCELLED';
          break;
        case 'TRADE_SUCCESS':
        case 'TRADE_FINISHED':
          status = 'COMPLETE';
          break;
        default:
          status = 'UNKNOWN';
      }

      // Return notification data
      return {
        orderNumber,
        status,
        alipayTradeNo,
        totalAmount,
        buyerId,
        notifyId: notifyData.notify_id,
        notifyTime: notifyData.notify_time,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error processing Alipay notification:', error);
      throw error;
    }
  },
};

module.exports = alipayService;
