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
  Share2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import penguinAvatar from "@/assets/Group 26087843.png";
import { validateInput } from "@/lib/inputFilter";
import { trackStageProgress } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
  sharingStatus: "idle" | "sharing" | "shared"; // Track the sharing process state
  sharedImageId?: number; // Store the ID of the shared image
  generationCount: number; // Track the number of images generated
}

export function ImageGenerationStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: ImageGenerationStageProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
    isChatOpen: true, // Always open in the side-by-side layout
    sharingStatus: "idle", // Start in idle state for sharing
    sharedImageId: undefined,
    generationCount: 0, // Initialize counter for image generations
  };

  // Initialize state with localStorage values or defaults
  const [state, setState] = useStageState<ImageGenerationState>(
    "image_generation",
    initialState,
  );

  // Effect to log the current generation count whenever it changes
  useEffect(() => {
    console.log(
      `🔍 CLIENT DEBUG - Current generation count: ${state.generationCount}`,
    );
  }, [state.generationCount]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    // Use both approaches for maximum compatibility
    // 1. Use scrollIntoView for standard behavior
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // 2. Use a timeout as a fallback to ensure scrolling happens after render
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 100);

    return () => clearTimeout(timer);
  }, [state.messages]);

  // Debug logging for image URLs
  useEffect(() => {
    if (state.generatedImageUrl) {
      console.log("🔍 CLIENT DEBUG - Image URL:", state.generatedImageUrl);
      console.log(
        "🔍 CLIENT DEBUG - Proxy URL:",
        `/api/ai/image-proxy?url=${encodeURIComponent(state.generatedImageUrl)}`,
      );
    }
  }, [state.generatedImageUrl]);

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
  const generateImage = async (
    prompt: string,
    messageHistory: ChatMessage[],
  ): Promise<string> => {
    try {
      // Filter message history to build a more effective context
      // 1. Skip welcome/introduction messages from the assistant
      // 2. Filter out assistant "processing" messages
      // 3. Include user messages and final assistant responses
      // 4. Keep success messages with generated images
      const relevantHistory = messageHistory.filter((msg) => {
        // Always include all user messages
        if (msg.role === "user") return true;

        // For assistant messages, be more selective
        if (msg.role === "assistant") {
          // Exclude welcome messages
          if (msg.content.includes("أنا هنا عشان أساعدك")) return false;

          // Exclude processing messages
          if (msg.content.includes("تمام! خلينا نشوف")) return false;

          // Include success messages with image references
          if (msg.content.includes("هذه الصورة حسب وصفك")) return true;

          // Generally include most assistant responses
          return true;
        }

        return false;
      });

      console.log(
        `Sending image generation request with ${relevantHistory.length} context messages`,
      );

      console.log(
        `🔍 CLIENT DEBUG - Current generation count before API call: ${state.generationCount}`,
      );

      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          messageHistory: relevantHistory,
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
      const proxyUrl = `/api/ai/image-proxy?url=${encodeURIComponent(state.generatedImageUrl)}`;

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = proxyUrl;
      link.download = `ai-generated-image-${Date.now()}.png`;

      // Append the link to the document body, click it, then remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to download image. Please try again.",
      }));
    }
  };

  // Helper function to share image to gallery
  const handleShareToGallery = async () => {
    // If image is already shared, don't allow sharing again
    if (state.sharingStatus === "shared") {
      toast({
        title: "تم مشاركة الصورة بالفعل",
        description: "تم مشاركة هذه الصورة في المعرض مسبقاً.",
        duration: 3000,
      });
      return;
    }

    // If sharing is in progress, don't allow multiple requests
    if (state.sharingStatus === "sharing") {
      return;
    }

    if (!state.generatedImageUrl) {
      toast({
        title: "لا توجد صورة للمشاركة",
        description: "يرجى إنشاء صورة أولاً قبل المشاركة في المعرض.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Set sharing status to "sharing" to show loading state
    setState((prev) => ({
      ...prev,
      sharingStatus: "sharing",
    }));

    // Validate the image URL first
    const validateImage = (url: string) => {
      return new Promise<boolean>((resolve) => {
        const img = document.createElement("img");
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    };

    // Check if image is valid before proceeding
    const isValid = await validateImage(state.generatedImageUrl);
    if (!isValid) {
      setState((prev) => ({
        ...prev,
        sharingStatus: "idle", // Reset sharing status on error
      }));

      toast({
        title: "خطأ في الصورة",
        description:
          "الصورة غير صالحة أو لا يمكن تحميلها. يرجى إنشاء صورة جديدة.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    try {
      // Get the latest prompt that generated the image (last user message)
      const userMessages = state.messages.filter((msg) => msg.role === "user");
      const latestPrompt =
        userMessages.length > 0
          ? userMessages[userMessages.length - 1].content
          : "";

      // Get the current mission number (assuming it's 1 for now - could be passed as a prop in the future)
      const missionNumber = 1;

      // Get the student name from localStorage
      const studentName = localStorage.getItem("studentName") || "طالب مبدع";

      // Call the API to share the image to the gallery
      const response = await fetch("/api/gallery/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: state.generatedImageUrl,
          studentName,
          prompt: latestPrompt,
          missionNumber,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to share image to gallery");
      }

      const result = await response.json();

      // Update state to indicate sharing is complete and store the image ID
      setState((prev) => ({
        ...prev,
        sharingStatus: "shared",
        sharedImageId: result.id,
      }));

      // Award the Image Artist Badge when an image is successfully shared
      onUnlockBadge("image_artist_badge", "image_shared_to_gallery");

      // Award XP for sharing to gallery
      onEarnXp(50, "image_shared_to_gallery");

      // Show success toast and track the event
      toast({
        title: "تم مشاركة الصورة!",
        description:
          "يمكنك الآن رؤية صورتك في معرض الصور وتم منحك شارة (فنان الصور) 🏆",
        duration: 5000,
      });

      trackStageProgress("image_generation", "image_shared_to_gallery", {
        gallery_image_id: result.id,
        student_name: studentName,
        badge_awarded: "image_artist_badge",
      });
    } catch (error) {
      console.error("Error sharing image to gallery:", error);

      // Reset sharing status on error
      setState((prev) => ({
        ...prev,
        sharingStatus: "idle",
      }));

      toast({
        title: "خطأ في المشاركة",
        description: "حدث خطأ أثناء مشاركة الصورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Maximum number of allowed image generations per user
  const MAX_GENERATIONS = 3;

  // Handle prompt submission - simplified without prompt analysis
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (state.isLoading) return;

    // Check if the user has reached the generation limit
    if (state.generationCount >= MAX_GENERATIONS) {
      toast({
        title: "تم الوصول للحد الأقصى",
        description: `يمكنك إنشاء ${MAX_GENERATIONS} صور فقط. يرجى مشاركة صورة في المعرض للمتابعة.`,
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    // Validate input using the utility function
    const validation = validateInput(state.prompt);
    if (!validation.isValid) {
      // Add a warning message from د. بنجي about the invalid input
      const validationWarning: ChatMessage = {
        role: "assistant",
        content:
          validation.errorMessage ||
          "أرجوك أدخل وصف واضح للصورة التي تريد إنشاءها.",
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, validationWarning],
        error: validation.errorMessage,
      }));

      return;
    }

    // Store current prompt before clearing
    const currentPrompt = state.prompt;

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: "user",
      content: currentPrompt,
    };

    // Add a thinking message from Dr. Pengy immediately
    const thinkingMessage: ChatMessage = {
      role: "assistant",
      content: "د. بنجي قاعد يرسم الصورة... 🎨",
    };

    // Update state immediately to show user message, thinking message, and clear prompt
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, thinkingMessage],
      prompt: "",
      isLoading: true,
      error: "",
    }));

    try {
      // First, check content moderation
      const isAppropriate = await checkContentModeration(userMessage.content);

      if (!isAppropriate) {
        // If content is inappropriate, replace the thinking message with a warning
        const moderationWarning: ChatMessage = {
          role: "assistant",
          content:
            "هذا النوع من المحتوى ما نقدر نشتغل عليه. خلنا نركز على أفكار ممتعة وآمنة مع بعض 💡",
        };

        setState((prev) => {
          // Get messages without the thinking message
          const messagesWithoutThinking = prev.messages.slice(0, -1);

          return {
            ...prev,
            messages: [...messagesWithoutThinking, moderationWarning],
            isLoading: false,
            error: "",
          };
        });

        return;
      }

      // Track the prompt for analytics
      trackStageProgress("image_generation", "prompt_submitted", {
        prompt_length: userMessage.content.length,
      });

      // Generate the image with message history for context
      const imageUrl = await generateImage(userMessage.content, state.messages);

      // Prepare a context-aware success message based on whether this is a follow-up request
      let successMessageContent = "🎉 هذه الصورة حسب وصفك!";

      // Check if this is a follow-up request by checking if we have previous user messages
      const previousUserMessages = state.messages.filter(
        (msg) => msg.role === "user",
      );
      if (previousUserMessages.length > 1) {
        // This is a follow-up request, so make the success message reflect the modifications
        successMessageContent = "🎉 تم تعديل الصورة بنجاح حسب طلبك!";
      }

      const successMessage: ChatMessage = {
        role: "assistant",
        content: successMessageContent,
      };

      // Update state with the image and message, and remove the thinking message
      setState((prev) => {
        // Get messages without the thinking message
        const messagesWithoutThinking = prev.messages.slice(0, -1);

        // Increment the generation count
        const newGenerationCount = prev.generationCount + 1;

        return {
          ...prev,
          messages: [...messagesWithoutThinking, successMessage],
          generatedImageUrl: imageUrl,
          isLoading: false,
          generationCount: newGenerationCount,
          sharingStatus: "idle", // Reset sharing status for the new image
        };
      });

      // Award XP and track the image generation event
      if (state.generationCount === 0) {
        // This is the first image generation, so award XP
        onEarnXp(30, "first_image_generated");
        
        // Track this specific event
        trackStageProgress("image_generation", "first_image_generated", {
          image_url_length: imageUrl.length,
        });
      }

      // Track all image generations
      trackStageProgress("image_generation", "image_generated", {
        generation_count: state.generationCount + 1,
        image_url_length: imageUrl.length,
      });

    } catch (error) {
      console.error("Error generating image:", error);

      // Create an error message
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

      // First update to clear loading state
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

      // Then replace the thinking message with an error message
      setState((prev) => {
        // Get messages without the thinking message
        const messagesWithoutThinking = prev.messages.slice(0, -1);

        return {
          ...prev,
          messages: [...messagesWithoutThinking, aiErrorMessage],
        };
      });
    }
  };

  return (
    <div className="image-generation-stage min-h-screen flex flex-col">
      <div className="py-6 border-b bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-medium text-center flex items-center justify-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-500" />
            صمم صور باستخدام الذكاء الاصطناعي
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            تخيل أي شي... و خل الذكاء الاصطناعي يرسمه لك في ثواني! و بعدين
            شارك ابداعك.
          </p>
          
          {/* Image generation counter with visual indicator */}
          <div className="flex flex-col items-center justify-center mt-3">
            <div className="text-sm text-muted-foreground bg-muted inline-flex items-center px-3 py-1 rounded-full mb-2">
              <Wand2 className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              <span>
                الصور المتبقية:{" "}
                <span className="font-bold">
                  {Math.max(0, MAX_GENERATIONS - state.generationCount)}
                </span>{" "}
                من <span>{MAX_GENERATIONS}</span>
              </span>
            </div>
            {/* Visual progress bar for generations */}
            <div className="w-full max-w-xs bg-muted rounded-full h-2.5 mb-1">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(0, ((MAX_GENERATIONS - state.generationCount) / MAX_GENERATIONS) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Two Columns Layout */}
      <div className="flex-grow p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row h-[calc(100vh-250px)]">
            {/* Left Column: Image Preview - 70% width */}
            <div className="w-full md:w-[70%] h-full mb-4 md:mb-0 md:pr-2">
              <div className="bg-gray-100 border rounded-t px-4 py-2 flex items-center">
                <span className="font-medium text-sm">معاينة الصورة</span>
              </div>

              <div className="flex-grow bg-white h-full border-x border-b rounded-b p-4 flex flex-col items-center justify-center">
                {state.generatedImageUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-4 overflow-hidden rounded border shadow-sm">
                      <img
                        src={`/api/ai/image-proxy?url=${encodeURIComponent(state.generatedImageUrl)}`}
                        alt="صورة منشأة بالذكاء الاصطناعي"
                        className="max-w-full max-h-[500px] object-contain"
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={handleDownloadImage}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-xs"
                      >
                        <Download className="h-3 w-3" />
                        تنزيل الصورة
                      </Button>
                      <Button
                        onClick={handleShareToGallery}
                        variant={
                          state.sharingStatus === "idle" ? "default" : "outline"
                        }
                        size="sm"
                        className={`flex items-center gap-1 text-xs ${
                          state.sharingStatus === "idle"
                            ? "animate-pulse bg-amber-500 hover:bg-amber-600 shadow-md"
                            : ""
                        }`}
                        disabled={state.sharingStatus !== "idle"}
                      >
                        {state.sharingStatus === "sharing" ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin ml-1" />
                            جاري المشاركة...
                          </>
                        ) : state.sharingStatus === "shared" ? (
                          <>
                            <Share2 className="h-3 w-3 ml-1" />
                            تمت المشاركة! ✓
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3 w-3 ml-1" />
                            مشاركة إلى المعرض
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Image className="w-16 h-16 mb-2 text-gray-300" />
                    <p>ستظهر الصورة التي أنشأها الذكاء الاصطناعي هنا</p>
                    <p className="text-xs mt-2">دردش مع د. بنجي لإنشاء صورة</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Chat Thread - 30% width */}
            <div className="w-full md:w-[30%] h-full md:pl-2 flex flex-col">
              <div className="rounded-t bg-gray-100 border-t border-r border-l px-4 py-3 flex items-center">
                <div className="flex items-center">
                  <img
                    src={penguinAvatar}
                    alt="د. بنجي"
                    className="h-6 w-6 ml-2"
                  />
                  <span className="font-medium text-sm">دردشة مع د. بنجي</span>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-grow border-x overflow-hidden relative">
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="p-4 space-y-4">
                    {state.messages.map((msg, i) => (
                      <div
                        key={i}
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
                                className="h-5 w-5 ml-1.5"
                              />
                              <div className="font-medium text-xs">د. بنجي</div>
                            </div>
                          )}
                        </div>
                        <div className="whitespace-pre-wrap text-xs">
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {state.isLoading && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mr-6">
                        <div className="flex items-center mb-2">
                          <img
                            src={penguinAvatar}
                            alt="د. بنجي"
                            className="h-5 w-5 ml-1.5"
                          />
                          <div className="font-medium text-xs">د. بنجي</div>
                        </div>
                        <div className="flex items-center text-xs">
                          <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                          جاري التفكير...
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="border-x border-b rounded-b p-3">
                {state.error && (
                  <Alert variant="destructive" className="mb-3 py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertTitle className="text-xs">خطأ</AlertTitle>
                    <AlertDescription className="text-xs">
                      {state.error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <Textarea
                    value={state.prompt}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, prompt: e.target.value }))
                    }
                    placeholder="صف الصورة التي تريد إنشاءها بالتفصيل..."
                    disabled={state.isLoading}
                    className="text-sm resize-none bg-white rtl:text-right"
                    rows={3}
                    dir="auto"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!state.prompt.trim() || state.isLoading}
                  >
                    {state.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        جاري إنشاء الصورة...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        إنشاء الصورة
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Navigation */}
      <div className="bg-white border-t py-4 mt-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowRight className="ml-2 h-4 w-4" />
              <span>للخلف</span>
            </Button>
            <Button 
              onClick={onComplete} 
              size="lg"
              disabled={state.generationCount === 0 || state.sharingStatus !== "shared"}
              className={state.generationCount === 0 || state.sharingStatus !== "shared" ? "relative" : ""}
              variant={state.generationCount > 0 && state.sharingStatus === "shared" ? "default" : "outline"}
            >
              {state.generationCount === 0 || state.sharingStatus !== "shared" ? (
                <div className="absolute -top-8 right-0 bg-amber-100 text-amber-800 text-xs py-1 px-2 rounded whitespace-nowrap">
                  {state.generationCount === 0 ? "قم بإنشاء صورة أولاً" : "شارك صورتك في المعرض"}
                </div>
              ) : null}
              <span>المتابعة</span>
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}