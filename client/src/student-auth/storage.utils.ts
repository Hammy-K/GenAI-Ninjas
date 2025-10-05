import { AUTH_STORAGE_KEYS } from "./auth.constants";

export const storageKeys = AUTH_STORAGE_KEYS;

export const ls = {
  get: (key: string) =>
    typeof window === "undefined" ? "" : localStorage.getItem(key) || "",
  set: (key: string, value: string) => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  },
  del: (key: string) => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  },
};

export const getInitialGrade = () => ls.get(storageKeys.studentGrade) || "";

export function clearAuthStorage() {
  Object.values(storageKeys).forEach((k) => ls.del(k));
}
