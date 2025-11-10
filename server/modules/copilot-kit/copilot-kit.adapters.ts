import { OpenAIAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";
import { DEFAULT_OPENAI_MODEL } from "./copilot-kit.config";

/**
 * Factory for CopilotKit's OpenAI adapter.
 * Uses OpenAI SDK v4/v5 with optional custom baseURL.
 */
export function makeOpenAIAdapter() {
  // Fail fast to make issues obvious during startup
  if (!process.env.OPENAI_API_KEY) {
    // You already warn in your main bootstrap; this is an extra guard.
    console.warn("⚠️ OPENAI_API_KEY is not set; Copilot endpoint will fail.");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL, // optional
  });

  return new OpenAIAdapter({
    openai,
    model: DEFAULT_OPENAI_MODEL,
  });
}
