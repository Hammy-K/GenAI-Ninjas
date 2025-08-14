import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { htmlProjects } from "@shared/schema";
import { HtmlProjectRepository } from "../database/html-projects-repository";
import { NormalizedPaginationParams } from "server/types/pagination.types";

export function registerHTMLProjectsRoutes(router: Router) {
  const htmlProjectsRouter = Router();

  // Get all submissions
  htmlProjectsRouter.get(
    "/submissions",
    async (req: Request, res: Response) => {
      try {
        // Get all projects using the storage interface
        // const submissions = await storage.getAllHtmlProjects();

        const {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          filters,
          organization,
        } = req.query;

        const organizationFilter =
          typeof organization === "string" && organization.trim()
            ? organization.trim()
            : "main";

        const submissions =
          await new HtmlProjectRepository().findAllProjectsWithPagination({
            page: page,
            limit: limit,
            search,
            sortBy,
            sortOrder: sortOrder === "desc" ? "desc" : "asc",
            filters: {
              organization: organizationFilter,
            },
          });

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
  htmlProjectsRouter.get("/:projectId", async (req: Request, res: Response) => {
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
  });

  htmlProjectsRouter.post("/featured", async (req: Request, res: Response) => {
    try {
      const organization = req.body.organization || "main";

      const featuredProjects =
        await new HtmlProjectRepository().findFeaturedProjectsByOrganization(
          organization,
        );

      res.status(200).json({
        data: featuredProjects,
        count: featuredProjects.length,
      });
    } catch (error) {
      console.error("Error fetching featured HTML projects:", error);

      res.status(500).json({
        error: "Failed to fetch featured projects",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // htmlProjectsRouter.post("/featured", async (req: Request, res: Response) => {
  //   try {
  //     const { projectIds } = req.body;

  //     if (!projectIds || !Array.isArray(projectIds)) {
  //       return res.status(400).json({
  //         error: "Project IDs array is required",
  //       });
  //     }

  //     const featuredProjects =
  //       await new HtmlProjectRepository().findProjectsByIds(projectIds);

  //     res.setHeader("Content-Type", "application/json");
  //     return res.status(200).json({
  //       data: featuredProjects,
  //       count: featuredProjects.length,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching featured HTML projects:", error);
  //     return res.status(500).json({
  //       error: "Failed to fetch featured projects",
  //       details: error instanceof Error ? error.message : String(error),
  //     });
  //   }
  // });

  router.use("/html-projects", htmlProjectsRouter);
}
