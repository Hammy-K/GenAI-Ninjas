import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      dir="rtl"
      className="h-screen overflow-hidden bg-white text-gray-900 flex flex-col"
    >
      <AdminHeader />

      <div className="flex flex-1 min-h-0 bg-white">
        <AdminSidebar className="w-48 h-full overflow-y-auto bg-white" />

        <main className="flex-1 min-h-0 h-full overflow-y-auto p-4 lg:p-6 bg-gray-50 rounded-lg">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
