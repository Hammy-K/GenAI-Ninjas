import { useState } from "react";
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

  const handleGenerateText = async () => {
    if (!state.textPrompt.trim()) return;

    setError("");
    setIsGeneratingText(true);

    try {
      // Use an empty array as fallback if messageHistory is undefined
      const messageHistory = state.messageHistory || [];

      const response = await generateText({
        prompt: state.textPrompt,
        messageHistory: messageHistory,
      });

      if (!response.error) {
        setState((prev) => {
          // Create a safe copy of the message history with fallback
          const prevMessageHistory = prev.messageHistory || [];

          return {
            ...prev,
            messageHistory: [
              ...prevMessageHistory,
              { role: "user", content: state.textPrompt },
              { role: "assistant", content: response.text },
            ],
            textPrompt: "", // Clear the input after successful response
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
                د. بنجي هنا عشان يكتشف معك عالم الذكاء التوليدي! 🐧 اسأله أي
                شيء، جرّب أفكار، أو بس دردش معاه. يساعدك تكتب برومبتات رهيبة،
                تطلع صور خرافية، ويمكن تبني تطبيقك بعدين! جرب تتكلم معاه وشوف وش
                يقدر يسوي 💬✨
              </p>
            </div>

            <div className="space-y-4">
              {/* Display conversation thread if there's message history */}
              <div className="bg-neutral-50 p-4 rounded-lg border mb-4">
                <h3 className="font-bold mb-3">Chat with Dr. Pengy</h3>
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
                              <div className="font-medium text-xs">You</div>
                            ) : (
                              <div className="flex items-center">
                                <img
                                  src={penguinAvatar}
                                  alt="Dr. Pengy"
                                  className="h-5 w-5 rounded-full mr-1.5"
                                />
                                <div className="font-medium text-xs">
                                  Dr. Pengy
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
                        <p>No messages yet. Chat with Dr. Pengy!</p>
                        <p className="text-xs mt-2">
                          Try asking: "Tell me about generative AI" or "Write a
                          poem about learning"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message here... (e.g., 'Write a short story about a space adventure')"
                    value={state.textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    className="min-h-[80px] flex-grow"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        e.preventDefault();
                        if (!isGeneratingText && state.textPrompt.trim()) {
                          handleGenerateText();
                        }
                      }
                    }}
                    dir="auto" // Auto-detect text direction for RTL support
                  />
                  <Button
                    onClick={handleGenerateText}
                    disabled={isGeneratingText || !state.textPrompt.trim()}
                    className="self-end h-10 px-4"
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
                <p className="text-xs text-gray-500 mt-2">
                  Press Ctrl+Enter to send your message
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Previous Stage</span>
            </Button>
            <Button
              onClick={onComplete}
              size="lg"
              disabled={false} // Allow users to proceed even if API calls fail
            >
              <span>Continue to Next Stage</span>
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
