import { useEffect, useState, useCallback } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";

function getSafeAuth(provided?: Auth): Auth {
  if (provided) return provided;

  return getAuth();
}

export function useGoogleAuth(authOverride?: Auth) {
  const auth = getSafeAuth(authOverride);

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setEmail(u?.email ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, [auth]);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();

    provider.addScope("email");

    await signInWithPopup(auth, provider);
  }, [auth]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, [auth]);

  return { email, loading, signInWithGoogle, signOutUser };
}
