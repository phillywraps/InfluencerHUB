const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

/**
 * Generate a new TOTP secret for a user
 * @returns {Object} Object containing secret in different formats
 */
const generateSecret = (username) => {
  const secretObject = speakeasy.generateSecret({
    name: `InfluencerPlatform:${username}`,
    length: 20
  });
  
  return {
    base32: secretObject.base32,
    otpauth_url: secretObject.otpauth_url
  };
};

/**
 * Generate a QR code for the TOTP secret
 * @param {string} otpauthUrl - The otpauth URL for the secret
 * @returns {Promise<string>} The QR code as a data URL
 */
const generateQRCode = async (otpauthUrl) => {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify a TOTP token against a secret
 * @param {string} token - The token to verify
 * @param {string} secret - The secret to verify against (base32 format)
 * @returns {boolean} Whether the token is valid
 */
const verifyToken = (token, secret) => {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow 1 step before and after current time (30 seconds each)
    });
    
    return verified;
  } catch (error) {
    return false;
  }
};

/**
 * Generate a set of recovery codes
 * @param {number} count - Number of recovery codes to generate
 * @returns {Array<string>} Array of recovery codes
 */
const generateRecoveryCodes = (count = 10) => {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random 12-character hex string
    const code = require('crypto').randomBytes(6).toString('hex').toUpperCase();
    // Format as XXXX-XXXX-XXXX
    const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 12)}`;
    codes.push(formattedCode);
  }
  
  return codes;
};

module.exports = {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateRecoveryCodes
};
