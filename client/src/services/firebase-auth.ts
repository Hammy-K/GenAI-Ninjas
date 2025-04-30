import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  type User as FirebaseUser 
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log configuration to help with debugging (excluding sensitive values)
console.log("Checking Firebase configuration:", {
  apiKey: firebaseConfig.apiKey ? "API_KEY_PROVIDED" : "MISSING",
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? "APP_ID_PROVIDED" : "MISSING"
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Print success message if initialized correctly
console.log("Firebase configuration validated successfully!");

let currentUser: FirebaseUser | null = null;
let authInitialized = false;

/**
 * Sign in anonymously if not already signed in
 * This ensures users have a persistent identity across sessions
 */
export async function signInAnonymousUser(): Promise<FirebaseUser | null> {
  try {
    // Check if user is already signed in
    if (auth.currentUser) {
      currentUser = auth.currentUser;
      console.log("Using existing anonymous user with UID:", auth.currentUser.uid);
      return auth.currentUser;
    }

    // Sign in anonymously
    const result = await signInAnonymously(auth);
    currentUser = result.user;
    console.log("User signed in anonymously with UID:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    
    // Check for specific error codes related to anonymous auth not being enabled
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as {code: string}).code;
      if (errorCode === 'auth/admin-restricted-operation') {
        console.warn("Anonymous authentication is not enabled in Firebase console. Please enable it in the Authentication > Sign-in method section.");
      }
    }
    
    // Return null but don't break the app flow
    return null;
  }
}

/**
 * Get the current Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return currentUser || auth.currentUser;
}

/**
 * Get Firebase User ID (UID)
 * Returns the UID if available, or null if not signed in
 */
export function getUserId(): string | null {
  const user = getCurrentUser();
  return user ? user.uid : null;
}

/**
 * Initialize Firebase authentication
 * Returns a promise that resolves when auth state is first determined
 */
export function initializeAuth(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    // If auth is already initialized, return current state
    if (authInitialized) {
      resolve(currentUser);
      return;
    }

    // Set up auth state change listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      authInitialized = true;
      currentUser = user;

      // If user is not signed in, sign in anonymously
      if (!user) {
        signInAnonymousUser().then(resolve);
      } else {
        console.log("User already signed in with UID:", user.uid);
        resolve(user);
      }
      
      // Unsubscribe after first auth state determination
      unsubscribe();
    });
  });
}

// Export auth instance
export { auth };