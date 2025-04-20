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
      content:
          'أنت الدكتور بنجي (Dr. Pengy) — مرشد ذكي، ممتع، وصديق لطلاب الثانوي في السعودية (من 13 إلى 18 سنة). شغلك إنك تساعد الطلاب يتعلمون ويستكشفون عالم الذكاء الاصطناعي التوليدي (GenAI) بطريقة تفاعلية وممتعة. ردودك دايمًا تكون بلهجة سعودية عامية، آمنة، مفيدة، وبأسلوب يناسب أعمارهم. استخدم نبرة مرحة كأنك تتكلم مع خويك — خلك خفيف دم، طبيعي، واستعمل إيموجيز لما يناسب 😊. تقدر تسألهم، تمزح مزح خفيف، أو تقول توقفات (زي: "مممم... خلني أفكر 😄") عشان تحسسهم إنك تتفاعل معهم. ركز على مساعدتهم يفهمون GenAI، يجربون أدوات جديدة، ويطلعون أفكار ومشاريع يفتخرون فيها. لو سأل الطالب عن شي تعليمي عام، عادي ترد عليه، بس حاول ترجع تركّز معه على المهمة أو الخطوة اللي هو فيها داخل المنصة. والمهم! لا ترد على أي محتوى مسيء، خطر، أو غير لائق (زي العنف أو المواضيع الجنسية). لو أحد كتب شي مايناسب، نبهه بلطافة، ووضح له إنك موجود عشان تساعده يتعلم ويبدع بأفكار ممتعة وآمنة. خلك دايمًا إيجابي، محفّز، وخلي التجربة كأنها مغامرة تعليمية ممتعة.',
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
  
  // Register direct prompt analysis route to handle client requests
  apiRouter.post('/ai/analyze-prompt', async (req: Request, res: Response) => {
    try {
      const { prompt, messageHistory = [] } = req.body;
      
      // Log the prompt analysis request
      logEvent('prompt_analysis', prompt, {
        message_history_length: messageHistory?.length || 0,
        prompt_length: prompt?.length || 0
      });

      // Use OpenAI client with JSON response format
      const systemPrompt = {
        role: "system",
        content: "You are Dr. Pengy, an AI assistant who analyzes prompts and provides feedback. Return a JSON with 'score' (1-10), 'feedback' (string), and 'improvement' (string)."
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          systemPrompt, 
          ...messageHistory,
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      // Safely parse the response
      let result = { score: 8, feedback: "توجيه جيد!", improvement: "يمكنك إضافة المزيد من التفاصيل." };
      
      try {
        // Get the content and parse it
        const content = response.choices[0].message.content || "{}";
        const parsed = JSON.parse(content);
        
        // Validate and ensure all required fields exist
        if (typeof parsed.score === 'number' && parsed.feedback && parsed.improvement) {
          result = {
            score: Math.min(10, Math.max(1, Math.round(parsed.score))),
            feedback: parsed.feedback,
            improvement: parsed.improvement
          };
        }
      } catch (parseError) {
        // Log the error and use the default values
        logError('prompt_analysis_parse', parseError instanceof Error ? parseError : 'Unknown error', {
          response_content: response.choices[0].message.content
        });
      }

      return res.json(result);
    } catch (error) {
      logError('prompt_analysis_direct', error instanceof Error ? error : 'Unknown error');
      // Return a fallback response
      return res.json({ 
        score: 8,
        feedback: "توجيه جيد! استمر بالعمل الرائع.",
        improvement: "يمكنك إضافة المزيد من التفاصيل المحددة للحصول على نتائج أفضل."
      });
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