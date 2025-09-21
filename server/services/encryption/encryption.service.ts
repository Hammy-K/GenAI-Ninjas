import crypto from 'crypto';

interface EncryptionResult {
  encrypted: string;
  iv: string;
}

/**
 * Encryption service for securing sensitive data like API credentials
 * Uses AES-256-CBC for secure encryption
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      // For development, generate a key. In production, this should be set explicitly
      console.warn('ENCRYPTION_KEY not found, generating temporary key (development only)');
      this.key = crypto.randomBytes(this.keyLength);
    } else {
      // Convert hex string to buffer, or hash the provided key to ensure correct length
      if (encryptionKey.length === this.keyLength * 2) {
        // Key is provided as hex string
        this.key = Buffer.from(encryptionKey, 'hex');
      } else {
        // Hash the provided key to get consistent 256-bit key
        this.key = crypto.createHash('sha256').update(encryptionKey).digest();
      }
    }
  }

  /**
   * Encrypt sensitive data with AES-256-CBC
   */
  encrypt(plaintext: string): EncryptionResult {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      return {
        encrypted,
        iv: iv.toString('base64'),
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with AES-256-CBC
   */
  decrypt(encryptedData: string, iv: string): string {
    try {
      const ivBuffer = Buffer.from(iv, 'base64');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, ivBuffer);
      
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - data may be corrupted or tampered with');
    }
  }

  /**
   * Encrypt JSON object (for service account credentials)
   */
  encryptJson(obj: object): EncryptionResult {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt and parse JSON object
   */
  decryptJson<T = object>(encryptedData: string, iv: string): T {
    const decrypted = this.decrypt(encryptedData, iv);
    try {
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Failed to parse decrypted JSON:', error);
      throw new Error('Decrypted data is not valid JSON');
    }
  }

  /**
   * Generate a new encryption key (for setup/rotation)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();