import React from "react";
import { Lock, Zap, Play, CheckCircle2, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AMBIENT } from "@/lib/motion";
import { Button } from "./button";
import { Card } from "./card";

export type MissionState =
  | "locked"
  | "available"
  | "active"
  | "completed"
  | "mastered";

interface MissionNodeProps {
  state: MissionState;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  xpReward?: number;
  /** Persistent label naming the action on the active node (e.g. "أنشئ لعبتك"). */
  actionLabel?: string;
  /** Shown as the subtitle when locked so a locked tap is never a dead end. */
  lockedHint?: string;
  onSelect?: () => void;
  className?: string;
}

const stateConfig: Record<
  MissionState,
  {
    icon: React.ReactNode;
    label: string;
    action: string;
    textColor: string;
    cardClass: string;
    buttonVariant: "default" | "outline" | "secondary" | "ghost" | "destructive";
  }
> = {
  locked: {
    icon: <Lock className="w-5 h-5" />,
    label: "مقفلة",
    action: "",
    textColor: "text-muted-foreground",
    cardClass: "bg-mission-locked/40",
    buttonVariant: "outline",
  },
  available: {
    icon: <Zap className="w-5 h-5" />,
    label: "متاحة",
    action: "ابدأ",
    textColor: "text-mission-available",
    cardClass: "bg-card hover:shadow-elevated",
    buttonVariant: "default",
  },
  active: {
    icon: <Play className="w-5 h-5" />,
    label: "التالية",
    action: "ابدأ الآن",
    textColor: "text-mission-active",
    cardClass:
      "bg-mission-active/10 border-2 border-mission-active shadow-elevated",
    buttonVariant: "default",
  },
  completed: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: "مكتملة",
    action: "مراجعة",
    textColor: "text-mission-completed",
    cardClass: "bg-mission-completed/10 hover:shadow-elevated",
    buttonVariant: "secondary",
  },
  mastered: {
    icon: <Star className="w-5 h-5" />,
    label: "متقنة",
    action: "مراجعة",
    textColor: "text-mission-mastered",
    cardClass: "bg-mission-mastered/10 hover:shadow-elevated",
    buttonVariant: "secondary",
  },
};

export function MissionNode({
  state,
  title,
  description,
  icon,
  xpReward,
  actionLabel,
  lockedHint,
  onSelect,
  className,
}: MissionNodeProps) {
  const reduce = useReducedMotion();
  const config = stateConfig[state];
  const isActive = state === "active";
  const isLocked = state === "locked";
  // Exactly one element on the screen moves at rest: the active node. Reduced
  // motion holds it still.
  const breathing = isActive && !reduce;
  // A locked tap is never dead — the reason it's locked is shown as the subtitle.
  const subtitle = isLocked ? lockedHint ?? description : description;

  // Locked nodes carry no inner button, so the card itself becomes the keyboard
  // target that surfaces the explanation. Interactive states delegate keyboard
  // handling to the inner Button to avoid nested interactive roles.
  const lockedA11y = isLocked
    ? {
        role: "button" as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.();
          }
        },
      }
    : {};

  return (
    <motion.div
      animate={breathing ? AMBIENT.animate : undefined}
      transition={breathing ? AMBIENT.transition : undefined}
    >
      <Card
        {...lockedA11y}
        onClick={onSelect}
        className={cn(
          "cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "p-5" : "p-4",
          isLocked && "opacity-70",
          config.cardClass,
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 flex-shrink-0", config.textColor)}>
            {icon || config.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={cn(
                  "font-bold text-foreground truncate",
                  isActive ? "text-lg" : "text-base"
                )}
              >
                {title}
              </h3>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  config.textColor
                )}
              >
                {config.label}
              </span>
            </div>

            {subtitle && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {subtitle}
              </p>
            )}

            <div className="flex items-center justify-between gap-2">
              {xpReward ? (
                <span className="text-xs font-semibold text-mission-available">
                  <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
                    +{xpReward}
                  </span>{" "}
                  نقطة
                </span>
              ) : (
                <span />
              )}

              {!isLocked && (
                <Button
                  size="sm"
                  variant={config.buttonVariant}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.();
                  }}
                >
                  {actionLabel ?? config.action}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
