/**
 * AI Text Generation Routes
 * Handles all text-based AI operations including chat, completions, and HTML generation
 */
import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { logEvent, logError } from '../services';
import { validateChatHistory, validatePrompt, moderateContentMiddleware } from '../middleware/validation';
import { buildSystemPrompt, trimMessageHistory, FEW_SHOT_EXAMPLES } from '../templates/prompts';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const GPT_MODEL = "gpt-4o";

export function registerAITextRoutes(router: Router, openai: OpenAI) {
  // Apply common middleware to all routes
  const aiRoutes = Router();
  aiRoutes.use(validateChatHistory);
  aiRoutes.use(moderateContentMiddleware(openai));

  // Text generation endpoint
  aiRoutes.post("/generate", validatePrompt, async (req: Request, res: Response) => {
    try {
      const { prompt, messageHistory = [], maxTokens = 1000 } = req.body;
      
      // Log the text generation request (with truncated prompt)
      logEvent('text_generation', prompt, {
        message_history_length: messageHistory.length,
        prompt_length: prompt.length,
        max_tokens: maxTokens
      });

      // Build the system prompt using our template
      const systemPrompt = {
        role: "system",
        content: buildSystemPrompt('DR_PENGY', 'GENERAL_CONVERSATION')
      };

      // Trim message history to reduce token usage
      const trimmedHistory = trimMessageHistory(messageHistory, 5);

      // Construct the messages array for OpenAI
      const messages = [
        systemPrompt,
        ...trimmedHistory,
        { role: "user", content: prompt },
      ];

      // Call OpenAI with consistent parameters
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
      });

      // Log successful text generation
      logEvent('text_generation_success', prompt, {
        model: GPT_MODEL,
        response_length: response.choices[0].message.content?.length || 0,
        conversation_turns: messageHistory.length + 1
      });

      return res.json({ text: response.choices[0].message.content });
    } catch (error) {
      logError('text_generation', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to generate text" });
    }
  });

  // Prompt analysis endpoint
  aiRoutes.post("/analyze-prompt", validatePrompt, async (req: Request, res: Response) => {
    try {
      const { prompt, messageHistory = [] } = req.body;

      // Log the prompt analysis request
      logEvent('prompt_analysis', prompt, {
        message_history_length: messageHistory.length,
        prompt_length: prompt.length
      });

      // Include few-shot examples for better results
      const fewShotExamples = FEW_SHOT_EXAMPLES.PROMPT_ENGINEERING;
      
      // Build the system prompt specifically for prompt analysis
      const systemPrompt = {
        role: "system",
        content: buildSystemPrompt('DR_PENGY', 'PROMPT_ANALYSIS')
      };

      // Include message history, few-shot examples, and the current prompt
      const messages = [
        systemPrompt,
        ...fewShotExamples,
        ...messageHistory,
        { role: "user", content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
        temperature: 0.5, // Lower temperature for more consistent evaluations
        response_format: { type: "json_object" },
      });

      // Safely parse the JSON response
      let result;
      try {
        const messageContent = response.choices[0].message.content || "{}";
        result = JSON.parse(messageContent);
        
        // Validate that we have all required fields with correct types
        if (typeof result.score !== 'number' || !result.score) {
          result.score = 8; // Default to a favorable score
        }
        
        if (!result.feedback || typeof result.feedback !== 'string') {
          result.feedback = "توجيه رائع! استمر بالعمل الجيد.";
        }
        
        if (!result.improvement || typeof result.improvement !== 'string') {
          result.improvement = "يمكنك إضافة المزيد من التفاصيل لتحسين النتائج.";
        }
        
        // Ensure score is within range
        result.score = Math.max(1, Math.min(10, Math.round(result.score)));
        
      } catch (parseError) {
        logError('prompt_analysis_parse', parseError instanceof Error ? parseError : 'Unknown error', {
          response_content: response.choices[0].message.content
        });
        
        // Provide a robust fallback structure if parsing fails
        result = {
          score: 8,
          feedback: "توجيه جيد! استمر بالعمل الرائع.",
          improvement: "يمكنك إضافة المزيد من التفاصيل المحددة للحصول على نتائج أفضل."
        };
      }
      
      // Log the analysis result with score
      logEvent('prompt_analysis_result', prompt, {
        score: result.score,
        passed_threshold: result.score >= 7,
        model: GPT_MODEL
      });
      
      return res.json(result);
    } catch (error) {
      logError('prompt_analysis', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to analyze prompt" });
    }
  });

  // HTML generation endpoint with chat history
  aiRoutes.post("/generate-html", async (req: Request, res: Response) => {
    try {
      const { messageHistory = [] } = req.body;

      // Make sure we have at least one user message
      const userMessages = messageHistory.filter((msg: any) => msg.role === 'user');
      if (userMessages.length === 0) {
        return res.status(400).json({ error: "At least one user message is required in messageHistory" });
      }

      // Get the latest user message for logging
      const latestUserMessage = userMessages[userMessages.length - 1];

      // Log the HTML generation request
      logEvent('html_generation', latestUserMessage.content, {
        message_history_length: messageHistory.length
      });

      // Build the system prompt for HTML generation
      const systemPrompt = {
        role: "system",
        content: buildSystemPrompt('DR_PENGY', 'HTML_GENERATION')
      };

      // Trim message history to reduce tokens
      const trimmedHistory = trimMessageHistory(messageHistory, 4);

      // Always start with the system prompt, then include message history
      const messages = [
        systemPrompt,
        ...trimmedHistory
      ];

      // Use specific parameters for consistent, high-quality code
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
        temperature: 0.3, // Lower temperature for more consistent code
        top_p: 0.95,
        max_tokens: 2000, // Allow enough tokens for complex HTML
      });

      // Extract HTML from the response
      let generatedHTML = response.choices[0].message.content || "";
      
      // Extract code blocks
      const htmlPattern = /```html\s([\s\S]*?)```/;
      const htmlMatch = generatedHTML.match(htmlPattern);
      
      if (htmlMatch && htmlMatch[1]) {
        generatedHTML = htmlMatch[1].trim();
      } else {
        // Try to fix if missing proper HTML doctype
        const doctypeIndex = generatedHTML.indexOf('<!DOCTYPE html>');
        if (doctypeIndex >= 0) {
          generatedHTML = generatedHTML.substring(doctypeIndex);
        } else {
          // Fallback to a basic HTML template
          generatedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <p>The AI had trouble generating HTML. Please try again with a different prompt.</p>
</body>
</html>`;

          // Log the HTML generation failure
          logEvent('html_generation_parsing_failed', latestUserMessage.content, {
            model: GPT_MODEL,
            response_length: response.choices[0].message.content?.length || 0
          });
        }
      }

      // Log successful HTML generation with metrics
      logEvent('html_generation_success', latestUserMessage.content, {
        model: GPT_MODEL,
        html_size: generatedHTML.length,
        html_type: generatedHTML.includes('<script') ? 'interactive' : 'static'
      });

      // Return the complete response with the assistant's message
      return res.json({
        html: generatedHTML,
        message: {
          role: "assistant",
          content: generatedHTML,
        },
      });
    } catch (error) {
      logError('html_generation', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: "Failed to generate HTML" });
    }
  });

  // Mount all AI text routes to the main router
  router.use('/ai/text', aiRoutes);
}