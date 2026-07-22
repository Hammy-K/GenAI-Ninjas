import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      dir="rtl"
      className="h-screen overflow-hidden bg-background text-foreground flex flex-col"
    >
      <AdminHeader />

      <div className="flex flex-1 min-h-0 bg-background">
        <AdminSidebar className="w-48 h-full overflow-y-auto bg-background" />

        <main className="flex-1 min-h-0 h-full overflow-y-auto p-4 lg:p-6 bg-card rounded-lg">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
