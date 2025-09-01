import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Settings,
  Gamepad2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";

type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  {
    href: "/admin/html-games-projects",
    label: "مشاريع الألعاب",
    icon: Gamepad2,
  },
  { href: "/admin/gallery", label: "المعرض", icon: ImageIcon },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export default function AdminSidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { logout } = useAdminAuth();

  return (
    <aside
      className={cn("w-64 flex flex-col justify-between", className)}
      aria-label="شريط التنقل الجانبي"
    >
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            location === href ||
            (href !== "/admin" && location.startsWith(href));

          return (
            <Link key={href} href={href}>
              <a
                className={[
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                ].join(" ")}
              >
                {Icon ? <Icon className="w-4 h-4" /> : null}
                <span className="truncate">{label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-red-500"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
