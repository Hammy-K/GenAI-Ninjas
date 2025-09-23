import type {
  GoogleAuthRequest,
  AuthResponse,
  FacilitatorsResponse,
  FacilitatorConfirmRequest,
  UsageResponse,
  GenerateVideoRequest,
  GenerateVideoResponse,
} from "@shared/video-flow.schema";

/**
 * API client for video flow endpoints
 */

const VIDEO_FLOW_BASE = "/api/video-flow";

// Module-level re-authentication function that can be set by the context
let reAuthenticateCallback: (() => Promise<boolean>) | null = null;

export function setReAuthenticateCallback(callback: (() => Promise<boolean>) | null) {
  reAuthenticateCallback = callback;
}

// Custom error class that preserves HTTP status codes
class APIError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// Custom fetch wrapper for video flow API to handle GET/POST properly with 401 retry
async function makeVideoFlowRequest<T>(
  method: string,
  endpoint: string,
  data?: unknown,
  retryCount: number = 0,
): Promise<T> {
  const requestInit: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Only add body for non-GET requests
  if (method !== "GET" && data) {
    requestInit.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${VIDEO_FLOW_BASE}${endpoint}`, requestInit);

    if (!response.ok) {
      // Handle 401 Unauthorized with automatic re-authentication retry
      // Exempt "/auth/google" endpoint to prevent recursive auth calls
      if (response.status === 401 && retryCount === 0 && reAuthenticateCallback && endpoint !== "/auth/google") {
        console.log(`401 error on ${method} ${endpoint}, attempting re-authentication...`);
        const reAuthSuccess = await reAuthenticateCallback();
        
        if (reAuthSuccess) {
          console.log('Re-authentication successful, retrying request...');
          return makeVideoFlowRequest<T>(method, endpoint, data, retryCount + 1);
        } else {
          console.log('Re-authentication failed, not retrying');
        }
      }
      
      const errorText = await response.text();
      throw new APIError(response.status, errorText || response.statusText);
    }

    return response.json();
  } catch (error) {
    // Re-throw APIError as-is, wrap other errors
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const videoFlowApi = {
  /**
   * Authenticate with Google Firebase ID token
   */
  async authenticateGoogle(request: GoogleAuthRequest): Promise<AuthResponse> {
    return makeVideoFlowRequest<AuthResponse>("POST", "/auth/google", request);
  },

  /**
   * Get available facilitators and matched facilitator for current user
   */
  async getFacilitators(): Promise<FacilitatorsResponse> {
    return makeVideoFlowRequest<FacilitatorsResponse>("GET", "/facilitators");
  },

  /**
   * Confirm facilitator selection
   */
  async confirmFacilitator(
    request: FacilitatorConfirmRequest,
  ): Promise<{ success: boolean }> {
    return makeVideoFlowRequest<{ success: boolean }>(
      "POST",
      "/facilitator/confirm",
      request,
    );
  },

  /**
   * Get current usage statistics
   */
  async getUsage(): Promise<UsageResponse> {
    return makeVideoFlowRequest<UsageResponse>("GET", "/usage");
  },

  /**
   * Generate a video scene
   */
  async generateVideo(
    request: GenerateVideoRequest,
  ): Promise<GenerateVideoResponse> {
    return makeVideoFlowRequest<GenerateVideoResponse>(
      "POST",
      "/generate",
      request,
    );
  },

  /**
   * Check video generation job status
   */
  async checkStatus(jobId: string): Promise<GenerateVideoResponse> {
    return makeVideoFlowRequest<GenerateVideoResponse>(
      "GET",
      `/status/${encodeURIComponent(jobId)}`,
    );
  },
};
