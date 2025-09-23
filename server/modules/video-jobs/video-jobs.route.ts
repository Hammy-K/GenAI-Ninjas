import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../../storage";
import { videoJobs, facilitators } from "../../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { createHash } from "crypto";

export function createVideoJobsRouter(): Router {
  const router = Router();

  // Job creation request schema
  const CreateJobRequestSchema = z.object({
    prompt: z.string().min(10, "Prompt must be at least 10 characters"),
    aspectRatio: z.string().default("16:9"),
    sceneNumber: z.number().int().min(1).default(1),
  });

  // Job response schema
  const JobResponseSchema = z.object({
    id: z.number(),
    status: z.enum(["queued", "processing", "completed", "failed", "expired"]),
    videoUrl: z.string().nullable(),
    errorCode: z.string().nullable(),
    errorMessage: z.string().nullable(),
    attemptCount: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
  });

  /**
   * POST /api/video-jobs
   * Create a new video generation job with idempotency
   */
  router.post("/", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.user?.uid || !req.session.user?.email) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validate request
      const parseResult = CreateJobRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }

      const { prompt, aspectRatio, sceneNumber } = parseResult.data;
      const firebaseUid = req.session.user.uid;
      const userEmail = req.session.user.email;

      // Create idempotency hash
      const requestContent = JSON.stringify({
        firebaseUid,
        sceneNumber,
        prompt: prompt.trim(),
        aspectRatio,
      });
      const requestHash = createHash('sha256').update(requestContent).digest('hex');

      // Check for existing job with same hash
      const existingJob = await db
        .select()
        .from(videoJobs)
        .where(eq(videoJobs.requestHash, requestHash))
        .limit(1);

      if (existingJob.length > 0) {
        const job = existingJob[0];
        console.log(`Returning existing job ${job.id} for hash ${requestHash}`);
        return res.json({
          id: job.id,
          status: job.status,
          videoUrl: job.videoUrl,
          errorCode: job.errorCode,
          errorMessage: job.errorMessage,
          attemptCount: job.attemptCount,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          isExisting: true,
        });
      }

      // Get facilitator for this user
      const { facilitatorService } = await import("../../services/facilitator/facilitator.service");
      let facilitatorId: number | null = null;
      try {
        const credentials = await facilitatorService.getCredentialsForStudent(userEmail);
        if (credentials) {
          // Find facilitator ID by credentials (this is a simplified lookup)
          const facilitator = await db
            .select({ id: facilitators.id })
            .from(facilitators)
            .where(eq(facilitators.isActive, true))
            .limit(1);
          if (facilitator.length > 0) {
            facilitatorId = facilitator[0].id;
          }
        }
      } catch (error) {
        console.warn("Could not determine facilitator for user:", userEmail, error);
      }

      // Create new job
      const newJob = await db
        .insert(videoJobs)
        .values({
          firebaseUid,
          facilitatorId,
          sceneNumber,
          requestHash,
          prompt: prompt.trim(),
          aspectRatio,
          status: "queued",
          nextCheckAt: new Date(), // Process immediately
        })
        .returning();

      console.log(`Created new video job ${newJob[0].id} for user ${userEmail}`);

      res.status(201).json({
        id: newJob[0].id,
        status: newJob[0].status,
        videoUrl: newJob[0].videoUrl,
        errorCode: newJob[0].errorCode,
        errorMessage: newJob[0].errorMessage,
        attemptCount: newJob[0].attemptCount,
        createdAt: newJob[0].createdAt,
        updatedAt: newJob[0].updatedAt,
        isExisting: false,
      });

    } catch (error) {
      console.error("Job creation error:", error);
      res.status(500).json({ 
        error: "Failed to create video job",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * GET /api/video-jobs/:id
   * Get job status by ID
   */
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.user?.uid) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      const job = await db
        .select()
        .from(videoJobs)
        .where(and(
          eq(videoJobs.id, jobId),
          eq(videoJobs.firebaseUid, req.session.user.uid)
        ))
        .limit(1);

      if (job.length === 0) {
        return res.status(404).json({ error: "Job not found" });
      }

      const jobData = job[0];
      res.json({
        id: jobData.id,
        status: jobData.status,
        videoUrl: jobData.videoUrl,
        errorCode: jobData.errorCode,
        errorMessage: jobData.errorMessage,
        attemptCount: jobData.attemptCount,
        createdAt: jobData.createdAt,
        updatedAt: jobData.updatedAt,
      });

    } catch (error) {
      console.error("Job retrieval error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve job",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * GET /api/video-jobs/:id/stream
   * Server-Sent Events stream for real-time job updates
   */
  router.get("/:id/stream", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.user?.uid) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      // Verify job belongs to user
      const job = await db
        .select()
        .from(videoJobs)
        .where(and(
          eq(videoJobs.id, jobId),
          eq(videoJobs.firebaseUid, req.session.user.uid)
        ))
        .limit(1);

      if (job.length === 0) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Set up SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Send initial job state
      const initialJob = job[0];
      res.write(`data: ${JSON.stringify({
        id: initialJob.id,
        status: initialJob.status,
        videoUrl: initialJob.videoUrl,
        errorCode: initialJob.errorCode,
        errorMessage: initialJob.errorMessage,
        attemptCount: initialJob.attemptCount,
        updatedAt: initialJob.updatedAt,
      })}\n\n`);

      // If job is already complete, close the stream
      if (initialJob.status === 'completed' || initialJob.status === 'failed' || initialJob.status === 'expired') {
        res.end();
        return;
      }

      // Poll for updates every 2 seconds
      const intervalId = setInterval(async () => {
        try {
          const updatedJob = await db
            .select()
            .from(videoJobs)
            .where(eq(videoJobs.id, jobId))
            .limit(1);

          if (updatedJob.length > 0) {
            const jobData = updatedJob[0];
            res.write(`data: ${JSON.stringify({
              id: jobData.id,
              status: jobData.status,
              videoUrl: jobData.videoUrl,
              errorCode: jobData.errorCode,
              errorMessage: jobData.errorMessage,
              attemptCount: jobData.attemptCount,
              updatedAt: jobData.updatedAt,
            })}\n\n`);

            // Close stream if job is complete
            if (jobData.status === 'completed' || jobData.status === 'failed' || jobData.status === 'expired') {
              clearInterval(intervalId);
              res.end();
            }
          }
        } catch (error) {
          console.error("SSE polling error:", error);
          clearInterval(intervalId);
          res.end();
        }
      }, 2000);

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(intervalId);
      });

      // Keep connection alive
      res.write(`data: {"type":"keepalive"}\n\n`);

    } catch (error) {
      console.error("SSE setup error:", error);
      res.status(500).json({ 
        error: "Failed to setup stream",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * GET /api/video-jobs
   * List user's recent jobs
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.user?.uid) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const jobs = await db
        .select()
        .from(videoJobs)
        .where(eq(videoJobs.firebaseUid, req.session.user.uid))
        .orderBy(desc(videoJobs.createdAt))
        .limit(20);

      res.json({
        jobs: jobs.map(job => ({
          id: job.id,
          status: job.status,
          sceneNumber: job.sceneNumber,
          videoUrl: job.videoUrl,
          errorCode: job.errorCode,
          errorMessage: job.errorMessage,
          attemptCount: job.attemptCount,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        }))
      });

    } catch (error) {
      console.error("Jobs listing error:", error);
      res.status(500).json({ 
        error: "Failed to list jobs",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return router;
}