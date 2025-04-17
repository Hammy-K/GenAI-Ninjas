import React, { useState, useEffect, useRef } from "react";
import { useStageState } from "@/hooks/useStageState";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Send,
  Wand2,
  X,
  Image,
  Download,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import penguinAvatar from "@assets/Penguin.png";

// Import the OpenAI utilities
import OpenAI from "openai";

// Define the component props
interface ImageGenerationStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

// Define the message type
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Define the component state
interface ImageGenerationState {
  messages: ChatMessage[];
  prompt: string;
  generatedImageUrl: string | null;
  isLoading: boolean;
  error: string;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
  isChatOpen: boolean;
}

export function ImageGenerationStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: ImageGenerationStageProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Define the welcome message from د. بنجي in Arabic
  const welcomeMessage: ChatMessage = {
    role: "assistant",
    content:
      'أنا هنا عشان أساعدك تحوّل فكرتك لصورة حلوة باستخدام الذكاء الاصطناعي 😎 بس أوصفها بشكل واضح — زي الأسلوب، الإضاءة، أو المكان. مثال: "ولد يركب سكوتر في مدينة خيالية، ستايل بيكسار" أو "شخصية تلعب بلايستيشن وقت الغروب".',
  };

  // Define the initial state
  const initialState: ImageGenerationState = {
    messages: [welcomeMessage],
    prompt: "",
    generatedImageUrl: null,
    isLoading: false,
    error: "",
    hasEarnedXp: false,
    hasUnlockedBadge: false,
    isChatOpen: false, // Start with chat closed, will open after delay
  };

  // Initialize state with localStorage values or defaults
  const [state, setState] = useStageState<ImageGenerationState>(
    "image_generation",
    initialState,
  );

  // Effect to ensure chat is open on mount with a 1-second delay
  useEffect(() => {
    // Force the chat to be open on component mount after a 1-second delay
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, isChatOpen: true }));
    }, 1000);

    // Clean up the timer if component unmounts before the delay completes
    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  // Toggle chat open/closed
  const toggleChat = () => {
    setState((prev) => ({ ...prev, isChatOpen: !prev.isChatOpen }));
  };

  // Check if the content is appropriate using moderation API
  const checkContentModeration = async (text: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/ai/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Moderation API request failed");

      const data = await response.json();
      return !data.flagged;
    } catch (error) {
      console.error("Error checking content moderation:", error);
      return false; // Fail safe if moderation check fails
    }
  };

  // Generate an image using DALL-E with message history for context
  const generateImage = async (prompt: string, messageHistory: ChatMessage[]): Promise<string> => {
    try {
      // Filter message history to build a more effective context
      // 1. Skip welcome/introduction messages from the assistant
      // 2. Filter out assistant "processing" messages
      // 3. Include user messages and final assistant responses
      // 4. Keep success messages with generated images
      const relevantHistory = messageHistory.filter(msg => {
        // Always include all user messages
        if (msg.role === 'user') return true;
        
        // For assistant messages, be more selective
        if (msg.role === 'assistant') {
          // Exclude welcome messages
          if (msg.content.includes('أنا هنا عشان أساعدك')) return false;
          
          // Exclude processing messages
          if (msg.content.includes('تمام! خلينا نشوف')) return false;
          
          // Include success messages with image references
          if (msg.content.includes('هذه الصورة حسب وصفك')) return true;
          
          // Generally include most assistant responses
          return true;
        }
        
        return false;
      });
      
      console.log(`Sending image generation request with ${relevantHistory.length} context messages`);
      
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt, 
          messageHistory: relevantHistory 
        }),
      });

      if (!response.ok) throw new Error("Image generation failed");

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  };
  
  // Helper function to download the generated image using our proxy
  const handleDownloadImage = () => {
    if (!state.generatedImageUrl) return;
    
    try {
      // Use our server-side proxy to handle the download
      // This avoids CORS issues with direct downloads
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(state.generatedImageUrl)}`;
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = `ai-generated-image-${Date.now()}.png`;
      
      // Append the link to the document body, click it, then remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
      setState(prev => ({
        ...prev,
        error: "Failed to download image. Please try again."
      }));
    }
  };

  // Handle prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.prompt.trim() || state.isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: state.prompt,
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      prompt: "",
      isLoading: true,
      error: "",
    }));

    try {
      // First, check content moderation
      const isAppropriate = await checkContentModeration(userMessage.content);

      if (!isAppropriate) {
        // If content is inappropriate, add a warning message from د. بنجي
        const moderationWarning: ChatMessage = {
          role: "assistant",
          content:
            "هذا النوع من المحتوى ما نقدر نشتغل عليه. خلنا نركز على أفكار ممتعة وآمنة مع بعض 💡",
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, moderationWarning],
          isLoading: false,
          error: "",
        }));

        return;
      }

      // If content is appropriate, generate the image
      // First, add a processing message
      const processingMessage: ChatMessage = {
        role: "assistant",
        content: "تمام! خلينا نشوف كيف بتطلع 😄",
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, processingMessage],
      }));

      // Generate the image with message history for context
      const imageUrl = await generateImage(userMessage.content, state.messages);

      // Prepare a context-aware success message based on whether this is a follow-up request
      let successMessageContent = "🎉 هذه الصورة حسب وصفك!";
      
      // Check if this is a follow-up request by checking if we have previous user messages
      const previousUserMessages = state.messages.filter(msg => msg.role === 'user');
      if (previousUserMessages.length > 1) {
        // This is a follow-up request, so make the success message reflect the modifications
        successMessageContent = "🎉 تم تعديل الصورة بنجاح حسب طلبك!";
      }
      
      const successMessage: ChatMessage = {
        role: "assistant",
        content: successMessageContent,
      };

      // Update state with the image and message
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, successMessage],
        generatedImageUrl: imageUrl,
        isLoading: false,
      }));

      // Award XP if not already awarded
      if (!state.hasEarnedXp) {
        onEarnXp(30, "image_generation_complete");
        onUnlockBadge("creative_artist_badge", "image_generation_complete");
        setState((prev) => ({
          ...prev,
          hasEarnedXp: true,
          hasUnlockedBadge: true,
        }));
      }
    } catch (error) {
      // Handle errors
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Add error message from د. بنجي
      const aiErrorMessage: ChatMessage = {
        role: "assistant",
        content:
          "عفواً، واجهنا مشكلة أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى بوصف مختلف.",
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, aiErrorMessage],
      }));
    }
  };

  return (
    <div className="image-generation-stage">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">
              صمم صور باستخدام الذكاء الاصطناعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p>
                وصف ما تريد أن تراه ودع الذكاء الاصطناعي يحول خيالك إلى حقيقة!
              </p>
            </div>

            {/* Image Display Area */}
            <div className="mb-6 flex justify-center">
              {state.generatedImageUrl ? (
                <div className="border rounded p-4 max-w-2xl">
                  <div className="mb-4 text-center font-medium flex items-center justify-between">
                    <span>الصورة التي تم إنشاؤها</span>
                    <Button 
                      onClick={handleDownloadImage} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Download className="h-3 w-3" />
                      حفظ الصورة
                    </Button>
                  </div>
                  <img
                    src={state.generatedImageUrl}
                    alt="AI Generated Image"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              ) : (
                <div className="border rounded p-8 max-w-2xl w-full flex items-center justify-center min-h-[300px] bg-gray-50">
                  <div className="text-center text-gray-400">
                    <Image className="h-16 w-16 mx-auto opacity-20 mb-4" />
                    <p>ستظهر الصورة التي أنشأها الذكاء الاصطناعي هنا</p>
                    <p className="text-xs mt-2">
                      دردش مع د. بنجي لإنشاء صورة
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Chat Widget */}
            <div
              className={`fixed bottom-4 right-4 z-50 flex flex-col transition-all duration-500 ease-in-out 
                         ${state.isChatOpen ? "w-80 sm:w-96 h-[500px] scale-100 opacity-100" : "w-16 h-16 scale-95 opacity-95"}`}
            >
              {/* Chat Widget Button (When Closed) */}
              {!state.isChatOpen && (
                <Button
                  onClick={toggleChat}
                  size="icon"
                  className="w-16 h-16 flex items-center justify-center p-0 overflow-hidden bg-transparent"
                >
                  <img
                    src={penguinAvatar}
                    alt="د. بنجي"
                    className="w-16 h-16 object-contain"
                  />
                </Button>
              )}

              {/* Chat Widget Panel (When Open) */}
              {state.isChatOpen && (
                <div className="flex flex-col h-full overflow-hidden bg-white border rounded-md shadow-xl">
                  {/* Chat Header */}
                  <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={penguinAvatar}
                        alt="د. بنجي"
                        className="h-6 w-6 rounded-full mr-2"
                      />
                      <span className="font-medium text-sm">
                        دردش مع د. بنجي
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleChat}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Chat Messages */}
                  <ScrollArea className="flex-grow p-4">
                    <div className="space-y-4">
                      {state.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`p-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground ml-6"
                                : "bg-amber-50 border border-amber-100 mr-6"
                            }`}
                          >
                            <div className="flex items-center mb-2">
                              {msg.role === "user" ? (
                                <div className="font-medium text-xs">أنت</div>
                              ) : (
                                <div className="flex items-center">
                                  <img
                                    src={penguinAvatar}
                                    alt="د. بنجي"
                                    className="h-5 w-5 rounded-full mr-1.5"
                                  />
                                  <div className="font-medium text-xs">
                                    د. بنجي
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="whitespace-pre-wrap text-xs">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}

                      {state.isLoading && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mr-6">
                          <div className="flex items-center mb-2">
                            <img
                              src={penguinAvatar}
                              alt="د. بنجي"
                              className="h-5 w-5 rounded-full mr-1.5"
                            />
                            <div className="font-medium text-xs">د. بنجي</div>
                          </div>
                          <div className="flex items-center text-xs">
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            جاري الإنشاء...
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="border-t p-3">
                    {state.error && (
                      <Alert variant="destructive" className="mb-3 py-2">
                        <AlertCircle className="h-3 w-3" />
                        <AlertTitle className="text-xs">خطأ</AlertTitle>
                        <AlertDescription className="text-xs">
                          {state.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="flex gap-2">
                      <Textarea
                        placeholder="صف الصورة التي تريد إنشاءها..."
                        value={state.prompt}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            prompt: e.target.value,
                          }))
                        }
                        className="min-h-[80px] text-sm flex-grow resize-none"
                        dir="auto" // Auto-detect text direction for RTL support
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={state.isLoading || !state.prompt.trim()}
                        className="self-end h-10 w-10"
                      >
                        {state.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowRight className="mr-2 h-4 w-4" />
              <span>المرحلة السابقة</span>
            </Button>
            <Button
              onClick={onComplete}
              size="lg"
              disabled={!state.generatedImageUrl && !state.hasEarnedXp}
            >
              <span>متابعة للمرحلة التالية</span>
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
