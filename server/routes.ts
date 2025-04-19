import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";

// Import route modules directly
import { registerAITextRoutes } from "./routes/ai-text";
import { registerAIImageRoutes } from "./routes/ai-image";
import { registerGalleryRoutes } from "./routes/gallery";
import { registerFirebaseRoutes } from "./routes/firebase";

// Import services
import { logEvent, logError } from "./services";

// Import OpenAI client
import OpenAI from "openai";

/**
 * Legacy function for server-side prompt logging
 * @deprecated Use logEvent from services/logging instead
 */
function logServerPrompt(promptType: string, promptContent: string, metadata: any = {}) {
  try {
    console.log(`[Server Analytics] Logging ${promptType} prompt`);
    console.log(`[Server Analytics] Length: ${promptContent.length} chars`);
    console.log(`[Server Analytics] Metadata:`, JSON.stringify(metadata));
  } catch (error) {
    console.error('[Server Analytics] Failed to log prompt:', error);
  }
}

/**
 * Register all API routes for the application
 * @param app Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Create router for API endpoints
  const apiRouter = express.Router();
  
  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn("\n⚠️  WARNING: OPENAI_API_KEY environment variable is not set. AI features will not work properly.\n");
  }

  // Register direct text generation route to handle client requests
  apiRouter.post('/ai/text', async (req: Request, res: Response) => {
    try {
      const { prompt, messageHistory = [], maxTokens = 1000 } = req.body;
      
      // Log the text generation request
      logEvent('text_generation', prompt, {
        message_history_length: messageHistory.length,
        prompt_length: prompt.length,
        max_tokens: maxTokens
      });

      // Use OpenAI client
      const systemPrompt = {
        role: "system",
        content: "You are Dr. Pengy, an AI assistant helping students learn about generative AI."
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          systemPrompt, 
          ...messageHistory,
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return res.json({ text: response.choices[0].message.content });
    } catch (error) {
      logError('text_generation_direct', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to generate text" });
    }
  });
  
  // Register other route modules
  registerAITextRoutes(apiRouter, openai);
  registerAIImageRoutes(apiRouter, openai);
  registerGalleryRoutes(apiRouter);
  registerFirebaseRoutes(apiRouter);

  // Apply the API router to all /api routes
  app.use("/api", apiRouter);
  
  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Global error handler caught:', err);
    
    logError('global_error', err instanceof Error ? err : 'Unknown error');
    
    // Don't expose server errors to clients
    res.status(500).json({
      error: "An internal server error occurred"
    });
  });

  // Create and return HTTP server
  const server = createServer(app);
  return server;
}