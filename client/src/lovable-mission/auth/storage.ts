export const AUTH_TTL_HOURS = 12;

const KEY = "lovable.auth.user";

export type StoredUser = {
  displayName: string;
  email: string;
  photoURL?: string;
  signedAt: number;
  expiresAt: number;
};

export function saveUser(u: Omit<StoredUser, "signedAt" | "expiresAt">) {
  const now = Date.now();
  const expiresAt = now + AUTH_TTL_HOURS * 60 * 60 * 1000;

  const payload: StoredUser = { ...u, signedAt: now, expiresAt };

  localStorage.setItem(KEY, JSON.stringify(payload));

  return payload;
}

export function loadUser(): StoredUser | null {
  const raw = localStorage.getItem(KEY);

  if (!raw) return null;

  try {
    const parsed: StoredUser = JSON.parse(raw);

    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      // expired → clear
      localStorage.removeItem(KEY);

      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(KEY);

    return null;
  }
}

export function clearUser() {
  localStorage.removeItem(KEY);
}
