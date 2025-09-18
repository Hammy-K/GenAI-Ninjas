import type { Request, Response } from "express";
import { isContentSafe } from "server/services/ai-moderation";
import {
  validateTtsInput,
  validateVoice,
  bufferToPayload,
} from "./audio-tts.utils";
import type {
  TtsRequest,
  TtsResponse,
  TtsError,
  TtsSuccess,
} from "./audio-tts.types";
import { generateSpeech } from "./audio-tts.service";

export async function handleTts(req: Request, res: Response) {
  const body = req.body as Partial<TtsRequest> | undefined;

  const inputError = validateTtsInput(body?.input);

  if (inputError) {
    const payload: TtsError = { ok: false, error: inputError };

    return res.status(400).json(payload);
  }

  const voiceError = validateVoice(body?.voice);

  if (voiceError) {
    const payload: TtsError = { ok: false, error: voiceError };

    return res.status(400).json(payload);
  }

  const input = body!.input ? body!.input.trim() : "";
  const voice = body!.voice ? body!.voice.trim() : "";

  const instructions = body?.instructions;

  try {
    const safe = await isContentSafe(input);

    if (!safe) {
      const payload: TtsError = { ok: false, error: "المحتوى المرسل مرفوض." };

      return res.status(400).json(payload);
    }
  } catch (err: any) {
    console.error("[tts] Content moderation fail:", err?.message ?? err);

    const payload: TtsError = {
      ok: false,
      error: "حدث خطأ أثناء التحقق من المحتوى. حاول مرة أخرى لاحقًا.",
    };

    return res.status(500).json(payload);
  }

  try {
    const buf = await generateSpeech({ input, voice, instructions });

    const audio = bufferToPayload(buf, "audio/mpeg");

    const payload: TtsSuccess = { ok: true, audio };

    return res.status(200).json(payload as TtsResponse);
  } catch (err: any) {
    console.error("[tts] OpenAI Audio API error:", err?.message ?? err);

    const payload: TtsError = {
      ok: false,
      error: "فشل توليد الصوت. حاول مرة أخرى لاحقًا.",
    };

    return res.status(500).json(payload);
  }
}
