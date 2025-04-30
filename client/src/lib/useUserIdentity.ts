import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to provide user identity data for API requests
 * Encapsulates both session ID (from localStorage) and Firebase UID
 * Includes a fallback device ID when Firebase auth is not available
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
   * Get a persistent device ID from localStorage
   * This serves as a fallback when Firebase auth is not available
   */
  const getDeviceId = useCallback((): string => {
    const key = 'device_id';
    let deviceId = localStorage.getItem(key);
    
    if (!deviceId) {
      // Create a more reliable device ID with timestamp and random component
      deviceId = `device_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
      localStorage.setItem(key, deviceId);
    }
    
    return deviceId;
  }, []);

  // Either use Firebase UID or fallback to device ID
  const persistentId = useMemo(() => {
    return userId || getDeviceId();
  }, [userId, getDeviceId]);

  /**
   * Add user identity data to any request payload
   * Always includes both session ID and a persistent ID (either Firebase UID or device ID)
   */
  const addUserIdentity = useCallback(<T extends object>(data: T, prefix: string = 'user'): T & { 
    sessionId: string, 
    firebaseUid?: string,
    deviceId: string
  } => {
    const sessionId = getSessionId(prefix);
    const deviceId = getDeviceId();
    
    return {
      ...data,
      sessionId,
      deviceId,
      // Only include Firebase UID if available
      firebaseUid: userId || undefined,
    };
  }, [userId, getSessionId, getDeviceId]);

  return {
    userId,
    persistentId,
    getSessionId,
    getDeviceId,
    addUserIdentity,
  };
}