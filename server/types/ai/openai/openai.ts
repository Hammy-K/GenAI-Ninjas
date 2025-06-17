import { ProviderType } from "../providers";

export enum OpenAIModelName {
  GPT_4 = "gpt-4",
}

export interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature: number;
  max_tokens: number;
  response_format: {
    type: "json_schema";
    json_schema: {
      name: string;
      schema: any;
      strict: boolean;
    };
  };
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface OpenAIModelConfig {
  name: OpenAIModelName;
  displayName: string;
  provider: ProviderType;
  maxTokens: number;
  temperature: number;
  costPer1kTokens?: {
    input: number;
    output: number;
  };
  capabilities: {
    codeGeneration: boolean;
    structuredOutput: boolean;
    longContext: boolean;
  };
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}
