import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getAuth, signOut as fbSignOut } from "firebase/auth";
import { useGoogleSignIn } from "./useGoogleSignIn";
import {
  clearUser,
  loadUser,
  saveUser,
  StoredUser,
  AUTH_TTL_HOURS,
} from "./storage";
import { toastError, toastInfo, toastSuccess } from "../ui/Toast";

type AuthUser = Pick<
  StoredUser,
  "displayName" | "email" | "photoURL" | "signedAt" | "expiresAt"
>;

export function useAuth() {
  const {
    signInWithGoogle,
    isSigningIn,
    error: signInError,
  } = useGoogleSignIn();

  const [user, setUser] = useState<AuthUser | null>(() => loadUser());
  const timerRef = useRef<number | null>(null);

  const expired = useMemo(() => {
    if (!user) return false;
    return Date.now() > user.expiresAt;
  }, [user]);

  const scheduleAutoLogout = useCallback((u: AuthUser) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);

    const msLeft = Math.max(0, u.expiresAt - Date.now());

    // single timeout per session — trivial perf impact
    timerRef.current = window.setTimeout(() => {
      clearUser();
      setUser(null);

      toastInfo("انتهت صلاحية الجلسة. سجّل دخولك من جديد.");
    }, msLeft);
  }, []);

  useEffect(() => {
    if (user) scheduleAutoLogout(user);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [user, scheduleAutoLogout]);

  const signIn = useCallback(async () => {
    const result = await signInWithGoogle();

    if (!result) {
      if (signInError) toastError(signInError);
      else toastError("تعذّر تسجيل الدخول عبر Google.");
      return;
    }

    // we already have the shaped Google user from the hook
    const gUser = result.user;

    if (!gUser.email) {
      toastError("لم نستطع الحصول على بريدك الإلكتروني من Google.");
      return;
    }

    const stored = saveUser({
      displayName: gUser.displayName || gUser.email.split("@")[0],
      email: gUser.email,
      photoURL: gUser.photoURL || undefined,
    });

    setUser(stored);

    toastSuccess("تم تسجيل الدخول بنجاح.");
  }, [signInWithGoogle, signInError]);

  const signOut = useCallback(async () => {
    try {
      await fbSignOut(getAuth());
    } catch {
      // ignore firebase local errors
    } finally {
      clearUser();
      setUser(null);
      toastInfo("تم تسجيل الخروج.");
    }
  }, []);

  // on first mount, if expired remove immediately (cheap check)
  useEffect(() => {
    if (user && expired) {
      clearUser();
      setUser(null);
    }
  }, [user, expired]);

  return {
    user,
    isSigningIn,
    expired,
    signIn,
    signOut,
    ttlHours: AUTH_TTL_HOURS,
  };
}
