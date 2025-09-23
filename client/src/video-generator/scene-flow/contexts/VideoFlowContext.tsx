import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videoFlowApi } from "../api/video-flow.api";
import type {
  AuthResponse,
  FacilitatorsResponse,
  GenerateVideoResponse,
} from "@shared/video-flow.schema";

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

  // Video Management
  completedVideos: Map<number, GenerateVideoResponse>;
  saveCompletedVideo: (
    sceneNumber: number,
    videoResult: GenerateVideoResponse,
  ) => void;
  getCompletedVideo: (sceneNumber: number) => GenerateVideoResponse | null;
  clearAllVideos: () => void;

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

const VideoFlowContext = createContext<VideoFlowContextType | undefined>(
  undefined,
);

interface VideoFlowProviderProps {
  children: ReactNode;
}

export function VideoFlowProvider({ children }: VideoFlowProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [facilitator, setFacilitator] = useState<Facilitator | null>(null);
  const [completedVideos, setCompletedVideos] = useState<
    Map<number, GenerateVideoResponse>
  >(new Map());
  const queryClient = useQueryClient();

  // Load persisted state on mount
  useEffect(() => {
    // Load user from localStorage
    try {
      const savedUser = localStorage.getItem('video_flow_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        console.log('Restored user from localStorage:', parsedUser.email);
      }
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
    }

    // Load facilitator from localStorage
    try {
      const savedFacilitator = localStorage.getItem('video_flow_facilitator');
      if (savedFacilitator) {
        const parsedFacilitator = JSON.parse(savedFacilitator) as Facilitator;
        setFacilitator(parsedFacilitator);
        console.log('Restored facilitator from localStorage:', parsedFacilitator.name);
      }
    } catch (error) {
      console.error('Failed to load facilitator from localStorage:', error);
    }
  }, []);

  const isAuthenticated = !!user;
  const hasFacilitator = !!facilitator;

  // Video management functions
  const saveCompletedVideo = (
    sceneNumber: number,
    videoResult: GenerateVideoResponse,
  ) => {
    setCompletedVideos((prev) => new Map(prev.set(sceneNumber, videoResult)));

    // Persist to localStorage
    try {
      localStorage.setItem(
        `video_scene_${sceneNumber}`,
        JSON.stringify(videoResult),
      );
      console.log(`Video ${sceneNumber} saved to localStorage`);
    } catch (error) {
      console.error("Failed to save video to localStorage:", error);
    }
  };

  const getCompletedVideo = (
    sceneNumber: number,
  ): GenerateVideoResponse | null => {
    // First check in-memory state
    const inMemoryVideo = completedVideos.get(sceneNumber);
    if (inMemoryVideo) {
      return inMemoryVideo;
    }

    // Fallback to localStorage
    try {
      const savedVideo = localStorage.getItem(`video_scene_${sceneNumber}`);
      if (savedVideo) {
        const parsedVideo = JSON.parse(savedVideo) as GenerateVideoResponse;
        // Also restore to in-memory state
        setCompletedVideos(
          (prev) => new Map(prev.set(sceneNumber, parsedVideo)),
        );
        return parsedVideo;
      }
    } catch (error) {
      console.error(
        `Failed to load video ${sceneNumber} from localStorage:`,
        error,
      );
    }

    return null;
  };

  const clearAllVideos = () => {
    setCompletedVideos(new Map());

    // Clear from localStorage
    try {
      [1, 2, 3].forEach((sceneNumber) => {
        localStorage.removeItem(`video_scene_${sceneNumber}`);
      });
      console.log("All videos cleared from localStorage");
    } catch (error) {
      console.error("Failed to clear videos from localStorage:", error);
    }
  };

  // Load saved videos on mount
  useEffect(() => {
    const loadSavedVideos = () => {
      const savedVideosMap = new Map<number, GenerateVideoResponse>();

      [1, 2, 3].forEach((sceneNumber) => {
        try {
          const savedVideo = localStorage.getItem(`video_scene_${sceneNumber}`);
          if (savedVideo) {
            const parsedVideo = JSON.parse(savedVideo) as GenerateVideoResponse;
            savedVideosMap.set(sceneNumber, parsedVideo);
          }
        } catch (error) {
          console.error(
            `Failed to load video ${sceneNumber} from localStorage:`,
            error,
          );
        }
      });

      if (savedVideosMap.size > 0) {
        setCompletedVideos(savedVideosMap);
        console.log(`Loaded ${savedVideosMap.size} videos from localStorage`);
      }
    };

    loadSavedVideos();
  }, []);

  // Get facilitators data - only fetch when authenticated
  const {
    data: facilitatorsData,
    isLoading: isFacilitatorsLoading,
    error: facilitatorsError,
  } = useQuery({
    queryKey: ["video-flow", "facilitators"],
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
          uid: "session-user", // Placeholder UID
          email: facilitatorsData.userEmail,
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
        
        // Persist user to localStorage
        try {
          localStorage.setItem('video_flow_user', JSON.stringify(data.user));
          console.log('User persisted to localStorage:', data.user.email);
        } catch (error) {
          console.error('Failed to persist user to localStorage:', error);
        }
        
        // Invalidate facilitators query to fetch fresh data
        queryClient.invalidateQueries({
          queryKey: ["video-flow", "facilitators"],
        });
      }
    },
    onError: (error) => {
      console.error("Google authentication failed:", error);
      setUser(null);
      // Clear user from localStorage on auth failure
      try {
        localStorage.removeItem('video_flow_user');
      } catch (error) {
        console.error('Failed to clear user from localStorage:', error);
      }
    },
  });

  // Facilitator confirmation mutation
  const confirmFacilitatorMutation = useMutation({
    mutationFn: videoFlowApi.confirmFacilitator,
    retry: 2, // Retry up to 2 times
    onSuccess: (data, variables) => {
      if (data.success) {
        const newFacilitator = { name: variables.facilitatorName };
        setFacilitator(newFacilitator);
        
        // Persist facilitator to localStorage
        try {
          localStorage.setItem('video_flow_facilitator', JSON.stringify(newFacilitator));
          console.log('Facilitator persisted to localStorage:', variables.facilitatorName);
        } catch (error) {
          console.error('Failed to persist facilitator to localStorage:', error);
        }
        
        // Invalidate facilitators query to update server state
        queryClient.invalidateQueries({
          queryKey: ["video-flow", "facilitators"],
        });
      }
    },
    onError: (error) => {
      console.error("Facilitator confirmation failed:", error);
      setFacilitator(null);
      // Clear facilitator from localStorage on confirmation failure
      try {
        localStorage.removeItem('video_flow_facilitator');
      } catch (error) {
        console.error('Failed to clear facilitator from localStorage:', error);
      }
    },
  });

  const value: VideoFlowContextType = {
    // State
    user,
    facilitator,
    isAuthenticated,
    hasFacilitator,
    facilitatorsData,

    // Video Management
    completedVideos,
    saveCompletedVideo,
    getCompletedVideo,
    clearAllVideos,

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
    throw new Error(
      "useVideoFlowContext must be used within a VideoFlowProvider",
    );
  }
  return context;
}
