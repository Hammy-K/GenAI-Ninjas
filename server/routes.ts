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
import { registerFirebaseRoutes } from "./routes/firebase";

// Import services
import { logEvent, logError } from "./services";

// Import OpenAI client
import OpenAI from "openai";

// Import prompt templates
import { buildSystemPrompt } from "./templates/prompts";

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

  // Add direct HTML generation route to handle client requests
  apiRouter.post("/ai/generate-html", async (req: Request, res: Response) => {
    try {
      const { messageHistory = [] } = req.body;

      // Make sure we have at least one user message
      const userMessages = messageHistory.filter(
        (msg: any) => msg.role === "user",
      );
      if (userMessages.length === 0) {
        return res
          .status(400)
          .json({
            error: "At least one user message is required in messageHistory",
          });
      }

      // Get the latest user message for logging
      const latestUserMessage = userMessages[userMessages.length - 1];

      // Log the HTML generation request
      logEvent("html_generation", latestUserMessage.content, {
        message_history_length: messageHistory.length,
      });

      // Build the system prompt for HTML generation using our template system
      const systemPrompt = {
        role: "system",
        content: buildSystemPrompt("DR_PENGY", "HTML_GENERATION"),
      };

      // Use specific parameters for consistent, high-quality code
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [systemPrompt, ...messageHistory],
        temperature: 0.3, // Lower temperature for more consistent code
        max_tokens: 2000, // Allow enough tokens for complex HTML
      });

      // Extract message content from the response
      const responseContent = response.choices[0].message.content || "";
      let generatedHTML = "";

      // Detect if this is a questioning phase (step 1) or generating HTML (step 2)
      // If the response doesn't contain <!DOCTYPE html> and doesn't have code blocks,
      // and it looks like it's asking questions, then we're in the questioning phase
      const isQuestioningPhase =
        responseContent.indexOf("<!DOCTYPE html>") === -1 &&
        !responseContent.includes("```html") &&
        (responseContent.includes("?") ||
          responseContent.includes("سؤال") ||
          responseContent.includes("أسئلة"));

      if (isQuestioningPhase) {
        // During questioning phase, we don't need to extract HTML
        // Just provide an empty placeholder HTML
        generatedHTML = `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إنشاء الصفحة</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8f9fa;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      text-align: center;
      direction: rtl;
    }
    .message {
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { color: #4B5563; }
    p { color: #6B7280; }
  </style>
</head>
<body>
  <div class="message">
    <h1>جاري التخطيط للصفحة... 🤔</h1>
    <p>في هذه المرحلة، د. بنجي يطرح أسئلة لمعرفة متطلباتك بالضبط.<br>أجب عن الأسئلة ليتمكن من إنشاء الصفحة المناسبة لك.</p>
  </div>
</body>
</html>`;
      } else {
        // Move to HTML extraction for step 2
        generatedHTML = responseContent;

        // Extract code blocks
        const htmlPattern = /```html\s([\s\S]*?)```/;
        const htmlMatch = generatedHTML.match(htmlPattern);

        if (htmlMatch && htmlMatch[1]) {
          generatedHTML = htmlMatch[1].trim();
        } else {
          // Try to fix if missing proper HTML doctype
          const doctypeIndex = generatedHTML.indexOf("<!DOCTYPE html>");
          if (doctypeIndex >= 0) {
            generatedHTML = generatedHTML.substring(doctypeIndex);
          } else {
            // Fallback to a basic HTML template
            generatedHTML = `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <p>حدث خطأ في عملية توليد HTML. الرجاء المحاولة مرة أخرى بوصف مختلف.</p>
</body>
</html>`;

            // Log the HTML generation failure
            logEvent(
              "html_generation_parsing_failed",
              latestUserMessage.content,
              {
                model: "gpt-4o",
                response_length: responseContent.length,
              },
            );
          }
        }
      }

      // Log successful HTML generation with metrics
      logEvent("html_generation_success", latestUserMessage.content, {
        model: "gpt-4o",
        html_size: generatedHTML.length,
        html_type: generatedHTML.includes("<script") ? "interactive" : "static",
      });

      // Send back the actual AI response as the message
      // For HTML-containing responses, only extract the HTML part for the html field
      // but preserve the full message for the chat
      return res.json({
        html: generatedHTML,
        message: {
          role: "assistant",
          content:
            response.choices[0].message.content ||
            "لقد بنيت فكرتك! جربها وأخبرني إذا ترغب في أي تغييرات.",
        },
      });
    } catch (error) {
      logError(
        "html_generation",
        error instanceof Error ? error : "Unknown error",
      );
      return res.status(500).json({
        error: "Failed to generate HTML",
        html: "",
        message: {
          role: "assistant",
          content:
            "حدث خطأ في توليد الصفحة. الرجاء المحاولة مرة أخرى بتوجيه مختلف.",
        },
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
