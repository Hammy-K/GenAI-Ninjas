import { openai } from "server/config/ai-config/openai/openai.config";
import { CONFIG } from "server/config";

export async function generateSpeech({
  input,
  voice,
  instructions,
}: {
  input: string;
  voice: string;
  instructions?: string;
}): Promise<Buffer> {
  const result = await openai.audio.speech.create({
    model: CONFIG.ai.openai.models.TTS_1,
    voice,
    input,
    instructions,
    response_format: "mp3",
  });

  return Buffer.from(await result.arrayBuffer());
}