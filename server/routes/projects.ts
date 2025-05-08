/**
 * Project Routes
 * Handles all project operations including HTML storage in Neon DB
 * (formerly Firebase Firestore operations)
 */
import { Router, Request, Response } from 'express';
import { Session } from 'express-session';
import path from 'path';
import { logEvent, logError } from '../services/logging';
import { z } from 'zod';
import { storage } from '../storage';

// Extended session interface to include firebaseUid
interface RequestWithFirebaseSession extends Request {
  session: Session & {
    firebaseUid?: string;
  };
}

// Validation schemas
const saveProjectSchema = z.object({
  html: z.string().min(1)
});

const loadProjectSchema = z.object({
  projectId: z.string().min(1)
});

export function registerProjectRoutes(router: Router) {
  // Keep function name for backward compatibility, but update the routes
  const projectRoutes = Router();

  // Firebase test routes endpoint
  projectRoutes.get("/firebase-test", (req: Request, res: Response) => {
    res.sendFile("firebase-web-test.html", { root: path.resolve() });
  });

  // Save project to database
  projectRoutes.post("/save-project", async (req: Request, res: Response) => {
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
      
      // Generate a unique project ID with the same format for URL compatibility
      const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Get Firebase UID from body if available (optional)
      const firebaseUid = req.body.firebaseUid;
      
      // Save project to PostgreSQL
      await storage.createHtmlProject({
        projectId,
        html,
        firebaseUid
      });
      
      // Log the success
      logEvent('project_save', 'Project saved to Neon DB', {
        project_id: projectId,
        html_length: html.length
      });
      
      return res.json({ projectId });
    } catch (error) {
      logError('project_save', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to save project" });
    }
  });

  // Load project from database
  projectRoutes.get("/load-project/:projectId", async (req: Request, res: Response) => {
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
      
      // Load the project from PostgreSQL
      const project = await storage.getHtmlProjectByProjectId(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check the Accept header to determine response format
      const acceptHeader = req.headers.accept || '';
      
      // If client accepts HTML, send raw HTML content directly
      if (acceptHeader.includes('text/html')) {
        // Log the success
        logEvent('project_load', 'HTML project loaded directly', {
          project_id: projectId
        });
        
        // Set content type to HTML and send it directly
        res.setHeader('Content-Type', 'text/html');
        return res.send(project.html);
      }
      
      // Otherwise, return JSON for backward compatibility
      const response = {
        id: project.projectId,
        html: project.html,
        createdAt: project.createdAt.toISOString()
      };
      
      // Log the success
      logEvent('project_load', 'Project loaded from Neon DB', {
        project_id: projectId
      });
      
      return res.json(response);
    } catch (error) {
      logError('project_load', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to load project" });
    }
  });

  // Mount project routes
  router.use('/', projectRoutes);
}