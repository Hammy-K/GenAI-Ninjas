import { useRef } from 'react';

/**
 * A custom hook that tracks which XP awards and badges have been given to prevent
 * duplicate awards across component re-renders, navigation, AND reloads.
 *
 * Dedupe keys are persisted to localStorage, namespaced by a stable per-device id
 * (the same `device_id` used across the app). A previous version kept the dedupe
 * sets only in `useRef`, so the memory died on unmount — every remount re-opened
 * the door to re-awarding one-time milestone XP. Persisting the keys means an award
 * granted once stays granted. All keys are wiped by the app's reset flow, which
 * calls `localStorage.clear()`.
 */

const STORAGE_PREFIX = 'genAIQuest_xpTracker';

/** Stable per-device id, shared with useUserIdentity's `device_id`. */
function getDeviceKey(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = `device_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
      localStorage.setItem('device_id', id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

function loadSet(storageKey: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

function persistSet(storageKey: string, set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
  } catch {
    // Storage unavailable or full — dedupe degrades to in-memory for this session.
  }
}

export function useXpTracker() {
  // Resolve storage keys once per mount (device id is stable for the browser).
  const keysRef = useRef<{ xp: string; badges: string } | null>(null);
  if (!keysRef.current) {
    const device = getDeviceKey();
    keysRef.current = {
      xp: `${STORAGE_PREFIX}_xp_${device}`,
      badges: `${STORAGE_PREFIX}_badges_${device}`,
    };
  }
  const storageKeys = keysRef.current;

  // Hydrate the dedupe sets from persisted storage so awards survive navigation
  // and reload — not just re-renders.
  const awardedXpRef = useRef<Set<string> | null>(null);
  if (!awardedXpRef.current) awardedXpRef.current = loadSet(storageKeys.xp);

  const awardedBadgesRef = useRef<Set<string> | null>(null);
  if (!awardedBadgesRef.current) awardedBadgesRef.current = loadSet(storageKeys.badges);

  const awardedXp = awardedXpRef.current;
  const awardedBadges = awardedBadgesRef.current;

  /**
   * Track if a specific XP award has already been given
   * @param source The source/reason for the XP award (e.g., 'discovery_complete')
   * @param amount The amount of XP awarded
   * @returns True if this XP has already been awarded, false otherwise
   */
  const hasAwardedXp = (source: string, amount: number): boolean => {
    const awardKey = `${source}_${amount}`;
    return awardedXp.has(awardKey);
  };

  /**
   * Mark a specific XP award as given
   * @param source The source/reason for the XP award
   * @param amount The amount of XP awarded
   */
  const markXpAwarded = (source: string, amount: number): void => {
    const awardKey = `${source}_${amount}`;
    awardedXp.add(awardKey);
    persistSet(storageKeys.xp, awardedXp);
  };

  /**
   * Award XP only if it hasn't been awarded from this source yet
   * @param earnXpFunction The function to call to actually award the XP
   * @param amount The amount of XP to award
   * @param source The source/reason for the XP award
   * @returns True if XP was newly awarded, false if it was already awarded
   */
  const awardXpOnce = (
    earnXpFunction: (amount: number) => void,
    amount: number,
    source: string
  ): boolean => {
    if (!hasAwardedXp(source, amount)) {
      earnXpFunction(amount);
      markXpAwarded(source, amount);
      return true;
    }
    return false;
  };

  /**
   * Check if a badge has already been awarded from a specific source
   * @param source The source of the badge award
   * @param badgeName The name of the badge
   * @returns True if already awarded, false otherwise
   */
  const isAlreadyAwarded = (source: string, badgeName: string): boolean => {
    const badgeKey = `${badgeName}_${source}`;
    return awardedBadges.has(badgeKey);
  };

  /**
   * Mark a badge as awarded from a specific source
   * @param source The source of the badge award
   * @param badgeName The name of the badge
   */
  const markAsAwarded = (source: string, badgeName: string): void => {
    const badgeKey = `${badgeName}_${source}`;
    awardedBadges.add(badgeKey);
    persistSet(storageKeys.badges, awardedBadges);
  };

  /**
   * Award XP if not already awarded
   * @param earnXpFunction The function to call to award XP
   * @param amount The amount of XP to award
   * @param source The source/reason for the award
   * @returns True if XP was newly awarded, false otherwise
   */
  const awardIfNotAlreadyAwarded = (
    earnXpFunction: (amount: number, source?: string) => void,
    amount: number,
    source: string
  ): boolean => {
    if (!hasAwardedXp(source, amount)) {
      earnXpFunction(amount, source);
      markXpAwarded(source, amount);
      return true;
    }
    return false;
  };

  return {
    hasAwardedXp,
    markXpAwarded,
    awardXpOnce,
    isAlreadyAwarded,
    markAsAwarded,
    awardIfNotAlreadyAwarded
  };
}
