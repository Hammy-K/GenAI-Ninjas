import { OpenAIModelName } from "server/types/ai/openai/openai";

export interface OpenAIConfig {
  apiKey: string;
  model: OpenAIModelName;
  maxTokens: number;
  temperature: number;
  timeout: number;
  baseURL?: string;
}

export const openaiConfig: OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || "",
  model: OpenAIModelName.GPT_4,
  maxTokens: 4000,
  temperature: 0.1,
  timeout: 60000,
  baseURL: process.env.OPENAI_BASE_URL,
};

export const validateOpenAIConfig = (): void => {
  if (!openaiConfig.apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
};
