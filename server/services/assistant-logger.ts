/**
 * OpenAI Assistant API Logger
 *
 * This service handles logging of all OpenAI Assistant API interactions
 * for analytics, debugging, and audit purposes.
 *
 * Enhanced with Firebase Anonymous Auth tracking to provide persistent
 * user identity across sessions for better analytics and tracking.
 */
import { db } from "../db";
import { assistantLogs, type InsertAssistantLog } from "@shared/schema";
import { logError } from "./logging";

/**
 * Logs an OpenAI Assistant API interaction to the database
 * This is designed to be fire-and-forget and should not block the main API flow
 *
 * @param logData Data about the API interaction to log
 */
export async function logAssistantInteraction(
  logData: InsertAssistantLog,
): Promise<void> {
  try {
    // Note: timestamp is automatically added by the database with defaultNow()
    const logEntry: InsertAssistantLog = {
      ...logData,
      // Make sure identity fields are properly passed through if available
      firebaseUid: logData.firebaseUid || null,
      userName: logData.userName || null,
      // Use deviceId as a fallback when Firebase UID is not available
      // This allows us to track interactions across sessions even when Firebase Anonymous Auth is not enabled
      deviceId: logData.deviceId || null,
      // Student information fields for Lovable Mission
      studentName: logData.studentName || null,
      studentId: logData.studentId || null,
      userId:
        logData.studentId !== null ? parseInt(logData?.studentId ?? "") : null,
    };

    console.log("#########################################");
    console.log("Logging assistant interaction:", logEntry);
    console.log("#########################################");

    // Insert into database
    await db.insert(assistantLogs).values(logEntry);
  } catch (error) {
    // Log the error, but don't throw - this should never block the main application flow
    logError(
      "assistant_logger",
      `Failed to log assistant interaction: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Extracts token usage information from an OpenAI API response
 *
 * @param response The OpenAI API response
 * @returns Object containing token usage information or null if not available
 */
export function extractTokenUsage(
  response: any,
): { prompt: number; completion: number; total: number } | null {
  try {
    if (response?.usage) {
      return {
        prompt: response.usage.prompt_tokens || 0,
        completion: response.usage.completion_tokens || 0,
        total: response.usage.total_tokens || 0,
      };
    }
    return null;
  } catch (error) {
    logError(
      "token_extraction",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
