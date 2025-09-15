import { ReactNode } from "react";

/**
 * ActionsBar always reserves space for conditional buttons
 * to avoid UI flicker (e.g. when Open/Submit appear later).
 */
export function ActionsBar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-w-[220px] justify-end mt-4">
      {children ?? null}
    </div>
  );
}
