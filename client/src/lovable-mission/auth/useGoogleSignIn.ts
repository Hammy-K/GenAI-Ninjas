import { useCallback, useState } from "react";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FbUser,
} from "firebase/auth";

function ensureFirebaseApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  // If you initialize Firebase in a separate file, you can delete this block.
  // Otherwise, you can optionally initialize here from envs.
  // initializeApp({
  //   apiKey: import.meta.env.VITE_FB_API_KEY,
  //   authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  //   projectId: import.meta.env.VITE_FB_PROJECT_ID,
  //   appId: import.meta.env.VITE_FB_APP_ID,
  // });

  throw new Error(
    "Firebase app is not initialized. Initialize Firebase before calling useGoogleSignIn().",
  );
}

export type GoogleUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
};

export type GoogleSignInSuccess = {
  idToken: string;
  user: GoogleUser;
};

function toArabicErrorMessage(code?: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
      return "تم إغلاق نافذة تسجيل الدخول قبل اكتمال العملية.";
    case "auth/cancelled-popup-request":
      return "تم إلغاء نافذة تسجيل الدخول السابقة. جرّب مرة أخرى.";
    case "auth/popup-blocked":
      return "المتصفح حظر النافذة المنبثقة. عطّل الحظر مؤقتاً أو افتح من متصفح آخر.";
    case "auth/network-request-failed":
      return "مشكلة في الاتصال بالشبكة. تحقق من الإنترنت وحاول مرة أخرى.";
    case "auth/operation-not-allowed":
      return "تسجيل الدخول عبر Google غير مفعل في إعدادات المشروع.";
    case "auth/unauthorized-domain":
      return "النطاق الحالي غير مصرح به لاستخدام تسجيل الدخول عبر Google.";
    default:
      return "تعذّر تسجيل الدخول عبر Google. حاول مرة أخرى.";
  }
}

function shapeUser(u: FbUser): GoogleUser {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
  };
}

/**
 * useGoogleSignIn
 * - Opens Google popup
 * - Returns { idToken, user } on success
 * - Exposes isSigningIn + last Arabic error message
 */
export function useGoogleSignIn() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle =
    useCallback(async (): Promise<GoogleSignInSuccess | null> => {
      setIsSigningIn(true);
      setError(null);

      try {
        ensureFirebaseApp();
        const auth = getAuth();

        const provider = new GoogleAuthProvider();
        // Keep scopes minimal; email/profile are included by default.
        // Explicit scopes below are harmless but optional.
        provider.addScope("email");
        provider.addScope("profile");

        // Force account chooser to avoid “stuck on old Google account”
        provider.setCustomParameters({ prompt: "select_account" });

        const res = await signInWithPopup(auth, provider);
        const idToken = await res.user.getIdToken();
        const user = shapeUser(res.user);

        return { idToken, user };
      } catch (e: any) {
        const code: string | undefined = e?.code;
        const msg = toArabicErrorMessage(code);
        setError(msg);
        // Keep original error visible in console for debugging.
        console.error("Google sign-in error:", e);
        return null;
      } finally {
        setIsSigningIn(false);
      }
    }, []);

  return {
    signInWithGoogle,
    isSigningIn,
    error, // Arabic, friendly
  };
}
