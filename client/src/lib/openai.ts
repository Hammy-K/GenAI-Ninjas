import { apiRequest } from './queryClient';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type TextGenerationOptions = {
  prompt: string;
  maxTokens?: number;
  messageHistory?: Message[];
};

type CompletionResponse = {
  text: string;
  error?: string;
};

type PromptAnalysisResponse = {
  score: number;
  feedback: string;
  improvement: string;
};

type ProjectIdeaResponse = {
  title: string;
  description: string;
  steps: string[];
  tools: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
};

export async function generateText(options: TextGenerationOptions): Promise<CompletionResponse> {
  try {
    // Use the new TryAI assistant endpoint which uses the specific assistant ID
    const response = await apiRequest('POST', '/api/ai/text/try-ai-assistant', options);
    const data = await response.json();
    return { text: data.text, error: data.error };
  } catch (error) {
    console.error("Error generating text:", error);
    
    // Try falling back to the original endpoint if the assistant API fails
    try {
      console.log("TryAI Assistant API failed, falling back to standard endpoint");
      const fallbackResponse = await apiRequest('POST', '/api/ai/text', options);
      const fallbackData = await fallbackResponse.json();
      return { text: fallbackData.text };
    } catch (fallbackError) {
      console.error("Both text generation endpoints failed:", fallbackError);
      return { 
        text: "عذرًا، حدث خطأ في التواصل مع د. بنجي. هل يمكنك إعادة المحاولة؟", 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      };
    }
  }
}

/**
 * Image generation functionality has been removed
 * This comment block replaces the generateImage function
 */

export async function analyzePrompt(prompt: string): Promise<PromptAnalysisResponse> {
  try {
    const response = await apiRequest('POST', '/api/ai/analyze-prompt', { prompt });
    return await response.json();
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    return {
      score: 0,
      feedback: "حدث خطأ في تحليل التوجيه.",
      improvement: ""
    };
  }
}

export type CodeGenerationResponse = {
  html: string;
  css: string;
  js: string;
  description: string;
  error?: string;
};

export async function generateCode(prompt: string): Promise<CodeGenerationResponse> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-code', { prompt });
    return await response.json();
  } catch (error) {
    console.error("Error generating code:", error);
    return {
      html: '',
      css: '',
      js: '',
      description: 'An error occurred while generating the code. Please try again.',
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

export async function generateProjectIdea(interests: string, goal: string, tools: string): Promise<ProjectIdeaResponse> {
  try {
    const response = await apiRequest('POST', '/api/ai/project-idea', { interests, goal, tools });
    return await response.json();
  } catch (error) {
    console.error("Error generating project idea:", error);
    return {
      title: "حدث خطأ في توليد فكرة المشروع",
      description: "يرجى المحاولة مرة أخرى لاحقًا.",
      steps: [],
      tools: [],
      difficulty: "beginner"
    };
  }
}

// New HTML generation with chat history
export type HTMLMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type GenerateHTMLResponse = {
  html: string;
  message: HTMLMessage;
  error?: string;
  isGeneratingHTML?: boolean; // Flag to indicate if we're generating HTML (close chat) or asking questions (keep chat open)
};

export type ClarificationResponse = {
  question: string;
  error?: string;
};

export type SummaryResponse = {
  summary: string;
  error?: string;
};

/**
 * Ask a clarifying question about the HTML idea
 * Uses a separate assistant specialized for clarification
 */
export async function getClarifyingQuestion(idea: string): Promise<ClarificationResponse> {
  try {
    const prompt = `The student wants to build: ${idea} as an HTML. Ask one clarifying question to make the project richer and more impressive`;
    const response = await apiRequest('POST', '/api/ai/text/try-ai-assistant', { 
      prompt,
      // Use the clarification assistant ID
      assistantId: 'asst_x31y8qYnTlwvs1gAxKCNG5KB'
    });
    const data = await response.json();
    
    return { 
      question: data.text,
      error: data.error 
    };
  } catch (error) {
    console.error("Error getting clarifying question:", error);
    return {
      question: "هل يمكنك إضافة المزيد من التفاصيل عن مشروعك لجعله أكثر تميزاً؟", // Fallback question
      error: error instanceof Error ? error.message : "Failed to get clarifying question"
    };
  }
}

/**
 * Generate a summary of the HTML project based on the original idea and clarification
 */
export async function getProjectSummary(idea: string, clarification: string): Promise<SummaryResponse> {
  try {
    const prompt = `Summarize this HTML project in 2 simple sentences: Original idea: "${idea}". Clarification: "${clarification}"`;
    const response = await apiRequest('POST', '/api/ai/text/try-ai-assistant', { 
      prompt,
      // Use the same clarification assistant ID
      assistantId: 'asst_x31y8qYnTlwvs1gAxKCNG5KB'
    });
    const data = await response.json();
    
    return { 
      summary: data.text,
      error: data.error 
    };
  } catch (error) {
    console.error("Error getting project summary:", error);
    return {
      summary: `سنبني: ${idea}`,
      error: error instanceof Error ? error.message : "Failed to get project summary"
    };
  }
}

export async function generateHTML(messageHistory: HTMLMessage[]): Promise<GenerateHTMLResponse> {
  try {
    // Use the new Assistant API endpoint for better context preservation and clarification handling
    const response = await apiRequest('POST', '/api/assistant/generate-html', { messageHistory });
    return await response.json();
  } catch (error) {
    console.error("Error generating HTML:", error);
    
    // Try falling back to the original endpoint if the assistant API fails
    try {
      console.log("Assistant API failed, falling back to standard endpoint");
      const fallbackResponse = await apiRequest('POST', '/api/ai/generate-html', { messageHistory });
      return await fallbackResponse.json();
    } catch (fallbackError) {
      console.error("Both HTML generation endpoints failed:", fallbackError);
      return {
        html: '',
        message: {
          role: 'assistant',
          content: 'عذرًا، حدث خطأ في عملية توليد HTML. هل يمكنك إعادة المحاولة؟'
        },
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}
