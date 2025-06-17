import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const ANTHROPIC_MAX_TOKENS = 16000;
export const ANTHROPIC_TEMPERATURE = 0.1;

export const ANTHROPIC_CLAUDE_SONNET_4_MODEL = "claude-sonnet-4-20250514";
export const ANTHROPIC_CLAUDE_SONNET_3_7_MODEL = "claude-3-7-sonnet-20250219";
