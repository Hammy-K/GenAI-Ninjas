import { Router } from "express";
import { submitProject } from "./api/video-submissions";

export function registerVideoSubmissionsRoutes(): Router {
  const router = Router();
  
  // POST /api/video-submissions/submit
  router.post('/submit', submitProject);
  
  return router;
}