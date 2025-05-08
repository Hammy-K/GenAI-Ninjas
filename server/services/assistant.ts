/**
 * OpenAI Assistant Service
 * 
 * This service uses the OpenAI Assistant API to interact with different assistants
 * with persistent thread history for better contextual understanding.
 */
import OpenAI from 'openai';
import { logEvent, logError } from './logging';
import { logAssistantInteraction, extractTokenUsage } from './assistant-logger';

// Constants for the Assistants
const HTML_ASSISTANT_ID = 'asst_o8p9ImGTnvhGKDge3x8qht3j'; // HTML generator assistant
const TRYAI_ASSISTANT_ID = 'asst_x31y8qYnTlwvs1gAxKCNG5KB'; // TryAI stage assistant

// Thread Map for session persistence
// Using a file-backed storage solution would be better in production
// This is a simple in-memory solution that persists threads until server restart
const threadMap = new Map<string, string>();

// Optional: load thread map from database on startup and save on shutdown
// This could be implemented with a PostgreSQL table for thread persistence

// Message types matching the client's expected format
interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Response format for HTML generation
interface AssistantResponse {
  html: string;
  message: AssistantMessage;
  isGeneratingHTML: boolean;
  error?: string;
}

// Response format for TryAI stage chat
interface TryAIResponse {
  text: string;
  error?: string;
}

export class AssistantService {
  private openai: OpenAI;
  
  constructor(openai: OpenAI) {
    this.openai = openai;
  }
  
