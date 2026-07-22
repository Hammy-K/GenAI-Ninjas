import React from "react";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";

type ProgressType = "session" | "macro";

interface ProgressIndicatorProps {
  type: ProgressType;
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressIndicator({
  type,
  value,
  max = 100,
  label,
  showPercentage = false,
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.round((value / max) * 100);

  const heightClass = type === "session" ? "h-2" : "h-4";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showPercentage && (
            <span className="text-xs text-muted">{percentage}%</span>
          )}
        </div>
      )}
      <Progress
        value={percentage}
        className={heightClass}
      />
    </div>
  );
}
