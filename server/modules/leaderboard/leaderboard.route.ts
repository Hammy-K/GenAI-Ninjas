import { Router } from "express";
import { LeaderboardController } from "./leaderboard.controller";

export function registerLeaderboardRoutes(router: Router): void {
  const r = Router();

  // Submit a score
  r.post("/submit", async (req, res) => {
    try {
      const { studentName, score, prompt } = req.body;

      if (!studentName || typeof studentName !== "string") {
        return res.status(400).json({ error: "studentName is required" });
      }

      if (typeof score !== "number" || score < 1 || score > 10) {
        return res
          .status(400)
          .json({ error: "score must be a number between 1-10" });
      }

      const result = await LeaderboardController.submitScore(
        studentName.trim(),
        score,
        prompt,
      );

      res.status(201).json(result);
    } catch (err: any) {
      console.error("Submit score error:", err?.message || err);
      res.status(500).json({ error: "Failed to submit score" });
    }
  });

  // Get leaderboard
  r.get("/", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const leaderboard = await LeaderboardController.getLeaderboard(limit);

      res.json({ leaderboard });
    } catch (err: any) {
      console.error("Get leaderboard error:", err?.message || err);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  // Get student's best score
  r.get("/student/:name", async (req, res) => {
    try {
      const studentName = req.params.name;
      const best = await LeaderboardController.getStudentBest(studentName);

      res.json({ best });
    } catch (err: any) {
      console.error("Get student best error:", err?.message || err);
      res.status(500).json({ error: "Failed to get student best" });
    }
  });

  router.use("/leaderboard", r);
}
