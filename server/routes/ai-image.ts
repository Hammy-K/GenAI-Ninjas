/**
 * AI Image Generation Routes
 * Handles all image-related operations including generation and moderation
 */
import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { logEvent, logError } from '../services/logging';
import { validateChatHistory, validatePrompt, moderateContentMiddleware } from '../middleware/validation';
import { moderateContent } from '../moderation';

export function registerAIImageRoutes(router: Router, openai: OpenAI) {
  // Apply common middleware to all routes
  const imageRoutes = Router();
  imageRoutes.use(validateChatHistory);
  imageRoutes.use(moderateContentMiddleware(openai));

  // Image generation endpoint with chat history support
  imageRoutes.post("/image", validatePrompt, async (req: Request, res: Response) => {
    try {
      const { prompt, messageHistory = [] } = req.body;

      // Log the image generation request (with minimal info for privacy)
      logEvent('image_generation', prompt, {
        message_history_length: messageHistory.length,
        prompt_length: prompt.length
      });

      // Determine if this is a follow-up request by checking for previous images
      const isFollowUpRequest = messageHistory.some(
        (msg: any) => msg.role === 'assistant' && msg.content.includes('image')
      );

      // Extract the base concept if this is a follow-up request
      let enhancedPrompt = prompt;
      
      if (isFollowUpRequest) {
        // Find all user messages to gather context
        const userMessages = messageHistory.filter((msg: any) => msg.role === 'user');
        
        // Extract the base concept (first substantive prompt)
        const baseImageConcept = userMessages.length > 0 ? userMessages[0].content : '';
        
        // Extract follow-up requests for context
        const followUpRequests = userMessages.slice(1);
        
        // If this is a follow-up request, enhance the prompt with context
        if (baseImageConcept && baseImageConcept !== prompt) {
          enhancedPrompt = `Original concept: "${baseImageConcept}". Now changing to: "${prompt}"`;
          
          // Log the enhanced prompt
          logEvent('image_generation_enhanced', prompt, {
            is_followup_request: true,
            base_concept_length: baseImageConcept.length,
            follow_up_count: followUpRequests.length,
            enhanced_prompt_length: enhancedPrompt.length
          });
        }
      }

      // Generate image with appropriate parameters
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        // Remove the invalid "quality" parameter as requested
      });

      // Log successful image generation
      logEvent('image_generation_success', prompt, {
        model: "dall-e-3",
        is_context_enhanced: isFollowUpRequest,
        conversation_turns: messageHistory.length
      });

      return res.json({ url: response.data[0].url });
    } catch (error) {
      logError('image_generation', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to generate image" });
    }
  });
  
  // Content moderation endpoint
  imageRoutes.post("/moderate", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      
      // Log the content moderation request (with minimal content for privacy)
      logEvent('content_moderation', text.substring(0, 20), {
        text_length: text.length
      });
      
      const moderationResult = await moderateContent(text, openai);
      
      // Log the moderation result if flagged
      if (moderationResult.flagged) {
        logEvent('content_moderation_flagged', text.substring(0, 20), {
          issues: moderationResult.categories
        });
      }
      
      return res.json(moderationResult);
    } catch (error) {
      logError('content_moderation', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to moderate content" });
    }
  });

  // Image proxy endpoint to avoid CORS issues with direct downloads
  imageRoutes.get("/image-proxy", async (req: Request, res: Response) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      // Only proxy images from trusted domains (OpenAI)
      if (!url.startsWith('https://oaidalleapiprodscus')) {
        return res.status(403).json({ error: "Only OpenAI image URLs are supported" });
      }
      
      // Import axios if not at the top
      const axios = require('axios');
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });
      
      // Set appropriate headers
      res.setHeader('Content-Type', response.headers['content-type']);
      res.setHeader('Content-Disposition', 'inline; filename="ai-generated-image.png"');
      
      // Stream the image data to the client
      response.data.pipe(res);
    } catch (error) {
      logError('image_proxy', error instanceof Error ? error : 'Unknown error');
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  // Mount all AI image routes to the main router
  router.use('/ai', imageRoutes);
}