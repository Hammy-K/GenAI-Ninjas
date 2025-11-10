import { Router } from "express";
import { LovableSubmissionsController } from "./lovable-submissions.controller";
import { LovableSubmissionWhere } from "./lovable-submissions.model";
import { validateSubmissionPayload } from "./lovable-submissions.utils";

export function registerLovableSubmissionsRoutes(router: Router): void {
  const r = Router();

  r.post("/", async (req, res) => {
    try {
      const v = validateSubmissionPayload(req.body);

      if (!v.ok) {
        return res.status(400).json({
          error: "invalid_payload",
          userMessage: v.userMessage,
        });
      }

      const payload = { ...req.body, ...v.data };

      const row = await LovableSubmissionsController.create(payload);

      res.status(201).json(row);
    } catch (err: any) {
      console.error("Create submission error:", err?.message || err);
      res.status(500).json({ error: "Create failed" });
    }
  });

  r.patch("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      const row = await LovableSubmissionsController.update(id, req.body);

      if (!row) return res.status(404).json({ error: "Not found" });

      res.json(row);
    } catch (err: any) {
      console.error("Update submission error:", err?.message || err);
      res.status(500).json({ error: "Update failed" });
    }
  });

  r.delete("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      const hard = req.query.hard === "1" || req.query.hard === "true";

      const out = await LovableSubmissionsController.delete(id, { hard });

      res.json(out);
    } catch (err: any) {
      console.error("Delete submission error:", err?.message || err);
      res.status(500).json({ error: "Delete failed" });
    }
  });

  r.get("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      const withDeleted =
        req.query.withDeleted === "1" || req.query.withDeleted === "true";

      const row = await LovableSubmissionsController.findById(id, {
        withDeleted,
      });

      if (!row) return res.status(404).json({ error: "Not found" });

      res.json(row);
    } catch (err: any) {
      console.error("FindById submission error:", err?.message || err);
      res.status(500).json({ error: "Fetch failed" });
    }
  });

  r.get("/", async (req, res) => {
    try {
      // Narrow and validate orderBy to the allowed union type
      const allowedOrderBy = new Set<
        "createdAt" | "updatedAt" | keyof LovableSubmissionWhere
      >([
        "id",
        "studentName",
        "noonCode",
        "schoolName",
        "projectTitle",
        "projectLink",
        "email",
        "createdAt",
        "updatedAt",
      ]);

      const rawOrderBy =
        (req.query.orderBy as string | undefined) ?? "createdAt";

      const orderBy = (
        allowedOrderBy.has(rawOrderBy as any)
          ? (rawOrderBy as any)
          : "createdAt"
      ) as "createdAt" | "updatedAt" | keyof LovableSubmissionWhere;

      const orderDirection: "asc" | "desc" =
        req.query.orderDirection === "asc" ? "asc" : "desc";

      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;
      const search = (req.query.search as string) || undefined;
      const isFeatured = req.query.isFeatured === "true";

      const out = await LovableSubmissionsController.find({
        search,
        limit,
        offset,
        orderBy,
        orderDirection,
        isFeatured,
      });

      res.json(out);
    } catch (err: any) {
      console.error("Find submissions error:", err?.message || err);
      res.status(500).json({ error: "Fetch failed" });
    }
  });

  router.use("/submissions", r);
}
