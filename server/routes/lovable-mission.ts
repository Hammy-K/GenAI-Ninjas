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
import { Session } from 'express-session';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { 
  lovableMissionProgress, 
  lovableMissionChatHistory 
} from '@shared/schema';

// Lovable Mission Assistant ID
const LOVABLE_MISSION_ASSISTANT_ID = "asst_L23zNIrbAjmHwouCGGqRr1fA";
const LOVABLE_MISSION_SESSION_PREFIX = 'lovable_mission_';

// Thread Map for session persistence (in-memory for now)
const threadMap = new Map<string, string>();

// Extended request type with session
interface RequestWithLovableMissionSession extends Request {
  session: Session & {
    lovableMissionThreadId?: string;
  };
}

// Define validation schemas
const submitLinkSchema = z.object({
  projectLink: z.string()
    .min(1, { message: "Project link is required" })
    .refine(
      (url) => url.includes('lovable.dev') || url.includes('lovable.app'), 
      { message: "URL must include lovable.dev or lovable.app" }
    ),
  studentName: z.string().min(1, { message: "Student name is required" }).optional(),
  projectType: z.string().refine(
    (val) => ['app', 'game'].includes(val),
    { message: "Project type must be 'app' or 'game'" }
  ).default('app'),
  finalPrompt: z.string().optional(),
  firebaseUid: z.string().optional(),
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

const assistantChatSchema = z.object({
  firebaseUid: z.string().min(1),
  message: z.string().min(1),
  messageHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ).optional(),
  systemPrompt: z.string().optional(),
  threadId: z.string().nullable().optional(),
});

// Register Lovable Mission routes
export function registerLovableMissionRoutes(router: Router, openai?: OpenAI) {
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
      // Debug log the request body
      console.log('Lovable Mission submit request body:', req.body);
      
      const result = submitLinkSchema.safeParse(req.body);
      
      if (!result.success) {
        console.log('Validation errors:', result.error.errors);
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: result.error.errors,
        });
      }
      
      const { projectLink, studentName, firebaseUid, projectType, finalPrompt } = result.data;
      
      // Project metadata to store
      const metadata = {
        projectLink,
        studentName: studentName || "Anonymous Student",
        submittedAt: new Date().toISOString(),
        projectType,
        finalPrompt,
      };
      
      // Create a record in the dedicated lovableSubmissions table
      try {
        await storage.createLovableSubmission({
          projectLink,
          studentName: studentName || "Anonymous Student",
          projectType: projectType || "app", // Default to "app" if not provided
          finalPrompt, // Include the final prompt
          firebaseUid: firebaseUid || undefined,
          // We'll link to the progress record if we find/create one below
          progressId: undefined,
          metadata
        });
      } catch (submissionError) {
        console.error("Error saving to lovableSubmissions table:", submissionError);
        // Continue even if this fails, as we'll still update the progress record
      }
      
      // Store into progress record if firebaseUid is available
      let progress = null;
      let userId = 0;
      
      // Handle both cases: user with Firebase UID and anonymous users
      if (firebaseUid) {
        try {
          // Try to get user and progress, but don't require them
          const user = await storage.getUserByFirebaseUid(firebaseUid);
          
          if (user) {
            userId = user.id;
            progress = await storage.getLovableMissionProgressByFirebaseUid(firebaseUid);
            
            if (progress) {
              // Update existing progress
              progress = await storage.updateLovableMissionProgress(progress.id, {
                hasSubmitted: true,
                projectLink,
                studentName, // Store student name in the database
                currentStep: Math.max(progress.currentStep || 1, 6), // Ensure step is at least at submission level
              });
              
              // Link the submission to this progress record (creates a new submission if the earlier one failed)
              try {
                // This creates a second record, which is fine - we want a history of all submissions
                await storage.createLovableSubmission({
                  progressId: progress.id,
                  projectLink,
                  studentName: studentName || "Anonymous Student",
                  firebaseUid,
                  metadata: {
                    ...metadata,
                    isLinkedToProgress: true
                  }
                });
              } catch (linkError) {
                console.error("Error linking submission to progress:", linkError);
                // This is not critical, continue with the flow
              }
            } else {
              // Create new progress
              progress = await storage.createLovableMissionProgress({
                userId: user.id,
                firebaseUid,
                currentStep: 6, // Set to step 6 (submission step)
                hasSubmitted: true,
                projectLink,
                studentName, // Store student name in the database
              });
            }
          } else {
            // User not found but we have firebaseUid, so we need to create a new user
            try {
              // Create a temporary username based on studentName or a generated ID
              const username = studentName ? 
                `${studentName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}` : 
                `anonymous_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              
              // Create a new user with the firebaseUid
              const newUser = await storage.createUser({
                username,
                password: Math.random().toString(36).substring(2, 15), // Random password
                firebaseUid
              });
              
              userId = newUser.id;
              
              // Create new progress for this user
              progress = await storage.createLovableMissionProgress({
                userId: newUser.id,
                firebaseUid,
                currentStep: 6, // Set to step 6 (submission step)
                hasSubmitted: true,
                projectLink,
                studentName, // Store student name in the database
              });
            } catch (userErr) {
              console.error("Error creating new user:", userErr);
              // Continue without throwing an error
            }
          }
        } catch (err) {
          console.error("Error updating user progress:", err);
          // Continue without throwing an error
        }
      } else {
        // For anonymous submissions (no firebaseUid), create a temporary user and associate the submission
        try {
          // Create a temporary username based on studentName or a generated ID
          const username = studentName ? 
            `${studentName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}` : 
            `anonymous_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          
          // Create an anonymous UID
          const anonymousUID = `anonymous_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          
          // Create a temporary user with the anonymous UID
          const tempUser = await storage.createUser({
            username,
            password: Math.random().toString(36).substring(2, 15), // Random password
            firebaseUid: anonymousUID
          });
          
          userId = tempUser.id;
          
          // Create progress record
          progress = await storage.createLovableMissionProgress({
            userId: tempUser.id,
            firebaseUid: anonymousUID, // Use the same anonymous UID
            currentStep: 6, // Set to step 6 (submission step)
            hasSubmitted: true,
            projectLink,
            studentName, // Store student name in the database
          });
        } catch (anonymousErr) {
          console.error("Error creating anonymous submission:", anonymousErr);
          // Continue without throwing an error
        }
      }
      
      // Log the event
      logEvent('lovable_mission_link_submitted', 'Project link submitted', {
        user_id: userId || 0,
        firebase_uid: firebaseUid || 'anonymous',
        project_link: projectLink,
        student_name: studentName || 'Anonymous',
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
  
  // Assistant chat endpoint using OpenAI Assistant API 
  if (openai) {
    lovableMissionRouter.post('/assistant-chat', async (req: RequestWithLovableMissionSession, res: Response) => {
      try {
        const result = assistantChatSchema.safeParse(req.body);
        
        if (!result.success) {
          return res.status(400).json({ 
            error: 'Invalid request body',
            details: result.error.errors,
          });
        }
        
        const { firebaseUid, message, messageHistory = [], systemPrompt } = result.data;
        
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
        
        // Get or create session ID for this user to maintain thread history
        let sessionId = `${LOVABLE_MISSION_SESSION_PREFIX}${firebaseUid}`;
        
        // Get or create thread ID
        let threadId = req.session.lovableMissionThreadId || threadMap.get(sessionId);
        
        if (!threadId) {
          // Create a new thread
          const thread = await openai.beta.threads.create();
          threadId = thread.id;
          
          // Store the thread ID
          req.session.lovableMissionThreadId = threadId;
          threadMap.set(sessionId, threadId);
          
          console.log(`Created new thread for Lovable Mission: ${threadId}`);
        }
        
        // Add the user message to the thread
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: message
        });
        
        // If there's a system prompt, add it before running the assistant
        let runParams: any = {
          assistant_id: LOVABLE_MISSION_ASSISTANT_ID
        };
        
        if (systemPrompt) {
          runParams.additional_instructions = systemPrompt;
        }
        
        // Run the assistant on the thread
        const run = await openai.beta.threads.runs.create(threadId, runParams);
        
        // Poll for completion
        let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        
        while (runStatus.status !== "completed" && runStatus.status !== "failed") {
          // Wait before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        }
        
        if (runStatus.status === "failed") {
          throw new Error(`Assistant run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
        }
        
        // Get the latest messages
        const messages = await openai.beta.threads.messages.list(threadId);
        
        // Filter for assistant messages only
        const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
        
        if (assistantMessages.length === 0) {
          throw new Error("No assistant response received");
        }
        
        // Get the content of the latest assistant message
        const latestMessage = assistantMessages[0];
        const messageContent = latestMessage.content[0];
        
        let assistantResponse = "";
        if (messageContent.type === "text") {
          assistantResponse = messageContent.text.value;
        } else {
          assistantResponse = "أعتذر، لم أتمكن من توليد استجابة مناسبة.";
        }
        
        // Save the message to the database
        const chatMessage = await storage.createLovableMissionChatMessage({
          progressId: progress.id,
          role: 'assistant',
          content: assistantResponse,
        });
        
        // Also save the user message for completeness
        await storage.createLovableMissionChatMessage({
          progressId: progress.id,
          role: 'user',
          content: message,
        });
        
        // Log the event
        logEvent('lovable_mission_assistant_chat', 'Assistant chat message', {
          user_id: user.id,
          firebase_uid: firebaseUid,
          thread_id: threadId,
          message_length: assistantResponse.length,
        });
        
        return res.status(200).json({
          message: 'Chat processed successfully',
          response: assistantResponse,
          threadId: threadId,
        });
        
      } catch (error) {
        console.error('Error in Lovable Mission assistant chat:', error);
        return res.status(500).json({ 
          error: 'Failed to process chat message',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  // Mount Lovable Mission routes
  router.use('/lovable-mission', lovableMissionRouter);
}