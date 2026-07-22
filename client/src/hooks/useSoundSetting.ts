import { useEffect, useState } from "react";

/**
 * Persisted sound preference (§5: "Sound is opt-out and its setting is respected
 * everywhere without exception"). Sound is ON by default; the choice survives
 * reload in localStorage and is shared across tabs.
 *
 * celebrate() reads the same key directly (it is a plain function, not a hook) via
 * isSoundEnabled(); UI uses this hook so a toggle re-renders live.
 */

export const SOUND_SETTING_KEY = "genAIQuest_soundEnabled";

/** Read the persisted setting outside React (used by lib/celebrate.ts). */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SOUND_SETTING_KEY) !== "false";
  } catch {
    return true;
  }
}

function writeSetting(value: boolean): void {
  try {
    localStorage.setItem(SOUND_SETTING_KEY, String(value));
    // Let listeners in the same tab react (storage event only fires cross-tab).
    window.dispatchEvent(new CustomEvent("sound-setting-changed", { detail: value }));
  } catch {
    // Storage unavailable — setting stays in-memory for this session.
  }
}

export function useSoundSetting() {
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled);

  useEffect(() => {
    const sync = () => setSoundEnabled(isSoundEnabled());
    window.addEventListener("sound-setting-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sound-setting-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setSound = (value: boolean) => {
    writeSetting(value);
    setSoundEnabled(value);
  };

  return {
    soundEnabled,
    toggleSound: () => setSound(!soundEnabled),
    setSound,
  };
}
