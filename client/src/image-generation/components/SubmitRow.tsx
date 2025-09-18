import type { ImageSize } from "../image-generation.constants";
import { useMemo } from "react";

type Props = {
  disabled?: boolean;
  size: ImageSize;
  sizes: readonly ImageSize[];
  onSizeChange: (s: ImageSize) => void;
  onSubmit: () => void;
  onGenerateAgain: () => void;
  onNewPrompt: () => void;
  hasResult?: boolean;
};

export function SubmitRow({
  disabled,
  size,
  sizes,
  onSizeChange,
  onSubmit,
  onGenerateAgain,
  onNewPrompt,
  hasResult = false,
}: Props) {
  const label = useMemo(() => {
    if (size === "1024x1024") return "عالي (مناسب للفيديو)";

    if (size === "1024x1536") return "عمودي (1024x1536)";

    if (size === "1536x1024") return "أفقي (1536x1024)";

    return "آلي";
  }, [size]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">الحجم:</label>
        <select
          value={size}
          onChange={(e) => onSizeChange(e.target.value as ImageSize)}
          disabled={disabled || hasResult}
          className="rounded-md border border-gray-200 px-2 py-1 text-sm bg-white"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <span className="ml-3 text-sm text-gray-500">{label}</span>
      </div> */}

      <div className="flex items-center gap-3">
        {!hasResult ? (
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="rounded-md bg-purple-600 text-white px-8 py-2 text-lg disabled:opacity-50"
          >
            توليد
          </button>
        ) : (
          <>
            <button
              onClick={onGenerateAgain}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              توليد مرة أخرى
            </button>

            <button
              onClick={onNewPrompt}
              className="rounded-md bg-white border border-gray-200 px-3 py-2 text-sm"
            >
              برومبت جديد
            </button>
          </>
        )}
      </div>
    </div>
  );
}
