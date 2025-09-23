import { Router, Request, Response } from "express";
import { z } from "zod";
import { facilitatorService } from "../../services/facilitator/facilitator.service";
import { credentialValidatorService } from "../../services/validation/credential-validator.service";

/**
 * Admin routes for managing facilitator credentials and student assignments
 * These routes should be protected in production with proper admin authentication
 */

// Validation schemas
const FacilitatorUploadZ = z.object({
  facilitators: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      projectId: z.string().min(1, "Project ID is required"),
      location: z.string().default("us-central1"),
      serviceAccountJson: z.string().min(1, "Service account JSON is required"),
    })
  ),
});

const StudentAssignmentUploadZ = z.object({
  assignments: z.array(
    z.object({
      studentEmail: z.string().email("Valid email required"),
      facilitatorName: z.string().min(1, "Facilitator name is required"),
    })
  ),
});

const SingleAssignmentZ = z.object({
  studentEmail: z.string().email("Valid email required"),
  facilitatorName: z.string().min(1, "Facilitator name is required"),
});

const UpdateCredentialsZ = z.object({
  name: z.string().min(1, "Name is required"),
  projectId: z.string().min(1, "Project ID is required"),
  location: z.string().min(1, "Location is required"),
  serviceAccountJson: z.string().min(1, "Service account JSON is required"),
});

