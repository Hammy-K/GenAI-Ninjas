import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_TEMPERATURE = 0.1;

export const OPENAI_GPT_4_1_MINI_MODEL = "gpt-4.1-mini";