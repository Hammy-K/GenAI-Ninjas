import OpenAI from "openai";
import { CONFIG } from "../../index";

// Initialize OpenAI client with centralized config
export const openai = new OpenAI({
  apiKey: CONFIG.ai.openai.apiKey,
});

// Re-export configuration constants from centralized config
export const OPENAI_TEMPERATURE = CONFIG.ai.openai.config.temperature;
export const OPENAI_MODELS = CONFIG.ai.openai.models;
export const OPENAI_GPT_4_1_MINI_MODEL = CONFIG.ai.openai.models.GPT_4_1_MINI;