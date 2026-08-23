import Cookies from "js-cookie";
import { AUTH_COOKIE_KEYS, AUTH_COOKIE_DEFAULTS } from "./auth.constants";

export function getStudentIdCookie(): string | undefined {
  return Cookies.get(AUTH_COOKIE_KEYS.studentId);
}

export function setStudentIdCookie(id: string | number) {
  Cookies.set(AUTH_COOKIE_KEYS.studentId, String(id), {
    expires: AUTH_COOKIE_DEFAULTS.expiresDays,
    path: AUTH_COOKIE_DEFAULTS.path,
    secure:
      typeof window !== "undefined" && window.location.protocol === "https:",
    sameSite: AUTH_COOKIE_DEFAULTS.sameSite,
  });
}

export function clearStudentIdCookie() {
  Cookies.remove(AUTH_COOKIE_KEYS.studentId, {
    path: AUTH_COOKIE_DEFAULTS.path,
  });
}

export function isAuthenticatedViaCookie(): boolean {
  return Boolean(getStudentIdCookie());
}
