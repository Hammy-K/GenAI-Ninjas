import { db } from "../../db";
import { videoJobs, facilitators } from "../../../shared/schema";
import { eq, and, lte, or, isNull } from "drizzle-orm";

interface JobWorkerConfig {
  pollIntervalMs: number;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jobTimeoutMs: number;
}

class VideoJobWorker {
  private config: JobWorkerConfig;
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private processingJobs = new Set<number>();

  constructor(config: Partial<JobWorkerConfig> = {}) {
    this.config = {
      pollIntervalMs: 2000, // Check every 2 seconds
      maxRetries: 10,
      baseDelayMs: 10000, // Start with 10 seconds
      maxDelayMs: 60000, // Max 60 seconds between retries
      jobTimeoutMs: 10 * 60 * 1000, // 10 minutes total timeout
      ...config,
    };
  }

  start() {
    if (this.isRunning) {
      console.log("Video job worker is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting video job worker with config:", this.config);
    this.scheduleNextPoll();
  }

  stop() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log("Video job worker stopped");
  }

  private scheduleNextPoll() {
    if (!this.isRunning) return;

    this.pollTimer = setTimeout(async () => {
      try {
        await this.processJobs();
      } catch (error) {
        console.error("Error in job processing cycle:", error);
      }
      this.scheduleNextPoll();
    }, this.config.pollIntervalMs);
  }

  private async processJobs() {
    const now = new Date();

    try {
      // Find jobs that need processing
      const pendingJobs = await db
        .select()
        .from(videoJobs)
        .where(
          and(
            or(
              eq(videoJobs.status, "queued"),
              eq(videoJobs.status, "processing")
            ),
            or(
              isNull(videoJobs.nextCheckAt),
              lte(videoJobs.nextCheckAt, now)
            )
          )
        )
        .limit(10); // Process max 10 jobs at once

      for (const job of pendingJobs) {
        // Skip if already processing this job
        if (this.processingJobs.has(job.id)) {
          continue;
        }

        // Check if job has timed out
        const jobAge = now.getTime() - new Date(job.createdAt).getTime();
        if (jobAge > this.config.jobTimeoutMs) {
          await this.expireJob(job.id, "Job timeout exceeded");
          continue;
        }

        // Process the job
        this.processingJobs.add(job.id);
        this.processJob(job).finally(() => {
          this.processingJobs.delete(job.id);
        });
      }
    } catch (error) {
      console.error("Error fetching pending jobs:", error);
    }
  }

  private async processJob(job: any) {
    try {
      console.log(`Processing job ${job.id} with status ${job.status}`);

      if (job.status === "queued") {
        await this.startVideoGeneration(job);
      } else if (job.status === "processing") {
        await this.checkVideoStatus(job);
      }
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      await this.handleJobError(job, error);
    }
  }

