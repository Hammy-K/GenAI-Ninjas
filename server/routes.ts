import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createServer, type Server } from "http";

// Import route modules directly
import { registerAITextRoutes } from "./routes/ai-text";
import { registerAIImageRoutes } from "./routes/ai-image";
import { registerGalleryRoutes } from "./routes/gallery";
// Use either Firebase routes (old) or Project routes (new)
// import { registerFirebaseRoutes } from "./routes/firebase";
import { registerProjectRoutes } from "./routes/projects";
import { registerAIAssistantRoutes } from "./routes/ai-assistant";
import { registerLogsRoutes } from "./routes/logs";
import { registerAppBuilderRoutes } from "./routes/app-builder";

// Import services
import { logEvent, logError } from "./services";
import { buildSystemPrompt } from "./templates/prompts";

// Import OpenAI client
import OpenAI from "openai";

/**
 * Legacy function for server-side prompt logging
 * @deprecated Use logEvent from services/logging instead
 */
function logServerPrompt(
  promptType: string,
  promptContent: string,
  metadata: any = {},
) {
  try {
    console.log(`[Server Analytics] Logging ${promptType} prompt`);
    console.log(`[Server Analytics] Length: ${promptContent.length} chars`);
    console.log(`[Server Analytics] Metadata:`, JSON.stringify(metadata));
  } catch (error) {
    console.error("[Server Analytics] Failed to log prompt:", error);
  }
}

