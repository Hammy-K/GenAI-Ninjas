import { ReactNode } from "react";

interface ChatLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ChatLayout({ children, className = "" }: ChatLayoutProps) {
  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden border border-border rounded-lg bg-white">
        {children}
      </div>
    </div>
  );
}
