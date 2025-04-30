import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { initializeAuth, getUserId } from '../services/firebase-auth';

// Define the auth context type
interface AuthContextType {
  user: FirebaseUser | null;
  userId: string | null;
  isLoading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  userId: null,
  isLoading: true
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize Firebase authentication on component mount
    const initAuth = async () => {
      try {
        const user = await initializeAuth();
        setUser(user);
      } catch (error) {
        console.error('Error initializing authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = {
    user,
    userId: getUserId(),
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};