import { apiRequest } from '@/lib/queryClient';
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

export const videoFlowApi = {
  /**
   * Authenticate with Google Firebase ID token
   */
  async authenticateGoogle(request: GoogleAuthRequest): Promise<AuthResponse> {
    return apiRequest(`${VIDEO_FLOW_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'include', // Include session cookies
    });
  },

  /**
   * Get available facilitators and matched facilitator for current user
   */
  async getFacilitators(): Promise<FacilitatorsResponse> {
    return apiRequest(`${VIDEO_FLOW_BASE}/facilitators`, {
      method: 'GET',
      credentials: 'include',
    });
  },

  /**
   * Confirm facilitator selection
   */
  async confirmFacilitator(request: FacilitatorConfirmRequest): Promise<{ success: boolean }> {
    return apiRequest(`${VIDEO_FLOW_BASE}/facilitator/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'include',
    });
  },

  /**
   * Get current usage statistics
   */
  async getUsage(): Promise<UsageResponse> {
    return apiRequest(`${VIDEO_FLOW_BASE}/usage`, {
      method: 'GET',
      credentials: 'include',
    });
  },

  /**
   * Generate a video scene
   */
  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    return apiRequest(`${VIDEO_FLOW_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'include',
    });
  },
};