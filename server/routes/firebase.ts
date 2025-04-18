/**
 * Firebase Routes
 * Handles all Firebase-related operations including project saving and loading
 */
import { Router, Request, Response } from 'express';
import path from 'path';
import { logEvent, logError } from '../services/logging';
import { z } from 'zod';

// Validation schemas
const saveProjectSchema = z.object({
  html: z.string().min(1)
});

const loadProjectSchema = z.object({
  projectId: z.string().min(1)
});

export function registerFirebaseRoutes(router: Router) {
  const firebaseRoutes = Router();

  // Firebase test routes endpoint
  firebaseRoutes.get("/firebase-test", (req: Request, res: Response) => {
    res.sendFile("firebase-web-test.html", { root: path.resolve() });
  });

  // Save project to Firebase
  firebaseRoutes.post("/save-project", async (req: Request, res: Response) => {
    try {
      // Validate request with Zod
      const validation = saveProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.format()
        });
      }
      
      const { html } = validation.data;
      
      // In the real implementation, we would call an actual Firebase function
      // But for now, we'll stub it with a mock function
      const saveProject = async (html: string) => `project_${Date.now()}`;
      
      // Save the project
      const projectId = await saveProject(html);
      
      // Log the success
      logEvent('firebase_project_save', 'Project saved', {
        project_id: projectId,
        html_length: html.length
      });
      
      return res.json({ projectId });
    } catch (error) {
      logError('firebase_project_save', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to save project" });
    }
  });

  // Load project from Firebase
  firebaseRoutes.get("/load-project/:projectId", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      
      // Validate projectId
      const validation = loadProjectSchema.safeParse({ projectId });
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid project ID',
          details: validation.error.format()
        });
      }
      
      // In the real implementation, we would call an actual Firebase function
      // But for now, we'll stub it with a mock function
      const loadProject = async (projectId: string) => ({
        id: projectId,
        html: '<!DOCTYPE html><html><body><h1>Project ' + projectId + '</h1></body></html>',
        createdAt: new Date().toISOString()
      });
      
      // Load the project
      const project = await loadProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Log the success
      logEvent('firebase_project_load', 'Project loaded', {
        project_id: projectId
      });
      
      return res.json(project);
    } catch (error) {
      logError('firebase_project_load', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to load project" });
    }
  });

  // Mount firebase routes
  router.use('/', firebaseRoutes);
}