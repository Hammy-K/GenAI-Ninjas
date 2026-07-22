import React, { useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Gamepad2,
  AppWindow,
  Video,
  Rocket,
} from "lucide-react";
import { MissionNode, type MissionState } from "@/components/ui/mission-node";
import { useQuest } from "@/hooks/useQuest";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * JourneySpine — the dashboard's single scrollable path (GAMIFIED_UX §2).
 *
 * The journey is a spine, not a grid: one column of nodes in learning order with
 * exactly one active node (the obvious "what do I do next"). The only gate is the
 * intro mission — a real, satisfiable unlock, not a permanent lock. Completed nodes
 * stay visible so scrolling past finished work renders the macro loop.
 */

interface JourneyItem {
  id: string;
  /** Set when completion is tracked in quest state; drives completed/active logic. */
  missionId?: number;
  title: string;
  description: string;
  /** Destination route (org prefix applied at navigation time). */
  path: string;
  /** Persistent action label shown on the active node. */
  actionLabel: string;
  icon: React.ReactNode;
  /** Only shown for the main organization. */
  mainOnly?: boolean;
}

const JOURNEY: JourneyItem[] = [
  {
    id: "intro",
    missionId: 1,
    title: "المهمة التعريفية",
    description: "تعرف على الذكاء الاصطناعي التوليدي",
    path: "/intro-mission",
    actionLabel: "ابدأ الآن",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "game",
    missionId: 2,
    title: "توليد لعبتك الأولى",
    description: "اصنع لعبة تفاعلية بالذكاء الاصطناعي، بدون برمجة",
    path: "/missions/ai-html-generator",
    actionLabel: "أنشئ لعبتك",
    icon: <Gamepad2 className="w-5 h-5" />,
  },
  {
    id: "app",
    title: "ابنِ تطبيقك",
    description: "حوّل فكرتك إلى تطبيق حقيقي",
    path: "/missions/lovable",
    actionLabel: "ابدأ البناء",
    icon: <AppWindow className="w-5 h-5" />,
  },
  {
    id: "video",
    title: "توليد الفيديو",
    description: "اصنع مقاطع فيديو بالذكاء الاصطناعي",
    path: "/missions/videos",
    actionLabel: "ابدأ",
    icon: <Video className="w-5 h-5" />,
  },
  {
    id: "appdev",
    title: "تطوير التطبيقات",
    description: "تعمّق في بناء التطبيقات خطوة بخطوة",
    path: "/missions/app-development",
    actionLabel: "ابدأ",
    icon: <Rocket className="w-5 h-5" />,
    mainOnly: true,
  },
];

const LOCK_HINT = "أكمل المهمة التعريفية أولاً لفتح بقية الرحلة.";

export function JourneySpine() {
  const [, navigate] = useLocation();
  const organization = useOrganization();
  const { isMissionCompleted } = useQuest();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const activeRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () => JOURNEY.filter((it) => !it.mainOnly || organization.isMain),
    [organization.isMain]
  );

  const introDone = isMissionCompleted(1);

  // Exactly one active node: the first mission the learner hasn't finished yet.
  const activeId = useMemo(() => {
    const firstOpen = items.find(
      (it) => !(it.missionId && isMissionCompleted(it.missionId))
    );
    return firstOpen?.id ?? null;
    // introDone is derived from the same source, listed so the memo tracks completion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, introDone]);

  const stateFor = (item: JourneyItem): MissionState => {
    if (item.missionId && isMissionCompleted(item.missionId)) return "completed";
    if (item.id === activeId) return "active";
    // Everything past the intro is gated behind it — a real, satisfiable unlock.
    if (item.id !== "intro" && !introDone) return "locked";
    return "available";
  };

  // A returning learner lands on their place, not the top. Reduced motion jumps
  // instead of sliding.
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (item: JourneyItem, state: MissionState) => {
    if (state === "locked") {
      toast({ title: "مقفلة 🔒", description: LOCK_HINT });
      return;
    }
    const dest = organization.isMain
      ? item.path
      : `/${organization.name}${item.path}`;
    navigate(dest);
  };

  return (
    <div className="flex flex-col" dir="rtl">
      {items.map((item, i) => {
        const state = stateFor(item);
        const prev = items[i - 1];
        const prevDone = Boolean(
          prev?.missionId && isMissionCompleted(prev.missionId)
        );

        return (
          <React.Fragment key={item.id}>
            {i > 0 && (
              <div className="flex justify-center" aria-hidden>
                <div
                  className={cn(
                    "w-1 h-6 rounded-full",
                    prevDone ? "bg-mission-completed" : "bg-border"
                  )}
                />
              </div>
            )}
            <div ref={state === "active" ? activeRef : undefined}>
              <MissionNode
                state={state}
                title={item.title}
                description={item.description}
                icon={item.icon}
                actionLabel={state === "active" ? item.actionLabel : undefined}
                lockedHint={LOCK_HINT}
                onSelect={() => handleSelect(item, state)}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default JourneySpine;
