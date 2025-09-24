import { Router } from "express";
import { submitProject } from "./api/video-submissions";
import { db } from "../db";
import { videoSubmissions, tracksStudents } from "../../shared/schema";
import { eq } from "drizzle-orm";

export function registerVideoSubmissionsRoutes(): Router {
  const router = Router();
  
  // POST /api/video-submissions/submit
  router.post('/submit', submitProject);
  
  // GET /api/video-submissions/gallery
  router.get('/gallery', async (req, res) => {
    try {
      console.log('Fetching video submissions for gallery...');
      
      // Join video_submissions with tracks_students on email
      const submissions = await db
        .select({
          id: videoSubmissions.id,
          projectName: videoSubmissions.projectName,
          link: videoSubmissions.link,
          submittedAt: videoSubmissions.submittedAt,
          studentName: tracksStudents.studentName,
          grade: tracksStudents.grade,
          school: tracksStudents.school
        })
        .from(videoSubmissions)
        .innerJoin(tracksStudents, eq(videoSubmissions.email, tracksStudents.studentEmail))
        .orderBy(videoSubmissions.submittedAt);

      console.log(`Found ${submissions.length} video submissions with student data`);
      
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching video submissions gallery:', error);
      res.status(500).json({ error: 'Failed to fetch video submissions' });
    }
  });
  
  return router;
}