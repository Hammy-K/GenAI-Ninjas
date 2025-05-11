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
const LOVABLE_MISSION_SESSION_PREFIX = 'lovable_mission_';



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
      
      // Use the assistant service to handle the chat
      const result = await assistantService.lovableChat(message, sessionId, systemPrompt);
      
      return res.status(200).json({
        message: 'Chat processed successfully',
        response: result.response,
        threadId: result.threadId,
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