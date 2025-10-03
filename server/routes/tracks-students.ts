import { Router } from "express";
import { db } from "../db";
import { tracksStudents } from "../../shared/schema";
import { students } from "../schemas/students";
import { appDevFrontend } from "../schemas/app_dev_frontend.schema";
import { eq, inArray, and } from "drizzle-orm";

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

      const tracksStudentsList = await db
        .select({
          supervisor: tracksStudents.supervisor,
          studentEmail: tracksStudents.studentEmail,
        })
        .from(tracksStudents);

      console.log("Tracks students found:", tracksStudentsList.length);

      const supervisorMap = new Map<string, string[]>();

      tracksStudentsList.forEach((student) => {
        if (!student.supervisor) return;

        if (!supervisorMap.has(student.supervisor)) {
          supervisorMap.set(student.supervisor, []);
        }
        supervisorMap.get(student.supervisor)!.push(student.studentEmail);
      });

      console.log("Supervisors found:", supervisorMap.size);

      const leaderboard = [];

      for (const [supervisor, studentEmails] of supervisorMap.entries()) {
        const studentCount = studentEmails.length;

        const studentsInClass = await db
          .select({ id: students.id, email: students.email })
          .from(students)
          .where(inArray(students.email, studentEmails));

        console.log(
          `${supervisor}: Found ${studentsInClass.length} students in students table`,
        );

        let totalVaults = 0;

        if (studentsInClass.length > 0) {
          const studentIds = studentsInClass.map((s) => s.id);

          const submissions = await db
            .select({
              userId: appDevFrontend.userId,
              mission: appDevFrontend.mission,
            })
            .from(appDevFrontend)
            .where(
              and(
                inArray(appDevFrontend.userId, studentIds),
                eq(appDevFrontend.organization, organization),
              ),
            );

          const uniqueCompletions = new Set(
            submissions.map((s) => `${s.userId}-${s.mission}`),
          );
          totalVaults = uniqueCompletions.size;

          console.log(`${supervisor}: ${totalVaults} total vaults completed`);
        }

        const avgVaultsCompleted =
          studentCount > 0 ? totalVaults / studentCount : 0;

        leaderboard.push({
          supervisor,
          avgVaultsCompleted: parseFloat(avgVaultsCompleted.toFixed(2)),
          totalVaults,
          studentCount,
        });
      }

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
