import { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export function useGoogleSignIn() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async (): Promise<string | null> => {
    setIsSigningIn(true);
    setError(null);

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      // Request additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      return idToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      setError(errorMessage);
      console.error('Google sign-in error:', error);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  return {
    signInWithGoogle,
    isSigningIn,
    error,
  };
}