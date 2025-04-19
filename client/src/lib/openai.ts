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
    const response = await apiRequest('POST', '/api/ai/generate', options);
    const data = await response.json();
    return { text: data.text };
  } catch (error) {
    console.error("Error generating text:", error);
    return { text: "", error: error instanceof Error ? error.message : "Unknown error occurred" };
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
};

export async function generateHTML(messageHistory: HTMLMessage[]): Promise<GenerateHTMLResponse> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-html', { messageHistory });
    return await response.json();
  } catch (error) {
    console.error("Error generating HTML:", error);
    return {
      html: '',
      message: {
        role: 'assistant',
        content: ''
      },
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
