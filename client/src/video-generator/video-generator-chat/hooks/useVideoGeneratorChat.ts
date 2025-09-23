import { useCallback, useRef, useState } from "react";
import type {
  AiChatRequest,
  AiChatResponse,
  ChatMessage,
} from "../types/video-generator-chat.types";
import { sendVideoGeneratorChat } from "../api/video-generator-chat.api";
import { VIDEO_GENERATOR_CHAT_RESPONSE_FORMAT } from "../config/video-generator-chat.schema";
import { VIDEO_GENERATOR_CHAT_SYSTEM_PROMPT } from "../config/video-generator-chat.system.prompt";

const WELCOME_MSG: ChatMessage = {
  role: "system",
  content:
    "هلا! أنا دكتور بنجي 🤓✨، مهمتي مساعدتك تحوّل فكرتك لقصة واضحة ومن ثم نصوّرها في 6 مشاهد لكل مشهد 5 ثواني. ابدأ بكتابة فكرتك الأولية وأنا بعطيك اقتراحات وأسئلة لتحسينها 📖🎬",
};

export function useVideoGeneratorChat() {
  const [history, setHistory] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [draft, setDraft] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const append = useCallback((msg: ChatMessage) => {
    setHistory((prev) => [...prev, msg]);
  }, []);

  const send = useCallback(async () => {
    const message = draft.trim();

    if (!message || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: message };

    append(userMsg);
    setDraft("");
    setIsLoading(true);

    try {
      abortRef.current?.abort();
    } catch {}

    abortRef.current = new AbortController();

    const body: AiChatRequest = {
      history: [...history, userMsg],
      message,
      systemPrompt: VIDEO_GENERATOR_CHAT_SYSTEM_PROMPT,
      responseFormat: VIDEO_GENERATOR_CHAT_RESPONSE_FORMAT,
    };

    try {
      const resp: AiChatResponse = await sendVideoGeneratorChat(body, {
        signal: abortRef.current.signal,
      });

      append(resp.message);
    } finally {
      setIsLoading(false);
    }
  }, [append, draft, history, isLoading]);

  const resetAll = useCallback(() => {
    try {
      localStorage.clear?.();
    } catch {}
    setHistory([WELCOME_MSG]);
    setDraft("");
    setIsLoading(false);

    try {
      window.location.reload();
    } catch {}
  }, []);

  return {
    // state
    history,
    draft,
    isLoading,

    // actions
    setDraft,
    send,
    resetAll,
  };
}
