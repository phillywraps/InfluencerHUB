import {
  isValidEmail,
  validatePassword,
  validateUsername,
  isValidUrl,
  isValidPhone,
  isValidDate,
  validateCreditCard,
  isValidSocialHandle,
  validateFile
} from '../sharedValidation';

describe('sharedValidation', () => {
  describe('isValidEmail', () => {
    it('should validate proper email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('test.user@sub.domain.com')).toBe(true);
      expect(isValidEmail('test+suffix@gmail.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@domain')).toBe(false);
      expect(isValidEmail('test user@domain.com')).toBe(false);
      expect(isValidEmail('test@domain..com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail('   test@example.com   ')).toBe(true); // With trim
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.strength).toBeGreaterThan(70);
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Sh0rt!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should identify missing requirements', () => {
      const noUppercase = validatePassword('lowercase123!');
      expect(noUppercase.isValid).toBe(false);
      expect(noUppercase.errors).toContain('Password must contain at least one uppercase letter');

      const noLowercase = validatePassword('UPPERCASE123!');
      expect(noLowercase.isValid).toBe(false);
      expect(noLowercase.errors).toContain('Password must contain at least one lowercase letter');

      const noNumbers = validatePassword('NoNumbersHere!');
      expect(noNumbers.isValid).toBe(false);
      expect(noNumbers.errors).toContain('Password must contain at least one number');

      const noSpecial = validatePassword('NoSpecialChars123');
      expect(noSpecial.isValid).toBe(false);
      expect(noSpecial.errors).toContain('Password must contain at least one special character');
    });

    it('should allow customization of requirements', () => {
      const simplePassword = 'simplepassword';
      
      // Default requirements (should fail)
      const defaultResult = validatePassword(simplePassword);
      expect(defaultResult.isValid).toBe(false);
      
      // Custom requirements (should pass)
      const customResult = validatePassword(simplePassword, {
        minLength: 8,
        requireUppercase: false,
        requireNumbers: false,
        requireSpecialChars: false
      });
      expect(customResult.isValid).toBe(true);
    });
  });

  describe('validateUsername', () => {
    it('should validate proper usernames', () => {
      const result = validateUsername('valid_user123');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject usernames that are too short', () => {
      const result = validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be at least 3 characters long');
    });

    it('should reject usernames with invalid characters', () => {
      const result = validateUsername('invalid@user');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username can only contain letters, numbers and underscores');
    });

    it('should allow periods and hyphens when specified', () => {
      const defaultResult = validateUsername('user.name-123');
      expect(defaultResult.isValid).toBe(false); // Default doesn't allow periods/hyphens

      const customResult = validateUsername('user.name-123', { allowSpecialChars: true });
      expect(customResult.isValid).toBe(true);
    });
  });

  describe('isValidUrl', () => {
    it('should validate proper URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://subdomain.example.co.uk/path')).toBe(true);
      expect(isValidUrl('https://example.com?param=value')).toBe(true);
    });

    it('should require protocol by default', () => {
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('example.com', false)).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('http://localhost')).toBe(false); // Requires domain with dot
    });

    it('should handle edge cases', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate US phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('11234567890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true); // Formatting is stripped
    });

    it('should validate UK phone numbers with UK country code', () => {
      expect(isValidPhone('07123456789', 'UK')).toBe(true);
      expect(isValidPhone('01234567890', 'GB')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123456')).toBe(false); // Too short
      expect(isValidPhone('12345678901234567890')).toBe(false); // Too long
    });

    it('should handle edge cases', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone(null)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate date objects', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should validate date strings', () => {
      expect(isValidDate('2025-01-01')).toBe(true);
      expect(isValidDate('Jan 1, 2025')).toBe(true);
    });

    it('should handle min/max date constraints', () => {
      const date = new Date('2025-01-15');
      
      expect(isValidDate(date, { minDate: '2025-01-01' })).toBe(true);
      expect(isValidDate(date, { maxDate: '2025-02-01' })).toBe(true);
      
      expect(isValidDate(date, { minDate: '2025-01-20' })).toBe(false);
      expect(isValidDate(date, { maxDate: '2025-01-10' })).toBe(false);
    });

    it('should handle invalid dates', () => {
      expect(isValidDate('not a date')).toBe(false);
      expect(isValidDate('2025-13-01')).toBe(false); // Invalid month
    });

    it('should handle edge cases', () => {
      expect(isValidDate('')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe('validateCreditCard', () => {
    it('should identify valid card numbers', () => {
      // Test Visa
      const visa = validateCreditCard('4111111111111111');
      expect(visa.isValid).toBe(true);
      expect(visa.cardType).toBe('visa');

      // Test Mastercard
      const mastercard = validateCreditCard('5555555555554444');
      expect(mastercard.isValid).toBe(true);
      expect(mastercard.cardType).toBe('mastercard');

      // Test Amex
      const amex = validateCreditCard('371449635398431');
      expect(amex.isValid).toBe(true);
      expect(amex.cardType).toBe('amex');

      // Test Discover
      const discover = validateCreditCard('6011111111111117');
      expect(discover.isValid).toBe(true);
      expect(discover.cardType).toBe('discover');
    });

    it('should reject invalid card numbers', () => {
      // Invalid Luhn checksum
      const invalidChecksum = validateCreditCard('4111111111111112');
      expect(invalidChecksum.isValid).toBe(false);

      // Invalid length
      const invalidLength = validateCreditCard('41111111');
      expect(invalidLength.isValid).toBe(false);
    });

    it('should handle formatted card numbers', () => {
      const formattedCard = validateCreditCard('4111-1111-1111-1111');
      expect(formattedCard.isValid).toBe(true);
      expect(formattedCard.cardType).toBe('visa');
    });

    it('should handle edge cases', () => {
      expect(validateCreditCard('').isValid).toBe(false);
      expect(validateCreditCard(null).isValid).toBe(false);
    });
  });

  describe('isValidSocialHandle', () => {
    it('should validate Instagram handles', () => {
      expect(isValidSocialHandle('username', 'instagram')).toBe(true);
      expect(isValidSocialHandle('user_name', 'instagram')).toBe(true);
      expect(isValidSocialHandle('user.name', 'instagram')).toBe(true);
      expect(isValidSocialHandle('user123', 'instagram')).toBe(true);
      expect(isValidSocialHandle('@username', 'instagram')).toBe(true); // With @
    });

    it('should validate Twitter handles', () => {
      expect(isValidSocialHandle('username', 'twitter')).toBe(true);
      expect(isValidSocialHandle('user_name', 'twitter')).toBe(true);
      expect(isValidSocialHandle('@username', 'twitter')).toBe(true); // With @
      
      // Twitter doesn't allow periods
      expect(isValidSocialHandle('user.name', 'twitter')).toBe(false);
    });

    it('should enforce platform-specific length limits', () => {
      // Instagram: 30 chars max
      const longIg = 'a'.repeat(31);
      expect(isValidSocialHandle(longIg, 'instagram')).toBe(false);
      
      // Twitter: 15 chars max
      const longTwitter = 'a'.repeat(16);
      expect(isValidSocialHandle(longTwitter, 'twitter')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidSocialHandle('', 'instagram')).toBe(false);
      expect(isValidSocialHandle(null, 'twitter')).toBe(false);
      expect(isValidSocialHandle('username', '')).toBe(false);
      expect(isValidSocialHandle('username', null)).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should validate files with allowed types', () => {
      const file = {
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      };
      
      const result = validateFile(file, {
        allowedTypes: ['image/jpeg', 'image/png'],
        maxSizeKB: 2048 // 2MB
      });
      
      expect(result.isValid).toBe(true);
    });

    it('should reject files with wrong type', () => {
      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024 * 1024 // 1MB
      };
      
      const result = validateFile(file, {
        allowedTypes: ['image/jpeg', 'image/png'],
        maxSizeKB: 2048 // 2MB
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type not allowed. Accepted types: image/jpeg, image/png');
    });

    it('should validate by file extension', () => {
      const file = {
        name: 'test.png',
        type: '', // Type might be empty in some environments
        size: 1024 * 1024 // 1MB
      };
      
      const result = validateFile(file, {
        allowedTypes: ['.png', '.jpg'],
        maxSizeKB: 2048 // 2MB
      });
      
      expect(result.isValid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const file = {
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 3 * 1024 * 1024 // 3MB
      };
      
      const result = validateFile(file, {
        allowedTypes: ['image/jpeg'],
        maxSizeKB: 2048 // 2MB
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size too large. Maximum size: 2048 KB');
    });

    it('should handle edge cases', () => {
      expect(validateFile(null).isValid).toBe(false);
      expect(validateFile(null).errors).toContain('No file provided');
    });
  });
});
