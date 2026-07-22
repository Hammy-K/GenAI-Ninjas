import Anthropic from "@anthropic-ai/sdk";
import { CONFIG } from "../../index";

// Initialize Anthropic client with centralized config
export const anthropic = new Anthropic({
  apiKey: CONFIG.ai.anthropic.apiKey,
});

// Re-export model definitions from centralized config
export const CLAUDE_MODELS = CONFIG.ai.anthropic.models;

// Export configuration constants from centralized config
export const ANTHROPIC_CONFIG = {
  TEMPERATURE: CONFIG.ai.anthropic.config.temperature,
  MAX_TOKENS: CONFIG.ai.anthropic.config.maxTokens,
  MODELS: CLAUDE_MODELS,
  FALLBACK_ORDER: CONFIG.ai.anthropic.fallbackOrder,
};

// import Anthropic from "@anthropic-ai/sdk";

// export const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// export const ANTHROPIC_MAX_TOKENS = 16000;
// export const ANTHROPIC_TEMPERATURE = 0.1;

// export const ANTHROPIC_CLAUDE_SONNET_4_MODEL = "claude-sonnet-4-20250514";
// export const ANTHROPIC_CLAUDE_SONNET_3_7_MODEL = "claude-3-7-sonnet-20250219";
