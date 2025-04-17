import { useState, useEffect } from 'react';

export interface QuestState {
  currentStage: number;
  xp: number;
  unlockedBadges: string[];
  awardedXp: Record<string, boolean>; // Track which XP awards have been given
  awardedBadges: Record<string, boolean>; // Track which badges have been awarded
  completedMissions: number[]; // Track which missions have been completed
}

const TOTAL_STAGES = 7; // Updated with the new image generation stage
const STORAGE_KEY = 'genAIQuestState';

export function useQuest() {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<QuestState>(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    return savedState 
      ? JSON.parse(savedState) 
      : { 
          currentStage: 1, 
          xp: 0, 
          unlockedBadges: [],
          awardedXp: {},
          awardedBadges: {},
          completedMissions: []
        };
  });
  
  // Save state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);
  
  // Advance to the next stage
  const goToNextStage = () => {
    if (state.currentStage < TOTAL_STAGES) {
      setState(prev => ({
        ...prev,
        currentStage: prev.currentStage + 1
      }));
      // No automatic badge awarding here anymore
    }
  };
  
  // Go back to the previous stage
  const goToPrevStage = () => {
    if (state.currentStage > 1) {
      setState(prev => ({
        ...prev,
        currentStage: prev.currentStage - 1
      }));
    }
  };
  
  // Set a specific stage
  const setStage = (stage: number) => {
    if (stage >= 1 && stage <= TOTAL_STAGES) {
      setState(prev => ({
        ...prev,
        currentStage: stage
      }));
    }
  };
  
  // Add XP points with source tracking to prevent duplicates
  const earnXp = (amount: number, source: string = 'generic') => {
    const awardKey = `${source}_${amount}`;
    
    setState(prev => {
      // Skip if this exact award was already given
      if (prev.awardedXp && prev.awardedXp[awardKey]) {
        console.log(`Skipping duplicate XP award: ${amount} from ${source}`);
        return prev; // Return unchanged state
      }
      
      console.log(`Awarding ${amount} XP from ${source}`);
      
      // Otherwise award the XP and mark it as awarded
      return {
        ...prev,
        xp: prev.xp + amount,
        awardedXp: {
          ...prev.awardedXp,
          [awardKey]: true
        }
      };
    });
  };
  
  // Unlock a badge with source tracking to prevent duplicates
  const unlockBadge = (badgeName: string, source: string = 'generic') => {
    const badgeKey = `${badgeName}_${source}`;
    
    setState(prev => {
      // Skip if this exact badge award was already given from this source
      if (prev.awardedBadges && prev.awardedBadges[badgeKey]) {
        console.log(`Skipping duplicate badge unlock: ${badgeName} from ${source}`);
        return prev; // Return unchanged state
      }
      
      // Skip if badge is already unlocked (different source)
      if (prev.unlockedBadges.includes(badgeName)) {
        console.log(`Badge ${badgeName} already unlocked from a different source`);
        
        // Still mark this award source as given to prevent future duplicates
        return {
          ...prev,
          awardedBadges: {
            ...prev.awardedBadges,
            [badgeKey]: true
          }
        };
      }
      
      console.log(`Unlocking badge: ${badgeName} from ${source}`);
      
      // Otherwise award the badge and mark it as awarded
      return {
        ...prev,
        unlockedBadges: [...prev.unlockedBadges, badgeName],
        awardedBadges: {
          ...prev.awardedBadges,
          [badgeKey]: true
        }
      };
    });
  };
  
  // Complete a mission
  const completeMission = (missionId: number) => {
    console.log(`Attempting to complete mission: ${missionId}`);
    console.log(`Current state:`, state);
    
    setState(prev => {
      // Initialize completedMissions array if undefined
      const prevCompletedMissions = prev.completedMissions || [];
      
      // Skip if this mission is already completed
      if (prevCompletedMissions.includes(missionId)) {
        console.log(`Mission ${missionId} already completed`);
        return prev;
      }
      
      console.log(`Completing mission: ${missionId}`);
      const newState = {
        ...prev,
        completedMissions: [...prevCompletedMissions, missionId]
      };
      
      console.log("New state will be:", newState);
      return newState;
    });
    
    // Log the state after update (note: this will log the previous state due to React's async state updates)
    console.log("State after completeMission:", state);
  };
  
  // Check if a mission is completed
  const isMissionCompleted = (missionId: number) => {
    return state.completedMissions?.includes(missionId) || false;
  };
  
  // Reset the quest
  const resetQuest = (preserveProgress = true) => {
    if (preserveProgress) {
      // Only reset the stage to 1, preserving badges, XP, and completed missions
      setState(prev => ({
        ...prev,
        currentStage: 1
      }));
    } else {
      // Complete reset (for testing or admin purposes)
      setState({
        currentStage: 1,
        xp: 0,
        unlockedBadges: [],
        awardedXp: {},
        awardedBadges: {},
        completedMissions: []
      });
    }
  };
  
  return {
    ...state,
    totalStages: TOTAL_STAGES,
    goToNextStage,
    goToPrevStage,
    setStage,
    earnXp,
    unlockBadge,
    completeMission,
    isMissionCompleted,
    restart: resetQuest  // Alias for resetQuest to match the expected name in home.tsx
  };
}
