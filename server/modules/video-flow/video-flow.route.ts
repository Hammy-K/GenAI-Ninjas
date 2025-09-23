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
import { registerAdminRoutes } from "./admin.routes";

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

  // Register admin routes
  router.use("/admin", registerAdminRoutes());

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
   * Get available facilitators and matched facilitator for current user (DATABASE-BACKED)
   */
  router.get("/facilitators", async (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // NEW: Get facilitators from database instead of JSON file
      const activeFacilitators = await facilitatorService.getActiveFacilitators();
      const facilitators = activeFacilitators.map(f => ({ name: f.name }));

      // Check if student has a database assignment
      const assignedCredentials = await facilitatorService.getCredentialsForStudent(
        req.session.user.email
      );
      
      let matchedFacilitatorName: string | undefined = undefined;
      if (assignedCredentials) {
        // Find the facilitator name from the database
        const allFacilitators = await facilitatorService.getAllFacilitators();
        const matchedFacilitator = allFacilitators.find(f => 
          f.projectId === assignedCredentials.projectId
        );
        matchedFacilitatorName = matchedFacilitator?.name;
      } else {
        // FALLBACK: Try legacy system if no database assignment found
        try {
          const legacyInfo = facilitatorService.getFacilitatorInfo(req.session.user.email);
          if (legacyInfo.facilitators.length > 0) {
            facilitators.push(...legacyInfo.facilitators.filter(
              lf => !facilitators.some(f => f.name === lf.name)
            ));
          }
          matchedFacilitatorName = legacyInfo.matchedFacilitatorName || undefined;
        } catch (error) {
          // Legacy system failed (expected in production), continue with database-only
          console.log('Legacy facilitator system not available, using database only');
        }
      }

      const response: FacilitatorsResponse = {
        facilitators,
        matchedFacilitatorName,
        confirmedFacilitatorName: req.session.facilitator?.name || undefined,
        userEmail: req.session.user.email,
      };
      res.json(response);
    } catch (error) {
      console.error('Failed to get facilitators:', error);
      res.status(500).json({ error: "Failed to retrieve facilitators" });
    }
  });

  /**
   * POST /api/video-flow/facilitator/confirm
   * Confirm facilitator selection and store API key in session (DATABASE-BACKED)
   */
  router.post("/facilitator/confirm", async (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const parseResult = FacilitatorConfirmRequestZ.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const { facilitatorName } = parseResult.data;

    try {
      // NEW: Check if facilitator exists in database
      const activeFacilitators = await facilitatorService.getActiveFacilitators();
      const facilitatorExists = activeFacilitators.some(f => f.name === facilitatorName);
      
      if (!facilitatorExists) {
        // FALLBACK: Try legacy system
        try {
          if (!facilitatorService.isValidFacilitator(facilitatorName)) {
            return res.status(400).json({ error: "Invalid facilitator" });
          }
          
          const apiKey = facilitatorService.getFacilitatorApiKey(facilitatorName);
          if (!apiKey) {
            return res.status(500).json({ error: "Facilitator API key not available" });
          }
        } catch (error) {
          // Legacy system failed, and facilitator not in database
          return res.status(400).json({ error: "Invalid facilitator" });
        }
      }

      // Store facilitator name in session (works for both database and legacy)
      req.session.facilitator = {
        name: facilitatorName,
      };

      res.json({ success: true });
    } catch (error) {
      console.error('Facilitator confirmation error:', error);
      res.status(500).json({ error: "Failed to confirm facilitator" });
    }
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
      let result;
      try {
        const customVertexClient = createVertexAIClient(facilitatorCredentials);
        
        // Build prompt using veoService logic
        const prompt = veoService.buildPrompt(scene);
        
        // Generate video with custom client
        result = await customVertexClient.generateVideo({
          prompt,
          aspectRatio: scene.aspectRatio,
        });
      } catch (error) {
        console.error('Failed to use facilitator credentials, falling back to environment credentials:', error);
        
        // Fallback: Use default client with environment variables (same pattern as status endpoint)
        console.warn("Facilitator credentials failed, using default environment client");
        const { vertexAIClient } = await import("../../services/ai/provider/vertex/vertex.client");
        
        // Build prompt using veoService logic
        const prompt = veoService.buildPrompt(scene);
        
        // Generate video with default client
        result = await vertexAIClient.generateVideo({
          prompt,
          aspectRatio: scene.aspectRatio,
        });
      }

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
        // Try to use custom client with student's facilitator credentials
        try {
          const customVertexClient = createVertexAIClient(facilitatorCredentials);
          result = await customVertexClient.checkJobStatus(decodedJobId);
        } catch (error) {
          console.error('Failed to use facilitator credentials for status check, falling back to environment credentials:', error);
          
          // Fallback: Use default client with environment variables
          console.warn("Facilitator credentials failed for status check, using default environment client");
          const { vertexAIClient } = await import("../../services/ai/provider/vertex/vertex.client");
          result = await vertexAIClient.checkJobStatus(decodedJobId);
        }
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
