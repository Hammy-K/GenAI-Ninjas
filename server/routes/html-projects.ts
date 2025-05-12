import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { htmlProjects } from "@shared/schema";

export function registerHTMLProjectsRoutes(router: Router) {
  const htmlProjectsRouter = Router();

  // Get all submissions
  htmlProjectsRouter.get(
    "/submissions",
    async (req: Request, res: Response) => {
      try {
        // Get all projects using the storage interface
        const submissions = await storage.getAllHtmlProjects();

        // Set content type to JSON explicitly
        res.setHeader("Content-Type", "application/json");

        return res.status(200).json(submissions);
      } catch (error) {
        console.error("Error fetching HTML projects submissions:", error);

        // Ensure error response is also JSON
        return res.status(500).json({
          error: "Failed to fetch submissions",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Get a single project by ID
  htmlProjectsRouter.get(
    "/:projectId",
    async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;
        const project = await storage.getHtmlProjectByProjectId(projectId);

        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

        return res.status(200).json(project);
      } catch (error) {
        console.error("Error fetching HTML project:", error);
        return res.status(500).json({
          error: "Failed to fetch project",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  router.use("/html-projects", htmlProjectsRouter);
}
