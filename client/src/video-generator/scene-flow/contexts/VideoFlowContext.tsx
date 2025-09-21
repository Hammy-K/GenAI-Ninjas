import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videoFlowApi } from '../api/video-flow.api';
import type { AuthResponse, FacilitatorsResponse } from '@shared/video-flow.schema';

interface User {
  uid: string;
  email: string;
}

interface Facilitator {
  name: string;
}

interface VideoFlowContextType {
  // State
  user: User | null;
  facilitator: Facilitator | null;
  isAuthenticated: boolean;
  hasFacilitator: boolean;
  facilitatorsData: FacilitatorsResponse | undefined;
  
  // Actions
  authenticateGoogle: (request: { idToken: string }) => void;
  confirmFacilitator: (request: { facilitatorName: string }) => void;
  
  // Loading states
  isAuthenticating: boolean;
  isConfirmingFacilitator: boolean;
  isFacilitatorsLoading: boolean;
  
  // Errors
  authError: Error | null;
  facilitatorError: Error | null;
  facilitatorsError: Error | null;
}

const VideoFlowContext = createContext<VideoFlowContextType | undefined>(undefined);

interface VideoFlowProviderProps {
  children: ReactNode;
}

export function VideoFlowProvider({ children }: VideoFlowProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [facilitator, setFacilitator] = useState<Facilitator | null>(null);
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;
  const hasFacilitator = !!facilitator;

  // Get facilitators data - only fetch when authenticated
  const { 
    data: facilitatorsData, 
    isLoading: isFacilitatorsLoading,
    error: facilitatorsError 
  } = useQuery({
    queryKey: ['video-flow', 'facilitators'],
    queryFn: videoFlowApi.getFacilitators,
    enabled: isAuthenticated, // Only run when user is authenticated
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) - user needs to sign in
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  });

  // Session hydration: Load user and facilitator from server data on mount
  useEffect(() => {
    if (facilitatorsData && !facilitatorsError) {
      // If we successfully got facilitators data, we must be authenticated
      // Extract user info from the response or set a placeholder
      if (!user && facilitatorsData.userEmail) {
        setUser({
          uid: 'session-user', // Placeholder UID
          email: facilitatorsData.userEmail
        });
      }

      // Auto-set facilitator if one is confirmed on the server
      if (!facilitator && facilitatorsData.confirmedFacilitatorName) {
        setFacilitator({ name: facilitatorsData.confirmedFacilitatorName });
      }
    }
  }, [facilitatorsData, facilitatorsError, user, facilitator]);

  // Google authentication mutation
  const authenticateGoogleMutation = useMutation({
    mutationFn: videoFlowApi.authenticateGoogle,
    retry: 2, // Retry up to 2 times
    onSuccess: (data: AuthResponse) => {
      if (data.success && data.user) {
        setUser(data.user);
        // Invalidate facilitators query to fetch fresh data
        queryClient.invalidateQueries({ queryKey: ['video-flow', 'facilitators'] });
      }
    },
    onError: (error) => {
      console.error('Google authentication failed:', error);
      setUser(null);
    },
  });

  // Facilitator confirmation mutation
  const confirmFacilitatorMutation = useMutation({
    mutationFn: videoFlowApi.confirmFacilitator,
    retry: 2, // Retry up to 2 times
    onSuccess: (data, variables) => {
      if (data.success) {
        setFacilitator({ name: variables.facilitatorName });
        // Invalidate facilitators query to update server state
        queryClient.invalidateQueries({ queryKey: ['video-flow', 'facilitators'] });
      }
    },
    onError: (error) => {
      console.error('Facilitator confirmation failed:', error);
      setFacilitator(null);
    },
  });

  const value: VideoFlowContextType = {
    // State
    user,
    facilitator,
    isAuthenticated,
    hasFacilitator,
    facilitatorsData,

    // Actions
    authenticateGoogle: authenticateGoogleMutation.mutate,
    confirmFacilitator: confirmFacilitatorMutation.mutate,

    // Loading states
    isAuthenticating: authenticateGoogleMutation.isPending,
    isConfirmingFacilitator: confirmFacilitatorMutation.isPending,
    isFacilitatorsLoading,

    // Errors
    authError: authenticateGoogleMutation.error,
    facilitatorError: confirmFacilitatorMutation.error,
    facilitatorsError,
  };

  return (
    <VideoFlowContext.Provider value={value}>
      {children}
    </VideoFlowContext.Provider>
  );
}

export function useVideoFlowContext() {
  const context = useContext(VideoFlowContext);
  if (context === undefined) {
    throw new Error('useVideoFlowContext must be used within a VideoFlowProvider');
  }
  return context;
}