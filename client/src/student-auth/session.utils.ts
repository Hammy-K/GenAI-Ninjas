import { clearStudentIdCookie } from "./cookies.utils";
import { clearAuthStorage } from "./storage.utils";

export function clearAuthSession() {
  clearStudentIdCookie();
  clearAuthStorage();
}
