// 3WM SONIK - Secret Management Service
// Handles secure secret generation, validation, and rotation

import * as crypto from 'crypto';

interface SecretConfig {
  jwtSecret: string;
  sessionSecret: string;
  encryptionKey: string;
}

class SecretManager {
  private secrets: SecretConfig;
  private readonly MIN_SECRET_LENGTH = 32;
  private readonly JWT_SECRET_LENGTH = 64;
  private readonly ENCRYPTION_KEY_LENGTH = 32;

  constructor() {
    this.secrets = this.loadSecrets();
    this.validateSecrets();
  }

  private loadSecrets(): SecretConfig {
    return {
      jwtSecret: process.env.JWT_SECRET || this.generateSecureSecret(this.JWT_SECRET_LENGTH),
      sessionSecret:
        process.env.SESSION_SECRET || this.generateSecureSecret(this.MIN_SECRET_LENGTH),
      encryptionKey:
        process.env.ENCRYPTION_KEY || this.generateSecureSecret(this.ENCRYPTION_KEY_LENGTH),
    };
  }

  private validateSecrets(): void {
    const { jwtSecret, sessionSecret, encryptionKey } = this.secrets;

    if (jwtSecret.length < this.MIN_SECRET_LENGTH) {
      console.warn(
        `JWT_SECRET is too short (${jwtSecret.length} chars). Minimum ${this.MIN_SECRET_LENGTH} characters recommended.`
      );
    }

    if (sessionSecret.length < this.MIN_SECRET_LENGTH) {
      console.warn(
        `SESSION_SECRET is too short (${sessionSecret.length} chars). Minimum ${this.MIN_SECRET_LENGTH} characters recommended.`
      );
    }

    if (encryptionKey.length < this.ENCRYPTION_KEY_LENGTH) {
      console.warn(
        `ENCRYPTION_KEY is too short (${encryptionKey.length} chars). Minimum ${this.ENCRYPTION_KEY_LENGTH} characters required.`
      );
    }
  }

  public generateSecureSecret(length: number): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  public getSecrets(): SecretConfig {
    return { ...this.secrets };
  }

  public getJwtSecret(): string {
    return this.secrets.jwtSecret;
  }

  public getSessionSecret(): string {
    return this.secrets.sessionSecret;
  }

  public getEncryptionKey(): Buffer {
    // Ensure the key is exactly 32 bytes for AES-256
    const key = this.secrets.encryptionKey.padEnd(32, '0').slice(0, 32);
    return Buffer.from(key);
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  public encrypt(text: string): { encrypted: string; authTag: string; iv: string } {
    const algorithm = 'aes-256-gcm';
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      authTag: authTag.toString('hex'),
      iv: iv.toString('hex'),
    };
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  public decrypt(encrypted: string, authTag: string, iv: string): string {
    const algorithm = 'aes-256-gcm';
    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash sensitive data using SHA-256
   */
  public hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data against hash
   */
  public verifyHash(data: string, hash: string): boolean {
    return this.hash(data) === hash;
  }

  /**
   * Generate secure random token
   */
  public generateToken(length: number = 32): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Generate API key
   */
  public generateApiKey(): string {
    const prefix = '3wm_';
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${prefix}${randomPart}`;
  }

  /**
   * Validate secret strength
   */
  public validateSecretStrength(secret: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (secret.length < this.MIN_SECRET_LENGTH) {
      issues.push(`Secret must be at least ${this.MIN_SECRET_LENGTH} characters`);
    }

    if (/^[a-zA-Z0-9]+$/.test(secret)) {
      issues.push('Secret should include special characters for better security');
    }

    if (!/[A-Z]/.test(secret)) {
      issues.push('Secret should include uppercase letters');
    }

    if (!/[a-z]/.test(secret)) {
      issues.push('Secret should include lowercase letters');
    }

    if (!/[0-9]/.test(secret)) {
      issues.push('Secret should include numbers');
    }

    // Check for common weak patterns
    const commonPatterns = ['password', 'secret', '123456', 'qwerty', 'admin'];
    const lowerSecret = secret.toLowerCase();
    if (commonPatterns.some((pattern) => lowerSecret.includes(pattern))) {
      issues.push('Secret contains common weak patterns');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Rotate JWT secret (for future implementation)
   */
  public rotateJwtSecret(): string {
    const newSecret = this.generateSecureSecret(this.JWT_SECRET_LENGTH);
    this.secrets.jwtSecret = newSecret;
    console.log('[SecretManager] JWT secret rotated');
    return newSecret;
  }
}

// Export singleton instance
export const secretManager = new SecretManager();

// Development helper to print secrets setup instructions
if (process.env.NODE_ENV === 'development') {
  console.log(`
========================================
3WM SONIK - Secret Management Setup
========================================

For production deployment, set these environment variables:

JWT_SECRET=${secretManager.getJwtSecret()}
SESSION_SECRET=${secretManager.getSessionSecret()}
ENCRYPTION_KEY=${secretManager.getEncryptionKey().toString('hex')}

⚠️  NEVER commit these secrets to version control!
⚠️  Use a proper secret management system in production:
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager
========================================
`);
}
