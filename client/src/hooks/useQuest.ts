import { useState, useEffect } from 'react';

export interface QuestState {
  currentStage: number;
  xp: number;
  unlockedBadges: string[];
  awardedXp: Record<string, boolean>; // Track which XP awards have been given
  awardedBadges: Record<string, boolean>; // Track which badges have been awarded
  completedMissions: number[]; // Track which missions have been completed
  visitedStages: number[]; // Track which stages have been visited
  stageTimerExpired: Record<number, boolean>; // Track which stage timers have expired
}

const TOTAL_STAGES = 8; // Updated with the new gallery exploration stage
const STORAGE_KEY = 'genAIQuestState';

export function useQuest() {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<QuestState>(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    let parsedState = savedState ? JSON.parse(savedState) : null;
    
    // Clean up any fake badges if they exist in stored state
    if (parsedState && parsedState.unlockedBadges && parsedState.unlockedBadges.length > 0) {
      // Filter out non-legitimate badges (badges not earned through proper completion)
      const legitimateBadges = [
        'prompt_engineer_badge',  // Earned from prompt engineering task
        'image_artist_badge'      // Earned from sharing image to gallery
      ];
      
      // Keep only legitimate badges that should be in the list
      parsedState.unlockedBadges = parsedState.unlockedBadges.filter(
        (badge: string) => legitimateBadges.includes(badge)
      );
      
      // Save the cleaned state back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedState));
    }
    
    return parsedState || { 
      currentStage: 1, 
      xp: 0, 
      unlockedBadges: [],
      awardedXp: {},
      awardedBadges: {},
      completedMissions: [],
      visitedStages: [],
      stageTimerExpired: {}
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
    
    // Use a promise to ensure state updates are completed and reflected
    setState(prev => {
      // Initialize completedMissions array if undefined
      const prevCompletedMissions = prev.completedMissions || [];
      
      // Skip if this mission is already completed
      if (prevCompletedMissions.includes(missionId)) {
        console.log(`Mission ${missionId} already completed`);
        return prev;
      }
      
      console.log(`Completing mission: ${missionId}`);
      
      // Force a complete state update to make sure the update propagates
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...prev,
        completedMissions: [...prevCompletedMissions, missionId]
      }));
      
      return {
        ...prev,
        completedMissions: [...prevCompletedMissions, missionId]
      };
    });
    
    // Log the state after update (note: this will log the previous state due to React's async state updates)
    console.log("State after completeMission:", state);
  };
  
  // Check if a mission is completed
  const isMissionCompleted = (missionId: number) => {
    return state.completedMissions?.includes(missionId) || false;
  };
  
  // Mark a stage as visited
  const markStageVisited = (stageId: number) => {
    setState(prev => {
      // Skip if already visited
      if (prev.visitedStages?.includes(stageId)) {
        return prev;
      }
      
      return {
        ...prev,
        visitedStages: [...(prev.visitedStages || []), stageId]
      };
    });
  };
  
  // Check if a stage has been visited
  const isStageVisited = (stageId: number) => {
    return state.visitedStages?.includes(stageId) || false;
  };
  
  // Mark a stage timer as expired
  const markStageTimerExpired = (stageId: number) => {
    setState(prev => {
      return {
        ...prev,
        stageTimerExpired: {
          ...(prev.stageTimerExpired || {}),
          [stageId]: true
        }
      };
    });
  };
  
  // Check if a stage timer is expired
  const isStageTimerExpired = (stageId: number) => {
    return !!state.stageTimerExpired?.[stageId];
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
        completedMissions: [],
        visitedStages: [],
        stageTimerExpired: {}
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
    markStageVisited,
    isStageVisited,
    markStageTimerExpired,
    isStageTimerExpired,
    restart: resetQuest  // Alias for resetQuest to match the expected name in home.tsx
  };
}
