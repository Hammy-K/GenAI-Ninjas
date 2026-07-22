import { copyToClipboard } from "@/lovable-mission/utils/lovable.utils";
import type { ChatMessage as Msg } from "../types/video-generator-chat.types";
import { Copy } from "lucide-react";

type Props = {
  message: Msg;
  onCopy?: (text: string) => void;
};

export function ChatMessage({ message, onCopy }: Props) {
  const isAssistant = message.role === "system";

  const bubbleBase =
    "relative rounded-lg px-3 py-1 text-sm leading-6 whitespace-pre-wrap break-words";

  const assistantStyles = "bg-white text-foreground rounded-bl-none";

  const userStyles = "bg-border text-foreground rounded-br-none";

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);

    if (ok && onCopy) onCopy("تم النسخ");
  };

  return (
    <div
      className={`flex ${isAssistant ? "justify-end" : "justify-start"}`}
      dir="rtl"
    >
      <div
        className={`${bubbleBase} ${isAssistant ? assistantStyles : userStyles} max-w-[85%] group cursor-${isAssistant ? "pointer" : "default"}`}
        onClick={isAssistant ? handleCopy : undefined}
        role={isAssistant ? "button" : undefined}
        tabIndex={isAssistant ? 0 : -1}
        onKeyDown={(e) => {
          if (isAssistant && (e.key === "Enter" || e.key === " ")) handleCopy();
        }}
      >
        {message.content}

        {/* Assistant copy icon - positioned outside bottom corner */}
        {isAssistant && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            title="نسخ"
            className="absolute -bottom-6 left-0 p-1 rounded hover:bg-gray-100 text-muted hover:text-foreground"
            aria-label="نسخ"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
