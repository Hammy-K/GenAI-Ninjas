import Cookies from "js-cookie";
import { AUTH_COOKIE_KEYS, AUTH_COOKIE_DEFAULTS } from "./auth.constants";
import { ls, storageKeys } from "./storage.utils";

export function getStudentIdCookie(): string | undefined {
  const cookieId = Cookies.get(AUTH_COOKIE_KEYS.studentId);
  if (cookieId) {
    ls.set(storageKeys.studentId, cookieId);
    return cookieId;
  }

  const storedId = ls.get(storageKeys.studentId);
  if (storedId) {
    // Restore the browser cookie so existing sessions survive route changes.
    setStudentIdCookie(storedId);
    return storedId;
  }

  return undefined;
}

export function setStudentIdCookie(id: string | number) {
  const normalizedId = String(id);

  Cookies.set(AUTH_COOKIE_KEYS.studentId, normalizedId, {
    expires: AUTH_COOKIE_DEFAULTS.expiresDays,
    path: AUTH_COOKIE_DEFAULTS.path,
    secure:
      typeof window !== "undefined" && window.location.protocol === "https:",
    sameSite: AUTH_COOKIE_DEFAULTS.sameSite,
  });
  ls.set(storageKeys.studentId, normalizedId);
}

export function clearStudentIdCookie() {
  Cookies.remove(AUTH_COOKIE_KEYS.studentId, {
    path: AUTH_COOKIE_DEFAULTS.path,
  });
  ls.del(storageKeys.studentId);
}

export function isAuthenticatedViaCookie(): boolean {
  return Boolean(getStudentIdCookie());
}
