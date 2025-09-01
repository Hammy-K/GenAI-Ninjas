import type { ComponentType } from "react";

export type Concept = {
  Icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  examples: string[];
  color: string;
  isCompleted: boolean;
  url: string;
  systemPrompt: string;
};

export type MissionSlug =
  | "inputs-outputs"
  | "buttons-events"
  | "random-selection"
  | "conditional-logic"
  | "layout-design"
  | "dynamic-images";

export type MAIN_MISSION =
  | "discovery"
  | "frontend-foundation"
  | "dynamic-interaction-media"
  | "backend-ai-integration"
  | "masterpiece-creation";

export type MissionTutorial = {
  videoId: string;
  name?: string;
  description?: string;
};

export type MissionTutorials = Record<MissionSlug, MissionTutorial>;


