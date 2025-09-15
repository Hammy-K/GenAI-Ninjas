import { useCallback, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  LovableAiResponse,
  LovableProgressFlags,
} from "../types/lovable.types";
import { useLocalStorageSync } from "./useLocalStorageSync";
import { sendChat } from "../api/lovable.api";

const LS_KEYS = {
  history: "lovable.history",
  lastResponse: "lovable.lastResponse",
  draft: "lovable.draft",
};

const DEFAULT_FLAGS: LovableProgressFlags = {
  welcomeDone: true,
  ideationOngoing: false,
  readyDone: false,
  buildingOngoing: false,
};

const WELCOME_MSG: ChatMessage = {
  role: "assistant",
  content: `
  هلا! أنا بينجي 👋 جاهز أساعدك تبني تطبيق اليوم.
فكّر: إيش الشي اللي يومياً يضايقك وتتمنى لو فيه تطبيق يحله؟ أو يمكن عندك فكرة فلة من قبل وتبغى تجربها؟
  `,
};

export function useLovableChat() {
  // localStorage-backed states
  const {
    state: history,
    setState: setHistory,
    reset: resetHistory,
  } = useLocalStorageSync<ChatMessage[]>(LS_KEYS.history, [WELCOME_MSG]);

  const {
    state: lastResponse,
    setState: setLastResponse,
    reset: resetLastResponse,
  } = useLocalStorageSync<LovableAiResponse | null>(LS_KEYS.lastResponse, null);

  const {
    state: draft,
    setState: setDraft,
    reset: resetDraft,
  } = useLocalStorageSync<string>(LS_KEYS.draft, "");

  const [isLoading, setIsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const progress = useMemo<LovableProgressFlags>(() => {
    const base = lastResponse?.progress ?? DEFAULT_FLAGS;

    return {
      ...base,
      ideationOngoing:
        base.readyDone || base.buildingOngoing ? true : base.ideationOngoing,
    };
  }, [lastResponse]);

  const append = useCallback(
    (msg: ChatMessage) => {
      setHistory((prev) => [...prev, msg]);
    },
    [setHistory],
  );

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
      const ai = await sendChat({
        history: [...history, userMsg],
        message,
        lastResponse: lastResponse ?? undefined,
        signal: abortRef.current.signal,
      });

      // append assistant message from ai.aiMessage
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: ai.aiMessage,
      };

      setHistory((prev) => [...prev, assistantMsg]);

      setLastResponse(ai);
    } catch (err) {
      // Remove optimistic user message? We keep it to reflect the send attempt.
      // Optionally add a transient UI toast at the call site.
    } finally {
      setIsLoading(false);
    }
  }, [
    append,
    draft,
    history,
    lastResponse,
    setHistory,
    setLastResponse,
    isLoading,
    setDraft,
  ]);

  const openLovable = useCallback(() => {
    // const link = lastResponse?.lovablePromptLink;

    const url = "https://lovable.dev";

    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
  }, [lastResponse]);

  const setBuildingOngoing = useCallback(
    (on: boolean) => {
      if (!lastResponse) return;

      setLastResponse({
        ...lastResponse,
        progress: { ...lastResponse.progress, buildingOngoing: on },
      });
    },
    [lastResponse, setLastResponse],
  );

  const resetAll = useCallback(() => {
    resetHistory([WELCOME_MSG]);
    resetLastResponse(null);
    resetDraft("");
  }, [resetDraft, resetHistory, resetLastResponse]);

  return {
    // state
    history,
    draft,
    isLoading,
    lastResponse,
    progress,

    // actions
    setDraft,
    send,
    openLovable,
    setBuildingOngoing,
    resetAll,
  };
}