/**
 * Register all API routes for the application
 * @param app Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Serve generated images from the server
  app.use('/generated-images', express.static('server/public/generated-images'));
  
  // Add a utility endpoint to clear session data (temporary, for debugging)
  app.get('/api/debug/clear-session', (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Failed to destroy session:', err);
          return res.status(500).json({ success: false, error: 'Failed to clear session' });
        }
        return res.status(200).json({ 
          success: true, 
          message: 'Session cleared successfully. Refresh the page to see changes.'
        });
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: 'No active session to clear. Refresh the page to start fresh.'
      });
    }
  });
  // Create router for API endpoints
  const apiRouter = express.Router();

  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      "\n⚠️  WARNING: OPENAI_API_KEY environment variable is not set. AI features will not work properly.\n",
    );
  }

  // Register direct text generation route to handle client requests
  apiRouter.post("/ai/text", async (req: Request, res: Response) => {
    try {
      const { prompt, messageHistory = [], maxTokens = 1000 } = req.body;

      // Log the text generation request
      logEvent("text_generation", prompt, {
        message_history_length: messageHistory.length,
        prompt_length: prompt.length,
        max_tokens: maxTokens,
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
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return res.json({ text: response.choices[0].message.content });
    } catch (error) {
      logError(
        "text_generation_direct",
        error instanceof Error ? error : "Unknown error",
      );
      return res.status(500).json({ error: "Failed to generate text" });
    }
  });

  // Register direct prompt analysis route to handle client requests
  apiRouter.post("/ai/analyze-prompt", async (req: Request, res: Response) => {
    try {
      const { prompt, messageHistory = [] } = req.body;

      // Log the prompt analysis request
      logEvent("prompt_analysis", prompt, {
        message_history_length: messageHistory?.length || 0,
        prompt_length: prompt?.length || 0,
      });

      // Use OpenAI client with JSON response format
      const systemPrompt = {
        role: "system",
        content:
          "You are Dr. Pengy, an AI assistant who analyzes prompts and provides feedback. Return a JSON with 'score' (1-10), 'feedback' (string), and 'improvement' (string).",
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          systemPrompt,
          ...messageHistory,
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      // Safely parse the response
      let result = {
        score: 8,
        feedback: "توجيه جيد!",
        improvement: "يمكنك إضافة المزيد من التفاصيل.",
      };

      try {
        // Get the content and parse it
        const content = response.choices[0].message.content || "{}";
        const parsed = JSON.parse(content);

        // Validate and ensure all required fields exist
        if (
          typeof parsed.score === "number" &&
          parsed.feedback &&
          parsed.improvement
        ) {
          result = {
            score: Math.min(10, Math.max(1, Math.round(parsed.score))),
            feedback: parsed.feedback,
            improvement: parsed.improvement,
          };
        }
      } catch (parseError) {
        // Log the error and use the default values
        logError(
          "prompt_analysis_parse",
          parseError instanceof Error ? parseError : "Unknown error",
          {
            response_content: response.choices[0].message.content,
          },
        );
      }

      return res.json(result);
    } catch (error) {
      logError(
        "prompt_analysis_direct",
        error instanceof Error ? error : "Unknown error",
      );
      // Return a fallback response
      return res.json({
        score: 8,
        feedback: "توجيه جيد! استمر بالعمل الرائع.",
        improvement:
          "يمكنك إضافة المزيد من التفاصيل المحددة للحصول على نتائج أفضل.",
      });
    }
  });

  // HTML Generation Route - handles creating web pages based on user prompts
  apiRouter.post("/ai/generate-html", async (req: Request, res: Response) => {
    try {
      const { messageHistory = [] } = req.body;

      // Validate message history
      const userMessages = messageHistory.filter((msg: {role: string, content: string}) => msg.role === "user");
      if (userMessages.length === 0) {
        return res.status(400).json({
          error: "At least one user message is required in messageHistory"
        });
      }

      // Get the latest user message for logging
      const latestUserMessage = userMessages[userMessages.length - 1];
      
      // Log the HTML generation request
      logEvent("html_generation", latestUserMessage.content, {
        message_history_length: messageHistory.length
      });

      // Build the system prompt using our template
      const systemPrompt = {
        role: "system",
        content: buildSystemPrompt("DR_PENGY", "HTML_GENERATION")
      };

      // Update model configuration to use JSON response format
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [systemPrompt, ...messageHistory],
        temperature: 0.2,         // Keep low for consistency
        max_tokens: 4000,         // Higher to allow full HTML pages
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
        response_format: { type: "json_object" } // Request JSON format
      });

      // Extract response content as JSON
      const responseContent = response.choices[0].message.content || "{}";
      let parsedResponse;
      let generatedHTML = "";
      let explanatoryMessage = "";
      let additionalFeatures = [];
      let isGeneratingHTMLPhase = false;
      let isQuestioningPhase = false;

      try {
        // Parse the JSON response
        parsedResponse = JSON.parse(responseContent);
        
        // Check if this is a questioning phase based on the model's response format
        isQuestioningPhase = parsedResponse.questions === true || !parsedResponse.html;
        
        if (isQuestioningPhase) {
          // In questioning phase, use the suggestions as the chat message
          explanatoryMessage = parsedResponse.suggestions || "عندي بعض الأسئلة عن طلبك...";
          isGeneratingHTMLPhase = false;
          
          // Pass through a minimal HTML structure for UI flow
          generatedHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>استكشاف الفكرة</title>
</head>
<body style="font-family:system-ui;background-color:#f5f5f5;margin:0;height:100vh;display:flex;align-items:center;justify-content:center;">
  <!-- Empty body - will be replaced with real HTML after questions are answered -->
</body>
</html>`;
        } else {
          // HTML generation phase
          isGeneratingHTMLPhase = true;
          
          // Extract HTML from the JSON response
          generatedHTML = parsedResponse.html || "";
          
          // Check if we have proper HTML content
          if (!generatedHTML.includes("<!DOCTYPE html>")) {
            // Add DOCTYPE if missing
            generatedHTML = `<!DOCTYPE html>\n<html>\n<head>\n<title>Generated Page</title>\n</head>\n<body>\n${generatedHTML}\n</body>\n</html>`;
          }
          
          // Fix HTML if needed (ensure it has proper structure)
          if (!generatedHTML.includes("</body>")) {
            generatedHTML += "\n</body>";
          }
          if (!generatedHTML.includes("</html>")) {
            generatedHTML += "\n</html>";
          }
          
          // Get the explanatory message
          explanatoryMessage = parsedResponse.suggestions || "سويت لك الصفحة! شوف النتيجة في الأسفل 👇";
          
          // Extract additional features if available
          additionalFeatures = parsedResponse.additionalFeatures || [];
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract HTML and explanation using the old method
        console.error("Error parsing JSON response:", parseError);
        logError("html_generation_json_parse", parseError instanceof Error ? parseError : "Unknown error");
        
        // Fallback to the old extraction method
        const doctypeIndex = responseContent.indexOf("<!DOCTYPE html>");
        isQuestioningPhase = 
          doctypeIndex === -1 &&
          (responseContent.includes("?") || 
           responseContent.includes("سؤال") || 
           responseContent.includes("أسئلة"));

        if (isQuestioningPhase) {
          explanatoryMessage = responseContent;
          isGeneratingHTMLPhase = false;
          
          generatedHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>استكشاف الفكرة</title>
</head>
<body style="font-family:system-ui;background-color:#f5f5f5;margin:0;height:100vh;display:flex;align-items:center;justify-content:center;">
  <!-- Empty body - will be replaced with real HTML after questions are answered -->
</body>
</html>`;
        } else if (doctypeIndex >= 0) {
          isGeneratingHTMLPhase = true;
          const htmlContent = responseContent.substring(doctypeIndex);
          const closingHtmlTagIndex = htmlContent.indexOf("</html>");
          
          if (closingHtmlTagIndex > 0) {
            generatedHTML = htmlContent.substring(0, closingHtmlTagIndex + 7);
            if (doctypeIndex > 0) {
              explanatoryMessage = responseContent.substring(0, doctypeIndex).trim();
            } else {
              explanatoryMessage = "سويت لك الصفحة! شوف النتيجة في الأسفل 👇";
            }
          } else {
            generatedHTML = htmlContent;
            if (!generatedHTML.includes("</body>")) generatedHTML += "\n</body>";
            if (!generatedHTML.includes("</html>")) generatedHTML += "\n</html>";
            
            if (doctypeIndex > 0) {
              explanatoryMessage = responseContent.substring(0, doctypeIndex).trim();
            } else {
              explanatoryMessage = "سويت لك الصفحة! شوف النتيجة في الأسفل 👇";
            }
          }
        } else {
          explanatoryMessage = responseContent;
          isGeneratingHTMLPhase = false;
          
          generatedHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>استكشاف الفكرة</title>
</head>
<body style="font-family:system-ui;background-color:#f5f5f5;margin:0;height:100vh;display:flex;align-items:center;justify-content:center;">
  <!-- Empty body - no HTML generated yet -->
</body>
</html>`;
        }
      }
      
      // Log generation status
      logEvent("html_generation_success", latestUserMessage.content, {
        model: "gpt-4o",
        html_size: generatedHTML.length,
        html_type: generatedHTML.includes("<script") ? "interactive" : "static",
        json_format: parsedResponse ? "success" : "fallback"
      });
      
      // Send response with the new format including additional features
      return res.json({
        html: generatedHTML,
        message: {
          role: "assistant",
          content: explanatoryMessage || "تم إنشاء الصفحة"
        },
        isGeneratingHTML: isGeneratingHTMLPhase,
        additionalFeatures: additionalFeatures
      });
      
    } catch (error) {
      // Log and handle errors
      logError("html_generation", error instanceof Error ? error : "Unknown error");
      
      return res.status(500).json({
        error: "Failed to generate HTML",
        html: "",
        message: {
          role: "assistant",
          content: "حدث خطأ في عملية توليد HTML. هل يمكنك إعادة صياغة طلبك بشكل مختلف؟"
        }
      });
    }
  });

  // Register other route modules
  registerAITextRoutes(apiRouter, openai);
  registerAIImageRoutes(apiRouter, openai);
  registerGalleryRoutes(apiRouter);
  // Use the new ProjectRoutes that store HTML in PostgreSQL
  registerProjectRoutes(apiRouter);
  registerAIAssistantRoutes(apiRouter, openai);
  registerLogsRoutes(apiRouter);
  registerAppBuilderRoutes(apiRouter, openai);

  // Apply the API router to all /api routes
  app.use("/api", apiRouter);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Global error handler caught:", err);

    logError("global_error", err instanceof Error ? err : "Unknown error");

    // Don't expose server errors to clients
    res.status(500).json({
      error: "An internal server error occurred",
    });
  });

  // Create and return HTTP server
  const server = createServer(app);
  return server;
}
