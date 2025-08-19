import { ReactNode, useEffect } from "react";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import { useLocation } from "wouter";
import AdminAuthModal from "@/pages/admin/AdminAuthModal";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthed, isLoading } = useAdminAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthed && location === "/admin") {
      navigate("/admin/dashboard");
    }
  }, [isLoading, isAuthed, location, navigate]);

  if (isLoading) {
    return (
      <div className="w-full h-screen grid place-items-center">
        <div>Loading…</div>
      </div>
    );
  }

  if (!isAuthed) {
    return <AdminAuthModal open />;
  }

  return <>{children}</>;
}
