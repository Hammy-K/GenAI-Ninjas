import { useRef } from "react";
import type { ChatMessage as Msg } from "../types/video-generator-chat.types";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { ChatMessage } from "./ChatMessage";
import { TypingBubble } from "@/lovable-mission/ui/TypingBubble";

type Props = {
  messages: Msg[];
  onCopy: (text: string) => void; // show toast upstream
  isLoading?: boolean; // NEW
};

export function ChatArea({ messages, onCopy, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useAutoScroll(bottomRef, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 h-full">
      <div className="mx-auto max-w-3xl space-y-3">
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} onCopy={onCopy} />
        ))}

        {isLoading && <TypingBubble />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
