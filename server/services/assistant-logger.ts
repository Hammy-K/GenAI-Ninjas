/**
 * OpenAI Assistant API Logger
 * 
 * This service handles logging of all OpenAI Assistant API interactions
 * for analytics, debugging, and audit purposes.
 */

import { db } from '../db';
import { assistantLogs, InsertAssistantLog } from '@shared/schema';

/**
 * Logs an OpenAI Assistant API interaction to the database
 * This is designed to be fire-and-forget and should not block the main API flow
 * 
 * @param logData Data about the API interaction to log
 */
export async function logAssistantInteraction(logData: Omit<InsertAssistantLog, 'timestamp'>): Promise<void> {
  try {
    // Insert the log asynchronously
    await db.insert(assistantLogs).values({
      ...logData,
      // These fields are required but can be null in DB
      userId: logData.userId || null,
      tokens: logData.tokens || null,
      errorMessage: logData.errorMessage || null,
    });
  } catch (error) {
    // Log the error but don't throw - this is intentionally fire-and-forget
    console.error('[AssistantLogger] Failed to log assistant interaction:', error);
  }
}

/**
 * Extracts token usage information from an OpenAI API response
 * 
 * @param response The OpenAI API response
 * @returns Object containing token usage information or null if not available
 */
export function extractTokenUsage(response: any): { prompt: number; completion: number; total: number } | null {
  try {
    if (
      response?.usage &&
      typeof response.usage.prompt_tokens === 'number' &&
      typeof response.usage.completion_tokens === 'number' &&
      typeof response.usage.total_tokens === 'number'
    ) {
      return {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      };
    }
    return null;
  } catch (error) {
    console.error('[AssistantLogger] Error extracting token usage:', error);
    return null;
  }
}