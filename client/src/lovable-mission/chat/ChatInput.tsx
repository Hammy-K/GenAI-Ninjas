import { useCallback, useRef } from "react";
import { Send } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        if (value.trim() && !disabled) onSend();
      }
    },
    [value, disabled, onSend],
  );

  return (
    <div className="border-t border-gray-200 p-3">
      <div className="mx-auto max-w-3xl flex items-end gap-2">
        <textarea
          ref={ref}
          dir="rtl"
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-40"
          placeholder="اكتب رسالتك..."
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 160) + "px";
          }}
        />

        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-purple-600 text-white px-3 py-2 text-sm disabled:opacity-50"
          aria-disabled={disabled || !value.trim()}
          aria-label="إرسال"
        >
          <Send className="h-4 w-4" />
          إرسال
        </button>
      </div>
    </div>
  );
}
