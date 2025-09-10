import { ReactNode } from "react";
import { Copy } from "lucide-react";
import { copyToClipboard } from "../utils/lovable.utils";

type Props = {
  title?: string;
  promptText: string; // the final prompt to copy
  onCopy?: (ok: boolean) => void;
  actions?: ReactNode; // place for extra buttons (e.g., OpenLovableButton)
};

export function PromptCard({
  title = "Lovable Prompt",
  promptText,
  onCopy,
  actions,
}: Props) {
  const handleCopy = async () => {
    const ok = await copyToClipboard(promptText);

    onCopy?.(ok);
  };

  return (
    <div className="w-full mx-auto max-w-3xl border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={handleCopy}
            title="نسخ"
            className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
          >
            <Copy className="h-3 w-3" />
            نسخ
          </button>
        </div>
      </div>

      <pre
        className="px-3 py-3 text-sm whitespace-pre-wrap break-words bg-gray-50"
        dir="rtl"
      >
        {promptText}
      </pre>

      <div className="px-3 py-2 text-xs text-gray-500">
        ✨ نصيحة: ادخل على Lovable، الصق النص، جرّب 2–3 تعديلات بسيطة ثم انشر.
      </div>
    </div>
  );
}
