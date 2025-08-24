import { Router } from "express";
import { SchoolsController } from "server/controller/schools.controller";

export function registerSchoolRoutes(router: Router) {
  const schoolsRouter = Router();

  schoolsRouter.post("/", async (req, res, next) => {
    try {
      const row = await SchoolsController.create(req.body);

      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  });

  schoolsRouter.get("/", async (req, res, next) => {
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

      const result = await SchoolsController.find({
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
      next(err);
    }
  });

  schoolsRouter.get("/:id", async (req, res, next) => {
    try {
      const row = await SchoolsController.findById(Number(req.params.id));

      if (!row) return res.status(404).json({ message: "Not found" });

      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  schoolsRouter.patch("/:id", async (req, res, next) => {
    try {
      const row = await SchoolsController.update(
        Number(req.params.id),
        req.body,
      );

      if (!row) return res.status(404).json({ message: "Not found" });

      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  schoolsRouter.delete("/:id", async (req, res, next) => {
    try {
      const hard = req.query.hard === "true";

      const result = await SchoolsController.delete(Number(req.params.id), {
        hard,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.use("/schools", schoolsRouter);
}
