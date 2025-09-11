import type { LovableProgressFlags } from "../types/lovable.types";

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function buildLovableFallbackUrl(): string {
  return "https://lovable.dev";
}

export type ChipState = "idle" | "active" | "pulse";

export function mapProgressToChips(p: LovableProgressFlags): {
  welcome: ChipState;
  ideation: ChipState;
  ready: ChipState;
  building: ChipState;
} {
  return {
    welcome: p.welcomeDone ? "active" : "idle",
    ideation: p.ideationOngoing ? "active" : p.welcomeDone ? "idle" : "idle",
    ready: p.readyDone ? "active" : "idle",
    building: p.buildingOngoing ? "active" : "idle",
  };
}
