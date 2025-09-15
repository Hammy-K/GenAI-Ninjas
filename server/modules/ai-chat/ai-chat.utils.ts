import type { ChatMessage, ResponseFormat } from "./ai-chat.types";
import {
  ERROR_ASSISTANT_TEXT_AR,
  MODERATION_BLOCK_TEXT_AR,
} from "./ai-chat.constants";

const FALLBACK_SYSTEM_PROMPT_AR =
  "أنت مساعد ودود. التزم بإرجاع JSON فقط وفق المخطط المحدد دون أي نص زائد.";

export function normalizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((m: any) => m && (m.role === "user" || m.role === "system"))
    .map((m: any) => {
      const content =
        typeof m.content === "string"
          ? m.content
          : JSON.stringify(m.content ?? "");

      return { role: m.role as "user" | "system", content };
    });
}

export function buildResponsesInput(
  systemPrompt: string | undefined,
  history: unknown,
  message: string,
) {
  const msgs = [
    {
      role: "system",
      content: systemPrompt?.trim() || FALLBACK_SYSTEM_PROMPT_AR,
    },
    ...normalizeHistory(history),
    { role: "user", content: message },
  ];

  return msgs.map((m) => ({
    role: m.role,
    content: [{ type: "input_text", text: String(m.content) }],
  }));
}

export function validateResponseFormat(def: ResponseFormat): string | null {
  if (!def || typeof def !== "object") return "المخطط المرسل غير صالح.";

  if (!def.name || typeof def.name !== "string") return "اسم المخطط غير صالح.";

  if (!def.schema || typeof def.schema !== "object")
    return "بنية المخطط غير صالحة.";

  const root = def.schema as Record<string, unknown>;

  if (typeof root.type !== "string")
    return "نوع المخطط (type) مفقود أو غير صالح.";

  return null;
}

export function extractTextFromOpenAIResponse(resp: any): string | null {
  if (typeof resp?.output_text === "string") return resp.output_text;

  const t1 = resp?.output?.[0]?.content?.[0]?.text;

  if (typeof t1 === "string") return t1;

  const t2 = resp?.choices?.[0]?.message?.content;

  if (typeof t2 === "string") return t2;

  return null;
}

export function assistantMessage(content: string) {
  return { role: "system" as const, content };
}

export function errorEnvelope() {
  return {
    ok: false as const,
    message: assistantMessage(ERROR_ASSISTANT_TEXT_AR),
  };
}

export function moderationEnvelope() {
  return {
    ok: true as const,
    message: assistantMessage(MODERATION_BLOCK_TEXT_AR),
  };
}
