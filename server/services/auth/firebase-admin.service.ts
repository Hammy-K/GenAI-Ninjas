import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Firebase Admin service for server-side token verification
 */

class FirebaseAdminService {
  private initialized = false;

  constructor() {
    this.initializeFirebaseAdmin();
  }

  private initializeFirebaseAdmin(): void {
    try {
      // Check if Firebase Admin is already initialized
      if (getApps().length > 0) {
        this.initialized = true;
        return;
      }

      // Get service account from environment
      const serviceAccountJson = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON;
      if (!serviceAccountJson) {
        console.error('VERTEX_AI_SERVICE_ACCOUNT_JSON not found - Firebase Admin verification disabled');
        return;
      }

      const serviceAccount = JSON.parse(serviceAccountJson);
      
      initializeApp({
        credential: cert(serviceAccount),
      });

      this.initialized = true;
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      this.initialized = false;
    }
  }

  /**
   * Verify Firebase ID token and extract user info
   */
  async verifyIdToken(idToken: string): Promise<{ uid: string; email: string } | null> {
    if (!this.initialized) {
      console.error('Firebase Admin not initialized - cannot verify token');
      return null;
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      
      if (!decodedToken.email) {
        console.error('No email found in decoded token');
        return null;
      }

      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const firebaseAdminService = new FirebaseAdminService();