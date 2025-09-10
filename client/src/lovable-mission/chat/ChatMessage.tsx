import type { ChatMessage as Msg } from "../types/lovable.types";
import { Copy } from "lucide-react";
import { copyToClipboard } from "../utils/lovable.utils";

type Props = {
  message: Msg;
  onCopy?: (text: string) => void;
};

export function ChatMessage({ message, onCopy }: Props) {
  const isAssistant = message.role === "assistant";
  const bubbleBase =
    "relative rounded-lg px-3 py-2 text-sm leading-6 whitespace-pre-wrap break-words";
  const assistantStyles = "bg-gray-50 text-gray-900 border border-gray-200";
  const userStyles = "bg-purple-600 text-white";

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);

    if (ok && onCopy) onCopy("تم النسخ");
  };

  return (
    <div
      className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
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
        {/* Assistant header & copy icon */}
        {isAssistant && (
          <>
            <div
              className="absolute -top-2 -left-2 h-8 w-8 rounded-full bg-white border border-gray-200 grid place-items-center text-xs"
              aria-hidden
            >
              🐧
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              title="نسخ"
              className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
              aria-label="نسخ"
            >
              <Copy className="h-4 w-4" />
            </button>
          </>
        )}

        {message.content}
      </div>
    </div>
  );
}
