import React from "react";
import { Lock, Zap, Play, CheckCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card } from "./card";

export type MissionState = "locked" | "available" | "active" | "completed" | "mastered";

interface MissionNodeProps {
  state: MissionState;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  xpReward?: number;
  onSelect?: () => void;
  className?: string;
}

const stateConfig: Record<MissionState, { icon: React.ReactNode; label: string; bgColor: string; textColor: string; buttonVariant: "default" | "outline" | "secondary" | "ghost" | "destructive" }> = {
  locked: {
    icon: <Lock className="w-5 h-5" />,
    label: "Locked",
    bgColor: "bg-mission-locked",
    textColor: "text-muted",
    buttonVariant: "outline",
  },
  available: {
    icon: <Zap className="w-5 h-5" />,
    label: "Available",
    bgColor: "bg-mission-available/10",
    textColor: "text-mission-available",
    buttonVariant: "default",
  },
  active: {
    icon: <Play className="w-5 h-5" />,
    label: "In Progress",
    bgColor: "bg-mission-active/10",
    textColor: "text-mission-active",
    buttonVariant: "default",
  },
  completed: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: "Completed",
    bgColor: "bg-mission-completed/10",
    textColor: "text-mission-completed",
    buttonVariant: "secondary",
  },
  mastered: {
    icon: <Star className="w-5 h-5" />,
    label: "Mastered",
    bgColor: "bg-mission-mastered/10",
    textColor: "text-mission-mastered",
    buttonVariant: "secondary",
  },
};

export function MissionNode({
  state,
  title,
  description,
  icon,
  xpReward,
  onSelect,
  className,
}: MissionNodeProps) {
  const config = stateConfig[state];
  const isInteractive = state !== "locked";

  return (
    <Card
      className={cn(
        "p-4 transition-all",
        config.bgColor,
        isInteractive ? "cursor-pointer hover:shadow-elevated" : "opacity-60",
        className
      )}
      onClick={isInteractive ? onSelect : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-1 flex-shrink-0", config.textColor)}>
          {icon || config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            <span className={cn("text-xs font-medium", config.textColor)}>
              {config.label}
            </span>
          </div>

          {description && (
            <p className="text-sm text-muted mb-3 line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            {xpReward && (
              <span className="text-xs font-semibold text-mission-available">
                +{xpReward} XP
              </span>
            )}

            {isInteractive && (
              <Button
                size="sm"
                variant={config.buttonVariant}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.();
                }}
              >
                {state === "completed" || state === "mastered"
                  ? "Review"
                  : "Start"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
