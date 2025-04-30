/**
 * OpenAI Assistant API Logger
 * 
 * This service handles logging of all OpenAI Assistant API interactions
 * for analytics, debugging, and audit purposes.
 */
import { db } from '../db';
import { assistantLogs, type InsertAssistantLog } from '@shared/schema';
import { logError } from './logging';

/**
 * Logs an OpenAI Assistant API interaction to the database
 * This is designed to be fire-and-forget and should not block the main API flow
 * 
 * @param logData Data about the API interaction to log
 */
export async function logAssistantInteraction(logData: InsertAssistantLog): Promise<void> {
  try {
    // Note: timestamp is automatically added by the database with defaultNow()
    const logEntry: InsertAssistantLog = {
      ...logData
    };

    // Insert into database
    await db.insert(assistantLogs).values(logEntry);
  } catch (error) {
    // Log the error, but don't throw - this should never block the main application flow
    logError(
      'assistant_logger', 
      `Failed to log assistant interaction: ${error instanceof Error ? error.message : String(error)}`
    );
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
    if (response?.usage) {
      return {
        prompt: response.usage.prompt_tokens || 0,
        completion: response.usage.completion_tokens || 0,
        total: response.usage.total_tokens || 0
      };
    }
    return null;
  } catch (error) {
    logError('token_extraction', error instanceof Error ? error.message : String(error));
    return null;
  }
}