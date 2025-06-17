import {
  AnthropicConfig,
  AnthropicModelName,
} from "server/types/ai/anthropic/anthropic";
import { ANTHROPIC_API_KEY } from "../../env.config";

export const getAnthropicConfig = (): AnthropicConfig => {
  const apiKey: string = ANTHROPIC_API_KEY || "";

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY environment variable is required");

    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const anthropicConfig: AnthropicConfig = {
    apiKey: apiKey,
    models: {
      claude37: AnthropicModelName.CLAUDE_37,
      claude4: AnthropicModelName.CLAUDE_4,
    },
    maxTokens: 16000,
    temperature: 0.1,
  };

  return anthropicConfig;
};

// export const anthropicConfig: AnthropicConfig = {
//   apiKey: process.env.ANTHROPIC_API_KEY || "",
//   models: {
//     claude37: AnthropicModelName.CLAUDE_37,
//     claude4: AnthropicModelName.CLAUDE_4,
//   },
//   maxTokens: 16000,
//   temperature: 0.1,
//   timeout: 60000,
//   baseURL: process.env.ANTHROPIC_BASE_URL,
// };

// export const validateAnthropicConfig = (): void => {
//   if (!anthropicConfig.apiKey) {
//     throw new Error("ANTHROPIC_API_KEY environment variable is required");
//   }
// };
