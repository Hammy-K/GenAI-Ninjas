/**
 * AI Assistant Routes
 * Handles OpenAI Assistant API interactions for HTML generation
 */
import { Router, Request, Response } from 'express';
import { Session } from 'express-session';
import OpenAI from 'openai';
import { AssistantService, createAssistantService } from '../services/assistant';
import { logEvent, logError } from '../services';
import { v4 as uuidv4 } from 'uuid';

// Session tracking (in a production app, use a proper session store)
const HTML_GENERATOR_SESSION_PREFIX = 'html_generator_';

// Define interface for request with our session type
interface RequestWithAssistantSession extends Request {
  session: Session & {
    assistantSessionId?: string;
  };
  body: any & {
    firebaseUid?: string;
    deviceId?: string;
  }
}

export function registerAIAssistantRoutes(router: Router, openai: OpenAI) {
  // Create an instance of the Assistant service
  const assistantService = createAssistantService(openai);
  
  // Set up the Assistant router with specific routes
  const assistantRoutes = Router();
  
  // HTML Generation with Assistant API
  assistantRoutes.post("/generate-html", async (req: RequestWithAssistantSession, res: Response) => {
    try {
      const { messageHistory = [] } = req.body;
      
      console.log("HTML Generate Request - Message history length:", messageHistory.length);
      
      // Validate that we have messages
      const userMessages = messageHistory.filter((msg: any) => msg.role === 'user');
      if (userMessages.length === 0) {
        console.log("ERROR: No user messages found in history");
        return res.status(400).json({
          error: "At least one user message is required in messageHistory"
        });
      }
      
      // Get or create session ID for this user to maintain thread history
      let sessionId = req.session.assistantSessionId;
      if (!sessionId) {
        sessionId = `${HTML_GENERATOR_SESSION_PREFIX}${uuidv4()}`;
        req.session.assistantSessionId = sessionId;
        console.log("Created new assistant session ID:", sessionId);
      } else {
        console.log("Using existing assistant session ID:", sessionId);
      }
      
      // Extract user identity information
      const { firebaseUid, deviceId } = req.body;
      
      // Generate HTML using the Assistant API with identity tracking
      const response = await assistantService.generateHTML(
        messageHistory, 
        sessionId,
        firebaseUid,
        deviceId
      );
      
      // Return the response
      return res.json(response);
    } catch (error) {
      // Log and handle errors
      logError("assistant_html_generation", error instanceof Error ? error : "Unknown error");
      
      return res.status(500).json({
        error: "Failed to generate HTML with Assistant API",
        html: "",
        message: {
          role: "assistant",
          content: "حدث خطأ في عملية توليد HTML. هل يمكنك إعادة صياغة طلبك بشكل مختلف؟"
        },
        isGeneratingHTML: false
      });
    }
  });
  
  // Lovable Mission Chat with Assistant API - using session-based approach
  assistantRoutes.post("/lovable-chat", async (req: RequestWithAssistantSession, res: Response) => {
    try {
      const { message, messageHistory = [], systemPrompt } = req.body;
      
      console.log("Lovable Chat Request - Message history length:", messageHistory.length);
      
      // Validate that we have a message
      if (!message) {
        return res.status(400).json({
          error: "Message is required"
        });
      }
      
      // Get or create session ID for this user to maintain thread history
      let sessionId = req.session.assistantSessionId;
      if (!sessionId) {
        sessionId = `lovable_mission_${uuidv4()}`;
        req.session.assistantSessionId = sessionId;
        console.log("Created new assistant session ID for lovable mission:", sessionId);
      } else {
        console.log("Using existing assistant session ID for lovable mission:", sessionId);
      }
      
      // Get the current thread ID
      let threadId = threadMap.get(sessionId);
      
      if (!threadId) {
        // Create a new thread
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        
        // Store the thread ID
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
        assistant_id: "asst_L23zNIrbAjmHwouCGGqRr1fA" // Lovable Mission Assistant ID
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
      
      // Log the event
      logEvent('lovable_mission_assistant_chat', 'Assistant chat message', {
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

  // Apply routes to the main router
  router.use('/assistant', assistantRoutes);
}