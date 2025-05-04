/**
 * App Builder Stream Routes
 * Handles the 11-step sequential journey with gating logic
 */
import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { OpenAI } from "openai";

export function registerAppBuilderRoutes(router: Router, openai: OpenAI) {
  const appBuilderRoutes = Router();
  router.use("/app-builder", appBuilderRoutes);

  // Start or resume the App Builder journey
  appBuilderRoutes.post("/start", async (req: Request, res: Response) => {
    try {
      const { firebaseUid } = req.body;

      if (!firebaseUid) {
        return res.status(400).json({
          success: false,
          message: "Firebase UID is required"
        });
      }

      // Check if the user has existing progress
      let progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);

      // If no progress exists, create a new progress record
      if (!progress) {
        progress = await storage.createAppBuilderProgress({
          firebaseUid,
          userId: 1, // Default user ID (we will have to handle this better in production)
          currentStep: 1,
          isCompleted: false
        });
      }

      return res.json({
        success: true,
        progress
      });
    } catch (error) {
      console.error("Error starting App Builder journey:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to start App Builder journey"
      });
    }
  });

  // Submit a step in the App Builder journey
  appBuilderRoutes.post("/submit-step", async (req: Request, res: Response) => {
    try {
      const { firebaseUid, progressId, stepNumber, submission } = req.body;

      if (!firebaseUid || !progressId || !stepNumber || !submission) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      // Get the user's progress
      const progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: "Progress not found"
        });
      }

      if (progress.id !== progressId) {
        return res.status(400).json({
          success: false,
          message: "Invalid progress ID"
        });
      }

      // Check if the step exists
      const step = await storage.getAppBuilderStep(stepNumber);
      if (!step) {
        return res.status(404).json({
          success: false,
          message: "Step not found"
        });
      }

      // Check if the user is eligible to submit this step (gating logic)
      if (stepNumber > progress.currentStep) {
        return res.status(403).json({
          success: false,
          message: "You must complete previous steps first"
        });
      }

      // Check if a submission already exists for this step
      let existingSubmission = await storage.getAppBuilderSubmissionByStepNumber(
        progressId,
        stepNumber
      );

      if (existingSubmission) {
        // Update the existing submission
        existingSubmission = await storage.updateAppBuilderSubmission(
          existingSubmission.id,
          {
            submissionContent: submission
          }
        );
      } else {
        // Create a new submission
        existingSubmission = await storage.createAppBuilderSubmission({
          progressId,
          stepNumber,
          submissionContent: submission
        });
      }

      // If this was the current step, update progress to the next step
      if (stepNumber === progress.currentStep && stepNumber < 11) {
        await storage.updateAppBuilderProgress(progressId, {
          currentStep: stepNumber + 1
        });
      } else if (stepNumber === 11) {
        // If the final step is submitted, mark the journey as complete
        await storage.updateAppBuilderProgress(progressId, {
          isCompleted: true
        });
      }

      return res.json({
        success: true,
        submission: existingSubmission,
        progress: await storage.getAppBuilderProgressByFirebaseUid(firebaseUid)
      });
    } catch (error) {
      console.error("Error submitting App Builder step:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to submit step"
      });
    }
  });

  // Get a specific step in the App Builder journey
  appBuilderRoutes.get("/step/:stepNumber", async (req: Request, res: Response) => {
    try {
      const stepNumber = parseInt(req.params.stepNumber);

      if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 11) {
        return res.status(400).json({
          success: false,
          message: "Invalid step number"
        });
      }

      const step = await storage.getAppBuilderStep(stepNumber);

      if (!step) {
        return res.status(404).json({
          success: false,
          message: "Step not found"
        });
      }

      return res.json({
        success: true,
        step
      });
    } catch (error) {
      console.error("Error getting App Builder step:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get step"
      });
    }
  });

  // Chat with Dr. Pengy in the context of the current step
  appBuilderRoutes.post("/chat-with-dr-pengy", async (req: Request, res: Response) => {
    try {
      const { firebaseUid, progressId, stepNumber, message } = req.body;

      if (!firebaseUid || !progressId || !stepNumber || !message) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      // Get the user's progress to validate access
      const progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: "Progress not found"
        });
      }

      if (progress.id !== progressId) {
        return res.status(400).json({
          success: false,
          message: "Invalid progress ID"
        });
      }

      // Check if the user is eligible to access this step
      if (stepNumber > progress.currentStep) {
        return res.status(403).json({
          success: false,
          message: "You must complete previous steps first"
        });
      }

      // Get the current step details
      const step = await storage.getAppBuilderStep(stepNumber);
      if (!step) {
        return res.status(404).json({
          success: false,
          message: "Step not found"
        });
      }

      // Get all previous chat history for context
      const chatHistory = await storage.getAppBuilderChatHistoryByStep(progressId, stepNumber);

      // Get any past submissions for this step for context
      const submission = await storage.getAppBuilderSubmissionByStepNumber(progressId, stepNumber);

      // Store the user's message in the chat history
      await storage.createAppBuilderChatMessage({
        progressId,
        stepNumber,
        role: "user",
        content: message
      });

      // Build the prompt for Dr. Pengy
      const systemPrompt = `You are د. بنجي (Dr. Pengy), an AI tutor for the App Builder Stream, a guided journey to build web applications. 
You are currently assisting with Step ${stepNumber} of 11: "${step?.title}".

Instructions for this step: ${step?.content}

Keep these guidelines in mind:
1. Respond in Arabic with right-to-left (RTL) text
2. Be concise and helpful
3. Focus on guiding rather than giving direct solutions
4. If the student is stuck, offer a hint before a complete solution
5. Use gentle encouragement and positive reinforcement
6. Remember cultural context - you're supporting Saudi Arabian students`;

      // Add previous submissions context if available
      const submissionContext = submission 
        ? `\n\nThe student has made a previous submission for this step:\n${submission.submissionContent}`
        : "";

      // Create Dr. Pengy's response using OpenAI
      const chatMessages = [
        { role: "system", content: systemPrompt + submissionContext },
      ];

      // Add the previous chat history (up to 10 messages) for context
      chatHistory.slice(-10).forEach(chatMsg => {
        chatMessages.push({
          role: chatMsg.role as "system" | "user" | "assistant",
          content: chatMsg.content
        });
      });

      // Add the current user message
      chatMessages.push({ role: "user", content: message });

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: chatMessages.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000
      });

      const drPengyResponse = aiResponse.choices[0].message.content;

      // Store Dr. Pengy's response in the chat history
      const savedResponse = await storage.createAppBuilderChatMessage({
        progressId,
        stepNumber,
        role: "assistant",
        content: drPengyResponse || "I apologize, I couldn't generate a response at this time."
      });

      return res.json({
        success: true,
        message: savedResponse
      });
    } catch (error) {
      console.error("Error chatting with Dr. Pengy:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get a response from Dr. Pengy"
      });
    }
  });

  // Get all steps in the App Builder journey
  appBuilderRoutes.get("/steps", async (req: Request, res: Response) => {
    try {
      const steps = await storage.getAllAppBuilderSteps();

      return res.json({
        success: true,
        steps
      });
    } catch (error) {
      console.error("Error getting App Builder steps:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get steps"
      });
    }
  });

  return appBuilderRoutes;
}