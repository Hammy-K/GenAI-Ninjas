import { apiRequest } from './queryClient';
import { getSystemPrompt } from './prompts';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  className?: string; // Optional class for styling
};

// Use system role for API calls but not in UI messages
export type HTMLMessage = {
  role: 'user' | 'assistant';
  content: string;
  className?: string; // Optional class for styling
};

type ThreadBasedOptions = {
  mode: 'chat' | 'html';
  threadId?: string | null;
  messages: HTMLMessage[];
};

type ThreadResponse = {
  text: string;
  threadId: string;
  error?: string;
};

export type GenerateHTMLResponse = {
  html: string;
  message?: HTMLMessage;
  threadId?: string;
  error?: string;
};

type ClarificationResponse = {
  question: string;
  threadId?: string;
  error?: string;
};

type SummaryResponse = {
  summary: string;
  threadId?: string;
  error?: string;
};

/**
 * Central function for all OpenAI interactions
 * Uses a unified thread-based approach
 */
async function callThreadAPI(options: ThreadBasedOptions): Promise<ThreadResponse> {
  try {
    // Filter out any loading or typing messages
    const filteredMessages = options.messages.filter(msg => 
      !msg.className?.includes("loading") && 
      !msg.className?.includes("typing")
    );
    
    // Add the system prompt as the first message
    // Convert HTMLMessage to API Message format
    const apiMessages = filteredMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
    
    const messagesWithSystem = [
      {
        role: "system" as const,
        content: getSystemPrompt(options.mode)
      },
      ...apiMessages
    ];
    
    // Call the unified endpoint
    const response = await apiRequest('POST', '/api/ai/unified-thread', {
      messages: messagesWithSystem,
      threadId: options.threadId || null,
      model: GPT_MODEL
    });
    
    const data = await response.json();
    
    return {
      text: data.text,
      threadId: data.threadId,
      error: data.error
    };
  } catch (error) {
    console.error(`Error in thread API call (${options.mode} mode):`, error);
    return {
      text: "",
      threadId: options.threadId || "",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Ask a clarifying question about the HTML idea
 * Uses chat mode with the unified thread
 */
export async function getClarifyingQuestion(
  idea: string, 
  threadId?: string | null
): Promise<ClarificationResponse> {
  try {
    // Create a message for the idea
    const messages: HTMLMessage[] = [
      {
        role: "user",
        content: `أنا أبي أبني: ${idea}`
      }
    ];
    
    // Call the API with chat mode
    const response = await callThreadAPI({
      mode: 'chat',
      threadId,
      messages
    });
    
    return {
      question: response.text,
      threadId: response.threadId,
      error: response.error
    };
  } catch (error) {
    console.error("Error getting clarifying question:", error);
    return {
      question: "عفواً، حدث خطأ. هل يمكنك توضيح فكرتك بشكل أكبر؟",
      error: error instanceof Error ? error.message : "Failed to get clarifying question"
    };
  }
}

/**
 * Get a project summary based on the idea and clarification
 * Uses chat mode with the unified thread
 */
export async function getProjectSummary(
  idea: string, 
  clarification: string,
  threadId?: string | null
): Promise<SummaryResponse> {
  try {
    // Create messages for the conversation so far
    const messages: HTMLMessage[] = [
      {
        role: "user",
        content: `أنا أبي أبني: ${idea}`
      },
      {
        role: "assistant",
        content: "Question placeholder" // The actual question is already in the thread
      },
      {
        role: "user",
        content: clarification
      }
    ];
    
    // Call the API with chat mode
    const response = await callThreadAPI({
      mode: 'chat',
      threadId,
      messages
    });
    
    return {
      summary: response.text,
      threadId: response.threadId,
      error: response.error
    };
  } catch (error) {
    console.error("Error getting project summary:", error);
    return {
      summary: `إذن، تبي تبني ${idea}. يلا نبدأ!`,
      error: error instanceof Error ? error.message : "Failed to get project summary"
    };
  }
}

/**
 * Generate HTML based on the complete conversation history
 * Uses html mode with the unified thread
 */
export async function generateHTML(
  messageHistory: HTMLMessage[],
  threadId?: string | null
): Promise<GenerateHTMLResponse> {
  try {
    // Call the API with html mode
    const response = await callThreadAPI({
      mode: 'html',
      threadId,
      messages: messageHistory
    });
    
    // Extract HTML from the response
    // We expect the response to contain a code block with HTML
    const htmlMatch = response.text.match(/```html\n([\s\S]*?)\n```/) || 
                      response.text.match(/```([\s\S]*?)```/);
    
    const html = htmlMatch ? htmlMatch[1] : response.text;
    
    // Create a clean response message without the code block
    const messageText = response.text.replace(/```html\n[\s\S]*?\n```/, "")
                                     .replace(/```[\s\S]*?```/, "")
                                     .trim() || "سويت لك الصفحة! شوف النتيجة 👈\n\nايش رأيك؟";
    
    return {
      html,
      message: {
        role: "assistant",
        content: messageText
      },
      threadId: response.threadId,
      error: response.error
    };
  } catch (error) {
    console.error("Error generating HTML:", error);
    return {
      html: "",
      error: error instanceof Error ? error.message : "Failed to generate HTML"
    };
  }
}