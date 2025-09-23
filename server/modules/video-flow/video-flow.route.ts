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

// Rate limiting: Track user requests (userId -> lastRequestTimestamp)
const userRateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW_SECONDS = 10;
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
   * POST /api/video-flow/admin/reset-all-data
   * TEMPORARY: Reset all user data (credits, session, facilitator) for testing
   */
  router.post("/admin/reset-all-data", (req: Request, res: Response) => {
    if (!req.session.user?.uid) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // Reset usage/credits
      usageService.resetUsage(req.session.user.uid);
      
      // Clear facilitator session
      req.session.facilitator = undefined;
      
      // Clear rate limiting for this user
      const userId = req.session.user.uid;
      if (userRateLimit.has(userId)) {
        userRateLimit.delete(userId);
      }
      
      const newUsage = usageService.getUsage(req.session.user.uid);
      
      res.json({
        success: true,
        message: "All user data reset successfully. Please refresh the page to clear frontend data.",
        usage: newUsage,
        clearedData: {
          videoCredits: true,
          facilitatorSession: true,
          rateLimiting: true
        }
      });
    } catch (error) {
      console.error("Reset all data error:", error);
      res.status(500).json({ 
        error: "Failed to reset user data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * GET /api/video-flow/admin/debug-facilitators
   * Debug endpoint to check facilitator credentials status (Admin only)
   */
  router.get("/admin/debug-facilitators", async (req: Request, res: Response) => {
    if (!req.session.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Admin-only restriction for security
    const isAdmin = req.session.user.email === 'admin@genaiquest.com' || 
                   req.session.user.email?.includes('@replit.com') ||
                   process.env.NODE_ENV === 'development';
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      // Check if student has database assignment
      const assignment = await facilitatorService.getCredentialsForStudent(req.session.user.email);
      
      // Get all active facilitators
      const activeFacilitators = await facilitatorService.getActiveFacilitators();
      
      // Check if legacy facilitator exists
      let legacyFacilitator = null;
      if (req.session.facilitator?.name) {
        try {
          legacyFacilitator = {
            name: req.session.facilitator.name,
            hasApiKey: !!facilitatorService.getFacilitatorApiKey(req.session.facilitator.name),
            isValid: facilitatorService.isValidFacilitator(req.session.facilitator.name)
          };
        } catch (error) {
          legacyFacilitator = {
            name: req.session.facilitator.name,
            hasApiKey: false,
            isValid: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }

      res.json({
        userEmail: req.session.user.email,
        hasAssignment: !!assignment,
        assignmentDetails: assignment ? {
          projectId: assignment.projectId,
          location: assignment.location,
          hasServiceAccount: !!assignment.serviceAccountJson
        } : null,
        activeFacilitatorsCount: activeFacilitators.length,
        activeFacilitators: activeFacilitators.map(f => ({ name: f.name, id: f.id })),
        sessionFacilitator: legacyFacilitator,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Debug facilitators error:", error);
      res.status(500).json({ 
        error: "Failed to debug facilitators",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * POST /api/video-flow/admin/reset-user
   * Reset specific user's progress and session data (Admin only)
   */
  router.post("/admin/reset-user", async (req: Request, res: Response) => {
    if (!req.session.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Admin-only restriction for security
    const isAdmin = req.session.user.email === 'admin@genaiquest.com' || 
                   req.session.user.email?.includes('@replit.com') ||
                   process.env.NODE_ENV === 'development';
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const { db } = await import("../../storage");
      const { students } = await import("../../../shared/schema");
      const { eq } = await import("drizzle-orm");

      // Find the user in the database
      const user = await db
        .select()
        .from(students)
        .where(eq(students.email, email))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = user[0];
      const firebaseUid = userData.firebaseUid;

      console.log(`Admin reset requested for user: ${email} (Firebase UID: ${firebaseUid})`);

      // Clear app builder progress if it exists
      try {
        const { appBuilderProgress } = await import("../../../shared/schema");
        await db
          .delete(appBuilderProgress)
          .where(eq(appBuilderProgress.firebaseUid, firebaseUid));
        console.log(`Cleared app builder progress for ${email}`);
      } catch (progressError) {
        console.log("No app builder progress to clear or error:", progressError);
      }

      // Clear any video generation state (localStorage is client-side, but we can clear server data)
      // Reset usage if exists
      try {
        const { usageService } = await import("../../services/usage/usage.service");
        usageService.resetUsage(firebaseUid);
        console.log(`Reset video usage for ${email}`);
      } catch (usageError) {
        console.log("No usage data to reset or error:", usageError);
      }

      // Note: Session clearing happens client-side when user refreshes/logs out
      
      res.json({
        success: true,
        message: `Successfully reset data for ${email}`,
        clearedData: {
          appBuilderProgress: true,
          videoUsage: true,
          note: "User should clear browser data (localStorage/cookies) and log back in for complete reset"
        }
      });

    } catch (error) {
      console.error("Reset user error:", error);
      res.status(500).json({ 
        error: "Failed to reset user data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
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
      }
      // REMOVED: Legacy system fallback that was incorrectly assigning TestFacilitator
      // New users should start with no assigned facilitator and manually select one

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

      // Rate limiting: Check if user is making requests too frequently
      const userId = req.session.user.uid;
      const currentTime = Date.now();
      const lastRequestTime = userRateLimit.get(userId);
      
      if (lastRequestTime && (currentTime - lastRequestTime) < (RATE_LIMIT_WINDOW_SECONDS * 1000)) {
        const waitTime = Math.ceil((RATE_LIMIT_WINDOW_SECONDS * 1000 - (currentTime - lastRequestTime)) / 1000);
        return res.status(429).json({
          error: "Please wait before generating another video",
          retryAfter: waitTime
        });
      }

      // Update rate limit timestamp
      userRateLimit.set(userId, currentTime);

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
        console.error("Video status check: User not authenticated");
        return res
          .status(401)
          .json({ error: "Not authenticated" });
      }

      const { jobId } = req.params;

      if (!jobId) {
        console.error("Video status check: Missing job ID");
        const response: GenerateVideoResponse = {
          jobId: "",
          status: "failed",
          error: "Job ID is required",
        };
        return res.status(400).json(response);
      }

      // FIXED: Decode the URL-encoded job ID
      const decodedJobId = decodeURIComponent(jobId);
      console.log("Status check for operation:", decodedJobId, "for user:", req.session.user.email);

      let result;
      let credentialsSource = "none";

      try {
        // NEW: Get student-specific facilitator credentials for status check
        const facilitatorCredentials = await facilitatorService.getCredentialsForStudent(
          req.session.user.email
        );

        if (facilitatorCredentials) {
          credentialsSource = "database";
          console.log("Using database facilitator credentials for status check");
          // Use custom client with student's facilitator credentials
          const customVertexClient = createVertexAIClient(facilitatorCredentials);
          result = await customVertexClient.checkJobStatus(decodedJobId);
        } else if (req.session.facilitator?.name) {
          // Fallback: Use legacy facilitator credentials with veoService
          credentialsSource = "legacy";
          console.log("Using legacy facilitator credentials for status check:", req.session.facilitator.name);
          const apiKey = facilitatorService.getFacilitatorApiKey(req.session.facilitator.name);
          if (apiKey && facilitatorService.isValidFacilitator(req.session.facilitator.name)) {
            result = await veoService.checkJobStatus(decodedJobId);
          } else {
            throw new Error("Invalid or missing legacy facilitator API key");
          }
        } else {
          credentialsSource = "default";
          // Final fallback: Use veoService
          console.warn("No facilitator credentials found for student, using default veoService");
          result = await veoService.checkJobStatus(decodedJobId);
        }
      } catch (credentialsError) {
        console.error("Error getting facilitator credentials:", credentialsError);
        // Try veoService as final fallback
        credentialsSource = "fallback";
        console.log("Attempting status check with veoService as fallback");
        result = await veoService.checkJobStatus(decodedJobId);
      }

      // Log only essential status info, not the massive video data
      console.log("Status check result:", {
        jobId: result.jobId,
        status: result.status,
        videoUrl: result.videoUrl || 'none',
        hasError: !!result.error,
        credentialsSource
      });

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
      console.error("Video status check error:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        jobId: req.params.jobId,
        userEmail: req.session.user?.email
      });
      // Enhanced error response with structured information
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const response: GenerateVideoResponse = {
        jobId: req.params.jobId || "",
        status: "failed",
        error: `Status check failed: ${errorMessage}`,
        errorCode: error instanceof Error && errorMessage.includes('facilitator') ? 'FACILITATOR_ERROR' : 
                  error instanceof Error && errorMessage.includes('credentials') ? 'CREDENTIALS_ERROR' : 
                  error instanceof Error && errorMessage.includes('Not authenticated') ? 'AUTH_ERROR' : 
                  'UNKNOWN_ERROR'
      };
      res.status(500).json(response);
    }
  });

  return router;
}
