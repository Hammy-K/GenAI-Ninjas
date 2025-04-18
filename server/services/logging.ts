/**
 * Logging service for server-side operations
 * Provides structured logging for API interactions, especially AI operations
 */

interface LogMetadata {
  [key: string]: any;
}

/**
 * Log a prompt or API interaction
 * @param eventType The type of event being logged (e.g., 'text_generation', 'image_generation')
 * @param content Brief description or truncated content (never log full prompts)
 * @param metadata Additional structured data to include with the log
 */
export function logEvent(eventType: string, content: string, metadata: LogMetadata = {}): void {
  try {
    // Sanitize content by truncating if needed
    const truncatedContent = content.length > 20 
      ? content.substring(0, 20) + '...' 
      : content;
    
    console.log(`[Server Analytics] ${eventType}`);
    
    // Only log length, not the actual content
    if (content) {
      console.log(`[Server Analytics] Length: ${content.length} chars`);
    }
    
    if (Object.keys(metadata).length > 0) {
      console.log(`[Server Analytics] Metadata:`, JSON.stringify(metadata));
    }
    
    // This would ideally connect to a database or analytics service
    // For a production application, implement real logging here
  } catch (error) {
    console.error('[Server Analytics] Failed to log event:', error);
  }
}

/**
 * Log errors from API operations
 * @param eventType The type of event that errored
 * @param error The error object or message
 * @param additionalInfo Any additional context about the error
 */
export function logError(eventType: string, error: Error | string, additionalInfo: LogMetadata = {}): void {
  try {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorType = error instanceof Error ? error.name : 'Unknown';
    
    console.error(`[Server Analytics] Error in ${eventType}: ${errorMessage}`);
    
    const metadata = {
      error_type: errorType,
      ...additionalInfo
    };
    
    if (Object.keys(metadata).length > 0) {
      console.error(`[Server Analytics] Error metadata:`, JSON.stringify(metadata));
    }
    
    // In production, this should send to an error tracking service
  } catch (secondaryError) {
    console.error('[Server Analytics] Failed to log error event:', secondaryError);
  }
}