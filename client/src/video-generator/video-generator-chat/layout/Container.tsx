import { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f2e8] text-foreground font-tajawal">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
