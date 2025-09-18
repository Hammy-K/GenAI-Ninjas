import { openai } from "server/config/ai-config/openai/openai.config";

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
    model: "gpt-4o-mini-tts",
    voice,
    input,
    instructions,
    response_format: "mp3",
  });

  return Buffer.from(await result.arrayBuffer());
}