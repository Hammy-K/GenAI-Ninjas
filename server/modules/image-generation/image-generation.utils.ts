import type { ImagePayload } from "./image-generation.types";

export function validatePrompt(prompt: unknown): string | null {
  if (typeof prompt !== "string") return "Prompt must be a string.";

  const trimmed = prompt.trim();

  if (!trimmed) return "Prompt is required.";

  return null;
}

export function b64ToDataUrl(b64: string, mime = "image/png"): ImagePayload {
  const dataUrl = `data:${mime};base64,${b64}`;
  
  return {
    b64,
    dataUrl,
    mimeType: mime,
  };
}