  /**
   * Generate HTML using the Assistant API
   * 
   * @param messageHistory Previous messages for context
   * @param sessionId Unique identifier for the user session
   * @param firebaseUid Optional Firebase Anonymous Auth UID for persistent user identification
   * @param deviceId Optional device ID as a fallback when Firebase auth is not available
   * @returns HTML and explanatory message
   */
  async generateHTML(
    messageHistory: AssistantMessage[],
    sessionId: string,
    firebaseUid?: string,
    deviceId?: string
  ): Promise<AssistantResponse> {
    const startTime = Date.now();
    let threadId: string = "";
    let latestUserMessage: AssistantMessage | undefined;
    
    try {
      // Get or create thread for this session
      const existingThreadId = this.getThreadId(sessionId);
      
      if (existingThreadId) {
        threadId = existingThreadId;
      } else {
        threadId = await this.createThread(sessionId);
      }
      
      // Get the last user message for logging purposes
      latestUserMessage = messageHistory
        .filter(msg => msg.role === 'user')
        .pop();
      
      if (!latestUserMessage) {
        return this.createErrorResponse("No user messages found in history");
      }
      
      // Check if this is a new thread - if so, add ALL messages for context
      if (!existingThreadId) {
        // Add all messages to the thread in the correct order to build context
        for (const message of messageHistory) {
          if (message.role === 'user' || message.role === 'assistant') {
            await this.openai.beta.threads.messages.create(
              threadId,
              {
                role: message.role,
                content: message.content,
              }
            );
          }
        }
      } else {
        // If existing thread, just add the latest user message to continue the conversation
        await this.openai.beta.threads.messages.create(
          threadId,
          {
            role: "user",
            content: latestUserMessage.content,
          }
        );
      }
      
      // Run the assistant on the thread - using the instructions already set up in the OpenAI Assistant portal
      const run = await this.openai.beta.threads.runs.create(
        threadId,
        {
          assistant_id: HTML_ASSISTANT_ID,
        }
      );
      
      // Wait for the run to complete
      const completedRun = await this.waitForRunCompletion(threadId, run.id);
      
      if (completedRun.status !== 'completed') {
        const errorMsg = `Assistant run failed with status: ${completedRun.status}`;
        
        // Log the failed interaction asynchronously (fire and forget)
        logAssistantInteraction({
          sessionId,
          threadId,
          assistantId: HTML_ASSISTANT_ID,
          model: "gpt-4o", // Assistants use GPT-4o by default
          promptContent: messageHistory,
          responseContent: { error: errorMsg },
          errorMessage: errorMsg,
          firebaseUid: firebaseUid || null,
          deviceId: deviceId || null
        }).catch(e => console.error("Failed to log assistant error:", e));
        
        return this.createErrorResponse(errorMsg);
      }
      
      // Get messages from the thread
      const messages = await this.openai.beta.threads.messages.list(threadId);
      
      // Extract the latest assistant message
      const assistantMessages = messages.data
        .filter(msg => msg.role === 'assistant')
        .map(msg => {
          if (msg.content[0]?.type === 'text') {
            return {
              role: 'assistant',
              content: msg.content[0].text.value
            } as AssistantMessage;
          }
          return null;
        })
        .filter(Boolean) as AssistantMessage[];
      
      if (assistantMessages.length === 0) {
        const errorMsg = "No assistant response received";
        
        // Log the failed interaction asynchronously (fire and forget)
        logAssistantInteraction({
          sessionId,
          threadId,
          assistantId: HTML_ASSISTANT_ID,
          model: "gpt-4o",
          promptContent: messageHistory,
          responseContent: { error: errorMsg },
          errorMessage: errorMsg
        }).catch(e => console.error("Failed to log assistant error:", e));
        
        return this.createErrorResponse(errorMsg);
      }
      
      const latestAssistantMessage = assistantMessages[0];
      
      // Process the assistant's response to extract HTML and explanatory text
      if (latestAssistantMessage && latestAssistantMessage.content) {
        const response = this.processAssistantResponse(latestAssistantMessage.content);
        
        // Calculate tokens based on prompt and response length (approximate)
        const promptTokens = JSON.stringify(messageHistory).length / 4; // ~4 chars per token
        const responseTokens = latestAssistantMessage.content.length / 4;
        
        // Log the successful interaction asynchronously (fire and forget)
        logAssistantInteraction({
          sessionId,
          threadId,
          assistantId: HTML_ASSISTANT_ID,
          model: "gpt-4o",
          promptContent: messageHistory,
          responseContent: {
            message: latestAssistantMessage.content,
            html: response.html,
            isGeneratingHTML: response.isGeneratingHTML
          },
          tokens: {
            prompt: Math.round(promptTokens),
            completion: Math.round(responseTokens),
            total: Math.round(promptTokens + responseTokens)
          },
          firebaseUid: firebaseUid || null,
          deviceId: deviceId || null
        }).catch(e => console.error("Failed to log assistant interaction:", e));
        
        return response;
      } else {
        const errorMsg = "Invalid assistant response format";
        
        // Log the failed interaction asynchronously (fire and forget)
        logAssistantInteraction({
          sessionId,
          threadId,
          assistantId: HTML_ASSISTANT_ID,
          model: "gpt-4o",
          promptContent: messageHistory,
          responseContent: { error: errorMsg },
          errorMessage: errorMsg,
          firebaseUid: firebaseUid || null,
          deviceId: deviceId || null
        }).catch(e => console.error("Failed to log assistant error:", e));
        
        return this.createErrorResponse(errorMsg);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logError("assistant_html_generation", errorMessage);
      
      // Log the error asynchronously (fire and forget)
      if (latestUserMessage && threadId) {
        logAssistantInteraction({
          sessionId,
          threadId,
          assistantId: HTML_ASSISTANT_ID,
          model: "gpt-4o",
          promptContent: messageHistory,
          responseContent: { error: errorMessage },
          errorMessage: errorMessage,
          firebaseUid: firebaseUid || null,
          deviceId: deviceId || null
        }).catch(e => console.error("Failed to log assistant error:", e));
      }
      
      return this.createErrorResponse(errorMessage);
    }
  }
  
  /**
   * Create a new thread and store it for the session
   * 
   * @param sessionId Unique session identifier
   * @returns Thread ID
   */
  private async createThread(sessionId: string): Promise<string> {
    try {
      const thread = await this.openai.beta.threads.create();
      
      // Store the thread ID for this session
      threadMap.set(sessionId, thread.id);
      return thread.id;
    } catch (error) {
      logError("assistant_create_thread", error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }
  
  /**
   * Get thread ID for a session, if exists
   * 
   * @param sessionId Session identifier
   * @returns Thread ID or undefined
   */
  private getThreadId(sessionId: string): string | undefined {
    return threadMap.get(sessionId);
  }
  
  /**
   * Poll for run completion
   * 
   * @param threadId Thread ID
   * @param runId Run ID
   * @returns Run result
   */
  private async waitForRunCompletion(threadId: string, runId: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      
      if (['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
        return run;
      }
      
      // Wait for 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
    
    throw new Error("Run timed out after 5 minutes");
  }
  
  /**
   * Process the assistant's response to extract HTML and explanatory text
   * 
   * @param responseContent Full response from the assistant
   * @returns Structured response with HTML and message
   */
  private processAssistantResponse(responseContent: string): AssistantResponse {
    let generatedHTML = "";
    let explanatoryMessage = "";
    let isGeneratingHTMLPhase = false;
    
    // Check if we're in questioning phase or generation phase
    // If there's no DOCTYPE, it's likely a clarifying question
    const isQuestioningPhase = 
      responseContent.indexOf("<!DOCTYPE html>") === -1 &&
      (responseContent.includes("?") || 
       responseContent.includes("سؤال") || 
       responseContent.includes("أسئلة") ||
       responseContent.includes("ممكن توضح") ||
       responseContent.includes("بغيت أفهم") ||
       responseContent.includes("توصف أكثر"));
       
    if (isQuestioningPhase) {
      // In questioning phase, pass through the questions as a message
      explanatoryMessage = responseContent;
      isGeneratingHTMLPhase = false;
      
      // Pass through a minimal HTML structure
      generatedHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>استكشاف الفكرة</title>
</head>
<body style="font-family:system-ui;background-color:#f5f5f5;margin:0;height:100vh;display:flex;align-items:center;justify-content:center;">
  <!-- Empty body - will be replaced with real HTML after questions are answered -->
</body>
</html>`;
    } else {
      // Extract HTML directly from the response
      const doctypeIndex = responseContent.indexOf("<!DOCTYPE html>");
      
      if (doctypeIndex >= 0) {
        // We found DOCTYPE, so we're in HTML generation phase
        isGeneratingHTMLPhase = true;

        // Extract just the content from doctype to </html> closing tag
        const htmlContent = responseContent.substring(doctypeIndex);
        const closingHtmlTagIndex = htmlContent.indexOf("</html>");
        
        if (closingHtmlTagIndex > 0) {
          // Found the closing tag - extract ONLY up to and including </html>
          generatedHTML = htmlContent.substring(0, closingHtmlTagIndex + 7); // +7 to include the </html> tag
          
          // All explanatory text is either before the DOCTYPE or will be moved to the chat
          let explanationText = "";
          
          if (doctypeIndex > 0) {
            // There's text before the DOCTYPE
            explanationText = responseContent.substring(0, doctypeIndex).trim();
          }
          
          explanatoryMessage = explanationText || "سويت لك الصفحة! شوف النتيجة في الأسفل 👇";
        } else {
          // Found DOCTYPE but no closing HTML tag - fix the HTML by adding the closing tag
          generatedHTML = htmlContent;
          
          if (!generatedHTML.includes("</body>")) {
            generatedHTML += "\n</body>";
          }
          if (!generatedHTML.includes("</html>")) {
            generatedHTML += "\n</html>";
          }
          
          // Extract any text before DOCTYPE as explanatory message
          if (doctypeIndex > 0) {
            explanatoryMessage = responseContent.substring(0, doctypeIndex).trim();
          } else {
            explanatoryMessage = "سويت لك الصفحة! شوف النتيجة في الأسفل 👇";
          }
        }
      } else {
        // If no DOCTYPE found, send the entire response back to the user as a message
        explanatoryMessage = responseContent;
        isGeneratingHTMLPhase = false;
        
        // Provide a placeholder HTML
        generatedHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>استكشاف الفكرة</title>
</head>
<body style="font-family:system-ui;background-color:#f5f5f5;margin:0;height:100vh;display:flex;align-items:center;justify-content:center;">
  <!-- Empty body - will be replaced with real HTML after clarification -->
</body>
</html>`;
      }
    }
    
    // Return structured response
    return {
      html: generatedHTML,
      message: {
        role: "assistant",
        content: explanatoryMessage
      },
      isGeneratingHTML: isGeneratingHTMLPhase
    };
  }
  
  /**
   * Create an error response
   * 
   * @param errorMessage Error message
   * @returns Error response object
   */
  private createErrorResponse(errorMessage: string): AssistantResponse {
    logError("assistant_service", errorMessage);
    
    return {
      html: "",
      message: {
        role: "assistant",
        content: "حدث خطأ في عملية توليد HTML. هل يمكنك إعادة صياغة طلبك بشكل مختلف؟"
      },
      isGeneratingHTML: false,
      error: errorMessage
    };
  }
  
  /**
   * Generate text response using the TryAI Assistant
   * 
   * @param prompt User prompt to respond to
   * @param messageHistory Previous messages for context
   * @param sessionId Unique identifier for the user session
   * @param firebaseUid Optional Firebase Anonymous Auth UID for persistent user identification
   * @param deviceId Optional device ID as a fallback when Firebase auth is not available
   * @returns Text response from the assistant
   */
  async generateText(
    prompt: string,
    messageHistory: AssistantMessage[],
    sessionId: string,
    firebaseUid?: string,
    deviceId?: string
  ): Promise<TryAIResponse> {
    const startTime = Date.now();
    let threadId: string = "";
    
    try {
      // Get or create thread for this session
      const existingThreadId = this.getThreadId(sessionId);
      
      if (existingThreadId) {
        threadId = existingThreadId;
      } else {
        threadId = await this.createThread(sessionId);
      }
      
      // Add message to thread
      await this.openai.beta.threads.messages.create(
        threadId,
        {
          role: "user",
          content: prompt
        }
      );
      
      // Run the TryAI assistant on the thread
      const run = await this.openai.beta.threads.runs.create(
        threadId,
        {
          assistant_id: TRYAI_ASSISTANT_ID
        }
      );
      
      // Wait for the run to complete
      const completedRun = await this.waitForRunCompletion(threadId, run.id);
      
      if (completedRun.status !== 'completed') {
        const errorMsg = `Assistant run failed with status: ${completedRun.status}`;
        
        // Log the failed interaction asynchronously (fire and forget)
        logAssistantInteraction({
          sessionId,
          threadId,
          assistantId: TRYAI_ASSISTANT_ID,
          model: "gpt-4o",
          promptContent: { prompt, messageHistory },
          responseContent: { error: errorMsg },
          errorMessage: errorMsg,
          firebaseUid: firebaseUid || null,
          deviceId: deviceId || null
        }).catch(e => console.error("Failed to log TryAI error:", e));
        
        throw new Error(errorMsg);
      }
      
      // Get messages from the thread
      const messages = await this.openai.beta.threads.messages.list(threadId);
      
      // Extract the latest assistant message
      const assistantMessages: string[] = [];
      for (const msg of messages.data) {
        if (msg.role === 'assistant' && msg.content[0]?.type === 'text') {
          assistantMessages.push(msg.content[0].text.value);
        }
      }
      
      if (assistantMessages.length === 0) {
        const errorMsg = "No assistant response received";
        
        // Log the failed interaction asynchronously (fire and forget)
        logAssistantInteraction({
          sessionId,
          threadId,
          assistantId: TRYAI_ASSISTANT_ID,
          model: "gpt-4o",
          promptContent: { prompt, messageHistory },
          responseContent: { error: errorMsg },
          errorMessage: errorMsg,
          firebaseUid: firebaseUid || null,
          deviceId: deviceId || null
        }).catch(e => console.error("Failed to log TryAI error:", e));
        
        throw new Error(errorMsg);
      }
      
      // Return the latest message
      const latestResponse = assistantMessages[0] || "";
      
      // Calculate tokens based on prompt and response length (approximate)
      const promptTokens = (prompt.length + JSON.stringify(messageHistory).length) / 4; // ~4 chars per token
      const responseTokens = latestResponse.length / 4;
      
      // Log the successful interaction asynchronously (fire and forget)
      logAssistantInteraction({
        sessionId,
        threadId,
        assistantId: TRYAI_ASSISTANT_ID,
        model: "gpt-4o",
        promptContent: { prompt, messageHistory },
        responseContent: { text: latestResponse },
        tokens: {
          prompt: Math.round(promptTokens),
          completion: Math.round(responseTokens),
          total: Math.round(promptTokens + responseTokens)
        },
        firebaseUid: firebaseUid || null,
        deviceId: deviceId || null
      }).catch(e => console.error("Failed to log TryAI interaction:", e));
      
      return {
        text: latestResponse
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logError("tryai_text_generation", errorMessage);
      
      // Log the error asynchronously if we have a threadId (fire and forget)
      if (threadId) {
        logAssistantInteraction({
          sessionId,
          threadId,
          assistantId: TRYAI_ASSISTANT_ID,
          model: "gpt-4o",
          promptContent: { prompt, messageHistory },
          responseContent: { error: errorMessage },
          errorMessage: errorMessage,
          firebaseUid: firebaseUid || null,
          deviceId: deviceId || null
        }).catch(e => console.error("Failed to log TryAI error:", e));
      }
      
      return {
        text: "حدث خطأ أثناء التواصل مع د. بنجي. هل يمكنك إعادة صياغة السؤال بشكل مختلف؟",
        error: errorMessage
      };
    }
  }
}

/**
 * Factory function to create an instance of the AssistantService
 * @param openai OpenAI client instance
 * @returns AssistantService instance
 */
export function createAssistantService(openai: OpenAI): AssistantService {
  return new AssistantService(openai);
}