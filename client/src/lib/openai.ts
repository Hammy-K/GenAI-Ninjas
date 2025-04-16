import { apiRequest } from './queryClient';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";
const IMAGE_MODEL = "dall-e-3";

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type TextGenerationOptions = {
  prompt: string;
  maxTokens?: number;
  messageHistory?: Message[];
};

type ImageGenerationOptions = {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
};

type CompletionResponse = {
  text: string;
  error?: string;
};

type ImageResponse = {
  url: string;
  error?: string;
  message?: string;
  moderationResult?: {
    flagged: boolean;
    categories: {
      hate: boolean;
      threatening: boolean;
      selfHarm: boolean;
      sexual: boolean;
      violence: boolean;
    };
  };
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
    const response = await apiRequest('POST', '/api/ai/text', options);
    const data = await response.json();
    return { text: data.text };
  } catch (error) {
    console.error("Error generating text:", error);
    return { text: "", error: error instanceof Error ? error.message : "Unknown error occurred" };
  }
}

export async function generateImage(options: ImageGenerationOptions): Promise<ImageResponse> {
  try {
    const response = await apiRequest('POST', '/api/ai/image', options);
    const data = await response.json();
    
    if (data.error) {
      return {
        url: "",
        error: data.error,
        message: data.message || "Failed to generate image",
        moderationResult: data.moderationResult
      };
    }
    
    return { url: data.url };
  } catch (error) {
    console.error("Error generating image:", error);
    
    // Try to extract the response data if it's a fetch error
    if (error instanceof Error && 'response' in error) {
      try {
        // @ts-ignore - trying to access response property on a fetch error
        const errorData = await error.response.json();
        return {
          url: "",
          error: errorData.error || "Failed to generate image",
          message: errorData.message || "Something went wrong with the image generation."
        };
      } catch (e) {
        // If we can't parse the response, fall back to generic error
      }
    }
    
    return { 
      url: "", 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "We had trouble creating your image. Please try again with a different description!"
    };
  }
}

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

export async function generateHTML(messages: HTMLMessage[]): Promise<GenerateHTMLResponse> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-html', { messages });
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
