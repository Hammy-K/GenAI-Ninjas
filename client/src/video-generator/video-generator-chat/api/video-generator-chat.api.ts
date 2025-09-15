import {
  AiChatRequest,
  AiChatResponse,
} from "../types/video-generator-chat.types";

const API_PATH = "/api/ai-chat/openai";
const GENERIC_ERROR_AR = "حدث خطأ أثناء توليد الرد. يرجى المحاولة مجددا.";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Minimal API wrapper that normalizes the server payload when needed.
 * If server returns message.content as a JSON string with { aiMessage: "..." },
 * we extract that aiMessage and return message.role === "assistant".
 *
 * Otherwise we return the server payload as-is but ensure message.role === "assistant"
 * (so UI rendering is consistent).
 */
export async function sendVideoGeneratorChat(
  body: AiChatRequest,
  opts?: { signal?: AbortSignal },
): Promise<AiChatResponse> {
  try {
    const res = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts?.signal,
    });

    const data = await safeJson(res);

    // Expecting server shape: { ok: boolean, message: { role: string, content: string } }
    if (
      data &&
      typeof data === "object" &&
      "message" in (data as any) &&
      data.message &&
      typeof data.message.content === "string"
    ) {
      const rawContent: string = (data as any).message.content;

      try {
        const parsed = JSON.parse(rawContent);

        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.aiMessage === "string"
        ) {
          return {
            ok: !!(data as any).ok,
            message: {
              role: "system",
              content: parsed.aiMessage,
            },
          } as AiChatResponse;
        }
      } catch {
        // not JSON -> fallthrough to return original (but normalize role)
      }

      // If content was plain string or didn't contain aiMessage, return original but normalize role
      return {
        ok: !!(data as any).ok,
        message: {
          role: "system",
          content: rawContent,
        },
      } as AiChatResponse;
    }

    // Unexpected shape -> minimal error response
    return {
      ok: false,
      message: { role: "system", content: GENERIC_ERROR_AR },
    } as AiChatResponse;
  } catch (err) {
    return {
      ok: false,
      message: { role: "system", content: GENERIC_ERROR_AR },
    } as AiChatResponse;
  }
}
