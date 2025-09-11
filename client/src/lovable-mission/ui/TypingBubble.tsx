import { memo } from "react";
import { motion } from "framer-motion";

type Props = {
  dir?: "rtl" | "ltr";
};

const dotVariants = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 0.9,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const TypingBubble = memo(({ dir = "rtl" }: Props) => {
  // Match assistant bubble style
  const bubbleBase =
    "relative rounded-lg px-3 py-1 text-sm leading-6 whitespace-pre-wrap break-words";
  const assistantStyles = "bg-white text-gray-900 rounded-bl-none";

  return (
    <div className={`flex justify-end`} dir={dir} aria-live="polite">
      <div
        className={`${bubbleBase} ${assistantStyles} max-w-[85%]`}
        role="status"
        aria-label="المساعد يكتب"
      >
        <div className="flex items-center gap-1">
          <motion.span
            className="inline-block w-2 h-2 rounded-full bg-gray-400"
            variants={dotVariants}
            animate="animate"
          />
          <motion.span
            className="inline-block w-2 h-2 rounded-full bg-gray-400"
            variants={dotVariants}
            animate="animate"
            transition={{ delay: 0.15 }}
          />
          <motion.span
            className="inline-block w-2 h-2 rounded-full bg-gray-400"
            variants={dotVariants}
            animate="animate"
            transition={{ delay: 0.3 }}
          />
          <span className="sr-only">المساعد يكتب…</span>
        </div>
      </div>
    </div>
  );
});
