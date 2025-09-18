import type { TtsPayload } from "./audio-tts.types";

export function validateTtsInput(input: unknown): string | null {
  if (typeof input !== "string") return "النص المطلوب غير صالح.";

  if (!input.trim()) return "النص مطلوب.";

  return null;
}

export function validateVoice(voice: unknown): string | null {
  if (typeof voice !== "string") return "الصوت غير صالح.";

  if (!voice.trim()) return "الصوت مطلوب.";

  return null;
}

export function bufferToPayload(buf: Buffer, mime = "audio/mpeg"): TtsPayload {
  const b64 = buf.toString("base64");

  return {
    b64,
    mimeType: mime,
    dataUrl: `data:${mime};base64,${b64}`,
  };
}
