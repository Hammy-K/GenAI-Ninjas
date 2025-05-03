/**
 * AI Image Generation Routes
 * Handles all image-related operations including generation and moderation
 */
import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { logEvent, logError } from "../services";
import {
  validateChatHistory,
  validatePrompt,
  moderateContentMiddleware,
} from "../middleware/validation";
import { moderateContent } from "../moderation";

export function registerAIImageRoutes(router: Router, openai: OpenAI) {
  // Apply common middleware to all routes
  const imageRoutes = Router();
  imageRoutes.use(validateChatHistory);
  imageRoutes.use(moderateContentMiddleware(openai));

  // Image generation endpoint with GPT-4.1-mini prompt enhancement and GPT Image generation
  imageRoutes.post(
    "/image",
    validatePrompt,
    async (req: Request, res: Response) => {
      try {
        const { prompt, messageHistory = [] } = req.body;

        // Log the image generation request (with minimal info for privacy)
        logEvent("image_generation", prompt, {
          message_history_length: messageHistory.length,
          prompt_length: prompt.length,
        });

        // Use GPT-4.1-mini to enhance the user's prompt
        // Call GPT-4.1-mini to enhance the prompt with proper typing
        const promptEnhancementResponse = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert at writing beautiful, high-quality prompts for image generation. 
Your job is to convert short or vague user inputs into detailed, vivid, and specific prompts 
that create stunning and useful images. Avoid adding any text or writing in the image unless the student clearly asks for it. 
Your reply should only include the final image prompt — no explanations or extra commentary.`,
            },
            {
              role: "user",
              content: `I want an image of: ${prompt}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        });

        // Extract the enhanced prompt
        const enhancedPrompt =
          promptEnhancementResponse.choices[0].message.content || prompt;

        // Log that we've enhanced the prompt
        logEvent("prompt_enhancement", prompt, {
          original_length: prompt.length,
          enhanced_length: enhancedPrompt.length,
          model: "gpt-4.1-mini",
        });

        // Generate image with GPT Image using the enhanced prompt
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          // Note: 'style' parameter removed as it's not supported by gpt-image-1
        });

        // Log successful image generation
        logEvent("image_generation_success", prompt, {
          model: "gpt-image-1",
          quality: "hd",
          enhanced: true,
          enhanced_by: "gpt-4.1-mini",
          conversation_turns: messageHistory.length,
        });

        return res.json({ url: response.data[0].url });
      } catch (error) {
        logError(
          "image_generation",
          error instanceof Error ? error : "Unknown error",
        );
        return res.status(500).json({ error: "Failed to generate image" });
      }
    },
  );

  // Content moderation endpoint
  imageRoutes.post("/moderate", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Log the content moderation request (with minimal content for privacy)
      logEvent("content_moderation", text.substring(0, 20), {
        text_length: text.length,
      });

      const moderationResult = await moderateContent(text, openai);

      // Log the moderation result if flagged
      if (moderationResult.flagged) {
        logEvent("content_moderation_flagged", text.substring(0, 20), {
          issues: moderationResult.categories,
        });
      }

      return res.json(moderationResult);
    } catch (error) {
      logError(
        "content_moderation",
        error instanceof Error ? error : "Unknown error",
      );
      return res.status(500).json({ error: "Failed to moderate content" });
    }
  });

  // Image proxy endpoint to avoid CORS issues with direct downloads
  imageRoutes.get("/image-proxy", async (req: Request, res: Response) => {
    try {
      const { url } = req.query;

      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      // Only proxy images from trusted domains (OpenAI)
      // Support both DALL-E and GPT Image URL formats
      if (!url.startsWith("https://oaidalleapiprodscus") && 
          !url.startsWith("https://dalleclient.blob.core.windows.net") && 
          !url.startsWith("https://gptimageprodsus")) {
        return res
          .status(403)
          .json({ error: "Only OpenAI image URLs are supported" });
      }

      // Import axios if not at the top
      const axios = require("axios");

      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
      });

      // Set appropriate headers
      res.setHeader("Content-Type", response.headers["content-type"]);
      res.setHeader(
        "Content-Disposition",
        'inline; filename="ai-generated-image.png"',
      );

      // Stream the image data to the client
      response.data.pipe(res);
    } catch (error) {
      logError("image_proxy", error instanceof Error ? error : "Unknown error");
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  // Mount all AI image routes to the main router
  router.use("/ai", imageRoutes);
}
