import { Router, Request, Response } from "express";
import { db } from "../db";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { htmlProjects } from "@shared/schema";

htmlProjects;
export function registerHTMLProjectsRoutes(router: Router) {
  const htmlProjectsRouter = Router();

  // Get all submissions
  htmlProjectsRouter.get(
    "/submissions",
    async (req: Request, res: Response) => {
      try {
        const submissions = await db
          .select({
            id: htmlProjects.id,
            projectId: htmlProjects.projectId,
            html: htmlProjects.html,
            firebaseUid: htmlProjects.firebaseUid,
            createdAt: htmlProjects.createdAt,
            updatedAt: htmlProjects.updatedAt,
          })
          .from(htmlProjects)
          .orderBy(htmlProjects.createdAt);

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

  router.use("/html-projects", htmlProjectsRouter);
}
