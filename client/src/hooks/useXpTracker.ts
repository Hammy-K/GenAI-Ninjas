import { useRef } from 'react';

/**
 * A custom hook that tracks which XP awards and badges have been given to prevent duplicate awards
 * across component re-renders and navigation.
 */
export function useXpTracker() {
  // Use a ref to keep the same Set instance across re-renders
  const awardedXpRef = useRef<Set<string>>(new Set());
  const awardedBadgesRef = useRef<Set<string>>(new Set());
  
  /**
   * Track if a specific XP award has already been given
   * @param source The source/reason for the XP award (e.g., 'discovery_complete')
   * @param amount The amount of XP awarded
   * @returns True if this XP has already been awarded, false otherwise
   */
  const hasAwardedXp = (source: string, amount: number): boolean => {
    const awardKey = `${source}_${amount}`;
    return awardedXpRef.current.has(awardKey);
  };
  
  /**
   * Mark a specific XP award as given
   * @param source The source/reason for the XP award
   * @param amount The amount of XP awarded
   */
  const markXpAwarded = (source: string, amount: number): void => {
    const awardKey = `${source}_${amount}`;
    awardedXpRef.current.add(awardKey);
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
    return awardedBadgesRef.current.has(badgeKey);
  };

  /**
   * Mark a badge as awarded from a specific source
   * @param source The source of the badge award
   * @param badgeName The name of the badge
   */
  const markAsAwarded = (source: string, badgeName: string): void => {
    const badgeKey = `${badgeName}_${source}`;
    awardedBadgesRef.current.add(badgeKey);
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