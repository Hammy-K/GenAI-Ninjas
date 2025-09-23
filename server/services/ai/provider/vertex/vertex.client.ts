import { GoogleAuth } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";

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
  aspectRatio: "9:16" | "16:9";
}

interface VideoGenerationResponse {
  jobId: string;
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

class VertexAIClient {
  private auth: GoogleAuth;
  private config: VertexConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(customConfig?: VertexConfig) {
    // Use custom config if provided, otherwise fall back to environment variables
    this.config = customConfig || {
      projectId: process.env.VERTEX_AI_PROJECT_ID || "",
      location: process.env.VERTEX_AI_LOCATION || "us-central1",
      serviceAccountJson: process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON || "",
    };

    if (!this.config.projectId || !this.config.serviceAccountJson) {
      throw new Error(
        "Missing Vertex AI configuration. Please provide credentials or check environment variables.",
      );
    }

    // Parse service account JSON
    let credentials;
    try {
      credentials = JSON.parse(this.config.serviceAccountJson);
    } catch (error) {
      throw new Error("Invalid service account JSON format");
    }

    this.auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
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
        throw new Error("Failed to get access token");
      }

      this.accessToken = response.token;
      // Set expiry to 50 minutes from now (tokens usually last 1 hour)
      this.tokenExpiry = now + 50 * 60 * 1000;

