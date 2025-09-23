import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/lovable-mission/types/lovable.types";
import { sendStoryboardChat } from "@/api/storyboard.api";

const WELCOME_MSG: ChatMessage = {
  role: "assistant",
  content: `هلا! أنا د. بنجي 👋 

أحب أساعدك تطور فكرتك لفيديو فيروسي مدته 30 ثانية! 

شاركني فكرتك وراح نشتغل مع بعض نخليها storyboard مكون من 6 مشاهد تجنن 🎬✨`,
};

export function useStoryboardChat() {
  const [history, setHistory] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [draft, setDraft] = useState("");
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

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await sendStoryboardChat({
        history: [...history, userMsg],
        message,
        signal: abortRef.current.signal,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.message.content,
      };

      append(assistantMsg);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "أعتذر، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى."
      };
      append(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [append, draft, history, isLoading]);

  const resetAll = useCallback(() => {
    setHistory([WELCOME_MSG]);
    setDraft("");
    setIsLoading(false);
  }, []);

  return {
    history,
    draft,
    isLoading,
    setDraft,
    send,
    resetAll,
  };
}