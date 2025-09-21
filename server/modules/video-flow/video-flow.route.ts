import { Router, Request, Response } from "express";
import {
  GoogleAuthRequestZ,
  FacilitatorConfirmRequestZ,
  GenerateVideoRequestZ,
  type AuthResponse,
  type FacilitatorsResponse,
  type GenerateVideoResponse,
  type UsageResponse,
} from "@shared/video-flow.schema";
import { firebaseAdminService } from "../../services/auth/firebase-admin.service";
import { facilitatorService } from "../../services/facilitator/facilitator.service";
import { usageService } from "../../services/usage/usage.service";
import { veoService } from "../../services/ai/provider/vertex/veo.service";
import { createVertexAIClient } from "../../services/ai/provider/vertex/vertex.client";

// Extend Express Request type to include our session user data
declare module "express-session" {
  interface SessionData {
    user?: {
      uid: string;
      email: string;
    };
    facilitator?: {
      name: string;
    };
  }
}

/**
 * Video flow routes for authentication, facilitator management, and video generation
 */
export function registerVideoFlowRoutes(): Router {
  const router = Router();

  /**
   * GET /api/video-flow/admin/reset-credits
   * TEMPORARY: Reset current user's video credits for testing
   */
  router.get("/admin/reset-credits", (req: Request, res: Response) => {
    if (!req.session.user?.uid) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    usageService.resetUsage(req.session.user.uid);
    const newUsage = usageService.getUsage(req.session.user.uid);
    
    res.json({
      success: true,
      message: "Video credits reset successfully",
      usage: newUsage
    });
  });

  /**
   * POST /api/video-flow/auth/google
   * Authenticate user with Google Firebase ID token
   */
  router.post("/auth/google", async (req: Request, res: Response) => {
    try {
      const parseResult = GoogleAuthRequestZ.safeParse(req.body);
      if (!parseResult.success) {
        const response: AuthResponse = {
          success: false,
          error: "Invalid request format",
        };
        return res.status(400).json(response);
      }

      const { idToken } = parseResult.data;
      const userInfo = await firebaseAdminService.verifyIdToken(idToken);

      if (!userInfo) {
        const response: AuthResponse = {
          success: false,
          error: "Invalid or expired token",
        };
        return res.status(401).json(response);
      }

      // Store user info in session
      req.session.user = userInfo;

      const response: AuthResponse = {
        success: true,
        user: userInfo,
      };
      res.json(response);
    } catch (error) {
      console.error("Google auth error:", error);
      const response: AuthResponse = {
        success: false,
        error: "Authentication failed",
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/video-flow/facilitators
   * Get available facilitators and matched facilitator for current user
   */
  router.get("/facilitators", (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const facilitatorInfo = facilitatorService.getFacilitatorInfo(
      req.session.user.email,
    );
    const response: FacilitatorsResponse = {
      facilitators: facilitatorInfo.facilitators,
      matchedFacilitatorName:
        facilitatorInfo.matchedFacilitatorName || undefined,
      confirmedFacilitatorName: req.session.facilitator?.name || undefined,
      userEmail: req.session.user.email,
    };
    res.json(response);
  });

  /**
   * POST /api/video-flow/facilitator/confirm
   * Confirm facilitator selection and store API key in session
   */
  router.post("/facilitator/confirm", (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const parseResult = FacilitatorConfirmRequestZ.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const { facilitatorName } = parseResult.data;

    if (!facilitatorService.isValidFacilitator(facilitatorName)) {
      return res.status(400).json({ error: "Invalid facilitator" });
    }

    const apiKey = facilitatorService.getFacilitatorApiKey(facilitatorName);
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Facilitator API key not available" });
    }

    // Store facilitator name in session
    req.session.facilitator = {
      name: facilitatorName,
    };

    res.json({ success: true });
  });

  /**
   * GET /api/video-flow/usage
   * Get current usage statistics for the user
   */
  router.get("/usage", (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const usage = usageService.getUsage(req.session.user.uid);
    const response: UsageResponse = usage;
    res.json(response);
  });

  /**
   * POST /api/video-flow/generate
   * Generate a video using the Veo 3 Fast model with student-specific facilitator credentials
   */
  router.post("/generate", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.user) {
        return res
          .status(401)
          .json({ error: "Not authenticated" });
      }

      // Check usage limits
      if (usageService.hasExceededLimit(req.session.user.uid)) {
        const response: GenerateVideoResponse = {
          jobId: "",
          status: "failed",
          error: "Usage limit exceeded (3 videos maximum)",
        };
        return res.status(429).json(response);
      }

      // Validate request
      const parseResult = GenerateVideoRequestZ.safeParse(req.body);
      if (!parseResult.success) {
        const response: GenerateVideoResponse = {
          jobId: "",
          status: "failed",
          error: "Invalid request format",
        };
        return res.status(400).json(response);
      }

      const { scene } = parseResult.data;

      // NEW: Get student-specific facilitator credentials
      const facilitatorCredentials = await facilitatorService.getCredentialsForStudent(
        req.session.user.email
      );

      if (!facilitatorCredentials) {
        // Fallback to old system if no database credentials found
        if (!req.session.facilitator) {
          return res
            .status(400)
            .json({ error: "No facilitator assigned. Please select a facilitator first." });
        }

        const facilitatorApiKey = facilitatorService.getFacilitatorApiKey(
          req.session.facilitator.name,
        );
        if (!facilitatorApiKey) {
          return res
            .status(500)
            .json({ error: "Facilitator API key not available" });
        }

        // Use old system
        const result = await veoService.generateVideo(scene, facilitatorApiKey);
        
        if (result.status === "completed") {
          usageService.incrementUsage(req.session.user.uid);
        }

        const response: GenerateVideoResponse = result;
        return res.json(response);
      }

      // NEW: Create custom VertexAI client with student's facilitator credentials
      const customVertexClient = createVertexAIClient(facilitatorCredentials);
      
      // Build prompt using veoService logic
      const prompt = veoService.buildPrompt(scene);
      
      // Generate video with custom client
      const result = await customVertexClient.generateVideo({
        prompt,
        aspectRatio: scene.aspectRatio,
      });

      // Increment usage only if generation was successful
      if (result.status === "completed") {
        usageService.incrementUsage(req.session.user.uid);
      }

      const response: GenerateVideoResponse = result;
      res.json(response);
    } catch (error) {
      console.error("Video generation error:", error);
      const response: GenerateVideoResponse = {
        jobId: "",
        status: "failed",
        error: "Video generation failed",
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/video-flow/status/:jobId
   * Check video generation job status with student-specific facilitator credentials
   */
  router.get("/status/:jobId", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.user) {
        return res
          .status(401)
          .json({ error: "Not authenticated" });
      }

      const { jobId } = req.params;

      if (!jobId) {
        const response: GenerateVideoResponse = {
          jobId: "",
          status: "failed",
          error: "Job ID is required",
        };
        return res.status(400).json(response);
      }

      // FIXED: Decode the URL-encoded job ID
      const decodedJobId = decodeURIComponent(jobId);
      console.log("Status check for operation:", decodedJobId);

      // NEW: Get student-specific facilitator credentials for status check
      const facilitatorCredentials = await facilitatorService.getCredentialsForStudent(
        req.session.user.email
      );

      let result;
      if (facilitatorCredentials) {
        // Use custom client with student's facilitator credentials
        const customVertexClient = createVertexAIClient(facilitatorCredentials);
        result = await customVertexClient.checkJobStatus(decodedJobId);
      } else {
        // Fallback: Use default client (this maintains backward compatibility)
        console.warn("No facilitator credentials found for student, using default client");
        const { vertexAIClient } = await import("../../services/ai/provider/vertex/vertex.client");
        result = await vertexAIClient.checkJobStatus(decodedJobId);
      }

      console.log("Status check result:", JSON.stringify(result, null, 2));

      // Increment usage if video just completed
      if (
        result.status === "completed" &&
        !usageService.hasExceededLimit(req.session.user.uid)
      ) {
        usageService.incrementUsage(req.session.user.uid);
      }

      const response: GenerateVideoResponse = result;
      res.json(response);
    } catch (error) {
      console.error("Video status check error:", error);
      const response: GenerateVideoResponse = {
        jobId: req.params.jobId || "",
        status: "failed",
        error:
          "Status check failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      };
      res.status(500).json(response);
    }
  });

  return router;
}
