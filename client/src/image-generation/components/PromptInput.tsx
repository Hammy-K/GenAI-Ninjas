import { useCallback, useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  minLines?: number;
  maxLines?: number;
  placeholder?: string;
};

export function PromptInput({
  value,
  onChange,
  readOnly = false,
  minLines = 2,
  maxLines = 10,
  placeholder,
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = ref.current;

    if (!el) return;

    el.style.height = "auto";
    const scrollH = el.scrollHeight;
    const lineHeight = 20; // approximate
    const maxHeight = maxLines * lineHeight;
    el.style.height = Math.min(scrollH, maxHeight) + "px";
  }, [maxLines]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      dir="rtl"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      rows={minLines}
      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-white"
      onInput={resize}
      style={{ overflow: "auto" }}
    />
  );
}
