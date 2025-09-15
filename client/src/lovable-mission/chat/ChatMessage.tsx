import type { ChatMessage as Msg } from "../types/lovable.types";
import { Copy } from "lucide-react";
import { copyToClipboard } from "../utils/lovable.utils";
import penguinAvatar from "@/assets/Group 26087843.png";

type Props = {
  message: Msg;
  onCopy?: (text: string) => void;
};

export function ChatMessage({ message, onCopy }: Props) {
  // treat system messages the same as assistant for showing the avatar
  const isAssistant = message.role === "assistant";

  const bubbleBase =
    "relative rounded-lg px-3 py-1 text-sm leading-6 whitespace-pre-wrap break-words";
  const assistantStyles = "bg-white text-gray-900 rounded-bl-none";
  const userStyles = "bg-gray-200 text-gray-900 rounded-br-none";

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);
    if (ok && onCopy) onCopy("تم النسخ");
  };

  return (
    <div
      className={`flex ${isAssistant ? "justify-end" : "justify-start"} items-end`}
      dir="rtl"
    >
      {isAssistant ? (
        // bubble first, then avatar so avatar appears on the right
        <>
          <div
            className={`${bubbleBase} ${assistantStyles} max-w-[85%] group cursor-pointer`}
            onClick={handleCopy}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleCopy();
            }}
          >
            <img
              src={penguinAvatar}
              alt="د. بنجي"
              title="د. بنجي"
              className="h-4 w-4 rounded-full self-end"
            />

            {message.content}

            {/* Assistant copy icon - positioned outside bottom corner */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              title="نسخ"
              className="absolute -bottom-6 left-0 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              aria-label="نسخ"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </>
      ) : (
        <div
          className={`${bubbleBase} ${userStyles} max-w-[85%]`}
          role={undefined}
          tabIndex={-1}
        >
          {message.content}
        </div>
      )}
    </div>
  );
}

// import type { ChatMessage as Msg } from "../types/lovable.types";
// import { Copy } from "lucide-react";
// import { copyToClipboard } from "../utils/lovable.utils";

// type Props = {
//   message: Msg;
//   onCopy?: (text: string) => void;
// };

// export function ChatMessage({ message, onCopy }: Props) {
//   const isAssistant = message.role === "assistant";
//   const bubbleBase =
//     "relative rounded-lg px-3 py-1 text-sm leading-6 whitespace-pre-wrap break-words";
//   const assistantStyles = "bg-white text-gray-900 rounded-bl-none";
//   const userStyles = "bg-gray-200 text-gray-900 rounded-br-none";

//   const handleCopy = async () => {
//     const ok = await copyToClipboard(message.content);
//     if (ok && onCopy) onCopy("تم النسخ");
//   };

//   return (
//     <div
//       className={`flex ${isAssistant ? "justify-end" : "justify-start"}`}
//       dir="rtl"
//     >
//       <div
//         className={`${bubbleBase} ${isAssistant ? assistantStyles : userStyles} max-w-[85%] group cursor-${isAssistant ? "pointer" : "default"}`}
//         onClick={isAssistant ? handleCopy : undefined}
//         role={isAssistant ? "button" : undefined}
//         tabIndex={isAssistant ? 0 : -1}
//         onKeyDown={(e) => {
//           if (isAssistant && (e.key === "Enter" || e.key === " ")) handleCopy();
//         }}
//       >
//         {message.content}

//         {/* Assistant copy icon - positioned outside bottom corner */}
//         {isAssistant && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               handleCopy();
//             }}
//             title="نسخ"
//             className="absolute -bottom-6 left-0 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
//             aria-label="نسخ"
//           >
//             <Copy className="h-3 w-3" />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }
