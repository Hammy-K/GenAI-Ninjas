import { Request, Response } from "express";
import { isContentSafe } from "server/services/ai-moderation";
import {
  DEFAULT_LOVABLE_STATE,
  LovableAiResponse,
} from "./lovable.response.schema";
import {
  LovableChatMessage,
  normalizeLovableChatRequest,
} from "./lovable.request.schema";
import { generateLovableAiResponse } from "./lovable.service";

function ensureWelcomeTrue(state: LovableAiResponse): LovableAiResponse {
  return {
    ...state,
    progress: { ...state.progress, welcomeDone: true },
  };
}

export async function handleLovableChat(req: Request, res: Response) {
  const { history, message, lastResponse } = normalizeLovableChatRequest(
    req.body,
  );

  if (!message || !message.trim()) {
    return res.status(400).json({
      error: "Message is required",
    });
  }

  /** Helper: pick last good state or default */
  const lastGoodState: LovableAiResponse | undefined = lastResponse
    ? ensureWelcomeTrue(lastResponse as LovableAiResponse)
    : undefined;

  try {
    const safe = await isContentSafe(message);

    if (!safe) {
      return res.status(200).json({
        ...DEFAULT_LOVABLE_STATE,
        ...lastGoodState,
        aiMessage: "عذرًا، لا يمكن استخدام هذا المحتوى.",
      });
    }

    const lastMessage: LovableChatMessage = { role: "user", content: message };

    const enrichedHistory = history ? [...history, lastMessage] : [lastMessage];

    const ai = await generateLovableAiResponse({
      history: enrichedHistory,
      message,
      lastResponse,
    });

    return res.status(200).json(ai);
  } catch (err: any) {
    console.error("Lovable chat error:", err);

    return res.status(200).json(DEFAULT_LOVABLE_STATE);
  }
}
