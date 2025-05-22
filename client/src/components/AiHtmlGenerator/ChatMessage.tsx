import React from "react";
import penguinAvatar from "@/assets/Group 26087843.png";
import { Message } from "./types";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isLoading = message.className === "loading-animation";
  const isHtmlContent =
    message.role === "assistant" &&
    (message.content.includes("<!DOCTYPE html") ||
      message.content.includes("<html"));

  let displayContent = message.content;

  // if (isHtmlContent) {
  //   displayContent = "سويت لك الصفحة! شوف النتيجة 👈";
  // } else if (message.content.includes("<!DOCTYPE html")) {
  //   displayContent = message.content.split("<!DOCTYPE html")[0];
  // }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col max-w-[70%]">
        {!isUser && (
          <div className="flex items-center mb-1">
            <img
              src={penguinAvatar}
              alt="د. بنجي"
              className="h-6 w-6 rounded-full mr-2"
            />
            <span className="text-sm font-medium text-gray-700">د. بنجي</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? "bg-gray-200 text-gray-900 rounded-br-none"
              : "bg-white text-gray-900 rounded-bl-none"
            // : "bg-white border border-gray-200 text-gray-900 rounded-bl-none"
          }`}
        >
          <div className="whitespace-pre-wrap">
            {isLoading ? (
              <div className="flex">
                {/* <span>جاري الإنشاء</span> */}
                <span className="flex mr-1">
                  <span className="w-1.5 h-1.5 bg-[#83e0be] rounded-full animate-bounce mx-0.5"></span>
                  <span
                    className="w-1.5 h-1.5 bg-[#83e0be] rounded-full animate-bounce mx-0.5"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-[#83e0be] rounded-full animate-bounce mx-0.5"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </span>
              </div>
            ) : (
              displayContent
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
