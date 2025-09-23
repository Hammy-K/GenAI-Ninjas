import { Router, Request, Response } from "express";
import { z } from "zod";
import { facilitatorService } from "../../services/facilitator/facilitator.service";

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
      serviceAccountJson: z.union([
        z.string().min(1, "Service account JSON is required"),
        z.object({}).passthrough(), // Accept any object structure
      ]).transform((val) => {
        // Normalize to string format
        if (typeof val === 'object') {
          return JSON.stringify(val);
        }
        return val;
      }),
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
          // Validate service account JSON format (already normalized to string by schema transform)
          const serviceAccountObj = JSON.parse(facilitator.serviceAccountJson);
          
          // Basic validation of required service account fields
          if (!serviceAccountObj.type || !serviceAccountObj.project_id || !serviceAccountObj.private_key || !serviceAccountObj.client_email) {
            throw new Error('Invalid service account JSON: missing required fields');
          }

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

  return router;
}