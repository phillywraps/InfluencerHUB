/**
 * Alipay Configuration Settings
 */

const dotenv = require('dotenv');
dotenv.config();

const alipayConfig = {
  // Alipay API configuration
  alipay: {
    // App ID from Alipay developer account
    appId: process.env.ALIPAY_APP_ID || '',
    
    // Alipay API gateway URL
    gatewayUrl: process.env.ALIPAY_GATEWAY_URL || 'https://openapi.alipay.com/gateway.do',
    
    // RSA private key for signing requests
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    
    // Alipay public key for verifying responses
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    
    // Webhook notification URL
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'https://your-domain.com/api/payments/alipay/webhook',
    
    // Return URL after payment completion
    returnUrl: process.env.ALIPAY_RETURN_URL || 'https://your-domain.com/payment/complete',
    
    // Log level for Alipay operations
    logLevel: process.env.ALIPAY_LOG_LEVEL || 'info',
    
    // Timeout in milliseconds
    timeout: parseInt(process.env.ALIPAY_TIMEOUT || '15000', 10),
    
    // Currency (default to CNY)
    currency: process.env.ALIPAY_CURRENCY || 'CNY',
    
    // Sandbox mode flag
    sandbox: process.env.NODE_ENV !== 'production'
  }
};

module.exports = alipayConfig;
