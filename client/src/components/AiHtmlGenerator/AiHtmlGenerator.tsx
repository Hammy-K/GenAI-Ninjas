import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { Message } from "./types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import { callAiApi } from "./api";
import penguinAvatar from "@/assets/Group 26087843.png";

const welcomeMessage: Message = {
  role: "assistant",
  content: `
🎮  ياهلا في أداة بناء الألعاب بالذكاء الاصطناعي! 
أنا د. بنجي، موجود هنا أساعدك تصمّم لعبتك بنفسك. 
كل اللي عليك: توصف لي فكرتك، وأنا أكتب لك الكود ✨
    `,
};

export default function AiHtmlGenerator() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (userMessage: string): Promise<void> => {
    try {
      const userMsg: Message = {
        role: "user",
        content: userMessage,
      };
      const newMessages: Message[] = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      const loadingMsg: Message = {
        role: "assistant",
        content: "جاري الإنشاء",
        className: "loading-animation",
      };

      setMessages([...newMessages, loadingMsg]);

      const response = await callAiApi(userMessage, newMessages);

      const assistantMsg: Message = {
        role: "assistant",
        content: response.content,
      };

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(
          (msg) => msg.className !== "loading-animation",
        );
        return [...updatedMessages, assistantMsg];
      });
    } catch (error) {
      console.error("Error sending message to API:", error);

      const errorMsg: Message = {
        role: "assistant",
        content: "عذراً، حدث خطأ في الاتصال",
      };

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(
          (msg) => msg.className !== "loading-animation",
        );
        return [...updatedMessages, errorMsg];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addUserMessage = (message: string): void => {
    if (message.trim() && !isLoading) {
      sendMessage(message);
    }
  };

  const handleSubmit = () => {
    if (inputValue.trim() && !isLoading) {
      addUserMessage(inputValue);
      setInputValue("");
    }
  };

  // const formatTime = () => {
  //   const now = new Date();
  //   return now.toLocaleTimeString("en-US", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     hour12: true,
  //   });
  // };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-foreground font-tajawal bg-[#f5f2e8] p-4">
      {/* Playground */}
      <Card className="w-full md:w-[70%] h-[87vh] flex flex-col bg-white border-0">
        <CardHeader className="p-3 flex flex-row space-x-2 justify-end items-center border-b border-gray-200 rouneded-full">
          <CardTitle className="font-medium text-lg">معاينة</CardTitle>
          <img
            src={penguinAvatar}
            alt="د. بنجي"
            className="h-8 w-8 rounded-full mr-2"
          />
        </CardHeader>
      </Card>

      {/* Chat Panel */}
      <Card className="w-full md:w-[30%] h-[87vh] flex flex-col bg-white border-0">
        <CardHeader className="p-3 flex flex-row space-x-2 justify-end items-center border-b border-gray-200 rouneded-full">
          <CardTitle className="font-medium text-lg">د. بنجي</CardTitle>
          <img
            src={penguinAvatar}
            alt="د. بنجي"
            className="h-8 w-8 rounded-full mr-2"
          />
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-[78vh] p-4">
            <div className="space-y-4 mt-3">
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <div key={index} className="flex flex-col">
                    <ChatMessage message={message} />
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8 text-sm">
                  ابدأ محادثة مع د. بنجي
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t p-3 border-gray-200 rouneded-full">
          <div className="relative w-full">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !inputValue.trim()}
              className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-500 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <Send size={18} />
            </button>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="اكتب رسالة وبنجي في مساعدتك"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              disabled={isLoading}
              className="w-full pr-10 text-right bg-white border-gray-200"
              dir="rtl"
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
