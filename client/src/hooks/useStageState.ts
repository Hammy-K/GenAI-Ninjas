import { useState, useEffect } from 'react';

/**
 * Custom hook to manage and persist stage state across navigation
 * @param stageKey A unique key for the stage (e.g., 'discovery', 'tryai')
 * @param initialState The initial state to use if no saved state exists
 * @returns [state, setState] tuple similar to useState
 */
export function useStageState<T>(stageKey: string, initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Create a unique localStorage key for this stage
  const storageKey = `genAIQuest_${stageKey}State`;
  
  // Initialize state from localStorage or use the provided initial state
  const [state, setState] = useState<T>(() => {
    try {
      const savedState = localStorage.getItem(storageKey);
      return savedState ? JSON.parse(savedState) : initialState;
    } catch (error) {
      console.error(`Error loading state for stage ${stageKey}:`, error);
      return initialState;
    }
  });
  
  // Save state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving state for stage ${stageKey}:`, error);
    }
  }, [state, storageKey]);
  
  return [state, setState];
}