import { useState, useEffect } from 'react';

export interface QuestState {
  currentStage: number;
  xp: number;
  unlockedBadges: string[];
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
          unlockedBadges: [] 
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
      if (state.currentStage === 2 && !state.unlockedBadges.includes('explorer_badge')) {
        unlockBadge('explorer_badge');
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
  
  // Add XP points
  const earnXp = (amount: number) => {
    setState(prev => ({
      ...prev,
      xp: prev.xp + amount
    }));
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
      unlockedBadges: []
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
