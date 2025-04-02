/**
 * Cryptocurrency Payment Configuration Settings
 */

const dotenv = require('dotenv');
dotenv.config();

const cryptoConfig = {
  // Cryptocurrency payment integration settings
  crypto: {
    // Coinbase Commerce API key
    apiKey: process.env.COINBASE_COMMERCE_API_KEY || '',
    
    // Coinbase Commerce webhook shared secret
    webhookSecret: process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || '',
    
    // Redirect URL after successful payment
    redirectUrl: process.env.CRYPTO_REDIRECT_URL || 'https://your-domain.com/payment/success',
    
    // Cancel URL if user cancels payment
    cancelUrl: process.env.CRYPTO_CANCEL_URL || 'https://your-domain.com/payment/cancel',
    
    // Webhook URL for receiving notifications
    webhookUrl: process.env.CRYPTO_WEBHOOK_URL || 'https://your-domain.com/api/payments/crypto/webhook',
    
    // Supported cryptocurrencies (comma-separated list)
    supportedCurrencies: (process.env.CRYPTO_SUPPORTED_CURRENCIES || 'BTC,ETH,USDC,DAI,LTC,BCH').split(','),
    
    // Default cryptocurrency when not specified
    defaultCurrency: process.env.CRYPTO_DEFAULT_CURRENCY || 'BTC',
    
    // Transaction fee percentage (as decimal)
    feePercentage: parseFloat(process.env.CRYPTO_FEE_PERCENTAGE || '0.005'),
    
    // Minimum transaction amount in USD
    minTransactionAmount: parseFloat(process.env.CRYPTO_MIN_TRANSACTION_AMOUNT || '5.00'),
    
    // Whether to use Coinbase Commerce sandbox
    sandbox: process.env.NODE_ENV !== 'production',
    
    // Default charge expiration time in minutes
    defaultExpirationMinutes: parseInt(process.env.CRYPTO_DEFAULT_EXPIRATION_MINUTES || '60', 10),
    
    // Confirmation threshold for transactions
    confirmationThreshold: parseInt(process.env.CRYPTO_CONFIRMATION_THRESHOLD || '2', 10)
  }
};

module.exports = cryptoConfig;
