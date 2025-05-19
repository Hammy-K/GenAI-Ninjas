import { Router, Request, Response } from "express";
import { db } from "../db";
import { feedback } from "../schemas/feedback";

export function registerFeedbackRoutes(router: Router) {
  const feedbackRoutes = Router();

  feedbackRoutes.post("/", async (req: Request, res: Response) => {
    const { excitement, firstAiIdea, surprise, studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId in cookie" });
    }

    const studentIdInt = parseInt(studentId, 10);

    try {
      const inserted = await db
        .insert(feedback)
        .values({
          studentId: studentIdInt,
          excitement,
          firstAiIdea,
          surprise,
          createdAt: new Date(),
        })
        .returning();

      res.status(201).json(inserted[0]);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.use("/feedback", feedbackRoutes);
}
