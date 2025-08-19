import { useContext } from "react";
import { AdminAuthContext } from "./AdminAuthProvider";

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
