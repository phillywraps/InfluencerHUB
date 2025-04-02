import {
  generateSecureApiKey,
  formatApiKeyForDisplay,
  validateApiKey,
  calculateApiKeyExpiration,
  calculateApiKeyStrength,
  needsRotation,
  sanitizeApiKeyInput
} from '../apiUtils';

describe('apiUtils', () => {
  // Mock the crypto functions for consistent testing
  const originalCrypto = global.crypto;
  
  beforeEach(() => {
    // Mock crypto.getRandomValues to return consistent values for testing
    global.crypto = {
      getRandomValues: function(arr) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = i % 256; // Deterministic pattern for testing
        }
        return arr;
      }
    };
  });
  
  afterEach(() => {
    global.crypto = originalCrypto;
  });

  describe('generateSecureApiKey', () => {
    it('should generate a key of the specified length', () => {
      const key = generateSecureApiKey(16, false);
      expect(key.length).toBe(16);
    });

    it('should include special characters when specified', () => {
      const key = generateSecureApiKey(32, true);
      const specialChars = /[!@#$%^&*()-_=+[\]{}|;:,.<>?]/;
      expect(specialChars.test(key)).toBe(true);
    });

    it('should not include special characters when not specified', () => {
      const key = generateSecureApiKey(20, false);
      const specialChars = /[!@#$%^&*()-_=+[\]{}|;:,.<>?]/;
      expect(specialChars.test(key)).toBe(false);
    });
  });

  describe('formatApiKeyForDisplay', () => {
    it('should mask the middle part of the API key', () => {
      const apiKey = 'abcdefghijklmnopqrstuvwxyz123456';
      const formatted = formatApiKeyForDisplay(apiKey);
      expect(formatted).toBe('abcd...3456');
    });

    it('should handle empty strings', () => {
      expect(formatApiKeyForDisplay('')).toBe('');
    });

    it('should handle null values', () => {
      expect(formatApiKeyForDisplay(null)).toBe('');
    });
  });

  describe('validateApiKey', () => {
    it('should validate a valid API key', () => {
      const apiKey = 'Abcd1234!@#$efgh';
      expect(validateApiKey(apiKey)).toBe(true);
    });

    it('should reject keys that are too short', () => {
      const apiKey = 'Ab1$';
      expect(validateApiKey(apiKey)).toBe(false);
    });

    it('should validate against custom requirements', () => {
      const apiKey = 'abcdefghijklmnop';
      // Only requiring lowercase and length ≥ 16
      expect(validateApiKey(apiKey, {
        requireUppercase: false,
        requireNumbers: false,
        requireSpecialChars: false
      })).toBe(true);
    });

    it('should reject keys that do not meet character requirements', () => {
      const apiKey = 'abcdefghijklmnop'; // No uppercase, numbers, or special chars
      expect(validateApiKey(apiKey)).toBe(false);
    });
  });

  describe('calculateApiKeyExpiration', () => {
    it('should calculate the correct expiration date', () => {
      const lastRotated = new Date('2025-01-01');
      const frequency = 30;
      const expiration = calculateApiKeyExpiration(lastRotated, frequency);
      expect(expiration.toISOString().substring(0, 10)).toBe('2025-01-31');
    });

    it('should return null for null last rotated date', () => {
      expect(calculateApiKeyExpiration(null)).toBe(null);
    });
  });

  describe('calculateApiKeyStrength', () => {
    it('should calculate high strength for complex passwords', () => {
      const apiKey = 'Abcd1234!@#$EFGH5678';
      const strength = calculateApiKeyStrength(apiKey);
      expect(strength).toBeGreaterThanOrEqual(80);
    });

    it('should calculate low strength for simple passwords', () => {
      const apiKey = 'abcdefgh';
      const strength = calculateApiKeyStrength(apiKey);
      expect(strength).toBeLessThanOrEqual(50);
    });

    it('should return 0 for empty strings', () => {
      expect(calculateApiKeyStrength('')).toBe(0);
    });
  });

  describe('needsRotation', () => {
    it('should return true when key is past rotation date', () => {
      const settings = {
        enabled: true,
        frequency: 30
      };
      const lastRotated = new Date();
      lastRotated.setDate(lastRotated.getDate() - 31); // 31 days ago
      
      expect(needsRotation(settings, lastRotated)).toBe(true);
    });

    it('should return false when key is within rotation period', () => {
      const settings = {
        enabled: true,
        frequency: 30
      };
      const lastRotated = new Date();
      lastRotated.setDate(lastRotated.getDate() - 15); // 15 days ago
      
      expect(needsRotation(settings, lastRotated)).toBe(false);
    });

    it('should return false when rotation is disabled', () => {
      const settings = {
        enabled: false,
        frequency: 30
      };
      const lastRotated = new Date();
      lastRotated.setDate(lastRotated.getDate() - 60); // 60 days ago
      
      expect(needsRotation(settings, lastRotated)).toBe(false);
    });
  });

  describe('sanitizeApiKeyInput', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("XSS")</script>apikey123';
      const sanitized = sanitizeApiKeyInput(input);
      expect(sanitized).toBe('scriptalert(XSS)/scriptapikey123');
    });

    it('should trim whitespace', () => {
      const input = '   apikey123   ';
      const sanitized = sanitizeApiKeyInput(input);
      expect(sanitized).toBe('apikey123');
    });

    it('should handle empty strings', () => {
      expect(sanitizeApiKeyInput('')).toBe('');
    });
  });
});
