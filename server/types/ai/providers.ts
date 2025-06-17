import { StandardAiResponse } from "./responses";

export enum ProviderType {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
}

export interface AIProviderConfig {
  apiKey: string;
  temperature: number;
}

export interface MessageHistory {
  role: "user" | "assistant";
  content: string;
}

export interface AIRequest {
  message: string;
  history: MessageHistory[];
  userId: string;
}

export interface AIProviderResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface AIProvider {
  sendMessage(request: AIRequest, config: any): Promise<StandardAiResponse>;
  validateRequest(request: AIRequest): boolean;
  getName(): string;
  getProviderType(): ProviderType;
  getSystemPrompt(): string;
}
