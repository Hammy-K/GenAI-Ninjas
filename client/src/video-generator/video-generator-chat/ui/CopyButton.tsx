import { Copy } from "lucide-react";
import { copyToClipboard } from "../utils/video-generator-chat.utils";

type Props = {
  text: string;
  onCopied?: (ok: boolean) => void;
  className?: string;
  title?: string;
};

export function CopyButton({
  text,
  onCopied,
  className,
  title = "نسخ",
}: Props) {
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);

    onCopied?.(ok);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      className={`inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 ${className ?? ""}`}
    >
      <Copy className="h-3 w-3" />
      {title}
    </button>
  );
}
