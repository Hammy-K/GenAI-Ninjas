import type { Router } from "express";
import { db } from "../db";
import {
  projectSubmissions,
  projectSubmissionVotes,
  tracksStudents,
} from "../../shared/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
console.log("📦 PROJECT SUBMISSIONS MODULE LOADED");

export function registerProjectSubmissionsRoutes(router: Router) {
  console.log("🔵 REGISTERING PROJECT SUBMISSIONS ROUTES");

  // POST /project-submissions - Create new submission (public endpoint)
  router.post("/project-submissions", async (req, res) => {
    console.log("🟢 PROJECT SUBMISSIONS POST ENDPOINT HIT");
    console.log("🟢 Request body:", JSON.stringify(req.body));
    console.log("🟢 Request headers:", JSON.stringify(req.headers));
    try {
      const { user_id, user_name, mission_id, project_id, project_name, url } =
        req.body;

      // Validate required fields
      if (
        !user_id ||
        !user_name ||
        !mission_id ||
        !project_id ||
        !project_name ||
        !url
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Missing required fields: user_id, user_name, mission_id, project_id, project_name, url",
        });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          ok: false,
          error: "Invalid URL format",
        });
      }

      // Insert submission
      const [submission] = await db
        .insert(projectSubmissions)
        .values({
          userId: user_id,
          userName: user_name,
          missionId: mission_id,
          projectId: project_id,
          projectName: project_name,
          url: url,
        })
        .returning();

      console.log("✅ Project submission created:", submission.id);

      return res.json({
        ok: true,
        submission: {
          id: submission.id,
          user_id: submission.userId,
          user_name: submission.userName,
          mission_id: submission.missionId,
          project_id: submission.projectId,
          project_name: submission.projectName,
          url: submission.url,
          created_at: submission.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Submission creation error:", error);
      return res.status(500).json({
        ok: false,
        error: "Failed to create submission",
      });
    }
  });

  // GET /project-submissions/gallery - Get submissions with student info and votes
  router.get("/project-submissions/gallery", async (req, res) => {
    console.log("🎨 GALLERY ROUTE HIT!");
    try {
      const { mission_id } = req.query;

      // Build query with LEFT JOIN to tracks_students
      let query = db
        .select({
          id: projectSubmissions.id,
          userId: projectSubmissions.userId,
          userName: projectSubmissions.userName,
          missionId: projectSubmissions.missionId,
          projectId: projectSubmissions.projectId,
          projectName: projectSubmissions.projectName,
          url: projectSubmissions.url,
          createdAt: projectSubmissions.createdAt,
          school: tracksStudents.school,
          supervisor: tracksStudents.supervisor,
          gender: tracksStudents.gender,
          grade: tracksStudents.grade,
        })
        .from(projectSubmissions)
        .leftJoin(
          tracksStudents,
          eq(
            sql`CAST(${projectSubmissions.userId} AS INTEGER)`,
            tracksStudents.userId,
          ),
        );

      // Filter by mission if provided
      if (mission_id && typeof mission_id === "string") {
        query = query.where(
          eq(projectSubmissions.missionId, mission_id),
        ) as any;
      }

      const submissions = await query
        .orderBy(desc(projectSubmissions.createdAt))
        .limit(1000);

      // Get vote counts
      const submissionIds = submissions.map((s) => s.id);
      const votes =
        submissionIds.length > 0
          ? await db
              .select({
                submissionId: projectSubmissionVotes.submissionId,
                voteType: projectSubmissionVotes.voteType,
                count: sql<number>`count(*)::int`,
              })
              .from(projectSubmissionVotes)
              .where(
                inArray(projectSubmissionVotes.submissionId, submissionIds),
              )
              .groupBy(
                projectSubmissionVotes.submissionId,
                projectSubmissionVotes.voteType,
              )
          : [];

      // Format response
      const submissionsWithVotes = submissions.map((s) => {
        const heartVotes =
          votes.find((v) => v.submissionId === s.id && v.voteType === "heart")
            ?.count || 0;
        const funnyVotes =
          votes.find((v) => v.submissionId === s.id && v.voteType === "funny")
            ?.count || 0;

        return {
          id: s.id,
          user_id: s.userId,
          user_name: s.userName,
          mission_id: s.missionId,
          project_id: s.projectId,
          project_name: s.projectName,
          url: s.url,
          created_at: s.createdAt,
          school_name: s.school,
          facilitator_name: s.supervisor,
          gender: s.gender,
          grade: s.grade,
          votes: {
            heart: heartVotes,
            funny: funnyVotes,
          },
        };
      });

      return res.json({
        ok: true,
        submissions: submissionsWithVotes,
      });
    } catch (error: any) {
      console.error("Failed to fetch gallery submissions:", error);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch gallery submissions",
      });
    }
  });

  // GET /project-submissions - Get all submissions
  router.get("/project-submissions", async (req, res) => {
    try {
      const { mission_id, user_id } = req.query;

      let query = db.select().from(projectSubmissions);

      // Filter by mission_id if provided
      if (mission_id && typeof mission_id === "string") {
        query = query.where(
          eq(projectSubmissions.missionId, mission_id),
        ) as any;
      }

      // Filter by user_id if provided
      if (user_id && typeof user_id === "string") {
        query = query.where(eq(projectSubmissions.userId, user_id)) as any;
      }

      const submissions = await query
        .orderBy(desc(projectSubmissions.createdAt))
        .limit(1000);

      return res.json({
        ok: true,
        submissions: submissions.map((s) => ({
          id: s.id,
          user_id: s.userId,
          user_name: s.userName,
          mission_id: s.missionId,
          project_id: s.projectId,
          project_name: s.projectName,
          url: s.url,
          created_at: s.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Failed to fetch submissions:", error);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch submissions",
      });
    }
  });

  // GET /project-submissions/:id - Get single submission
  router.get("/project-submissions/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const [submission] = await db
        .select()
        .from(projectSubmissions)
        .where(eq(projectSubmissions.id, parseInt(id)))
        .limit(1);

      if (!submission) {
        return res.status(404).json({
          ok: false,
          error: "Submission not found",
        });
      }

      return res.json({
        ok: true,
        submission: {
          id: submission.id,
          user_id: submission.userId,
          user_name: submission.userName,
          mission_id: submission.missionId,
          project_id: submission.projectId,
          project_name: submission.projectName,
          url: submission.url,
          created_at: submission.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Failed to fetch submission:", error);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch submission",
      });
    }
  });

  // POST /project-submissions/:id/vote - Vote on a submission
  router.post("/project-submissions/:id/vote", async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, vote_type } = req.body; // user_id is now email

      if (!user_id || !vote_type) {
        return res.status(400).json({
          ok: false,
          error: "Missing required fields: user_id, vote_type",
        });
      }

      if (!["heart", "funny"].includes(vote_type)) {
        return res.status(400).json({
          ok: false,
          error: "vote_type must be 'heart' or 'funny'",
        });
      }

      // Check if user already voted this type on this submission
      const existingVote = await db
        .select()
        .from(projectSubmissionVotes)
        .where(
          sql`${projectSubmissionVotes.submissionId} = ${parseInt(id)} AND ${projectSubmissionVotes.userId} = ${user_id} AND ${projectSubmissionVotes.voteType} = ${vote_type}`,
        )
        .limit(1);

      if (existingVote.length > 0) {
        // Remove vote (toggle)
        await db
          .delete(projectSubmissionVotes)
          .where(eq(projectSubmissionVotes.id, existingVote[0].id));

        return res.json({
          ok: true,
          action: "removed",
        });
      } else {
        // Add vote
        await db.insert(projectSubmissionVotes).values({
          submissionId: parseInt(id),
          userId: user_id, // Store email as string
          voteType: vote_type,
        });

        return res.json({
          ok: true,
          action: "added",
        });
      }
    } catch (error: any) {
      console.error("Failed to vote:", error);
      return res.status(500).json({
        ok: false,
        error: "Failed to vote",
      });
    }
  });

  // DELETE /project-submissions/:id - Delete submission
  router.delete("/project-submissions/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const [deleted] = await db
        .delete(projectSubmissions)
        .where(eq(projectSubmissions.id, parseInt(id)))
        .returning();

      if (!deleted) {
        return res.status(404).json({
          ok: false,
          error: "Submission not found",
        });
      }

      return res.json({
        ok: true,
        message: "Submission deleted successfully",
      });
    } catch (error: any) {
      console.error("Failed to delete submission:", error);
      return res.status(500).json({
        ok: false,
        error: "Failed to delete submission",
      });
    }
  });
}
