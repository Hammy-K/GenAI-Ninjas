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
  html: z.string().min(1),
  firebaseUid: z.string().optional() // Changed from screenshotUrl to firebaseUid
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
      // Validate request with Zod - but use more flexible schema
      const { html } = req.body;
      
      if (!html || typeof html !== 'string') {
        return res.status(400).json({ 
          error: 'Invalid request data: HTML content is required'
        });
      }
      
      // Generate a unique project ID with the same format for URL compatibility
      // Format: project_timestamp_randomstring
      const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Get Firebase UID from body if available (optional)
      const firebaseUid = req.body.firebaseUid || null;
      
      // Log for debugging
      console.log(`Creating project with ID: ${projectId}, Firebase UID: ${firebaseUid || 'none'}`);
      
      // Save project to PostgreSQL
      try {
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
        
        console.log(`Project ${projectId} saved successfully`);
        
        return res.json({ projectId });
      } catch (dbError: any) {
        console.error("Database error saving project:", dbError);
        return res.status(500).json({ 
          error: "Database error saving project", 
          details: dbError?.message || String(dbError) 
        });
      }
    } catch (error) {
      logError('project_save', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to save project" });
    }
  });

  // Load project from database
  projectRoutes.get("/load-project/:projectId", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      
      console.log(`Loading project with ID: ${projectId}`);
      
      // Validate projectId
      const validation = loadProjectSchema.safeParse({ projectId });
      if (!validation.success) {
        console.log(`Invalid project ID format: ${projectId}`);
        return res.status(400).json({ 
          error: 'Invalid project ID',
          details: validation.error.format()
        });
      }
      
      // Load the project from PostgreSQL
      const project = await storage.getHtmlProjectByProjectId(projectId);
      
      if (!project) {
        console.log(`Project not found in database: ${projectId}`);
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Log the loaded project 
      console.log(`Project loaded successfully: ${projectId}`);
      
      // Return in the same format as the previous API for backward compatibility
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

  // Mount project routes under the /projects namespace
  router.use('/projects', projectRoutes);
  
  // Log that routes are mounted
  console.log("Project routes mounted at /api/projects/*");
}