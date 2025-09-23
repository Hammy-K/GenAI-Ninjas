import { vertexAIClient } from './vertex.client';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Scene } from '@shared/video-flow.schema';

/**
 * Veo video generation service
 */

interface VideoGenerationResult {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

class VeoService {
  private readonly videoOutputDir: string;

  constructor() {
    this.videoOutputDir = join(process.cwd(), 'server', 'public', 'generated-videos');
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!existsSync(this.videoOutputDir)) {
      mkdirSync(this.videoOutputDir, { recursive: true });
      console.log(`Created video output directory: ${this.videoOutputDir}`);
    }
  }

  /**
   * Build a comprehensive prompt for Veo 3 Fast
   */
  buildPrompt(scene: Scene): string {
    const aspectRatioText = scene.aspectRatio === '9:16' ? 'vertical (9:16)' : 'horizontal (16:9)';
    
    return `Generate a high-quality cinematic video with aspect ratio ${aspectRatioText}.

Visual Description: ${scene.description}

Voiceover Narration (integrate into audio track): "${scene.voiceover}"

Requirements:
- Ensure the narration is clearly audible and well-synced with the visual content
- Use cinematic camera movements and professional lighting
- Create smooth transitions and engaging visual storytelling
- Maintain high visual quality throughout the video
- Duration: 6 seconds
- Output format: MP4

The voiceover should complement and enhance the visual narrative, providing context and emotional depth to the scene.`;
  }

  /**
   * Generate video using Vertex AI Veo 3 Fast
   */
  async generateVideo(scene: Scene, facilitatorApiKey: string): Promise<VideoGenerationResult> {
    try {
      console.log('Generating video for scene with Vertex AI');
      
      const prompt = this.buildPrompt(scene);
      console.log('Generated prompt:', prompt.substring(0, 200) + '...');

      const result = await vertexAIClient.generateVideo({
        prompt,
        aspectRatio: scene.aspectRatio,
      });

      // Return the real result from Vertex AI - no mocks
      return result;
    } catch (error) {
      console.error('Video generation failed:', error);
      
      const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check the status of a video generation job
   */
  async checkJobStatus(jobId: string): Promise<VideoGenerationResult> {
    try {
      console.log('Checking job status for:', jobId);
      
      const result = await vertexAIClient.checkJobStatus(jobId);
      return result;
    } catch (error) {
      console.error('Job status check failed:', error);
      
      return {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed',
      };
    }
  }

  /**
   * Check if a video file exists
   */
  videoExists(jobId: string): boolean {
    const filePath = join(this.videoOutputDir, `${jobId}.mp4`);
    return existsSync(filePath);
  }

  /**
   * Get video file path
   */
  getVideoPath(jobId: string): string {
    return join(this.videoOutputDir, `${jobId}.mp4`);
  }
}

// Singleton instance
export const veoService = new VeoService();