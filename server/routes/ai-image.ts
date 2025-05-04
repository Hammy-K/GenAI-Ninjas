/**
 * AI Image Generation Routes
 * Handles all image-related operations including generation and moderation
 */
import { Router, Request, Response } from "express";
import OpenAI from "openai";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { logEvent, logError } from "../services";
import {
  validateChatHistory,
  validatePrompt,
  moderateContentMiddleware,
} from "../middleware/validation";
import { moderateContent } from "../moderation";

// Prepare file system utilities
const writeFileAsync = promisify(fs.writeFile);

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

        // Generate image with GPT Image using direct API call to handle base64 response
        console.log("🔍 DEBUG - Making direct API call to OpenAI with model: gpt-image-1");
        
        // Make direct API call to OpenAI
        const openaiApiResponse = await axios({
          method: "POST",
          url: "https://api.openai.com/v1/images/generations",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          data: {
            model: "gpt-image-1",
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
            quality: "auto"  // Use auto quality as specified in docs
          }
        });
        
        // gpt-image-1 always returns base64-encoded images
        const b64Image = openaiApiResponse.data.data[0].b64_json;

        if (!b64Image) {
          console.log("🔍 DEBUG - No base64 image data received from OpenAI");
          throw new Error("No image data received from OpenAI");
        }

        console.log("🔍 DEBUG - Received base64 image from OpenAI");

        // Generate a unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const filename = `gpt-image-${timestamp}-${randomId}.png`;
        const imagePath = path.join(
          "server",
          "public",
          "generated-images",
          filename,
        );

        // Write the image to disk
        const imageBuffer = Buffer.from(b64Image, "base64");
        await writeFileAsync(imagePath, imageBuffer);

        console.log(`🔍 DEBUG - Saved image to: ${imagePath}`);

        // Create a URL for the image
        const imageUrl = `/generated-images/${filename}`;

        // Log successful image generation with detailed information
        logEvent("image_generation_success", prompt, {
          model: "gpt-image-1",
          quality: "standard",
          enhanced: true,
          enhanced_by: "gpt-4.1-mini",
          conversation_turns: messageHistory.length,
          image_storage: "local",
          filename: filename,
          format: "base64_to_png",
        });

        return res.json({ url: imageUrl });
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
      console.log("🔍 DEBUG - Image proxy request received for URL:", 
                 typeof url === 'string' ? url.substring(0, 50) + '...' : url);

      if (!url || typeof url !== "string") {
        console.log(
          "🔍 DEBUG - Image proxy error: URL parameter is missing or not a string",
        );
        return res.status(400).json({ error: "URL parameter is required" });
      }

      // Handle local image paths or external OpenAI URLs
      if (url.startsWith('/generated-images/')) {
        // This is a local image path, serve the file directly
        console.log("🔍 DEBUG - Local image requested, redirecting to static path:", url);
        return res.redirect(url);
      }
      // For external URLs, allow trusted domains (OpenAI, Firebase, and storage services)
      // But also allow other domains, with a warning
      const isTrustedDomain = (
        // OpenAI image domains
        url.startsWith("https://oaidalleapiprodscus") ||
        url.startsWith("https://dalleclient.blob.core.windows.net") ||
        url.startsWith("https://gptimageprodsus") ||
        url.startsWith("https://gptimageprod") ||
        url.startsWith("https://openai-api") ||
        // Firebase Storage domains
        url.startsWith("https://firebasestorage.googleapis.com") ||
        url.startsWith("https://storage.googleapis.com") ||
        // General cloud storage domains that might be used by Firebase
        url.includes(".googleusercontent.com") ||
        // Common image hosting sites for testing
        url.startsWith("https://placekitten.com") ||
        url.startsWith("https://picsum.photos") ||
        url.startsWith("https://images.unsplash.com")
      );
      
      if (!isTrustedDomain) {
        console.log(
          "🔍 DEBUG - Image proxy warning: URL domain not in trusted list:",
          url.substring(0, 50) + '...',
        );
        // Continue and try to proxy anyway, but log a warning
      }
      console.log("🔍 DEBUG - Image proxy URL validation passed for:", url.substring(0, 50) + '...');

      // Use the axios instance imported at the top
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
      });

      // Log successful response headers
      console.log(`🔍 DEBUG - Image proxy successful response:`, {
        contentType: response.headers["content-type"],
        contentLength: response.headers["content-length"],
        url: typeof url === 'string' ? url.substring(0, 30) + '...' : url
      });
      
      // Set appropriate headers
      res.setHeader("Content-Type", response.headers["content-type"] || 'image/png');
      res.setHeader(
        "Content-Disposition",
        'inline; filename="ai-generated-image.png"',
      );
      
      // Add caching headers to improve performance
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      // Check if it's a local or external URL and set a custom header
      const imageSource = typeof url === 'string' && url.startsWith('/generated-images/') ? 'local' : 'external';
      res.setHeader("X-Image-Source", imageSource);
      
      // Add a custom header for debugging
      res.setHeader("X-Image-Proxy-Status", "success");

      // Stream the image data to the client
      response.data.pipe(res);
    } catch (error) {
      console.error("🔍 DEBUG - Image proxy error:", error);
      
      // Get the URL from the request query for error reporting
      const requestUrl = typeof req.query.url === 'string' ? req.query.url : 'unknown';
      
      // Check for specific error types to provide better error messages
      if (axios.isAxiosError(error)) {
        console.log(`🔍 DEBUG - Axios error details:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: requestUrl.substring(0, 30) + '...'
        });
        
        // Handle 404 errors specifically - image not found
        if (error.response?.status === 404) {
          return res.status(404).json({ 
            error: "Image not found", 
            details: "The requested image URL could not be found on the server"
          });
        }
        
        // Handle other specific status codes if needed
        if (error.response?.status === 403) {
          return res.status(403).json({ 
            error: "Access forbidden", 
            details: "The image server denied access to this resource"
          });
        }
      }
      
      // General error logging and response
      logError("image_proxy", error instanceof Error ? error : "Unknown error");
      res.status(500).json({ 
        error: "Failed to proxy image",
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });

  // Mount all AI image routes to the main router
  router.use("/ai", imageRoutes);
}
