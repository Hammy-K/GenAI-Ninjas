import { useState, useEffect } from 'react';
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

export function useVideoFlowAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [facilitator, setFacilitator] = useState<Facilitator | null>(null);
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;
  const hasFacilitator = !!facilitator;

  // Get facilitators data when authenticated
  const { data: facilitatorsData } = useQuery({
    queryKey: ['video-flow', 'facilitators'],
    queryFn: videoFlowApi.getFacilitators,
    enabled: isAuthenticated,
    retry: false,
  });

  // Google authentication mutation
  const authenticateGoogleMutation = useMutation({
    mutationFn: videoFlowApi.authenticateGoogle,
    onSuccess: (data: AuthResponse) => {
      if (data.success && data.user) {
        setUser(data.user);
        // Invalidate facilitators query to fetch fresh data
        queryClient.invalidateQueries({ queryKey: ['video-flow', 'facilitators'] });
      }
    },
  });

  // Facilitator confirmation mutation
  const confirmFacilitatorMutation = useMutation({
    mutationFn: videoFlowApi.confirmFacilitator,
    onSuccess: (data, variables) => {
      if (data.success) {
        setFacilitator({ name: variables.facilitatorName });
      }
    },
  });

  return {
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

    // Errors
    authError: authenticateGoogleMutation.error,
    facilitatorError: confirmFacilitatorMutation.error,
  };
}