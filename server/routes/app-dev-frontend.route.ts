import { Router } from "express";
import { AppDevFrontendController } from "server/controller/app-dev-frontend.controller";

/**
 * Routes: /app-dev/frontend
 *
 * GET /app-dev/frontend? page & limit & sortBy & sortOrder & search &
 *   userId & organization & mission & isFeatured &
 *   studentName & schoolName & phoneNumber
 */
export function registerAppDevFrontendRoutes(router: Router) {
  const r = Router();

  r.post("/", async (req, res, next) => {
    try {
      const row = await AppDevFrontendController.create(req.body);

      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  });

  r.get("/", async (req, res, next) => {
    try {
      const q = req.query as Record<string, string | undefined>;

      const page = q.page ? Math.max(1, Number(q.page)) : 1;
      const limit = q.limit ? Math.min(200, Math.max(1, Number(q.limit))) : 30;
      const sortBy = (q.sortBy as any) ?? "createdAt";
      const sortOrder = (q.sortOrder === "asc" ? "asc" : "desc") as
        | "asc"
        | "desc";
      const search = q.search;

      const filters = {
        userId: q.userId,
        organization: q.organization,
        mission: q.mission as
          | "inputs-outputs"
          | "buttons-events"
          | "random-selection"
          | "conditional-logic"
          | "layout-design"
          | "dynamic-images"
          | "final-project"
          | undefined,
        isFeatured:
          typeof q.isFeatured === "string"
            ? q.isFeatured === "true"
            : undefined,
        studentName: q.studentName,
        schoolName: q.schoolName,
        phoneNumber: q.phoneNumber,
      };

      const result = await AppDevFrontendController.find({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        filters,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  r.get("/:id", async (req, res, next) => {
    try {
      const id = Number.parseInt(req.params.id);

      const row = await AppDevFrontendController.findById(id);

      if (!row) return res.status(404).json({ message: "Not found" });

      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  r.get("/projects/:projectId", async (req, res, next) => {
    try {
      const { projectId } = req.params;

      const row = await AppDevFrontendController.findByProjectId(projectId);

      if (!row) return res.status(404).json({ message: "Not found" });

      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  r.patch("/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      const row = await AppDevFrontendController.update(id, req.body);

      if (!row) return res.status(404).json({ message: "Not found" });

      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  r.delete("/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      const result = await AppDevFrontendController.delete(id);

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.use("/app-dev/frontend", r);
}
