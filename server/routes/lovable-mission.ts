/**
 * Lovable Mission Routes
 * Handles progress tracking and submission for the Lovable mission
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { storage } from '../storage';
import { logEvent } from '../services';
import { eq } from 'drizzle-orm';
import { 
  lovableMissionProgress, 
  lovableMissionChatHistory 
} from '@shared/schema';

// Define validation schemas
const submitLinkSchema = z.object({
  projectLink: z.string().url().includes('lovable.dev'),
  firebaseUid: z.string().min(1),
});

const updateProgressSchema = z.object({
  firebaseUid: z.string().min(1),
  currentStep: z.number().int().min(1).max(7).optional(),
  checklistItems: z.array(
    z.object({
      id: z.number().int(),
      completed: z.boolean(),
    })
  ).optional(),
});

const addChatMessageSchema = z.object({
  firebaseUid: z.string().min(1),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
});

// Register Lovable Mission routes
export function registerLovableMissionRoutes(router: Router) {
  const lovableMissionRouter = Router();

  // Get user progress
  lovableMissionRouter.get('/progress', async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.query.firebaseUid as string;
      
      if (!firebaseUid) {
        return res.status(400).json({ error: 'Firebase UID is required' });
      }
      
      // Get user ID from Firebase UID
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get progress
      const progress = await storage.getLovableMissionProgressByFirebaseUid(firebaseUid);
      
      if (!progress) {
        return res.status(200).json({ 
          progress: null,
          message: 'No progress found'
        });
      }
      
      // Get chat history
      const chatHistory = await storage.getLovableMissionChatHistoryByProgressId(progress.id);
      
      return res.status(200).json({
        progress,
        chatHistory,
      });
      
    } catch (error) {
      console.error('Error fetching Lovable Mission progress:', error);
      return res.status(500).json({ error: 'Failed to fetch progress' });
    }
  });

  // Update progress
  lovableMissionRouter.post('/progress', async (req: Request, res: Response) => {
    try {
      const result = updateProgressSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: result.error.errors,
        });
      }
      
      const { firebaseUid, currentStep, checklistItems } = result.data;
      
      // Get user ID from Firebase UID
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get or create progress
      let progress = await storage.getLovableMissionProgressByFirebaseUid(firebaseUid);
      
      if (!progress) {
        // Create new progress
        progress = await storage.createLovableMissionProgress({
          userId: user.id,
          firebaseUid,
          currentStep: currentStep || 1,
        });
      } else {
        // Update existing progress
        const updates: any = {};
        
        if (currentStep !== undefined) {
          updates.currentStep = currentStep;
        }
        
        if (Object.keys(updates).length > 0) {
          progress = await storage.updateLovableMissionProgress(progress.id, updates);
        }
      }
      
      // Log the event
      logEvent('lovable_mission_progress_updated', 'Progress updated', {
        user_id: user.id,
        firebase_uid: firebaseUid,
        current_step: currentStep,
      });
      
      return res.status(200).json({
        progress,
        message: 'Progress updated successfully',
      });
      
    } catch (error) {
      console.error('Error updating Lovable Mission progress:', error);
      return res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  // Submit project link
  lovableMissionRouter.post('/submit', async (req: Request, res: Response) => {
    try {
      const result = submitLinkSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: result.error.errors,
        });
      }
      
      const { projectLink, firebaseUid } = result.data;
      
      // Get user ID from Firebase UID
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get or create progress
      let progress = await storage.getLovableMissionProgressByFirebaseUid(firebaseUid);
      
      if (!progress) {
        // Create new progress
        progress = await storage.createLovableMissionProgress({
          userId: user.id,
          firebaseUid,
          currentStep: 6, // Set to step 6 (submission step)
          hasSubmitted: true,
          projectLink,
        });
      } else {
        // Update existing progress
        progress = await storage.updateLovableMissionProgress(progress.id, {
          hasSubmitted: true,
          projectLink,
          currentStep: Math.max(progress.currentStep || 1, 6), // Ensure step is at least at submission level
        });
      }
      
      // Log the event
      logEvent('lovable_mission_link_submitted', 'Project link submitted', {
        user_id: user.id,
        firebase_uid: firebaseUid,
        project_link: projectLink,
      });
      
      return res.status(200).json({
        progress,
        message: 'Project link submitted successfully',
      });
      
    } catch (error) {
      console.error('Error submitting Lovable Mission project link:', error);
      return res.status(500).json({ error: 'Failed to submit project link' });
    }
  });

  // Add chat message
  lovableMissionRouter.post('/chat', async (req: Request, res: Response) => {
    try {
      const result = addChatMessageSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: result.error.errors,
        });
      }
      
      const { firebaseUid, role, content } = result.data;
      
      // Get user ID from Firebase UID
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get or create progress
      let progress = await storage.getLovableMissionProgressByFirebaseUid(firebaseUid);
      
      if (!progress) {
        // Create new progress
        progress = await storage.createLovableMissionProgress({
          userId: user.id,
          firebaseUid,
          currentStep: 1,
        });
      }
      
      // Add chat message
      const chatMessage = await storage.createLovableMissionChatMessage({
        progressId: progress.id,
        role,
        content,
      });
      
      return res.status(200).json({
        message: 'Chat message added successfully',
        chatMessage,
      });
      
    } catch (error) {
      console.error('Error adding Lovable Mission chat message:', error);
      return res.status(500).json({ error: 'Failed to add chat message' });
    }
  });
  
  // Mount Lovable Mission routes
  router.use('/lovable-mission', lovableMissionRouter);
}