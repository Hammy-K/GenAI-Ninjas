import type {
  GoogleAuthRequest,
  AuthResponse,
  FacilitatorsResponse,
  FacilitatorConfirmRequest,
  UsageResponse,
  GenerateVideoRequest,
  GenerateVideoResponse
} from '@shared/video-flow.schema';

/**
 * API client for video flow endpoints
 */

const VIDEO_FLOW_BASE = '/api/video-flow';

// Custom fetch wrapper for video flow API to handle GET/POST properly
async function makeVideoFlowRequest<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
  const requestInit: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Only add body for non-GET requests
  if (method !== 'GET' && data) {
    requestInit.body = JSON.stringify(data);
  }

  const response = await fetch(`${VIDEO_FLOW_BASE}${endpoint}`, requestInit);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText || response.statusText}`);
  }

  return response.json();
}

export const videoFlowApi = {
  /**
   * Authenticate with Google Firebase ID token
   */
  async authenticateGoogle(request: GoogleAuthRequest): Promise<AuthResponse> {
    return makeVideoFlowRequest<AuthResponse>('POST', '/auth/google', request);
  },

  /**
   * Get available facilitators and matched facilitator for current user
   */
  async getFacilitators(): Promise<FacilitatorsResponse> {
    return makeVideoFlowRequest<FacilitatorsResponse>('GET', '/facilitators');
  },

  /**
   * Confirm facilitator selection
   */
  async confirmFacilitator(request: FacilitatorConfirmRequest): Promise<{ success: boolean }> {
    return makeVideoFlowRequest<{ success: boolean }>('POST', '/facilitator/confirm', request);
  },

  /**
   * Get current usage statistics
   */
  async getUsage(): Promise<UsageResponse> {
    return makeVideoFlowRequest<UsageResponse>('GET', '/usage');
  },

  /**
   * Generate a video scene
   */
  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    return makeVideoFlowRequest<GenerateVideoResponse>('POST', '/generate', request);
  },
};