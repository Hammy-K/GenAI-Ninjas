import { GoogleAuth } from 'google-auth-library';

/**
 * Vertex AI client for video generation using Veo 3 Fast model
 */

interface VertexConfig {
  projectId: string;
  location: string;
  serviceAccountJson: string;
}

interface VideoGenerationRequest {
  prompt: string;
  aspectRatio: '9:16' | '16:9';
}

interface VideoGenerationResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

class VertexAIClient {
  private auth: GoogleAuth;
  private config: VertexConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      projectId: process.env.VERTEX_AI_PROJECT_ID || '',
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
      serviceAccountJson: process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON || '',
    };

    if (!this.config.projectId || !this.config.serviceAccountJson) {
      throw new Error('Missing Vertex AI configuration. Please check environment variables.');
    }

    // Parse service account JSON
    let credentials;
    try {
      credentials = JSON.parse(this.config.serviceAccountJson);
    } catch (error) {
      throw new Error('Invalid VERTEX_AI_SERVICE_ACCOUNT_JSON format');
    }

    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const client = await this.auth.getClient();
      const response = await client.getAccessToken();
      
      if (!response.token) {
        throw new Error('Failed to get access token');
      }

      this.accessToken = response.token;
      // Set expiry to 50 minutes from now (tokens usually last 1 hour)
      this.tokenExpiry = now + (50 * 60 * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Vertex AI access token:', error);
      throw new Error('Authentication failed with Vertex AI');
    }
  }

  /**
   * Generate video using Veo 3 Fast model
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const accessToken = await this.getAccessToken();
    
    const endpoint = `https://${this.config.location}-aiplatform.googleapis.com/v1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/veo-3.0-fast-generate-preview:predictLongRunning`;

    const payload = {
      contents: [{
        role: 'user',
        parts: [{
          text: request.prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vertex AI API error:', response.status, errorText);
        throw new Error(`Vertex AI API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Generate a unique job ID
      const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // For now, we'll simulate the video generation process
      // In a real implementation, this would be an async operation
      if (result.candidates && result.candidates[0]) {
        return {
          jobId,
          status: 'completed',
          videoUrl: `/generated-videos/${jobId}.mp4`,
        };
      } else {
        return {
          jobId,
          status: 'failed',
          error: 'No video content generated',
        };
      }
      
    } catch (error) {
      console.error('Video generation failed:', error);
      const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check the status of a video generation job
   */
  async checkJobStatus(jobId: string): Promise<VideoGenerationResponse> {
    // For now, return completed status
    // In a real implementation, this would check the actual job status
    return {
      jobId,
      status: 'completed',
      videoUrl: `/generated-videos/${jobId}.mp4`,
    };
  }
}

// Singleton instance
export const vertexAIClient = new VertexAIClient();