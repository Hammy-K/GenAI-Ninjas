import { createContext, useContext, type ReactNode } from "react";

import { useAuth as useAuthBase } from "./useAuth";

/** Provide a single shared auth state to the whole app */
const LovableAuthContext = createContext<ReturnType<typeof useAuthBase> | null>(
  null,
);

export function LovableAuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthBase();

  return (
    <LovableAuthContext.Provider value={auth}>
      {children}
    </LovableAuthContext.Provider>
  );
}

/** Use this instead of importing useAuth from ./useAuth directly */
export function useLovableAuth() {
  const ctx = useContext(LovableAuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return ctx;
}
