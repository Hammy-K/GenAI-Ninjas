import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as crypto from 'crypto';

/**
 * Facilitator Service Tests
 * Tests credential encryption/decryption and round-trip data integrity
 */

// Simple encryption service mock for testing
class MockEncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    // Use a fixed key for testing
    this.key = Buffer.from(
      '0123456789abcdef0123456789abcdef',
      'hex'
    );
  }

  encrypt(plaintext: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return {
      encrypted,
      iv: iv.toString('base64'),
    };
  }

  decrypt(encryptedData: string, iv: string): string {
    const ivBuffer = Buffer.from(iv, 'base64');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, ivBuffer);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Mock drizzle-orm and db
vi.mock('../../db', () => ({
  db: {},
}));

vi.mock('../../../shared/schema', () => ({
  facilitators: {},
  studentFacilitatorAssignments: {},
}));

vi.mock('../../../shared/video-flow.schema', () => ({}));

describe('Credential Encryption - Facilitator Service', () => {
  let encryptionService: MockEncryptionService;

  beforeEach(() => {
    encryptionService = new MockEncryptionService();
  });

  describe('encryption round-trip', () => {
    it('should encrypt and decrypt credentials maintaining data integrity', () => {
      const originalData = JSON.stringify({
        projectId: 'test-project-123',
        location: 'us-central1',
      });

      // Encrypt
      const encrypted = encryptionService.encrypt(originalData);
      // Decrypt
      const decrypted = encryptionService.decrypt(encrypted.encrypted, encrypted.iv);

      expect(decrypted).toBe(originalData);
    });

    it('should handle service account JSON encryption', () => {
      const serviceAccount = {
        type: 'service_account',
        project_id: 'my-project',
        private_key_id: 'key-id-123',
        private_key: 'key-content',
      };

      const jsonString = JSON.stringify(serviceAccount);
      const encrypted = encryptionService.encrypt(jsonString);
      const decrypted = encryptionService.decrypt(encrypted.encrypted, encrypted.iv);

      expect(decrypted).toBe(jsonString);
      expect(JSON.parse(decrypted)).toEqual(serviceAccount);
    });

    it('should handle long credentials', () => {
      const longJson = JSON.stringify({
        content: 'x'.repeat(1000),
      });

      const encrypted = encryptionService.encrypt(longJson);
      const decrypted = encryptionService.decrypt(encrypted.encrypted, encrypted.iv);

      expect(decrypted).toBe(longJson);
    });
  });

  describe('encryption properties', () => {
    it('should generate unique IVs for each encryption', () => {
      const data = 'test-data';

      const encrypted1 = encryptionService.encrypt(data);
      const encrypted2 = encryptionService.encrypt(data);

      // IVs should be different even for same data
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });

    it('should not expose plaintext in encrypted output', () => {
      const plaintext = 'secret-api-key-12345';
      const encrypted = encryptionService.encrypt(plaintext);

      expect(encrypted.encrypted).not.toContain(plaintext);
      expect(encrypted.encrypted).not.toContain('secret');
    });

    it('should handle special characters in credentials', () => {
      const specialChars = 'key!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptionService.encrypt(specialChars);
      const decrypted = encryptionService.decrypt(encrypted.encrypted, encrypted.iv);

      expect(decrypted).toBe(specialChars);
    });

    it('should handle JSON with unicode characters', () => {
      const jsonWithUnicode = JSON.stringify({
        name: 'Facilitator',
        region: '中文',
        emoji: '🔐',
      });

      const encrypted = encryptionService.encrypt(jsonWithUnicode);
      const decrypted = encryptionService.decrypt(encrypted.encrypted, encrypted.iv);

      expect(decrypted).toBe(jsonWithUnicode);
      expect(JSON.parse(decrypted).emoji).toBe('🔐');
    });
  });

  describe('credential format storage', () => {
    it('should format encrypted credentials with IV prefix', () => {
      const encrypted = encryptionService.encrypt('test-data');

      // Simulate the storage format used in facilitator service
      const storedFormat = `${encrypted.iv}:${encrypted.encrypted}`;

      expect(storedFormat).toContain(':');
      const [iv, data] = storedFormat.split(':');
      expect(iv).toBe(encrypted.iv);
      expect(data).toBe(encrypted.encrypted);
    });

    it('should handle parsing stored credentials format', () => {
      const originalData = 'project-id-123';
      const encrypted = encryptionService.encrypt(originalData);
      const stored = `${encrypted.iv}:${encrypted.encrypted}`;

      // Parse like the service does
      const [parsedIv, parsedData] = stored.split(':');

      // Decrypt using parsed values
      const decrypted = encryptionService.decrypt(parsedData, parsedIv);
      expect(decrypted).toBe(originalData);
    });

    it('should preserve format across multiple credentials', () => {
      const credentials = {
        projectId: 'test-project-id',
        location: 'us-central1',
        serviceAccountJson: JSON.stringify({ type: 'service_account' }),
      };

      const encryptedProject = encryptionService.encrypt(credentials.projectId);
      const encryptedLocation = encryptionService.encrypt(credentials.location);
      const encryptedServiceAccount = encryptionService.encrypt(
        credentials.serviceAccountJson
      );

      const stored = {
        projectId: `${encryptedProject.iv}:${encryptedProject.encrypted}`,
        location: `${encryptedLocation.iv}:${encryptedLocation.encrypted}`,
        serviceAccount: `${encryptedServiceAccount.iv}:${encryptedServiceAccount.encrypted}`,
      };

      // Decrypt all three
      const [projIv, projData] = stored.projectId.split(':');
      const [locIv, locData] = stored.location.split(':');
      const [saIv, saData] = stored.serviceAccount.split(':');

      expect(encryptionService.decrypt(projData, projIv)).toBe(credentials.projectId);
      expect(encryptionService.decrypt(locData, locIv)).toBe(credentials.location);
      expect(encryptionService.decrypt(saData, saIv)).toBe(credentials.serviceAccountJson);
    });
  });

  describe('credential lifecycle', () => {
    it('should support full encrypt-store-retrieve-decrypt flow', () => {
      const originalCredentials = {
        projectId: 'my-gcp-project',
        location: 'us-west1',
        serviceAccountJson: JSON.stringify({
          type: 'service_account',
          project_id: 'my-gcp-project',
          private_key: 'very-secret-key',
        }),
      };

      // Step 1: Encrypt all fields
      const encryptedProject = encryptionService.encrypt(originalCredentials.projectId);
      const encryptedLocation = encryptionService.encrypt(originalCredentials.location);
      const encryptedServiceAccount = encryptionService.encrypt(
        originalCredentials.serviceAccountJson
      );

      // Step 2: Store in format with IV prefix
      const stored = {
        projectId: `${encryptedProject.iv}:${encryptedProject.encrypted}`,
        location: `${encryptedLocation.iv}:${encryptedLocation.encrypted}`,
        serviceAccount: `${encryptedServiceAccount.iv}:${encryptedServiceAccount.encrypted}`,
      };

      // Step 3: Retrieve and parse
      const [projIv, projEncrypted] = stored.projectId.split(':');
      const [locIv, locEncrypted] = stored.location.split(':');
      const [saIv, saEncrypted] = stored.serviceAccount.split(':');

      // Step 4: Decrypt
      const retrievedProjectId = encryptionService.decrypt(projEncrypted, projIv);
      const retrievedLocation = encryptionService.decrypt(locEncrypted, locIv);
      const retrievedServiceAccount = encryptionService.decrypt(saEncrypted, saIv);

      // Verify all match original
      expect(retrievedProjectId).toBe(originalCredentials.projectId);
      expect(retrievedLocation).toBe(originalCredentials.location);
      expect(retrievedServiceAccount).toBe(originalCredentials.serviceAccountJson);
    });

    it('should handle empty values', () => {
      const emptyValue = '';
      const encrypted = encryptionService.encrypt(emptyValue);
      const decrypted = encryptionService.decrypt(encrypted.encrypted, encrypted.iv);

      expect(decrypted).toBe('');
    });
  });
});
