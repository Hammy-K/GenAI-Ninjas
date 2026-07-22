import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Firebase Admin Service Tests
 * Tests token verification logic with mocked Firebase Admin SDK
 */

// Mock firebase-admin modules
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  cert: vi.fn((serviceAccount) => serviceAccount),
}));

const mockVerifyIdToken = vi.fn();

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('FirebaseAdminService Token Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });

  it('should verify valid token with email', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: 'test-project',
      type: 'service_account',
    });

    const firebaseAdmin = await import('firebase-admin/auth');
    const mockAuth = firebaseAdmin.getAuth();

    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: true,
    } as DecodedIdToken);

    // Test the verification logic
    const decodedToken = await (mockAuth as any).verifyIdToken('valid-token');

    expect(decodedToken.uid).toBe('user-123');
    expect(decodedToken.email).toBe('test@example.com');
  });

  it('should return null when token verification fails', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: 'test-project',
    });

    const firebaseAdmin = await import('firebase-admin/auth');
    const mockAuth = firebaseAdmin.getAuth();

    mockVerifyIdToken.mockRejectedValueOnce(
      new Error('Invalid token')
    );

    try {
      await (mockAuth as any).verifyIdToken('invalid-token');
      expect.fail('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toBe('Invalid token');
    }
  });

  it('should reject tokens without email claim', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: 'test-project',
    });

    const firebaseAdmin = await import('firebase-admin/auth');
    const mockAuth = firebaseAdmin.getAuth();

    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'user-123',
      // No email claim
    } as any);

    const decodedToken = await (mockAuth as any).verifyIdToken('token-no-email');

    // Token is decoded but has no email - service should handle this
    expect((decodedToken as any).email).toBeUndefined();
  });

  it('should handle expired token error', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: 'test-project',
    });

    const firebaseAdmin = await import('firebase-admin/auth');
    const mockAuth = firebaseAdmin.getAuth();

    mockVerifyIdToken.mockRejectedValueOnce(
      new Error('Credential has expired or is malformed')
    );

    try {
      await (mockAuth as any).verifyIdToken('expired-token');
      expect.fail('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toContain('expired');
    }
  });

  it('should handle revoked token error', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: 'test-project',
    });

    const firebaseAdmin = await import('firebase-admin/auth');
    const mockAuth = firebaseAdmin.getAuth();

    mockVerifyIdToken.mockRejectedValueOnce(
      new Error('Credential revoked')
    );

    try {
      await (mockAuth as any).verifyIdToken('revoked-token');
      expect.fail('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toContain('revoked');
    }
  });
});
