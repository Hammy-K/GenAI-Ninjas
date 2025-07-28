import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLAUDE_MODELS = {
  CLAUDE_HAIKU_3_5: "claude-3-5-haiku-20250606",
  CLAUDE_SONNET_3_5: "claude-3-5-sonnet-20250606",
  CLAUDE_SONNET_3_7: "claude-3-7-sonnet-20250219",
  CLAUDE_SONNET_4: "claude-sonnet-4-20250514",
} as const;

const CLAUDE_MODEL_FALLBACK_ORDER = [
  CLAUDE_MODELS.CLAUDE_SONNET_4,
  CLAUDE_MODELS.CLAUDE_SONNET_3_7,
  CLAUDE_MODELS.CLAUDE_SONNET_3_5,
  CLAUDE_MODELS.CLAUDE_HAIKU_3_5,
];

export const ANTHROPIC_CONFIG = {
  TEMPERATURE: 0.1,
  MAX_TOKENS: 16000,
  MODELS: CLAUDE_MODELS,
  FALLBACK_ORDER: CLAUDE_MODEL_FALLBACK_ORDER,
};

// import Anthropic from "@anthropic-ai/sdk";

// export const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// export const ANTHROPIC_MAX_TOKENS = 16000;
// export const ANTHROPIC_TEMPERATURE = 0.1;

// export const ANTHROPIC_CLAUDE_SONNET_4_MODEL = "claude-sonnet-4-20250514";
// export const ANTHROPIC_CLAUDE_SONNET_3_7_MODEL = "claude-3-7-sonnet-20250219";
