import {
  AnthropicModelConfig,
  AnthropicModelName,
} from "server/types/ai/anthropic/anthropic";
import { ProviderType } from "server/types/ai/providers";

export const anthropicModelConfigs: Record<
  AnthropicModelName,
  AnthropicModelConfig
> = {
  [AnthropicModelName.CLAUDE_37]: {
    name: AnthropicModelName.CLAUDE_37,
    displayName: "Claude 3.5 Sonnet",
    provider: ProviderType.ANTHROPIC,
    maxTokens: 16000,
    temperature: 0.1,
    costPer1kTokens: {
      input: 0.003,
      output: 0.015,
    },
    capabilities: {
      codeGeneration: true,
      structuredOutput: true,
      longContext: true,
    },
    rateLimits: {
      requestsPerMinute: 1000,
      tokensPerMinute: 40000,
    },
  },
  [AnthropicModelName.CLAUDE_4]: {
    name: AnthropicModelName.CLAUDE_4,
    displayName: "Claude 4 Sonnet",
    provider: ProviderType.ANTHROPIC,
    maxTokens: 16000,
    temperature: 0.1,
    costPer1kTokens: {
      input: 0.015,
      output: 0.075,
    },
    capabilities: {
      codeGeneration: true,
      structuredOutput: true,
      longContext: true,
    },
    rateLimits: {
      requestsPerMinute: 1000,
      tokensPerMinute: 40000,
    },
  },
};

export const getAnthropicModelConfig = (
  model: AnthropicModelName,
): AnthropicModelConfig => {
  const config = anthropicModelConfigs[model];

  if (!config) {
    throw new Error(`Anthropic model configuration not found for: ${model}`);
  }

  return config;
};
