/**
 * App Builder Stream Routes
 * 
 * Handles all operations related to the App Builder Stream journey including:
 * - Step retrieval
 * - Progress tracking
 * - Submission storage and retrieval
 * - Chat history management
 */
import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { storage } from "../storage";
import { 
  insertAppBuilderProgressSchema,
  insertAppBuilderSubmissionSchema,
  insertAppBuilderChatHistorySchema
} from "@shared/schema";
import { logEvent, logError } from "../services";
import { z } from "zod";

// Type for requests with firebase UID
interface RequestWithFirebase extends Request {
  body: {
    firebaseUid: string;
    [key: string]: any;
  }
}

export function registerAppBuilderRoutes(router: Router, openai: OpenAI) {
  const appBuilderRoutes = Router();

  /**
   * Get all App Builder steps
   */
  appBuilderRoutes.get("/steps", async (req: Request, res: Response) => {
    try {
      const steps = await storage.getAllAppBuilderSteps();
      return res.json({ steps });
    } catch (error) {
      logError("app_builder_get_steps", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to fetch App Builder steps" });
    }
  });

  /**
   * Get a specific App Builder step by number
   */
  appBuilderRoutes.get("/steps/:stepNumber", async (req: Request, res: Response) => {
    try {
      const stepNumber = parseInt(req.params.stepNumber);
      if (isNaN(stepNumber)) {
        return res.status(400).json({ error: "Invalid step number" });
      }

      const step = await storage.getAppBuilderStep(stepNumber);
      if (!step) {
        return res.status(404).json({ error: "Step not found" });
      }

      return res.json({ step });
    } catch (error) {
      logError("app_builder_get_step", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to fetch App Builder step" });
    }
  });

  /**
   * Get user's App Builder progress
   * Requires Firebase UID in the request body
   */
  appBuilderRoutes.post("/progress", async (req: RequestWithFirebase, res: Response) => {
    try {
      const { firebaseUid } = req.body;
      
      if (!firebaseUid) {
        return res.status(400).json({ error: "Firebase UID is required" });
      }

      const progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);
      
      if (!progress) {
        // User has not started the App Builder journey yet
        return res.json({ 
          exists: false,
          currentStep: 1,
          isCompleted: false
        });
      }

      return res.json({ 
        exists: true,
        ...progress
      });
    } catch (error) {
      logError("app_builder_get_progress", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to fetch App Builder progress" });
    }
  });

  /**
   * Start or resume App Builder journey
   * Creates a new progress record if one doesn't exist
   * Requires Firebase UID in the request body
   */
  appBuilderRoutes.post("/start", async (req: RequestWithFirebase, res: Response) => {
    try {
      const { firebaseUid } = req.body;
      
      if (!firebaseUid) {
        return res.status(400).json({ error: "Firebase UID is required" });
      }

      // Check if user already has progress
      let progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);
      
      if (!progress) {
        // Create new progress record
        const progressData = {
          userId: 0, // Will be set if user exists
          firebaseUid,
          currentStep: 1,
          isCompleted: false
        };

        // Check if user exists
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (user) {
          progressData.userId = user.id;
        }

        // Validate with schema
        const validatedData = insertAppBuilderProgressSchema.parse(progressData);
        
        // Create progress record
        progress = await storage.createAppBuilderProgress(validatedData);
        
        logEvent("app_builder_journey_started", "New journey started", {
          firebaseUid,
          userId: user?.id
        });
      } else {
        logEvent("app_builder_journey_resumed", "Existing journey resumed", {
          firebaseUid,
          progressId: progress.id,
          currentStep: progress.currentStep
        });
      }

      return res.json({ 
        success: true,
        progress
      });
    } catch (error) {
      logError("app_builder_start", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to start App Builder journey" });
    }
  });

  /**
   * Submit work for a specific step
   * Requires Firebase UID and progress ID in the request body
   */
  appBuilderRoutes.post("/submit", async (req: RequestWithFirebase, res: Response) => {
    try {
      const { 
        firebaseUid, 
        progressId, 
        stepNumber, 
        submissionContent,
        submissionData 
      } = req.body;
      
      // Validate required fields
      if (!firebaseUid || !progressId || !stepNumber || !submissionContent) {
        return res.status(400).json({ 
          error: "Missing required fields",
          requiredFields: ["firebaseUid", "progressId", "stepNumber", "submissionContent"]
        });
      }

      // Verify that the progress record belongs to this user
      const progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);
      
      if (!progress || progress.id !== progressId) {
        return res.status(403).json({ error: "Unauthorized access to progress record" });
      }

      // Validate that the step exists
      const step = await storage.getAppBuilderStep(stepNumber);
      if (!step) {
        return res.status(404).json({ error: "Step not found" });
      }

      // Ensure the step is accessible to the user (not ahead of their current step)
      if (stepNumber > progress.currentStep) {
        return res.status(403).json({ error: "Cannot submit for a step that is not yet unlocked" });
      }

      // Create the submission
      const submissionPayload = {
        progressId,
        stepNumber,
        submissionContent,
        submissionData: submissionData || {}
      };

      // Validate with schema
      const validatedData = insertAppBuilderSubmissionSchema.parse(submissionPayload);
      
      // Create submission record
      const submission = await storage.createAppBuilderSubmission(validatedData);

      // If this is the user's current step, update progress to unlock the next step
      if (stepNumber === progress.currentStep && step.requiredForProgress) {
        const nextStep = stepNumber + 1;
        
        // Update progress
        await storage.updateAppBuilderProgress(progress.id, {
          currentStep: nextStep,
          isCompleted: nextStep > 11 // If we've completed all 11 steps
        });
        
        logEvent("app_builder_step_completed", `Step ${stepNumber} completed`, {
          firebaseUid,
          progressId,
          stepNumber,
          nextStep
        });
      }

      return res.json({ 
        success: true,
        submission,
        nextStep: stepNumber === progress.currentStep ? stepNumber + 1 : null
      });
    } catch (error) {
      logError("app_builder_submit", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to submit work" });
    }
  });

  /**
   * Get all submissions for a user's App Builder journey
   * Requires Firebase UID and progress ID in the request body
   */
  appBuilderRoutes.post("/submissions", async (req: RequestWithFirebase, res: Response) => {
    try {
      const { firebaseUid, progressId } = req.body;
      
      if (!firebaseUid || !progressId) {
        return res.status(400).json({ error: "Firebase UID and progress ID are required" });
      }

      // Verify that the progress record belongs to this user
      const progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);
      
      if (!progress || progress.id !== progressId) {
        return res.status(403).json({ error: "Unauthorized access to progress record" });
      }

      // Get all submissions
      const submissions = await storage.getAppBuilderSubmissionsByProgressId(progressId);

      return res.json({ 
        success: true,
        submissions
      });
    } catch (error) {
      logError("app_builder_get_submissions", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  /**
   * Add a chat message to the App Builder journey
   * Requires Firebase UID and progress ID in the request body
   */
  appBuilderRoutes.post("/chat", async (req: RequestWithFirebase, res: Response) => {
    try {
      const { 
        firebaseUid, 
        progressId, 
        stepNumber, 
        role, 
        content 
      } = req.body;
      
      // Validate required fields
      if (!firebaseUid || !progressId || !stepNumber || !role || !content) {
        return res.status(400).json({ 
          error: "Missing required fields",
          requiredFields: ["firebaseUid", "progressId", "stepNumber", "role", "content"]
        });
      }

      // Validate role
      if (role !== "user" && role !== "assistant") {
        return res.status(400).json({ error: "Role must be 'user' or 'assistant'" });
      }

      // Verify that the progress record belongs to this user
      const progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);
      
      if (!progress || progress.id !== progressId) {
        return res.status(403).json({ error: "Unauthorized access to progress record" });
      }

      // Create the chat message
      const messageData = {
        progressId,
        stepNumber,
        role,
        content
      };

      // Validate with schema
      const validatedData = insertAppBuilderChatHistorySchema.parse(messageData);
      
      // Create chat message record
      const message = await storage.createAppBuilderChatMessage(validatedData);

      return res.json({ 
        success: true,
        message
      });
    } catch (error) {
      logError("app_builder_add_chat", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to add chat message" });
    }
  });

  /**
   * Get chat history for a specific step
   * Requires Firebase UID and progress ID in the request body
   */
  appBuilderRoutes.post("/chat-history", async (req: RequestWithFirebase, res: Response) => {
    try {
      const { firebaseUid, progressId, stepNumber } = req.body;
      
      if (!firebaseUid || !progressId) {
        return res.status(400).json({ error: "Firebase UID and progress ID are required" });
      }

      // Verify that the progress record belongs to this user
      const progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);
      
      if (!progress || progress.id !== progressId) {
        return res.status(403).json({ error: "Unauthorized access to progress record" });
      }

      // Get chat history
      let messages;
      if (stepNumber) {
        // Get messages for a specific step
        messages = await storage.getAppBuilderChatHistoryByStep(progressId, stepNumber);
      } else {
        // Get all messages for this progress
        messages = await storage.getAppBuilderChatHistoryByProgressId(progressId);
      }

      return res.json({ 
        success: true,
        messages
      });
    } catch (error) {
      logError("app_builder_get_chat", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  /**
   * Chat with Dr. Pengy in the context of the App Builder
   * Requires Firebase UID and progress ID in the request body
   */
  appBuilderRoutes.post("/chat-with-dr-pengy", async (req: RequestWithFirebase, res: Response) => {
    try {
      const { 
        firebaseUid, 
        progressId, 
        stepNumber, 
        message,
        messageHistory = [] 
      } = req.body;
      
      // Validate required fields
      if (!firebaseUid || !progressId || !stepNumber || !message) {
        return res.status(400).json({ 
          error: "Missing required fields",
          requiredFields: ["firebaseUid", "progressId", "stepNumber", "message"]
        });
      }

      // Verify that the progress record belongs to this user
      const progress = await storage.getAppBuilderProgressByFirebaseUid(firebaseUid);
      
      if (!progress || progress.id !== progressId) {
        return res.status(403).json({ error: "Unauthorized access to progress record" });
      }

      // Get step information
      const step = await storage.getAppBuilderStep(stepNumber);
      if (!step) {
        return res.status(404).json({ error: "Step not found" });
      }

      // Get user's previous submissions for all steps up to the current one
      const allSubmissions = await storage.getAppBuilderSubmissionsByProgressId(progressId);
      const userSubmissions = allSubmissions.filter(sub => sub.stepNumber <= stepNumber);
      
      // Prepare submission context for Dr. Pengy
      const submissionContext = userSubmissions.map(sub => 
        `Step ${sub.stepNumber} submission: ${sub.submissionContent}`
      ).join('\n\n');

      // Create the user message
      const userMessageData = {
        progressId,
        stepNumber,
        role: "user",
        content: message
      };

      // Validate with schema
      const validatedUserMessage = insertAppBuilderChatHistorySchema.parse(userMessageData);
      
      // Save user message to chat history
      await storage.createAppBuilderChatMessage(validatedUserMessage);

      // Log the chat event
      logEvent("app_builder_chat", message, {
        firebaseUid,
        progressId,
        stepNumber,
        message_history_length: messageHistory.length
      });

      // Create system prompt with context
      const systemPrompt = {
        role: "system",
        content: `أنت الدكتور بنجي (Dr. Pengy) — مرشد ذكي، ممتع، وصديق لطلاب الثانوي في السعودية (من 13 إلى 18 سنة). شغلك إنك تساعد الطلاب يتعلمون ويستكشفون عالم تطوير التطبيقات والذكاء الاصطناعي التوليدي (GenAI) بطريقة تفاعلية وممتعة. 

ردودك دايمًا تكون بلهجة سعودية عامية، آمنة، مفيدة، وبأسلوب يناسب أعمارهم. استخدم نبرة مرحة كأنك تتكلم مع صديق قريب — خلك خفيف دم، وطبيعي.

أنت الآن تساعد طالب في خطوة رقم ${stepNumber} من مسار بناء التطبيق الخاص به، وعنوان هذه الخطوة هو: "${step.title}"

معلومات مهمة عن الطالب وتقدمه:
${submissionContext}

إرشادات مهمة:
1. اجعل إجاباتك موجزة ومفيدة، وتفاعل مع الأسئلة المحددة للطالب.
2. لا تعطيه إجابات كاملة ولكن وجهه بأسئلة وتلميحات تساعده على التفكير بنفسه.
3. شجعه على التجربة والاستكشاف في كل خطوة.
4. كن على دراية بسياق الخطوة الحالية التي هو فيها.

تذكر: هدفك ليس حل المهام نيابة عنه، بل مساعدته على التعلم واكتساب مهارات تطوير التطبيقات من خلال الإرشاد المناسب.`
      };

      // Make OpenAI chat completion call
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          systemPrompt,
          ...messageHistory,
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      // Extract response
      const aiResponse = response.choices[0].message.content || "عذرًا، لم أستطع فهم سؤالك. هل يمكنك توضيحه أكثر؟";

      // Save assistant message to chat history
      const assistantMessageData = {
        progressId,
        stepNumber,
        role: "assistant",
        content: aiResponse
      };

      // Validate with schema
      const validatedAssistantMessage = insertAppBuilderChatHistorySchema.parse(assistantMessageData);
      
      // Save assistant message to chat history
      const savedMessage = await storage.createAppBuilderChatMessage(validatedAssistantMessage);

      return res.json({ 
        success: true,
        message: savedMessage
      });
    } catch (error) {
      logError("app_builder_chat_with_dr_pengy", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({ error: "Failed to chat with Dr. Pengy" });
    }
  });

  // Register the routes
  router.use("/app-builder", appBuilderRoutes);
}