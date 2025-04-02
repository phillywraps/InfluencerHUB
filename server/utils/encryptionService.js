const crypto = require('crypto');

/**
 * Service for encrypting and decrypting sensitive data like API keys
 */
class EncryptionService {
  constructor() {
    // Ensure encryption key is set
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    // Key should be 32 bytes (256 bits) for AES-256
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    
    // Use AES-256-CBC algorithm
    this.algorithm = 'aes-256-cbc';
  }

  /**
   * Encrypt data
   * @param {string} text - Plain text to encrypt
   * @returns {string} - Encrypted data in format: iv:encryptedData (both hex encoded)
   */
  encrypt(text) {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data
   * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
   * @returns {string} - Decrypted plain text
   */
  decrypt(encryptedText) {
    // Split the encrypted text to get IV and data
    const [ivHex, encryptedData] = encryptedText.split(':');
    
    if (!ivHex || !encryptedData) {
      throw new Error('Invalid encrypted text format');
    }
    
    // Convert IV from hex to Buffer
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Encrypt an API key object
   * @param {Object} apiKey - API key object with key, secret, etc.
   * @returns {Object} - Object with encrypted values
   */
  encryptApiKey(apiKey) {
    const encryptedApiKey = {};
    
    // Encrypt each field
    if (apiKey.key) {
      encryptedApiKey.key = this.encrypt(apiKey.key);
    }
    
    if (apiKey.secret) {
      encryptedApiKey.secret = this.encrypt(apiKey.secret);
    }
    
    // Copy non-sensitive fields
    if (apiKey.platform) {
      encryptedApiKey.platform = apiKey.platform;
    }
    
    if (apiKey.username) {
      encryptedApiKey.username = apiKey.username;
    }
    
    if (apiKey.additionalInfo) {
      encryptedApiKey.additionalInfo = apiKey.additionalInfo;
    }
    
    return encryptedApiKey;
  }

  /**
   * Decrypt an API key object
   * @param {Object} encryptedApiKey - Encrypted API key object
   * @returns {Object} - Decrypted API key object
   */
  decryptApiKey(encryptedApiKey) {
    const decryptedApiKey = {};
    
    // Decrypt each encrypted field
    if (encryptedApiKey.key) {
      decryptedApiKey.key = this.decrypt(encryptedApiKey.key);
    }
    
    if (encryptedApiKey.secret) {
      decryptedApiKey.secret = this.decrypt(encryptedApiKey.secret);
    }
    
    // Copy non-sensitive fields
    if (encryptedApiKey.platform) {
      decryptedApiKey.platform = encryptedApiKey.platform;
    }
    
    if (encryptedApiKey.username) {
      decryptedApiKey.username = encryptedApiKey.username;
    }
    
    if (encryptedApiKey.additionalInfo) {
      decryptedApiKey.additionalInfo = encryptedApiKey.additionalInfo;
    }
    
    return decryptedApiKey;
  }

  /**
   * Generate a secure random encryption key
   * @returns {string} - Hex-encoded 32-byte key
   */
  static generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = new EncryptionService();
