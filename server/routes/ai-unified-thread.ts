import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import { logEvent } from '../services';
import { moderateContent } from '../moderation';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validate the request schema
const threadRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  threadId: z.string().nullable().optional(),
  model: z.string().default('gpt-4o')
});

/**
 * Unified endpoint for thread-based OpenAI interactions
 * Supports both chat and HTML generation within the same thread
 */
router.post('/unified-thread', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = threadRequestSchema.safeParse(req.body);
    if (!result.success) {
      console.error('Invalid request body:', result.error);
      return res.status(400).json({ 
        error: 'Invalid request format', 
        details: result.error.errors 
      });
    }
    
    const { messages, threadId, model } = result.data;
    
    // Content moderation check on user messages
    for (const message of messages) {
      if (message.role === 'user') {
        const moderationResult = await moderateContent(message.content, openai);
        if (moderationResult.flagged) {
          return res.status(400).json({ 
            error: 'Content moderation failed', 
            categories: moderationResult.categories 
          });
        }
      }
    }
    
    // Track analytics
    const userMessages = messages.filter(m => m.role === 'user');
    const systemMessage = messages.find(m => m.role === 'system');
    const isHtmlMode = systemMessage?.content.includes('HTML') || false;
    
    logEvent(isHtmlMode ? 'html_thread' : 'chat_thread', 
      userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '', 
      {
        message_count: messages.length,
        prompt_length: userMessages.reduce((total, m) => total + m.content.length, 0),
        has_thread_id: !!threadId
      });
    
    // Create completion with the messages
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: isHtmlMode ? 0.2 : 0.7, // Lower temperature for HTML generation
      max_tokens: isHtmlMode ? 4000 : 1000 // More tokens for HTML generation
    });
    
    // Create or retrieve thread ID (for client-side tracking)
    // In a production environment, this would interact with the OpenAI Assistants API
    // to maintain a real thread ID. Here we're using a simplified approach.
    const responseThreadId = threadId || `thread_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Send response
    res.json({
      text: completion.choices[0].message.content || '',
      threadId: responseThreadId,
    });
    
    // Track successful completion
    logEvent(isHtmlMode ? 'html_thread_success' : 'chat_thread_success',
      completion.choices[0].message.content || '',
      {
        response_length: completion.choices[0].message.content?.length || 0,
        token_usage: completion.usage?.total_tokens || 0,
        has_thread_id: !!threadId
      });
  } catch (error) {
    console.error('Error in unified thread API:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

export default router;