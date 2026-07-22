import React, { createContext, useContext, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "./PageHeader";

export type AppSection =
  | "home"
  | "missions"
  | "lesson"
  | "admin";

interface ProgressContextType {
  current?: number;
  total?: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
);

export function useProgressContext() {
  const context = useContext(ProgressContext);
  return context;
}

interface AppShellProps {
  children: ReactNode;
  section?: AppSection;
  header?: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  showHeaderBack?: boolean;
  onHeaderBack?: () => void;
  headerRightContent?: React.ReactNode;
  progress?: ProgressContextType;
  className?: string;
}

export function AppShell({
  children,
  section = "home",
  header,
  headerTitle,
  headerSubtitle,
  showHeaderBack = false,
  onHeaderBack,
  headerRightContent,
  progress,
  className,
}: AppShellProps) {
  const sectionClasses: Record<AppSection, string> = {
    home: "min-h-screen bg-background",
    missions: "min-h-screen bg-background",
    lesson: "min-h-screen bg-background",
    admin: "min-h-screen bg-background",
  };

  return (
    <ProgressContext.Provider value={progress || {}}>
      <div className={cn(sectionClasses[section], className)}>
        {/* Header */}
        {header ? (
          header
        ) : headerTitle ? (
          <PageHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            showBack={showHeaderBack}
            onBack={onHeaderBack}
            rightContent={headerRightContent}
          />
        ) : null}

        {/* Main Content */}
        <main className="flex flex-col flex-1">{children}</main>
      </div>
    </ProgressContext.Provider>
  );
}
