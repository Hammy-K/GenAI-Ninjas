import { Router } from "express";
import { GenaiSchoolTrainingController } from "server/controller/genai-school-training.controller";

export function registerGenaiSchoolTrainingRoutes(router: Router) {
  const r = Router();

  r.post("/", async (req, res, next) => {
    try {
      const row = await GenaiSchoolTrainingController.create(req.body);

      res.status(201).json(row);
    } catch (err) {
      console.error("Error creating GenaiSchoolTraining:", err);
      next(err);
    }
  });

  r.get("/", async (req, res, next) => {
    try {
      const {
        limit,
        offset,
        orderBy,
        orderDirection,
        search,
        withDeleted,
        ...rest
      } = req.query;

      const result = await GenaiSchoolTrainingController.find({
        where: rest as any,
        search: search as string,
        orderBy: orderBy as any,
        orderDirection: orderDirection as any,
        withDeleted: withDeleted === "true",
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.json(result);
    } catch (err) {
      console.error("Error fetching GenaiSchoolTraining:", err);
      next(err);
    }
  });

  r.get("/:id", async (req, res, next) => {
    try {
      const row = await GenaiSchoolTrainingController.findById(
        Number(req.params.id),
      );

      if (!row) return res.status(404).json({ message: "Not found" });

      res.json(row);
    } catch (err) {
      console.error("Error fetching GenaiSchoolTraining by ID:", err);
      next(err);
    }
  });

  r.patch("/:id", async (req, res, next) => {
    try {
      const row = await GenaiSchoolTrainingController.update(
        Number(req.params.id),
        req.body,
      );

      if (!row) return res.status(404).json({ message: "Not found" });

      res.json(row);
    } catch (err) {
      console.error("Error updating GenaiSchoolTraining:", err);
      next(err);
    }
  });

  r.delete("/:id", async (req, res, next) => {
    try {
      const hard = req.query.hard === "true";

      const result = await GenaiSchoolTrainingController.delete(
        Number(req.params.id),
        { hard },
      );

      res.json(result);
    } catch (err) {
      console.error("Error deleting GenaiSchoolTraining:", err);
      next(err);
    }
  });

  router.use("/genai-school-training", r);
}
