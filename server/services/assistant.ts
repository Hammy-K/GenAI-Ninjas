/**
 * OpenAI Assistant Service for HTML Generation
 * 
 * This service uses the OpenAI Assistant API to generate HTML content
 * with persistent thread history for better contextual understanding.
 */
import OpenAI from 'openai';
import { logEvent, logError } from './logging';

// Constants for the HTML Generator Assistant
const ASSISTANT_ID = 'asst_o8p9ImGTnvhGKDge3x8qht3j';
const MODEL = 'gpt-4.1-mini';

// In-memory storage for active thread IDs (in production, use a database)
const activeThreads: Record<string, string> = {};

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantResponse {
  html: string;
  message: AssistantMessage;
  isGeneratingHTML: boolean;
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
   * @returns HTML and explanatory message
   */
  async generateHTML(
    messageHistory: AssistantMessage[],
    sessionId: string
  ): Promise<AssistantResponse> {
    try {
      // Get session thread or create a new one
      let threadId = this.getThreadId(sessionId);
      
      // Get latest user message
      const userMessages = messageHistory.filter((msg) => msg.role === 'user');
      if (userMessages.length === 0) {
        return this.createErrorResponse('No user messages found in history');
      }
      
      const latestUserMessage = userMessages[userMessages.length - 1];
      
      // Log the request
      logEvent('assistant_html_generation', latestUserMessage.content, {
        message_history_length: messageHistory.length,
        assistant_id: ASSISTANT_ID,
        model: MODEL,
        thread_id: threadId || 'new'
      });

      // If no thread exists yet, create one
      if (!threadId) {
        threadId = await this.createThread(sessionId);
      }

      // Add the user message to the thread
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: latestUserMessage.content
      });

      // Run the assistant on the thread
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: ASSISTANT_ID
      });

      // Poll for the completion of the run
      const result = await this.waitForRunCompletion(threadId, run.id);
      
      // Get the assistant's response
      const messages = await this.openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
      
      if (assistantMessages.length === 0) {
        return this.createErrorResponse('No response from assistant');
      }

      // Get the most recent assistant message
      const latestMessage = assistantMessages[0];
      
      // Extract the content
      let messageContent = '';
      if (latestMessage.content[0].type === 'text') {
        messageContent = latestMessage.content[0].text.value;
      }

      // Process the response to extract HTML and explanatory text
      return this.processAssistantResponse(messageContent);
    } catch (error) {
      logError('assistant_html_generation', error instanceof Error ? error : 'Unknown error');
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to generate HTML');
    }
  }

  /**
   * Create a new thread and store it for the session
   * 
   * @param sessionId Unique session identifier
   * @returns Thread ID
   */
  private async createThread(sessionId: string): Promise<string> {
    const thread = await this.openai.beta.threads.create();
    
    // Store the thread ID for this session
    activeThreads[sessionId] = thread.id;
    
    return thread.id;
  }

  /**
   * Get thread ID for a session, if exists
   * 
   * @param sessionId Session identifier
   * @returns Thread ID or undefined
   */
  private getThreadId(sessionId: string): string | undefined {
    return activeThreads[sessionId];
  }

  /**
   * Poll for run completion
   * 
   * @param threadId Thread ID
   * @param runId Run ID
   * @returns Run result
   */
  private async waitForRunCompletion(threadId: string, runId: string): Promise<any> {
    let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    
    // Poll in a loop until run is completed or fails
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      // Wait for 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    }

    // Check if run completed successfully
    if (runStatus.status !== 'completed') {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }
    
    return runStatus;
  }

  /**
   * Process the assistant's response to extract HTML and explanatory text
   * 
   * @param responseContent Full response from the assistant
   * @returns Structured response with HTML and message
   */
  private processAssistantResponse(responseContent: string): AssistantResponse {
    let generatedHTML = '';
    let explanatoryMessage = '';
    let isGeneratingHTML = false;

    // Check if this is a questioning phase (no HTML)
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
      isGeneratingHTML = false;
      
      // Minimal HTML structure for an empty preview
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
      // Extract HTML from the response if present
      const doctypeIndex = responseContent.indexOf("<!DOCTYPE html>");
      
      if (doctypeIndex >= 0) {
        // We found DOCTYPE, so we're in HTML generation phase
        isGeneratingHTML = true;

        // Extract just the content from doctype to </html> closing tag
        const htmlContent = responseContent.substring(doctypeIndex);
        const closingHtmlTagIndex = htmlContent.indexOf("</html>");
        
        if (closingHtmlTagIndex > 0) {
          // Found the closing tag - extract ONLY up to and including </html>
          generatedHTML = htmlContent.substring(0, closingHtmlTagIndex + 7); // +7 to include the </html> tag
          
          // Extract explanatory text that came before the HTML
          if (doctypeIndex > 0) {
            explanatoryMessage = responseContent.substring(0, doctypeIndex).trim();
          } else {
            explanatoryMessage = "سويت لك الصفحة! شوف النتيجة في الأسفل 👇";
          }
        } else {
          // Found DOCTYPE but no closing HTML tag - fix the HTML by adding the closing tag
          generatedHTML = htmlContent;
          
          if (!generatedHTML.includes("</body>")) {
            generatedHTML += "\n</body>";
          }
          if (!generatedHTML.includes("</html>")) {
            generatedHTML += "\n</html>";
          }
          
          // Extract explanatory text that came before the HTML
          if (doctypeIndex > 0) {
            explanatoryMessage = responseContent.substring(0, doctypeIndex).trim();
          } else {
            explanatoryMessage = "سويت لك الصفحة! شوف النتيجة في الأسفل 👇";
          }
        }
      } else {
        // No HTML found in the response
        explanatoryMessage = responseContent;
        isGeneratingHTML = false;
        
        // Minimal HTML structure for an empty preview
        generatedHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>استكشاف الفكرة</title>
</head>
<body style="font-family:system-ui;background-color:#f5f5f5;margin:0;height:100vh;display:flex;align-items:center;justify-content:center;">
  <!-- Empty body - no HTML generated yet -->
</body>
</html>`;
      }
    }

    // Log generation details
    logEvent('assistant_html_generation_success', responseContent.substring(0, 50) + '...', {
      html_size: generatedHTML.length,
      html_type: generatedHTML.includes("<script") ? "interactive" : "static",
      is_question_phase: isQuestioningPhase
    });

    return {
      html: generatedHTML,
      message: {
        role: 'assistant',
        content: explanatoryMessage
      },
      isGeneratingHTML
    };
  }

  /**
   * Create an error response
   * 
   * @param errorMessage Error message
   * @returns Error response object
   */
  private createErrorResponse(errorMessage: string): AssistantResponse {
    return {
      html: '',
      message: {
        role: 'assistant',
        content: 'حدث خطأ في عملية توليد HTML. هل يمكنك إعادة صياغة طلبك بشكل مختلف؟'
      },
      isGeneratingHTML: false,
      error: errorMessage
    };
  }
}

// Export a factory function to create the service
export function createAssistantService(openai: OpenAI): AssistantService {
  return new AssistantService(openai);
}