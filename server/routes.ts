import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createServer, type Server } from "http";
import {
  sendSuccess,
  sendError,
  sendCreated,
} from "./middleware/response";

// Import route modules
import { registerAITextRoutes } from "./routes/ai-text";
import { registerAIImageRoutes } from "./routes/ai-image";
import { registerGalleryRoutes } from "./routes/gallery";
import { registerProjectRoutes } from "./routes/projects";
import { registerAIAssistantRoutes } from "./routes/ai-assistant";
import { registerLogsRoutes } from "./routes/logs";
import { registerAppBuilderRoutes } from "./routes/app-builder";
import { registerLovableMissionRoutes } from "./routes/lovable-mission";
import { registerHTMLProjectsRoutes } from "./routes/html-projects";
import { createUnifiedThreadRouter } from "./routes/unified-thread";
import { registerStudentsRoutes } from "./routes/students";
import { registerFeedbackRoutes } from "./routes/feedback";
import { registerHtmlAiRoute } from "./routes/html-ai";
import { registerTranscribeRoute } from "./routes/ai-transcribe";
import { registerGoogleDriveVideosRoutes } from "./routes/google-drive-videos";
import { registerAuthRoutes } from "./routes/auth.route";
import { registerSchoolRoutes } from "./routes/schools.route";
import { registerGenaiSchoolTrainingRoutes } from "./routes/genai-school-training.route";
import { registerAppDevFrontendRoutes } from "./routes/app-dev-frontend.route";
import { registerGenAiRoutes } from "./routes/genai.routes";
import { registerLovableActivityRoutes } from "./routes/lovable-activity";
import { registerLovableRoutes } from "./modules/genai-lovable/lovable.route";
import { registerAiChatRoutes } from "./modules/ai-chat/ai-chat.route";
import { registerImageGenerationRoutes } from "./modules/image-generation/image-generation.route";
import { registerAudioTtsRoutes } from "./modules/audio-tts/audio-tts.routes";
import { registerVideoFlowRoutes } from "./modules/video-flow/video-flow.route";
import { registerVideoSubmissionsRoutes } from "./routes/video-submissions";
import { createVideoJobsRouter } from "./modules/video-jobs/video-jobs.route";
import { getSubmissionsAnalytics } from "./routes/submissions-analytics";
import { registerTracksStudentsRoutes } from "./routes/tracks-students";
import { registerProjectSubmissionsRoutes } from "./routes/project-submissions";
import { registerLeaderboardRoutes } from "./modules/leaderboard/leaderboard.route";

//Ali's Additions
import path from "path";
import { runAIPollMigration } from "./migrations/ai-poll-migration";
import aiPollRouter from "./routes/ai-poll";
import mediaAssetsRoutes from "./routes/mediaAssetsRoutes";
import videoLibraryRouter from "./routes/video-library";
import textLibraryRouter from "./routes/text-library";
//--------------------------------------------------------------------------------

// Import services
import { logEvent, logError } from "./services";
import { buildSystemPrompt } from "./templates/prompts";

// Import configuration
import { CONFIG } from "./config";

// Import OpenAI client
import OpenAI from "openai";
import { registerCopilotRoutes } from "./modules/copilot-kit/copilot-kit.route";
import { registerMangaEvaluationRoutes } from "./routes/manga-evaluation";
import { registerMediaClipsRoutes } from "./modules/media/clips/clips.route";
import { registerMediaClipVotesRoutes } from "./modules/media/clip-votes/clip-votes.route";

/**
 * Register all API routes for the application
 */
