import { useState, useEffect } from 'react';

export interface QuestState {
  currentStage: number;
  xp: number;
  unlockedBadges: string[];
  awardedXp: Record<string, boolean>; // Track which XP awards have been given
  awardedBadges: Record<string, boolean>; // Track which badges have been awarded
}

const TOTAL_STAGES = 6;
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
          awardedXp: {}
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
      
      // Automatically unlock explorer badge once after completing stage 2
      if (state.currentStage === 2) {
        unlockBadge('explorer_badge', 'stage_completion'); // Source tracks why badge was given
      }
    }
  };
  
  // Go back to the previous stage
  const goToPreviousStage = () => {
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
  
  // Unlock a badge
  const unlockBadge = (badgeName: string) => {
    if (!state.unlockedBadges.includes(badgeName)) {
      setState(prev => ({
        ...prev,
        unlockedBadges: [...prev.unlockedBadges, badgeName]
      }));
    }
  };
  
  // Reset the quest
  const resetQuest = () => {
    setState({
      currentStage: 1,
      xp: 0,
      unlockedBadges: [],
      awardedXp: {}
    });
  };
  
  return {
    ...state,
    totalStages: TOTAL_STAGES,
    goToNextStage,
    goToPreviousStage,
    setStage,
    earnXp,
    unlockBadge,
    resetQuest
  };
}
