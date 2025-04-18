/**
 * Validation middleware for API requests
 */
import { Request, Response, NextFunction } from 'express';
import { logError } from '../services/logging';
import OpenAI from 'openai';
import { moderateContent } from '../moderation';

/**
 * Validates that the chat message history follows the expected format
 * @param messageHistory Array of chat messages to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateMessageHistory(messageHistory: any): { 
  isValid: boolean; 
  error?: string;
} {
  // Check if messageHistory is an array
  if (!Array.isArray(messageHistory)) {
    return { 
      isValid: false, 
      error: "messageHistory must be an array" 
    };
  }

  // Empty array is valid
  if (messageHistory.length === 0) {
    return { isValid: true };
  }

  // Validate each message has required properties
  const hasInvalidMessage = messageHistory.some(
    (msg: any) => !msg.role || !msg.content || (msg.role !== 'user' && msg.role !== 'assistant')
  );
  
  if (hasInvalidMessage) {
    return { 
      isValid: false,
      error: "messageHistory contains invalid messages. Each message must have 'role' ('user' or 'assistant') and 'content'."
    };
  }

  return { isValid: true };
}

/**
 * Express middleware to validate chat history in requests
 */
export function validateChatHistory(req: Request, res: Response, next: NextFunction) {
  const { messageHistory = [] } = req.body;
  
  const validation = validateMessageHistory(messageHistory);
  
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }
  
  next();
}

/**
 * Express middleware to validate prompt in requests
 */
export function validatePrompt(req: Request, res: Response, next: NextFunction) {
  const { prompt } = req.body;
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: "A valid prompt is required" });
  }
  
  next();
}

/**
 * Express middleware to moderate content for inappropriate material
 */
export function moderateContentMiddleware(openai: OpenAI) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return next(); // No prompt to moderate, skip
      }
      
      const moderationResult = await moderateContent(prompt, openai);
      
      if (moderationResult.flagged) {
        // Log moderation failure
        logError('content_moderation', 'Content flagged as inappropriate', {
          issues: moderationResult.categories
        });
        
        return res.status(400).json({
          error: "Content flagged as inappropriate",
          moderationResult,
        });
      }
      
      next();
    } catch (error) {
      logError('content_moderation', error instanceof Error ? error : 'Unknown error');
      next(error);
    }
  };
}

/**
 * Basic rate limiter middleware
 * Simple in-memory implementation - would use Redis in production
 */
const requestCounts: Record<string, { count: number, resetTime: number }> = {};

export function simpleRateLimiter(maxRequests: number = 60, timeWindowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    
    // Initialize or reset if time window has passed
    if (!requestCounts[ip] || now > requestCounts[ip].resetTime) {
      requestCounts[ip] = {
        count: 0,
        resetTime: now + timeWindowMs
      };
    }
    
    // Increment request count
    requestCounts[ip].count += 1;
    
    // Check if over limit
    if (requestCounts[ip].count > maxRequests) {
      return res.status(429).json({ 
        error: "Too many requests, please try again later",
        retryAfter: Math.ceil((requestCounts[ip].resetTime - now) / 1000)
      });
    }
    
    next();
  };
}