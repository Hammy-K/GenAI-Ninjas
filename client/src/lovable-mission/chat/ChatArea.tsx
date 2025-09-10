import { useRef } from "react";
import type { ChatMessage as Msg } from "../types/lovable.types";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { ChatMessage } from "./ChatMessage";

type Props = {
  messages: Msg[];
  onCopy: (text: string) => void; // show toast upstream
};

export function ChatArea({ messages, onCopy }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useAutoScroll(bottomRef, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="mx-auto max-w-3xl space-y-3">
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} onCopy={onCopy} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
