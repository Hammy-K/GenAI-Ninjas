import { ProviderType } from "../providers";

export interface AnthropicConfig {
  apiKey: string;
  models: {
    claude37: string;
    claude4: string;
  };
  maxTokens: number;
  temperature: number;
}

export enum AnthropicModelName {
  CLAUDE_37 = "claude-3-5-sonnet-20241022",
  CLAUDE_4 = "claude-sonnet-4-20250514",
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  system: string;
  messages: AnthropicMessage[];
}

export interface AnthropicResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
  stop_reason?: string;
}

export interface AnthropicError {
  type: string;
  message: string;
}

export interface AnthropicModelConfig {
  name: AnthropicModelName;
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