export function registerAdminRoutes(): Router {
  const router = Router();

  /**
   * POST /api/video-flow/admin/facilitators
   * Bulk upload facilitator credentials (encrypted storage)
   */
  router.post("/facilitators", async (req: Request, res: Response) => {
    try {
      const parseResult = FacilitatorUploadZ.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: parseResult.error.errors,
        });
      }

      const { facilitators } = parseResult.data;
      const results: Array<{ name: string; success: boolean; error?: string }> = [];

      for (const facilitator of facilitators) {
        try {
          // Validate service account JSON format
          JSON.parse(facilitator.serviceAccountJson);

          await facilitatorService.addFacilitator({
            name: facilitator.name,
            projectId: facilitator.projectId,
            location: facilitator.location,
            serviceAccountJson: facilitator.serviceAccountJson,
          });

          results.push({
            name: facilitator.name,
            success: true,
          });
        } catch (error) {
          console.error(`Failed to add facilitator ${facilitator.name}:`, error);
          results.push({
            name: facilitator.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.json({
        message: `Processed ${results.length} facilitators: ${successCount} successful, ${failureCount} failed`,
        results,
      });
    } catch (error) {
      console.error("Facilitator upload error:", error);
      res.status(500).json({
        error: "Failed to upload facilitators",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/video-flow/admin/assignments
   * Bulk upload student-facilitator assignments
   */
  router.post("/assignments", async (req: Request, res: Response) => {
    try {
      const parseResult = StudentAssignmentUploadZ.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: parseResult.error.errors,
        });
      }

      const { assignments } = parseResult.data;
      const results: Array<{ studentEmail: string; success: boolean; error?: string }> = [];

      for (const assignment of assignments) {
        try {
          await facilitatorService.assignStudentToFacilitatorByName(
            assignment.studentEmail,
            assignment.facilitatorName
          );

          results.push({
            studentEmail: assignment.studentEmail,
            success: true,
          });
        } catch (error) {
          console.error(`Failed to assign ${assignment.studentEmail}:`, error);
          results.push({
            studentEmail: assignment.studentEmail,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.json({
        message: `Processed ${results.length} assignments: ${successCount} successful, ${failureCount} failed`,
        results,
      });
    } catch (error) {
      console.error("Student assignment upload error:", error);
      res.status(500).json({
        error: "Failed to upload student assignments",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/video-flow/admin/assignment
   * Add or update a single student assignment
   */
  router.post("/assignment", async (req: Request, res: Response) => {
    try {
      const parseResult = SingleAssignmentZ.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: parseResult.error.errors,
        });
      }

      const { studentEmail, facilitatorName } = parseResult.data;

      await facilitatorService.assignStudentToFacilitatorByName(
        studentEmail,
        facilitatorName
      );

      res.json({
        message: `Successfully assigned ${studentEmail} to ${facilitatorName}`,
        assignment: {
          studentEmail,
          facilitatorName,
        },
      });
    } catch (error) {
      console.error("Single assignment error:", error);
      res.status(500).json({
        error: "Failed to create assignment",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/video-flow/admin/facilitators
   * List all facilitators (without sensitive credentials)
   */
  router.get("/facilitators", async (req: Request, res: Response) => {
    try {
      const facilitators = await facilitatorService.getAllFacilitators();
      
      // Return facilitator info without sensitive credentials
      const sanitizedFacilitators = facilitators.map((f: any) => ({
        id: f.id,
        name: f.name,
        projectId: f.projectId,
        location: f.location,
        createdAt: f.createdAt,
        // Don't return encrypted service account data
      }));

      res.json({
        facilitators: sanitizedFacilitators,
        count: facilitators.length,
      });
    } catch (error) {
      console.error("Failed to get facilitators:", error);
      res.status(500).json({
        error: "Failed to retrieve facilitators",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/video-flow/admin/assignments
   * List all student assignments
   */
  router.get("/assignments", async (req: Request, res: Response) => {
    try {
      const assignments = await facilitatorService.getAllStudentAssignments();

      res.json({
        assignments,
        count: assignments.length,
      });
    } catch (error) {
      console.error("Failed to get assignments:", error);
      res.status(500).json({
        error: "Failed to retrieve assignments",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * DELETE /api/video-flow/admin/assignment/:email
   * Remove a student assignment
   */
  router.delete("/assignment/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      
      if (!email || !email.includes("@")) {
        return res.status(400).json({
          error: "Valid email is required",
        });
      }

      await facilitatorService.removeStudentAssignment(email);

      res.json({
        message: `Successfully removed assignment for ${email}`,
      });
    } catch (error) {
      console.error("Failed to remove assignment:", error);
      res.status(500).json({
        error: "Failed to remove assignment",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * DELETE /api/video-flow/admin/facilitator/:name
   * Remove a facilitator and all their assignments
   */
  router.delete("/facilitator/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      
      if (!name) {
        return res.status(400).json({
          error: "Facilitator name is required",
        });
      }

      await facilitatorService.removeFacilitator(name);

      res.json({
        message: `Successfully removed facilitator ${name} and all associated assignments`,
      });
    } catch (error) {
      console.error("Failed to remove facilitator:", error);
      res.status(500).json({
        error: "Failed to remove facilitator",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/video-flow/admin/status
   * Get overall system status and statistics
   */
  router.get("/status", async (req: Request, res: Response) => {
    try {
      const facilitators = await facilitatorService.getAllFacilitators();
      const assignments = await facilitatorService.getAllStudentAssignments();

      // Group assignments by facilitator
      const assignmentsByFacilitator = assignments.reduce((acc: Record<string, string[]>, assignment: any) => {
        const facilitatorName = assignment.facilitatorName;
        if (!acc[facilitatorName]) {
          acc[facilitatorName] = [];
        }
        acc[facilitatorName].push(assignment.studentEmail);
        return acc;
      }, {} as Record<string, string[]>);

      res.json({
        statistics: {
          totalFacilitators: facilitators.length,
          totalAssignments: assignments.length,
          assignmentsByFacilitator,
        },
        systemStatus: "operational",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to get admin status:", error);
      res.status(500).json({
        error: "Failed to retrieve system status",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * PATCH /api/video-flow/admin/facilitator/:id/credentials
   * Update/fix corrupted credentials for a specific facilitator with validation
   */
  router.patch("/facilitator/:id/credentials", async (req: Request, res: Response) => {
    try {
      const facilitatorId = parseInt(req.params.id);
      if (isNaN(facilitatorId)) {
        return res.status(400).json({ error: "Invalid facilitator ID" });
      }

      const parseResult = UpdateCredentialsZ.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: parseResult.error.errors,
        });
      }

      const { name, projectId, location, serviceAccountJson } = parseResult.data;

      // First, validate the credentials before storing
      console.log(`🔍 Validating new credentials for facilitator ID ${facilitatorId} (${name})...`);
      const validationResult = await credentialValidatorService.validateCredentialsData(
        projectId,
        location,
        serviceAccountJson
      );

      if (!validationResult.isValid) {
        return res.status(400).json({
          error: "Credential validation failed",
          validationError: validationResult.errorMessage,
          errorType: validationResult.errorType,
        });
      }

      // Update the facilitator credentials using the facilitator service
      await facilitatorService.updateFacilitatorCredentials(facilitatorId, {
        name,
        projectId,
        location,
        serviceAccountJson,
      });

      console.log(`✅ Successfully updated credentials for facilitator ${name} (ID: ${facilitatorId})`);

      res.json({
        message: `Successfully updated and validated credentials for facilitator ${name}`,
        facilitatorId,
        validated: true,
        validatedAt: validationResult.validatedAt,
      });
    } catch (error) {
      console.error("Failed to update facilitator credentials:", error);
      res.status(500).json({
        error: "Failed to update facilitator credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/video-flow/admin/facilitator/:id/validate
   * Validate credentials for a specific facilitator
   */
  router.post("/facilitator/:id/validate", async (req: Request, res: Response) => {
    try {
      const facilitatorId = parseInt(req.params.id);
      if (isNaN(facilitatorId)) {
        return res.status(400).json({ error: "Invalid facilitator ID" });
      }

      // Get facilitator info
      const facilitators = await facilitatorService.getAllFacilitators();
      const facilitator = facilitators.find((f: any) => f.id === facilitatorId);
      
      if (!facilitator) {
        return res.status(404).json({ error: "Facilitator not found" });
      }

      console.log(`🔍 Validating credentials for facilitator ${facilitator.name} (ID: ${facilitatorId})...`);
      
      const validationResult = await credentialValidatorService.validateFacilitator(
        facilitatorId,
        facilitator.name
      );

      const statusCode = validationResult.isValid ? 200 : 400;
      
      res.status(statusCode).json({
        facilitatorId,
        facilitatorName: facilitator.name,
        validation: validationResult,
      });
    } catch (error) {
      console.error("Failed to validate facilitator:", error);
      res.status(500).json({
        error: "Failed to validate facilitator",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/video-flow/admin/validate-all
   * Validate credentials for ALL active facilitators
   */
  router.post("/validate-all", async (req: Request, res: Response) => {
    try {
      console.log("🚀 Starting comprehensive validation of all facilitator credentials...");
      
      const validationReport = await credentialValidatorService.validateAllFacilitators();

      const statusCode = validationReport.invalidCount === 0 ? 200 : 207; // 207 Multi-Status

      res.status(statusCode).json({
        message: validationReport.invalidCount === 0 
          ? "All facilitator credentials are valid! 🎉" 
          : `Found ${validationReport.invalidCount} facilitators with invalid credentials`,
        report: validationReport,
      });
    } catch (error) {
      console.error("Failed to validate all facilitators:", error);
      res.status(500).json({
        error: "Failed to validate facilitator credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/video-flow/admin/validation-report
   * Get the latest validation report from cache
   */
  router.get("/validation-report", (req: Request, res: Response) => {
    try {
      const report = credentialValidatorService.getLastReport();
      
      if (!report) {
        return res.status(404).json({
          error: "No validation report available",
          message: "Run POST /api/video-flow/admin/validate-all first to generate a report",
        });
      }

      res.json({
        message: "Latest validation report",
        report,
      });
    } catch (error) {
      console.error("Failed to get validation report:", error);
      res.status(500).json({
        error: "Failed to retrieve validation report",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}