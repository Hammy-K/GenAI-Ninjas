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
  // Initialize user from localStorage with safety checks
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('videoflow_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
      return null;
    }
  });

  // Initialize facilitator from localStorage with safety checks
  const [facilitator, setFacilitator] = useState<Facilitator | null>(() => {
    try {
      const savedFacilitator = localStorage.getItem('videoflow_facilitator');
      return savedFacilitator ? JSON.parse(savedFacilitator) : null;
    } catch (error) {
      console.error('Failed to load facilitator from localStorage:', error);
      return null;
    }
  });
  const [completedVideos, setCompletedVideos] = useState<
    Map<number, GenerateVideoResponse>
  >(new Map());
  const queryClient = useQueryClient();

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

  // Persist user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('videoflow_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('videoflow_user');
      }
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }
  }, [user]);

  // Persist facilitator state to localStorage
  useEffect(() => {
    try {
      if (facilitator) {
        localStorage.setItem('videoflow_facilitator', JSON.stringify(facilitator));
      } else {
        localStorage.removeItem('videoflow_facilitator');
      }
    } catch (error) {
      console.error('Failed to save facilitator to localStorage:', error);
    }
  }, [facilitator]);

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
        // Invalidate facilitators query to fetch fresh data
        queryClient.invalidateQueries({
          queryKey: ["video-flow", "facilitators"],
        });
      }
    },
    onError: (error) => {
      console.error("Google authentication failed:", error);
      setUser(null);
      // Clear facilitator on auth failure
      setFacilitator(null);
    },
  });

  // FIXED: Facilitator confirmation mutation
  const confirmFacilitatorMutation = useMutation({
    mutationFn: videoFlowApi.confirmFacilitator,
    retry: 2, // Retry up to 2 times
    onSuccess: (data, variables) => {
      if (data.success) {
        // FIXED: Update facilitator state immediately
        setFacilitator({ name: variables.facilitatorName });

        // Invalidate facilitators query to update server state
        queryClient.invalidateQueries({
          queryKey: ["video-flow", "facilitators"],
        });

        console.log(
          "Facilitator confirmed successfully:",
          variables.facilitatorName,
        );
      }
    },
    onError: (error) => {
      console.error("Facilitator confirmation failed:", error);
      // FIXED: Don't reset facilitator state on error - keep the selection
      // This prevents the UI from resetting when there's a temporary network issue
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
