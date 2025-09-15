import type { Request, Response } from "express";
import { openai } from "server/config/ai-config/openai/openai.config";
import { isContentSafe } from "server/services/ai-moderation";
import type { AiChatRequest, AiChatResponse } from "./ai-chat.types";
import {
  assistantMessage,
  buildResponsesInput,
  errorEnvelope,
  extractTextFromOpenAIResponse,
  moderationEnvelope,
  validateResponseFormat,
} from "./ai-chat.utils";
import { OPENAI_GPT_4_1_NANO_MODEL } from "./ai-chat.constants";

export async function handleOpenAIChat(req: Request, res: Response) {
  const body = req.body as Partial<AiChatRequest>;

  if (!body?.message || typeof body.message !== "string") {
    console.error("[ai-chat] Missing message");
    const payload: AiChatResponse = errorEnvelope();

    return res.status(400).json(payload);
  }

  if (!body?.responseFormat) {
    console.error("[ai-chat] Missing responseFormat");
    const payload: AiChatResponse = errorEnvelope();

    return res.status(400).json(payload);
  }

  const rfError = validateResponseFormat(body.responseFormat as any);

  if (rfError) {
    console.error("[ai-chat] responseFormat invalid:", rfError);
    const payload: AiChatResponse = errorEnvelope();

    return res.status(400).json(payload);
  }

  try {
    const isSafe = await isContentSafe(body.message);

    if (!isSafe) {
      const payload: AiChatResponse = moderationEnvelope();

      return res.status(200).json(payload);
    }
  } catch (e: any) {
    console.error("[ai-chat] moderation failed:", e?.message || e);
    const payload: AiChatResponse = errorEnvelope();

    return res.status(500).json(payload);
  }

  const input = buildResponsesInput(
    body.systemPrompt,
    body.history,
    body.message,
  );

  try {
    const response = await openai.responses.create({
      model: OPENAI_GPT_4_1_NANO_MODEL,
      text: {
        format: {
          name: body.responseFormat!.name,
          type: "json_schema",
          schema: body.responseFormat!.schema,
          strict: body.responseFormat!.strict ?? true,
        },
      },
      input,
    } as any);

    const text = extractTextFromOpenAIResponse(response);

    if (!text) {
      console.error("[ai-chat] No text extracted from Responses API");
      const payload: AiChatResponse = errorEnvelope();

      return res.status(502).json(payload);
    }

    const payload: AiChatResponse = {
      ok: true,
      message: assistantMessage(text),
    };

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("[ai-chat] OpenAI Responses API error:", err?.message || err);
    const payload: AiChatResponse = errorEnvelope();

    return res.status(500).json(payload);
  }
}
