import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to provide user identity data for API requests
 * Encapsulates both session ID (from localStorage) and Firebase UID
 */
export function useUserIdentity() {
  const { userId } = useAuth();
  
  /**
   * Get the user's session ID from localStorage
   * Creates a new one if it doesn't exist
   */
  const getSessionId = useCallback((prefix: string = 'user'): string => {
    // Try to get existing session ID from localStorage
    const key = `${prefix}_session_id`;
    let sessionId = localStorage.getItem(key);
    
    // If no session ID exists, create a new one
    if (!sessionId) {
      sessionId = `${prefix}_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
      localStorage.setItem(key, sessionId);
    }
    
    return sessionId;
  }, []);

  /**
   * Add user identity data to any request payload
   */
  const addUserIdentity = useCallback(<T extends object>(data: T, prefix: string = 'user'): T & { sessionId: string, firebaseUid?: string } => {
    const sessionId = getSessionId(prefix);
    
    return {
      ...data,
      sessionId,
      firebaseUid: userId || undefined,
    };
  }, [userId, getSessionId]);

  return {
    userId,
    getSessionId,
    addUserIdentity,
  };
}