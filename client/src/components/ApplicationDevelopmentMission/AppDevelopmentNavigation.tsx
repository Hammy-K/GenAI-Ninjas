import { ArrowRight, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useOrganization } from "@/hooks/useOrganization";

type AppDevelopmentNavigationProps = {
  parentPath?: string;
  parentLabel?: string;
  className?: string;
};

export function AppDevelopmentNavigation({
  parentPath,
  parentLabel = "العودة",
  className = "",
}: AppDevelopmentNavigationProps) {
  const [, navigate] = useLocation();
  const organization = useOrganization();

  const withOrganization = (path: string) =>
    organization.isMain ? path : `/${organization.name}${path}`;

  return (
    <nav
      className={`flex items-center justify-between gap-3 ${className}`}
      aria-label="التنقل بين المهام"
      dir="rtl"
    >
      {parentPath ? (
        <button
          type="button"
          onClick={() => navigate(withOrganization(parentPath))}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          {parentLabel}
        </button>
      ) : (
        <span />
      )}

      <button
        type="button"
        onClick={() => navigate(organization.isMain ? "/" : `/${organization.name}/`)}
        className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700 shadow-sm transition-colors hover:bg-violet-50"
      >
        <Home className="h-4 w-4" />
        الرئيسية
      </button>
    </nav>
  );
}