export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());

  // Serve static files
  app.use(
    "/generated-images",
    express.static("server/public/generated-images"),
  );
  app.use(
    "/generated-videos",
    express.static("server/public/generated-videos"),
  );

  //Ali's Additions
  await runAIPollMigration();
  app.use("/uploads", express.static("server/public/uploads"));
  app.use("/api/media-assets", mediaAssetsRoutes);
  app.use("/api/ai-poll", aiPollRouter);
  app.use(textLibraryRouter);
  app.use(videoLibraryRouter);
  //--------------------------------------------------------------------------------

  // Debug endpoint to clear session
  app.get("/api/debug/clear-session", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Failed to destroy session:", err);
          return sendError(res, "Failed to clear session", 500);
        }
        return sendSuccess(res, { message: "Session cleared successfully" });
      });
    } else {
      return sendSuccess(res, { message: "No active session to clear" });
    }
  });

  // Mount tracks students routes
  app.use("/api/tracks-students", registerTracksStudentsRoutes());

  // Create API router
  const apiRouter = express.Router();

  // Health check endpoint
  apiRouter.get("/health", (_req, res) => {
    console.log("Health check endpoint called");
    sendSuccess(res, {
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // Submissions analytics
  apiRouter.get("/submissions-analytics", getSubmissionsAnalytics);

  // Video routes
  apiRouter.use("/video-flow", registerVideoFlowRoutes());
  apiRouter.use("/video-jobs", createVideoJobsRouter());
  apiRouter.use("/video-submissions", registerVideoSubmissionsRoutes());

  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey: CONFIG.ai.openai.apiKey });

  if (!CONFIG.ai.openai.apiKey) {
    console.warn(
      "⚠️  WARNING: OPENAI_API_KEY not set. AI features will not work.",
    );
  }

  // Register manga evaluation routes
  registerMangaEvaluationRoutes(app);

  // Mount unified thread router
  apiRouter.use("/ai", createUnifiedThreadRouter(openai));

  // Direct text generation endpoint
  apiRouter.post("/ai/text", async (req: Request, res: Response) => {
    try {
      const { prompt, messageHistory = [], maxTokens = 1000 } = req.body;

      logEvent("text_generation", prompt, {
        message_history_length: messageHistory.length,
        prompt_length: prompt.length,
        max_tokens: maxTokens,
      });

      const systemPrompt = {
        role: "system",
        content:
          "أنت الدكتور بنجي (Dr. Pengy) — مرشد ذكي، ممتع، وصديق لطلاب الثانوي في السعودية...",
      };

      const response = await openai.chat.completions.create({
        model: CONFIG.ai.openai.models.GPT_4O,
        messages: [
          systemPrompt,
          ...messageHistory,
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return sendSuccess(res, { text: response.choices[0].message.content });
    } catch (error) {
      logError(
        "text_generation_direct",
        error instanceof Error ? error : "Unknown error",
      );
      return sendError(res, "Failed to generate text", 500);
    }
  });

  // Prompt analysis endpoint
  apiRouter.post("/ai/analyze-prompt", async (req: Request, res: Response) => {
    console.log("🔥 analyze-prompt called with:", req.body);
    try {
      const { prompt, messageHistory = [] } = req.body;

      logEvent("prompt_analysis", prompt, {
        message_history_length: messageHistory?.length || 0,
        prompt_length: prompt?.length || 0,
      });

      const systemPrompt = {
        role: "system",
        content: `جاوب بالعربي دايما. أنت مقيم صارم ومنصف للتوجيهات المقدمة للذكاء الاصطناعي...`,
      };

      const response = await openai.chat.completions.create({
        model: CONFIG.ai.openai.models.GPT_4O,
        messages: [
          systemPrompt,
          ...messageHistory,
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      let result = {
        score: 8,
        feedback: "توجيه جيد!",
        improvement: "يمكنك إضافة المزيد من التفاصيل.",
      };

      try {
        const content = response.choices[0].message.content || "{}";
        const parsed = JSON.parse(content);

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
        logError(
          "prompt_analysis_parse",
          parseError instanceof Error ? parseError : "Unknown error",
          {
            response_content: response.choices[0].message.content,
          },
        );
      }

      return sendSuccess(res, result);
    } catch (error) {
      logError(
        "prompt_analysis_direct",
        error instanceof Error ? error : "Unknown error",
      );
      return sendError(
        res,
        error instanceof Error ? error.message : "Failed to analyze prompt",
        500
      );
    }
  });

  // HTML generation endpoint
  apiRouter.post("/ai/generate-html", async (req: Request, res: Response) => {
    try {
      const { messageHistory = [] } = req.body;

      const userMessages = messageHistory.filter(
        (msg: { role: string; content: string }) => msg.role === "user",
      );
      if (userMessages.length === 0) {
        return sendError(
          res,
          "At least one user message is required in messageHistory",
          400
        );
      }

      const latestUserMessage = userMessages[userMessages.length - 1];

      logEvent("html_generation", latestUserMessage.content, {
        message_history_length: messageHistory.length,
      });

      const systemPrompt = {
        role: "system",
        content: buildSystemPrompt("DR_PENGY", "HTML_GENERATION"),
      };

      const response = await openai.chat.completions.create({
        model: CONFIG.ai.openai.models.GPT_4O,
        messages: [systemPrompt, ...messageHistory],
        temperature: 0.2,
        max_tokens: CONFIG.tokens.HTML_GENERATION_MAX_TOKENS,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
      });

      const responseContent = response.choices[0].message.content || "";
      let generatedHTML = "";
      let explanatoryMessage = "";
      let isGeneratingHTMLPhase = false;

      const isQuestioningPhase =
        responseContent.indexOf("<!DOCTYPE html>") === -1 &&
        (responseContent.includes("?") ||
          responseContent.includes("سؤال") ||
          responseContent.includes("أسئلة") ||
          responseContent.includes("ممكن توضح") ||
          responseContent.includes("بغيت أفهم") ||
          responseContent.includes("توصف أكثر"));

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
      } else {
        const doctypeIndex = responseContent.indexOf("<!DOCTYPE html>");

        if (doctypeIndex >= 0) {
          isGeneratingHTMLPhase = true;

          const htmlContent = responseContent.substring(doctypeIndex);
          const closingHtmlTagIndex = htmlContent.indexOf("</html>");

          if (closingHtmlTagIndex > 0) {
            generatedHTML = htmlContent.substring(0, closingHtmlTagIndex + 7);

            let explanationText = "";
            if (doctypeIndex > 0) {
              explanationText = responseContent
                .substring(0, doctypeIndex)
                .trim();
            }

            explanatoryMessage =
              explanationText || "سويت لك الصفحة! شوف النتيجة 👈\n\nايش رأيك؟";
          } else {
            generatedHTML = htmlContent;

            if (!generatedHTML.includes("</body>")) {
              generatedHTML += "\n</body>";
            }
            if (!generatedHTML.includes("</html>")) {
              generatedHTML += "\n</html>";
            }

            if (doctypeIndex > 0) {
              explanatoryMessage = responseContent
                .substring(0, doctypeIndex)
                .trim();
            } else {
              explanatoryMessage =
                "سويت لك الصفحة! شوف النتيجة 👈\n\nايش رأيك؟";
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

      logEvent("html_generation_success", latestUserMessage.content, {
        model: CONFIG.ai.openai.models.GPT_4O,
        html_size: generatedHTML.length,
        html_type: generatedHTML.includes("<script") ? "interactive" : "static",
      });

      return sendSuccess(res, {
        html: generatedHTML,
        message: {
          role: "assistant",
          content: explanatoryMessage || "تم إنشاء الصفحة",
        },
        isGeneratingHTML: isGeneratingHTMLPhase,
      });
    } catch (error) {
      logError(
        "html_generation",
        error instanceof Error ? error : "Unknown error",
      );

      return sendError(res, "Failed to generate HTML", 500);
    }
  });

  // Register all other route modules on apiRouter
  registerAITextRoutes(apiRouter, openai);
  registerAIImageRoutes(apiRouter, openai);
  registerGalleryRoutes(apiRouter);
  registerProjectRoutes(apiRouter);
  registerAIAssistantRoutes(apiRouter, openai);
  registerLogsRoutes(apiRouter);
  registerAppBuilderRoutes(apiRouter, openai);
  registerLovableMissionRoutes(apiRouter, openai);
  registerHTMLProjectsRoutes(apiRouter);
  registerStudentsRoutes(apiRouter);
  registerFeedbackRoutes(apiRouter);
  registerHtmlAiRoute(apiRouter);
  registerTranscribeRoute(apiRouter);
  registerGoogleDriveVideosRoutes(apiRouter);
  registerAuthRoutes(apiRouter);
  registerSchoolRoutes(apiRouter);
  registerGenaiSchoolTrainingRoutes(apiRouter);
  registerAppDevFrontendRoutes(apiRouter);
  registerGenAiRoutes(apiRouter);
  registerLovableActivityRoutes(apiRouter, openai);
  registerLovableRoutes(apiRouter);
  registerAiChatRoutes(apiRouter);
  registerImageGenerationRoutes(apiRouter);
  registerAudioTtsRoutes(apiRouter);
  registerProjectSubmissionsRoutes(apiRouter);
  registerCopilotRoutes(apiRouter);
  registerMediaClipsRoutes(apiRouter);
  registerMediaClipVotesRoutes(apiRouter);
  registerLeaderboardRoutes(apiRouter);

  // DEBUG: Log all registered routes
  console.log("🔍 DEBUG: Checking registered routes on apiRouter:");
  apiRouter.stack.forEach((r) => {
    if (r.route) {
      const methods = Object.keys(r.route.methods).join(",").toUpperCase();
      console.log(`📍 Route: ${methods} /api${r.route.path}`);
    }
  });

  // Mount API router
  app.use("/api", apiRouter);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Global error handler caught:", err);
    logError("global_error", err instanceof Error ? err : "Unknown error");
    sendError(res, message, status);
  });

  // Create and return HTTP server
  const server = createServer(app);
  return server;
}
