import { Router } from "express";
import { db } from "../db";
import { tracksStudents } from "../../shared/schema";
import { students } from "../schemas/students";
import { appDevFrontend } from "../schemas/app_dev_frontend.schema";
import { eq, inArray, and, sql } from "drizzle-orm";

export function registerTracksStudentsRoutes(): Router {
  const router = Router();

  router.get("/by-email", async (req, res) => {
    try {
      const email = req.query.email as string;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const student = await db
        .select()
        .from(tracksStudents)
        .where(eq(tracksStudents.studentEmail, email))
        .limit(1);

      if (student.length === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json(student[0]);
    } catch (error) {
      console.error("Error fetching student by email:", error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  router.get("/supervisor-leaderboard", async (req, res) => {
    try {
      const organization = req.query.organization as string;
      if (!organization) {
        return res.status(400).json({ error: "Organization is required" });
      }

      // Optimized: Single aggregation query using JOIN and GROUP BY (no N+1 queries)
      // Get all supervisor stats in one query
      const supervisorStatsRaw = await db
        .select({
          supervisor: tracksStudents.supervisor,
          studentCount: sql<number>`COUNT(DISTINCT ${tracksStudents.studentEmail})`,
        })
        .from(tracksStudents)
        .where(sql`${tracksStudents.supervisor} IS NOT NULL`)
        .groupBy(tracksStudents.supervisor);

      console.log("Supervisor stats fetched:", supervisorStatsRaw.length);

      // Now get vault completion stats with a single JOIN query
      const vaultStats = await db
        .select({
          userId: appDevFrontend.userId,
          mission: appDevFrontend.mission,
          studentEmail: tracksStudents.studentEmail,
          supervisor: tracksStudents.supervisor,
        })
        .from(tracksStudents)
        .innerJoin(students, eq(tracksStudents.studentEmail, students.email))
        .innerJoin(
          appDevFrontend,
          and(
            eq(students.id, appDevFrontend.userId),
            eq(appDevFrontend.organization, organization),
          ),
        );

      // Aggregate vault completions by supervisor in JavaScript (data is already filtered)
      const supervisorVaults = new Map<string, Set<string>>();
      vaultStats.forEach((stat) => {
        if (!supervisorVaults.has(stat.supervisor)) {
          supervisorVaults.set(stat.supervisor, new Set());
        }
        supervisorVaults
          .get(stat.supervisor)!
          .add(`${stat.userId}-${stat.mission}`);
      });

      // Transform the results
      const leaderboard = supervisorStatsRaw.map((stat) => {
        const studentCount = stat.studentCount || 0;
        const totalVaults = supervisorVaults.get(stat.supervisor)?.size || 0;
        const avgVaultsCompleted =
          studentCount > 0 ? totalVaults / studentCount : 0;
        const percentageCompleted = (avgVaultsCompleted / 6) * 100;

        return {
          supervisor: stat.supervisor,
          avgVaultsCompleted: parseFloat(avgVaultsCompleted.toFixed(2)),
          percentageCompleted: parseFloat(percentageCompleted.toFixed(2)),
          totalVaults,
          studentCount,
        };
      });

      leaderboard.sort((a, b) => b.avgVaultsCompleted - a.avgVaultsCompleted);
      console.log("Final leaderboard:", leaderboard);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching supervisor leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });
  return router;
}
