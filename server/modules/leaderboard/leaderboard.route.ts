import { Router, Response } from "express";
import { LeaderboardController } from "./leaderboard.controller";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendBadRequest,
  sendServerError,
} from "../../middleware/response";

export function registerLeaderboardRoutes(router: Router): void {
  const r = Router();

  // Submit a score
  r.post("/submit", async (req, res: Response) => {
    try {
      const { studentName, score, prompt } = req.body;

      if (!studentName || typeof studentName !== "string") {
        return sendBadRequest(res, "studentName is required");
      }

      if (typeof score !== "number" || score < 1 || score > 10) {
        return sendBadRequest(
          res,
          "score must be a number between 1-10"
        );
      }

      const result = await LeaderboardController.submitScore(
        studentName.trim(),
        score,
        prompt,
      );

      sendCreated(res, result);
    } catch (err: any) {
      console.error("Submit score error:", err?.message || err);
      sendServerError(res, "Failed to submit score");
    }
  });

  // Get leaderboard
  r.get("/", async (req, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const leaderboard = await LeaderboardController.getLeaderboard(limit);

      sendSuccess(res, { leaderboard });
    } catch (err: any) {
      console.error("Get leaderboard error:", err?.message || err);
      sendServerError(res, "Failed to get leaderboard");
    }
  });

  // Get student's best score
  r.get("/student/:name", async (req, res: Response) => {
    try {
      const studentName = req.params.name;
      const best = await LeaderboardController.getStudentScore(studentName);

      sendSuccess(res, { best });
    } catch (err: any) {
      console.error("Get student best error:", err?.message || err);
      sendServerError(res, "Failed to get student best");
    }
  });

  router.use("/leaderboard", r);
}
