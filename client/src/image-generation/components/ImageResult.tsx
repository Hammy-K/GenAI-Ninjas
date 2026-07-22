import { Download, Copy } from "lucide-react";

type Props = {
  image: string;
  altText?: string;
  onDownload: () => void | Promise<void>;
  onCopy: () => void | Promise<void>;
  onGenerateAgain: () => void;
  onNewPrompt: () => void;
  onOpen: () => void;
};

export function ImageResult({
  image,
  altText,
  onDownload,
  onCopy,
  onGenerateAgain,
  onNewPrompt,
  onOpen,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 rounded-md bg-purple-600 text-white px-3 py-2 text-sm"
        >
          <Download size={16} /> تنزيل
        </button>

        <button
          onClick={onCopy}
          className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm"
        >
          <Copy size={16} /> نسخ
        </button>

        <button
          onClick={onGenerateAgain}
          className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm"
        >
          توليد مرة أخرى
        </button>

        <button
          onClick={onNewPrompt}
          className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm"
        >
          برومبت جديد
        </button>
      </div>

      <div
        className="w-full max-w-xl rounded-md overflow-hidden cursor-pointer border border-gray-100 shadow-sm max-h-[60vh]"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen();
        }}
      >
        <img
          src={image}
          alt={altText ?? "generated image"}
          className="w-full hover:scale-110 transition-transform duration-300 h-auto object-cover max-h-[60vh] rounded-md bg-slate-200"
        />
      </div>
    </div>
  );
}