  private async startVideoGeneration(job: any) {
    try {
      // Get facilitator credentials
      const { facilitatorService } = await import("../../services/facilitator/facilitator.service");
      const credentials = await facilitatorService.getCredentialsForStudent(
        job.firebaseUid // Using firebaseUid as a fallback
      );

      if (!credentials) {
        throw new Error("No facilitator credentials available");
      }

      // Create vertex client
      const { createVertexAIClient } = await import("../../services/ai/provider/vertex/vertex.client");
      const vertexClient = createVertexAIClient(credentials);

      // Start video generation
      const response = await vertexClient.generateVideo({
        prompt: job.prompt,
        aspectRatio: job.aspectRatio,
      });

      if (!response.operationName) {
        throw new Error("No operation name returned from video generation");
      }

      // Update job with operation details
      await db
        .update(videoJobs)
        .set({
          status: "processing",
          vertexOperation: response.operationName,
          nextCheckAt: new Date(Date.now() + this.config.baseDelayMs),
          lastCheckAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(videoJobs.id, job.id));

      console.log(`Job ${job.id} started video generation with operation ${response.operationName}`);

    } catch (error) {
      console.error(`Failed to start video generation for job ${job.id}:`, error);
      await this.handleJobError(job, error);
    }
  }

  private async checkVideoStatus(job: any) {
    try {
      if (!job.vertexOperation) {
        throw new Error("No vertex operation ID available for status check");
      }

      // Get facilitator credentials
      const { facilitatorService } = await import("../../services/facilitator/facilitator.service");
      const credentials = await facilitatorService.getCredentialsForStudent(
        job.firebaseUid
      );

      if (!credentials) {
        throw new Error("No facilitator credentials available for status check");
      }

      // Create vertex client
      const { createVertexAIClient } = await import("../../services/ai/provider/vertex/vertex.client");
      const vertexClient = createVertexAIClient(credentials);

      // Check operation status
      const statusResult = await vertexClient.checkJobStatus(job.vertexOperation);

      console.log(`Job ${job.id} status check: ${statusResult.status}`);

      if (statusResult.status === "completed") {
        // Job completed successfully
        await db
          .update(videoJobs)
          .set({
            status: "completed",
            videoUrl: statusResult.videoUrl,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(videoJobs.id, job.id));

        console.log(`✅ Job ${job.id} completed successfully`);

      } else if (statusResult.status === "failed") {
        // Job failed
        await db
          .update(videoJobs)
          .set({
            status: "failed",
            errorCode: "VERTEX_GENERATION_FAILED",
            errorMessage: statusResult.error || "Video generation failed",
            updatedAt: new Date(),
          })
          .where(eq(videoJobs.id, job.id));

        console.log(`❌ Job ${job.id} failed: ${statusResult.error}`);

      } else if (statusResult.status === "processing") {
        // Still processing - calculate next check time with exponential backoff
        const nextDelay = this.calculateBackoffDelay(job.attemptCount);
        
        await db
          .update(videoJobs)
          .set({
            nextCheckAt: new Date(Date.now() + nextDelay),
            lastCheckAt: new Date(),
            attemptCount: job.attemptCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(videoJobs.id, job.id));

        console.log(`⏳ Job ${job.id} still processing, next check in ${nextDelay}ms`);

      } else {
        throw new Error(`Unknown status: ${statusResult.status}`);
      }

    } catch (error) {
      console.error(`Failed to check video status for job ${job.id}:`, error);
      await this.handleJobError(job, error);
    }
  }

  private async handleJobError(job: any, error: any) {
    const attemptCount = job.attemptCount + 1;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (attemptCount >= this.config.maxRetries) {
      // Max retries exceeded - mark as failed
      await db
        .update(videoJobs)
        .set({
          status: "failed",
          errorCode: "MAX_RETRIES_EXCEEDED",
          errorMessage: `Failed after ${attemptCount} attempts: ${errorMessage}`,
          attemptCount,
          updatedAt: new Date(),
        })
        .where(eq(videoJobs.id, job.id));

      console.log(`❌ Job ${job.id} failed permanently after ${attemptCount} attempts`);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = this.calculateBackoffDelay(attemptCount);
      
      await db
        .update(videoJobs)
        .set({
          attemptCount,
          nextCheckAt: new Date(Date.now() + retryDelay),
          lastCheckAt: new Date(),
          errorMessage: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(videoJobs.id, job.id));

      console.log(`🔄 Job ${job.id} will retry in ${retryDelay}ms (attempt ${attemptCount})`);
    }
  }

  private async expireJob(jobId: number, reason: string) {
    await db
      .update(videoJobs)
      .set({
        status: "expired",
        errorCode: "JOB_EXPIRED", 
        errorMessage: reason,
        expiredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(videoJobs.id, jobId));

    console.log(`⏰ Job ${jobId} expired: ${reason}`);
  }

  private calculateBackoffDelay(attemptCount: number): number {
    // Exponential backoff with jitter: base * (1.5 ^ attempts) + random(0-20%)
    const exponential = this.config.baseDelayMs * Math.pow(1.5, attemptCount);
    const jitter = Math.random() * 0.2 * exponential;
    const delay = Math.min(exponential + jitter, this.config.maxDelayMs);
    return Math.floor(delay);
  }

  // Public method to get worker stats
  getStats() {
    return {
      isRunning: this.isRunning,
      processingJobsCount: this.processingJobs.size,
      config: this.config,
    };
  }
}

// Singleton instance
export const videoJobWorker = new VideoJobWorker();

// Auto-start the worker when this module is imported
videoJobWorker.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping video job worker...');
  videoJobWorker.stop();
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping video job worker...');
  videoJobWorker.stop();
});

export default videoJobWorker;