// 3WM SONIK - Secret Management Tests
import { secretManager } from './secrets';

describe('Secret Management', () => {
  describe('Secret Generation', () => {
    it('should generate secure random secrets', () => {
      const secret1 = secretManager.generateSecureSecret(32);
      const secret2 = secretManager.generateSecureSecret(32);

      expect(secret1).toHaveLength(32);
      expect(secret2).toHaveLength(32);
      expect(secret1).not.toBe(secret2);
    });

    it('should generate secure tokens', () => {
      const token = secretManager.generateToken();

      expect(token).toHaveLength(32);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate API keys with prefix', () => {
      const apiKey = secretManager.generateApiKey();

      expect(apiKey.startsWith('3wm_')).toBe(true);
      expect(apiKey.length).toBeGreaterThan(4);
    });
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'Sensitive data for 3WM SONIK';
      const encrypted = secretManager.encrypt(plaintext);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.encrypted).not.toBe(plaintext);

      const decrypted = secretManager.decrypt(encrypted.encrypted, encrypted.authTag, encrypted.iv);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted values for same plaintext', () => {
      const plaintext = 'Test data';
      const encrypted1 = secretManager.encrypt(plaintext);
      const encrypted2 = secretManager.encrypt(plaintext);

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('Hashing', () => {
    it('should hash data consistently', () => {
      const data = 'Test data for hashing';
      const hash1 = secretManager.hash(data);
      const hash2 = secretManager.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should verify hash correctly', () => {
      const data = 'Test data';
      const hash = secretManager.hash(data);

      expect(secretManager.verifyHash(data, hash)).toBe(true);
      expect(secretManager.verifyHash('Different data', hash)).toBe(false);
    });
  });

  describe('Secret Validation', () => {
    it('should validate strong secrets', () => {
      const strongSecret = 'Str0ng!S3cr3t#With$Special%Chars123';
      const validation = secretManager.validateSecretStrength(strongSecret);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should reject weak secrets', () => {
      const weakSecret = 'password';
      const validation = secretManager.validateSecretStrength(weakSecret);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should reject short secrets', () => {
      const shortSecret = 'short';
      const validation = secretManager.validateSecretStrength(shortSecret);

      expect(validation.valid).toBe(false);
      expect(validation.issues.some((issue) => issue.includes('32 characters'))).toBe(true);
    });
  });

  describe('Secret Rotation', () => {
    it('should rotate JWT secret', () => {
      const oldSecret = secretManager.getJwtSecret();
      const newSecret = secretManager.rotateJwtSecret();

      expect(newSecret).not.toBe(oldSecret);
      expect(secretManager.getJwtSecret()).toBe(newSecret);
    });
  });
});
