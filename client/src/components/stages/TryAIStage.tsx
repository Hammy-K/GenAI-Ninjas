import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { generateText, type Message } from "@/lib/openai";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStageState } from "@/hooks/useStageState";
import penguinAvatar from "@/assets/Group 26087843.png";

interface TryAIStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface TryAIState {
  textPrompt: string;
  generatedText: string;
  hasCompleted: boolean;
  messageHistory: Message[];
  hasShownNudge: boolean;
}

export function TryAIStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: TryAIStageProps) {
  // Use the custom hook to persist state
  const [state, setState] = useStageState<TryAIState>("tryAI", {
    textPrompt: "",
    generatedText: "",
    hasCompleted: false,
    messageHistory: [],
    hasShownNudge: false,
  });

  // Create individual updater functions
  const setTextPrompt = (prompt: string) =>
    setState((prev) => ({ ...prev, textPrompt: prompt }));
  const setGeneratedText = (text: string) =>
    setState((prev) => ({ ...prev, generatedText: text }));
  const setHasCompleted = (completed: boolean) =>
    setState((prev) => ({ ...prev, hasCompleted: completed }));

  // Local state for UI processing indicators
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [error, setError] = useState("");

  // Create ref for scrolling to bottom of chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll only the chat area to bottom when message history changes
  useEffect(() => {
    const scrollChatAreaOnly = () => {
      // Find the chat area container (the div with the overflow-y-auto class)
      const chatContainer = chatEndRef.current?.closest('.overflow-y-auto');
      
      if (chatContainer) {
        // Scroll the chat container to its bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    };

    // Use both immediate and delayed scrolling for reliability
    scrollChatAreaOnly();
    
    // Also use a timeout as a fallback to ensure scrolling happens after render
    const timer = setTimeout(scrollChatAreaOnly, 100);

    return () => clearTimeout(timer);
  }, [state.messageHistory]);

  // Check user message count and show nudge message after 6 user messages
  useEffect(() => {
    // Count user messages (role: 'user') in the message history
    const userMessageCount =
      state.messageHistory?.filter((msg) => msg.role === "user").length || 0;

    // If we have exactly 6 user messages and haven't shown the nudge yet
    if (userMessageCount >= 6 && !state.hasShownNudge) {
      // Add a slight delay before showing the nudge message
      const nudgeTimer = setTimeout(() => {
        // Add the nudge message from Dr. Pengy
        setState((prev) => ({
          ...prev,
          messageHistory: [
            ...(prev.messageHistory || []),
            {
              role: "assistant",
              content:
                "بما انك متحمس! خلنا نكمل ونشوف وش تقدر تسوي بالذكاء الاصطناعي 😉 في المرحلة الجاية فيه أدوات أحلى! اضغط على زر المتابعة عشان نبدأ المغامرة!",
            },
          ],
          hasShownNudge: true,
        }));
      }, 1000); // Wait 1 second after the 6th user message

      return () => clearTimeout(nudgeTimer);
    }
  }, [state.messageHistory, state.hasShownNudge, setState]);

  const handleGenerateText = async () => {
    if (!state.textPrompt.trim()) return;

    setError("");
    setIsGeneratingText(true);
    
    // Store the current prompt before clearing it
    const currentPrompt = state.textPrompt;

    // Immediately show the user message and the "thinking" message
    setState((prev) => {
      const prevMessageHistory = prev.messageHistory || [];
      return {
        ...prev,
        messageHistory: [
          ...prevMessageHistory,
          { role: "user", content: currentPrompt },
          { role: "assistant", content: "د. بنجي قاعد يفكر... 😄" }, // Thinking message
        ],
        textPrompt: "", // Clear the input right away
      };
    });

    try {
      // Use an empty array as fallback if messageHistory is undefined
      const messageHistory = state.messageHistory || [];

      const response = await generateText({
        prompt: currentPrompt,
        messageHistory: messageHistory,
      });

      if (!response.error) {
        setState((prev) => {
          // Create a safe copy of the message history with fallback
          const prevMessageHistory = prev.messageHistory || [];
          
          // Replace the "thinking" message with the actual response
          const updatedHistory = [...prevMessageHistory];
          // Remove the last message (thinking message)
          updatedHistory.pop();
          // Add the actual response
          updatedHistory.push({ role: "assistant", content: response.text });

          return {
            ...prev,
            messageHistory: updatedHistory,
          };
        });
      }
      if (response.error) {
        // Handle moderation-related errors with a friendly message
        if (response.error === "Content flagged as inappropriate") {
          setError(
            `Your content may contain inappropriate material. Please revise your prompt.`,
          );
        }
        // Check for quota exceeded error
        else if (
          response.error.includes("quota") ||
          response.error.toLowerCase().includes("429")
        ) {
          setError(
            "API quota exceeded. Please try again later or use a different API key.",
          );
        } else {
          setError(response.error);
        }
      } else {
        setGeneratedText(response.text);

        // Only award XP and badge once
        if (!state.hasCompleted) {
          onEarnXp(20, "text_generation_complete");
          onUnlockBadge("prompt_master_badge", "text_generation_complete");
          setHasCompleted(true);
        }
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsGeneratingText(false);
    }
  };

  return (
    <div className="try-ai-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">
              تعرف على Dr. Pengy — مرشدك الذكي!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6 flex flex-col items-center">
              <img
                src={penguinAvatar}
                alt="Dr. Pengy"
                className="h-20 w-20 mb-3 rounded-full border-2 border-amber-100"
              />
              <p>
                أنا د. بنجي 🐧، مساعدك الذكي! بس لا تشيل هم، أنا مو معقّد 😄
                شغلي أساعدك تتعلم وتخترع أشياء رهيبة باستخدام الذكاء الاصطناعي!
              </p>
            </div>

            <div className="space-y-4">
              {/* Display conversation thread if there's message history */}
              <div className="bg-neutral-50 p-4 rounded-lg border mb-4">
                <h3 className="font-bold mb-3">دردش مع د. بنجي</h3>
                <div className="space-y-4 overflow-y-auto max-h-[450px] p-1 mb-4">
                  {state.messageHistory && state.messageHistory.length > 0 ? (
                    state.messageHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`p-3 rounded-lg max-w-[85%] ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-amber-50 border border-amber-100"
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            {message.role === "user" ? (
                              <div className="font-medium text-xs">أنت</div>
                            ) : (
                              <div className="flex items-center">
                                <img
                                  src={penguinAvatar}
                                  alt="Dr. Pengy"
                                  className="h-5 w-5 rounded-full ml-1.5"
                                />
                                <div className="font-medium text-xs">
                                  د. بنجي
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-gray-400">
                      <div className="text-center">
                        <img
                          src={penguinAvatar}
                          alt="Dr. Pengy"
                          className="h-16 w-16 mx-auto mb-2 rounded-full border-2 border-amber-100"
                        />
                        <p>لا توجد رسائل بعد. دردش مع د. بنجي!</p>
                        <p className="text-xs mt-2">
                          جرب أن تسأل: "حدثني عن الذكاء الاصطناعي التوليدي" أو
                          "اكتب قصيدة عن التعلم"
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Element for automatic scrolling */}
                  <div ref={chatEndRef} />
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>خطأ</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 relative">
                  <Textarea
                    placeholder={state.hasShownNudge 
                      ? "تم إكمال مرحلة الدردشة! اضغط زر المتابعة لمواصلة المغامرة ✨"
                      : "اكتب رسالتك هنا... (مثال: 'اكتب قصيدة عن التعلم')"}
                    value={state.textPrompt}
                    onChange={(e) => !state.hasShownNudge && setTextPrompt(e.target.value)}
                    className={`min-h-[80px] flex-grow transition-all duration-500 ${
                      state.hasShownNudge 
                        ? 'bg-gray-50 text-gray-400 border-gray-200' 
                        : 'border-input'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey && !state.hasShownNudge) {
                        e.preventDefault();
                        if (!isGeneratingText && state.textPrompt.trim()) {
                          handleGenerateText();
                        }
                      }
                    }}
                    dir="auto" // Auto-detect text direction for RTL support
                    disabled={state.hasShownNudge} // Disable input after nudge message
                  />
                  {state.hasShownNudge && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none rounded-md flex items-end justify-center pb-2">
                      <div className="text-amber-600 font-medium text-sm bg-white/80 px-3 py-1 rounded-full shadow-sm border border-amber-100">
                        انتقل للخطوة التالية!
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleGenerateText}
                    disabled={isGeneratingText || !state.textPrompt.trim() || state.hasShownNudge}
                    className={`self-end h-10 px-4 transition-all duration-300 ${
                      state.hasShownNudge ? 'opacity-50' : ''
                    }`}
                  >
                    {isGeneratingText ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-send"
                      >
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                    )}
                  </Button>
                </div>
                {state.hasShownNudge ? (
                  <p className="text-sm text-amber-600 font-medium mt-4 text-center animate-pulse">
                    أحسنت! خلنا نكمل المغامرة. اضغط زر المتابعة للانتقال للمرحلة التالية 🚀
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    اضغط Ctrl+Enter لإرسال رسالتك
                  </p>
                )}
              </div>

              {/* No "Next Step" button as per new requirements */}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowRight className="ml-2 h-4 w-4" />
              <span>للخلف</span>
            </Button>
            <Button
              onClick={onComplete}
              size="lg"
              className={state.hasShownNudge ? 
                "animate-pulse bg-green-600 hover:bg-green-700 shadow-lg transform transition-all px-10 py-6" : 
                ""
              }
              disabled={false} // Allow users to proceed even if API calls fail
            >
              <span className={state.hasShownNudge ? "font-bold text-lg" : ""}>المتابعة</span>
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
