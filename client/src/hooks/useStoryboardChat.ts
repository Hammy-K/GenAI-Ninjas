import { useCallback, useRef, useState } from "react";
import type {
  ChatMessage,
  StoryboardAiResponse,
  StoryboardConversationState,
} from "../types/storyboard.types";
import { sendStoryboardChat } from "../api/storyboard.api";

const WELCOME_MSG: ChatMessage = {
  role: "assistant",
  content: `مرحباً! أنا د. بنجي 🐧 ومهمتي أساعدك تحول فكرتك لـ storyboard احترافي لفيديو فيروسي 30 ثانية!

أولاً، قول لي: إيش فكرة الفيديو اللي في بالك؟ 🎬✨`,
};

export function useStoryboardChat() {
  const [history, setHistory] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [draft, setDraft] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<StoryboardConversationState>({
    phase: "initial"
  });
  const [lastResponse, setLastResponse] = useState<StoryboardAiResponse | null>(null);

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

    // Cancel previous request
    try {
      abortRef.current?.abort();
    } catch {}

    abortRef.current = new AbortController();

    try {
      const response = await sendStoryboardChat({
        history: [...history, userMsg],
        message,
        conversationState,
        signal: abortRef.current.signal,
      });

      // Add assistant message
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.aiMessage,
      };

      append(assistantMsg);
      setLastResponse(response);
      setConversationState(response.conversationState);
    } catch (err) {
      // Error handling - could add a toast or error message
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [append, draft, history, isLoading, conversationState]);

  const resetAll = useCallback(() => {
    setHistory([WELCOME_MSG]);
    setDraft("");
    setIsLoading(false);
    setConversationState({ phase: "initial" });
    setLastResponse(null);
    
    try {
      abortRef.current?.abort();
    } catch {}
  }, []);

  return {
    // state
    history,
    draft,
    isLoading,
    conversationState,
    lastResponse,

    // actions
    setDraft,
    send,
    resetAll,
  };
}