      return this.accessToken;
    } catch (error) {
      console.error("Failed to get Vertex AI access token:", error);
      throw new Error("Authentication failed with Vertex AI");
    }
  }

  /**
   * Generate video using Veo 3 Fast model
   */
  async generateVideo(
    request: VideoGenerationRequest,
  ): Promise<VideoGenerationResponse> {
    console.log("Received request object:", request);
    console.log("Prompt value:", request.prompt);
    const accessToken = await this.getAccessToken();

    const endpoint = `https://${this.config.location}-aiplatform.googleapis.com/v1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/veo-3.0-fast-generate:predictLongRunning`;

    // Confirmed by documentation: 'instances' with nested 'prompt'
    const payload = {
      instances: [
        {
          prompt: request.prompt,
        },
      ],
      parameters: {
        aspectRatio: request.aspectRatio,
        durationSeconds: 6,
        generateAudio: true,
        sampleCount: 1,
        resolution: "1080p",
      },
    };

    try {
      console.log("Sending request to:", endpoint);
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vertex AI API error:", response.status, errorText);

        if (response.status === 404) {
          console.log("Trying alternative model name...");
          return this.tryAlternativeModel(request, accessToken);
        }

        throw new Error(
          `Vertex AI API error: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();
      console.log("API Response:", JSON.stringify(result, null, 2));

      if (!result.name) {
        throw new Error("No operation name returned from Vertex AI");
      }

      const operationName = result.name;

      return {
        jobId: operationName,
        status: "processing",
      };
    } catch (error) {
      console.error("Video generation failed:", error);
      const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Try alternative model names if the first one fails
   */
  private async tryAlternativeModel(
    request: VideoGenerationRequest,
    accessToken: string,
  ): Promise<VideoGenerationResponse> {
    const alternativeModels = [
      "veo-3.0-generate-fast-preview",
      "veo-3.0-generate-001",
      "veo-3.0-generate-preview",
      "veo-2.0-generate-001",
    ];

    for (const modelName of alternativeModels) {
      try {
        console.log(`Trying model: ${modelName}`);
        const endpoint = `https://${this.config.location}-aiplatform.googleapis.com/v1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/${modelName}:predictLongRunning`;

        const payload = {
          instances: [
            {
              prompt: request.prompt,
            },
          ],
          parameters: {
            aspectRatio: request.aspectRatio,
            durationSeconds: 6,
            generateAudio: true,
            sampleCount: 1,
            ...(modelName.includes("veo-3") && { resolution: "1080p" }),
          },
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log(`Successfully using model: ${modelName}`);
          const result = await response.json();

          if (result.name) {
            return {
              jobId: result.name,
              status: "processing",
            };
          }
        } else {
          const errorText = await response.text();
          console.log(
            `Model ${modelName} failed with ${response.status}: ${errorText}`,
          );
        }
      } catch (error) {
        console.log(`Model ${modelName} failed:`, error);
        continue;
      }
    }

    const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      jobId,
      status: "failed",
      error: "All model alternatives failed",
    };
  }

  /**
   * Check the status of a video generation job (operation)
   */
  async checkJobStatus(
    operationName: string,
  ): Promise<VideoGenerationResponse> {
    const accessToken = await this.getAccessToken();

    // Reconstruct the full endpoint from the operationName
    const parts = operationName.split("/");
    const projectId = parts[1];
    const location = parts[3];
    const modelId = parts[7];
    const operationId = parts[9];

    // Confirmed by documentation: 'POST' request to :fetchPredictOperation
    const statusEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;

    // Confirmed by documentation: JSON body with 'operationName'
    const payload = {
      operationName: operationName,
    };

    try {
      console.log("Checking operation status at:", statusEndpoint);
      console.log("With payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(statusEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Operation status check failed:",
          response.status,
          errorText,
        );
        return {
          jobId: operationName,
          status: "failed",
          error: `Status check failed: ${response.status}`,
        };
      }

      const result = await response.json();
      // Log only essential status info, not the massive video data
      console.log("Status check result:", {
        jobId: operationName,
        status: result.done ? "completed" : "processing",
        hasVideo: !!(result.response?.videos?.length > 0),
        hasError: !!result.error,
      });

      if (result.done) {
        if (result.error) {
          console.error("Video generation error:", result.error);
          return {
            jobId: operationName,
            status: "failed",
            error: result.error.message || "Video generation failed",
          };
        }

        if (result.response?.raiMediaFilteredCount > 0) {
          console.warn(
            "Content was filtered:",
            result.response.raiMediaFilteredReasons,
          );
          return {
            jobId: operationName,
            status: "failed",
            error: `Content filtered: ${result.response.raiMediaFilteredReasons?.join(", ") || "Content policy violation"}`,
          };
        }

        if (
          result.response &&
          result.response.videos &&
          result.response.videos.length > 0
        ) {
          const video = result.response.videos[0];

          // PRIORITY FIX: Try base64 data first (creates downloadable files)
          if (video.bytesBase64Encoded) {
            try {
              const videoData = Buffer.from(video.bytesBase64Encoded, "base64");
              const operationId =
                operationName.split("/").pop() || Date.now().toString();
              const filename = `${operationId}.mp4`;
              const filePath = path.join(
                "server/public/generated-videos",
                filename,
              );

              // Ensure directory exists
              const dir = path.dirname(filePath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }

              // Write video file
              fs.writeFileSync(filePath, videoData);

              const publicUrl = `/generated-videos/${filename}`;
              console.log(`Video saved successfully: ${publicUrl}`);

              return {
                jobId: operationName,
                status: "completed",
                videoUrl: publicUrl,
              };
            } catch (error) {
              console.error("Failed to save video file:", error);
              // Fall back to GCS URI if base64 processing fails
            }
          }

          // Fallback: Try GCS URI (browsers can't access gs:// directly)
          if (video.gcsUri) {
            console.warn(
              `Using GCS URI - browsers may not be able to access: ${video.gcsUri}`,
            );
            return {
              jobId: operationName,
              status: "completed",
              videoUrl: video.gcsUri,
            };
          }

          console.error("Video object found but no URL or base64 data:", video);
          return {
            jobId: operationName,
            status: "failed",
            error: "Video generated but no accessible URL found",
          };
        } else {
          console.error("No videos in response:", result.response);
          return {
            jobId: operationName,
            status: "failed",
            error: "Video generation completed but no video files returned",
          };
        }
      } else {
        return {
          jobId: operationName,
          status: "processing",
        };
      }
    } catch (error) {
      console.error("Job status check failed:", error);
      return {
        jobId: operationName,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Default instance for backward compatibility (uses environment variables)
export const vertexAIClient = new VertexAIClient();

// Factory function to create client with custom credentials
export function createVertexAIClient(config: VertexConfig): VertexAIClient {
  return new VertexAIClient(config);
}

// Export the class for direct instantiation
export { VertexAIClient };
