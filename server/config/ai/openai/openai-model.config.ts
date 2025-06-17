import { OpenAIModelName } from "server/types/ai/openai/openai";
import { ProviderType } from "server/types/ai/providers";



export const openaiModelConfigs: Record<OpenAIModelName, OpenAIModelConfig> = {
  [OpenAIModelName.GPT_4]: {
    name: OpenAIModelName.GPT_4,
    displayName: 'GPT-4',
    provider: ProviderType.OPENAI,
    maxTokens: 4000,
    temperature: 0.1,
    costPer1kTokens: {
      input: 0.03,
      output: 0.06,
    },
    capabilities: {
      codeGeneration: true,
      structuredOutput: true,
      longContext: false,
    },
    rateLimits: {
      requestsPerMinute: 500,
      tokensPerMinute: 10000,
    },
  },
};

export const getOpenAIModelConfig = (model: OpenAIModelName): OpenAIModelConfig => {
  const config = openaiModelConfigs[model];
  if (!config) {
    throw new Error(`OpenAI model configuration not found for: ${model}`);
  }
  return config;
};