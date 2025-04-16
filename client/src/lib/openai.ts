import { apiRequest } from './queryClient';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";
const IMAGE_MODEL = "dall-e-3";

type TextGenerationOptions = {
  prompt: string;
  maxTokens?: number;
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
    return { url: data.url };
  } catch (error) {
    console.error("Error generating image:", error);
    return { url: "", error: error instanceof Error ? error.message : "Unknown error occurred" };
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
