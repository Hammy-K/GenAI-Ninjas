import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Send,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  ListIcon,
} from "lucide-react";
import { Link } from "wouter";
import drPengyAvatar from "@assets/Pengy_chat.png";
import CelebrationAnimation from "@/components/animations/CelebrationAnimation";
import StudentInfoModal from "@/components/modals/StudentInfoModal";

// Define types for messages and state
type MessageRole = "user" | "assistant" | "system";

interface ChatMessage {
  role: MessageRole;
  content: string;
  className?: string;
}

interface ChecklistItem {
  id: number;
  text: string;
  description?: string;
  completed: boolean;
  type?: "button" | "normal";
  action?: () => void;
}

interface LovableMissionState {
  messages: ChatMessage[];
  prompt: string;
  isLoading: boolean;
  currentStep: number;
  checklistItems: ChecklistItem[];
  finalPrompt: string;
  projectLink: string;
  projectName: string; // Changed from studentName to projectName
  isSubmitted: boolean;
  error: string;
  isProjectLinkValid: boolean;
  isChatLocked: boolean; // Added for locking chat input until selection
  projectType: string; // 'app' or 'game'
  showCelebration: boolean; // For controlling the celebration animation
  isStudentInfoCompleted: boolean; // For tracking student info modal completion
}

// Initial data
const initialChecklistItems: ChecklistItem[] = [
  {
    id: 1,
    text: "✨ فكّر في فكرة تطبيق أو لعبة مع Pengy ",
    description: "",
    completed: false,
  },
  {
    id: 2,
    text: "📋 لما توصل لفكرتك النهائية، انسخها",
    description: "",
    completed: false,
    type: "button",
    action: () => {},
  },
  {
    id: 3,
    text: "🌐 ادخل على Lovable.الصق الفكرة وابدأ بناء فكرتك.",
    description: "انتبه! ⚠️ عندك بس ٥ محادثات مع Lovable، استخدمها بحكمة.",
    completed: false,
    type: "button",
    action: () => {},
  },
  {
    id: 5,
    text: "🔗 لما تنتهي، انسخ رابط مشروعك.",
    description: "",
    completed: false,
  },
  {
    id: 6,
    text: "📩 ارسل الرابط تحت هنا:",
    description: "",
    completed: false,
  },
  //{ id: 7, text: "(Team activity) Only one project submission per team.", completed: false },
];

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "مرحبًا بك في مهمة Lovable! أنا د. بنجي، وأنا هنا لمساعدتك في إنشاء فكرة مميزة. هل تريد أن نطور تطبيقًا أم لعبة؟",
};

// Helper functions
function trackStageProgress(stage: string, action: string, metadata = {}) {
  console.log(
    `[Analytics] Tracked stage progress: stage_${stage}_${action}`,
    metadata,
  );
}

function markAsAwarded(category: string, badge: string) {
  localStorage.setItem(`award_${category}_${badge}`, "true");
}

function isAlreadyAwarded(category: string, badge: string) {
  return localStorage.getItem(`award_${category}_${badge}`) === "true";
}

export default function LovableMissionStage() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handler for when celebration animation completes
  const handleCelebrationComplete = () => {
    console.log("Celebration animation complete!");
    // Delay turning off so it doesn't immediately disappear
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        showCelebration: false,
      }));
    }, 500);
  };
  // Check if student info is already in localStorage
  const hasStudentInfo = Boolean(
    localStorage.getItem("lovable_student_name") &&
      localStorage.getItem("lovable_noon_code"),
  );

  const [state, setState] = useState<LovableMissionState>({
    messages: [welcomeMessage],
    prompt: "",
    isLoading: false,
    currentStep: 1,
    checklistItems: initialChecklistItems,
    finalPrompt: "",
    projectLink: "",
    projectName: "", // Initialize with empty project name
    isSubmitted: false,
    error: "",
    isProjectLinkValid: false,
    isChatLocked: true, // Lock the chat input initially
    projectType: "app", // Default to 'app' - will be updated based on conversation
    showCelebration: false, // Don't show celebration initially
    isStudentInfoCompleted: hasStudentInfo, // Track if student info is completed
  });

  // Handle student info modal completion
  const handleStudentInfoComplete = () => {
    setState((prev) => ({
      ...prev,
      isStudentInfoCompleted: true,
    }));
  };

  // Load progress on mount
  useEffect(() => {
    // Track stage started
    trackStageProgress("lovable_mission", "started");

    // Try to load chat history from localStorage first
    const loadFromLocalStorage = () => {
      const savedMessages = localStorage.getItem("lovable_mission_messages");
      const savedProjectType =
        localStorage.getItem("lovable_mission_project_type") || "";
      const savedFinalPrompt =
        localStorage.getItem("lovable_mission_final_prompt") || "";
      const savedProjectLink =
        localStorage.getItem("lovable_mission_project_link") || "";

      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            // If we have messages, use them
            setState((prev) => ({
              ...prev,
              messages: parsedMessages,
              projectType: savedProjectType,
              finalPrompt: savedFinalPrompt,
              projectLink: savedProjectLink,
              isChatLocked: false, // Unlock chat if we have saved messages
            }));

            // Return true if we found saved messages
            return true;
          }
        } catch (e) {
          console.error("Error parsing saved messages:", e);
        }
      }
      return false;
    };

    // Try to load existing progress from API
    const loadProgress = async () => {
      try {
        const firebaseUid = localStorage.getItem("firebaseUid");
        if (!firebaseUid) return;

        const response = await fetch(
          `/api/lovable-mission/progress?firebaseUid=${firebaseUid}`,
        );
        const data = await response.json();

        if (data.progress && data.chatHistory?.length) {
          // Transform chat history into messages
          const messages = data.chatHistory.map((msg: any) => ({
            role: msg.role as MessageRole,
            content: msg.content,
          }));

          // If there are no messages, add the welcome message
          if (messages.length === 0) {
            messages.push(welcomeMessage);
          }

          setState((prev) => ({
            ...prev,
            messages,
            currentStep: data.progress.currentStep || 1,
            projectLink: data.progress.projectLink || "",
            isSubmitted: data.progress.hasSubmitted || false,
          }));

          // Also save to localStorage for future use
          localStorage.setItem(
            "lovable_mission_messages",
            JSON.stringify(messages),
          );
          localStorage.setItem(
            "lovable_mission_project_link",
            data.progress.projectLink || "",
          );
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
      }
    };

    // First try to load from localStorage, if that fails, try the API
    const foundSavedMessages = loadFromLocalStorage();
    if (!foundSavedMessages) {
      loadProgress();
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.messages]);

  // Handle form submission with OpenAI Assistant API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Store the prompt before clearing it
    const currentPrompt = state.prompt.trim();

    if (!currentPrompt) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: "user",
      content: currentPrompt,
      className: "justify-end", // Align to right
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      prompt: "",
      isLoading: true,
    }));

    // Add loading message
    const loadingMessage: ChatMessage = {
      role: "assistant",
      content: "أفكر ... 💭",
      className: "loading",
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, loadingMessage],
    }));

    try {
      // Save user message to the database
      const firebaseUid = localStorage.getItem("firebaseUid") || "";
      // Get student info from localStorage
      const chatStudentName =
        localStorage.getItem("lovable_student_name") || "";
      const chatNoonCode = localStorage.getItem("lovable_noon_code") || "";

      await fetch("/api/lovable-mission/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid,
          role: "user",
          content: currentPrompt,
          studentName: chatStudentName, // Include student name
          noonCode: chatNoonCode, // Include noon code
        }),
      });

      // Determine if this is the first message after selection (responding to "what's your favorite game/app?")
      const messages = state.messages;
      let isFirstResponseAfterSelection = false;
      let selectedType = "";

      // Check the last two messages
      if (messages.length >= 2) {
        // Check if the second-to-last message was from the assistant asking about favorite app/game
        const prevMessage = messages[messages.length - 2];
        if (
          prevMessage.role === "assistant" &&
          (prevMessage.content.includes("لعبتك المفضلة") ||
            prevMessage.content.includes("تطبيقك المفضل"))
        ) {
          isFirstResponseAfterSelection = true;

          // Determine if it was game or app
          selectedType = prevMessage.content.includes("لعبتك") ? "game" : "app";

          // Store the project type in state
          setState((prev) => ({
            ...prev,
            projectType: selectedType,
          }));
        }
      }

      // Use the standard chat API for now because our firebaseUid isn't properly recognized
      const apiEndpoint = "/api/ai/text";

      // Create the appropriate system message
      let systemPromptContent =
        "أنت الدكتور بنجي (Dr. Pengy) — مرشد ذكي، ممتع، وصديق لطلاب الثانوي في السعودية (من 13 إلى 18 سنة). شغلك إنك تساعد الطلاب يتعلمون ويستكشفون عالم الذكاء الاصطناعي التوليدي (GenAI) بطريقة تفاعلية وممتعة. ردودك دايمًا تكون بلهجة سعودية عامية، آمنة، مفيدة، وبأسلوب يناسب أعمارهم. استخدم نبرة مرحة كأنك تتكلم مع خويك — خلك خفيف دم، طبيعي، واستعمل إيموجيز لما يناسب 😊.";

      // Add the favorite app/game information if this is the first response after selection
      if (isFirstResponseAfterSelection) {
        systemPromptContent += ` The student's favorite ${selectedType} is "${currentPrompt}". Use this information to personalize your conversation and guide them toward brainstorming a project idea related to their interests.`;
      }

      // Create message history for API
      const messageHistory = state.messages
        .filter((msg) => !msg.className?.includes("loading")) // Remove loading messages
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      console.log("Sending chat request:", {
        prompt: currentPrompt,
        messageHistory: messageHistory.length,
      });

      // Get student info from localStorage for AI metadata
      const storedStudentName =
        localStorage.getItem("lovable_student_name") || "";
      const storedNoonCode = localStorage.getItem("lovable_noon_code") || "";

      // Call the standard GPT-4o chat endpoint
      // The /api/ai/text endpoint expects a different format:
      // - prompt: the user's message
      // - messageHistory: array of previous messages
      // - maxTokens: (optional) token limit
      // NOTE: We cannot pass systemPrompt or metadata directly, as the server handles the system message differently

      // Add the system prompt as the first message in the message history
      const fullMessageHistory = [
        { role: "system", content: systemPromptContent },
        ...messageHistory,
      ];

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          messageHistory: fullMessageHistory,
          maxTokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from Dr. Pengy");
      }

      const data = await response.json();

      // Remove loading message
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter(
          (msg) => !msg.className?.includes("loading"),
        ),
        isLoading: false,
      }));

      // Process final stage if needed
      // The /api/ai/text endpoint returns { text: "response content" }
      const aiResponse = data.text || "";

      if (
        aiResponse.includes("نسخ هذا الملخص") ||
        aiResponse.includes("استخدامه كتوجيه في Lovable") ||
        aiResponse.includes("تشغيل مشروعك")
      ) {
        // Extract the final prompt from the response if available
        const finalPromptMatch = aiResponse.match(/"([^"]+)"/);
        const finalPrompt = finalPromptMatch
          ? finalPromptMatch[1]
          : state.messages[state.messages.length - 2].content;

        // Set as final prompt when we reach this stage
        setState((prev) => ({
          ...prev,
          finalPrompt: finalPrompt,
          checklistItems: prev.checklistItems.map((item) =>
            item.id === 1 ? { ...item, completed: true } : item,
          ),
        }));
      }

      // Add assistant response
      // The /api/ai/text endpoint returns { text: "response content" }
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.text || "",
      };

      setState((prev) => {
        const updatedMessages = [...prev.messages, assistantMessage];

        // Save messages to localStorage for persistence
        localStorage.setItem(
          "lovable_mission_messages",
          JSON.stringify(updatedMessages),
        );

        // Also save other important state
        localStorage.setItem("lovable_mission_project_type", prev.projectType);
        localStorage.setItem("lovable_mission_final_prompt", prev.finalPrompt);
        localStorage.setItem("lovable_mission_project_link", prev.projectLink);

        return {
          ...prev,
          messages: updatedMessages,
        };
      });

      // Track progress
      trackStageProgress("lovable_mission", "chat_response_sent");

      // Save assistant message to the database
      await fetch("/api/lovable-mission/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid,
          role: "assistant",
          content: data.response,
        }),
      });
    } catch (error) {
      console.error("Error in chat response:", error);

      // Remove loading message and show error
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter(
          (msg) => !msg.className?.includes("loading"),
        ),
        isLoading: false,
        error: "حدث خطأ أثناء التواصل مع د. بنجي. يرجى المحاولة مرة أخرى.",
      }));
    }
  };

  // Handle checklist item toggle
  const toggleChecklistItem = (id: number) => {
    setState((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    }));

    // Track progress
    trackStageProgress("lovable_mission", `checklist_item_${id}_toggled`);
  };

  // Handle copy prompt to clipboard
  const copyFinalPrompt = () => {
    if (!state.finalPrompt) {
      setState((prev) => ({
        ...prev,
        finalPrompt: state.messages[state.messages.length - 1].content,
        checklistItems: prev.checklistItems.map((item) =>
          item.id === 1 ? { ...item, completed: true } : item,
        ),
      }));
    }

    navigator.clipboard
      .writeText(
        state.finalPrompt || state.messages[state.messages.length - 1].content,
      )
      .then(() => {
        toast({
          title: "تم النسخ!",
          description: "تم نسخ فكرتك النهائية إلى الحافظة.",
        });

        // Mark checklist item 2 as complete
        setState((prev) => ({
          ...prev,
          checklistItems: prev.checklistItems.map((item) =>
            item.id === 2 ? { ...item, completed: true } : item,
          ),
        }));

        // Track progress
        trackStageProgress("lovable_mission", "prompt_copied");
      })
      .catch(() => {
        toast({
          title: "خطأ",
          description: "فشل نسخ النص. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      });
  };

  // Handle opening Lovable
  const openLovable = () => {
    window.open("https://lovable.dev", "_blank");

    // Mark checklist item 3 as complete
    setState((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) =>
        item.id === 3 ? { ...item, completed: true } : item,
      ),
    }));

    // Track progress
    trackStageProgress("lovable_mission", "lovable_opened");
  };

  // Handle project link submission
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Skip the validation since we already did it with the Validate button
    if (!state.isProjectLinkValid) {
      setState((prev) => ({
        ...prev,
        error: "الرجاء التحقق من صحة الرابط أولاً.",
      }));
      return;
    }

    // Check for project name
    if (!state.projectName) {
      setState((prev) => ({
        ...prev,
        error: "الرجاء إدخال اسم المشروع.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      // Try to get Firebase UID but don't require it
      const firebaseUid = localStorage.getItem("firebaseUid") || "";
      // Get student & project information
      const submissionStudentName =
        localStorage.getItem("lovable_student_name") || "";
      const submissionNoonCode =
        localStorage.getItem("lovable_noon_code") || "";
      const projectName = state.projectName;

      // Debug logging
      console.log("Submitting project:", {
        projectLink: state.projectLink,
        studentName: submissionStudentName,
        projectName: projectName,
        noonCode: submissionNoonCode,
        firebaseUid: firebaseUid || "anonymous",
      });

      // Call API to submit link with student name
      const response = await fetch("/api/lovable-mission/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectLink: state.projectLink,
          studentName: submissionStudentName,
          projectName: projectName, // Add project name field
          noonCode: submissionNoonCode, // Include noon code
          projectType: state.projectType, // Include project type (app/game)
          finalPrompt: state.finalPrompt, // Include the final prompt used
          firebaseUid: firebaseUid || undefined, // Include if available
        }),
      });

      if (!response.ok) {
        // Get detailed error information
        const errorData = await response.json();
        console.error("URL submission error:", errorData);
        throw new Error(errorData.error || "Failed to submit project link");
      }

      // Mark as submitted and show celebration
      setState((prev) => ({
        ...prev,
        isSubmitted: true,
        isLoading: false,
        showCelebration: true, // Show the celebration animation
        checklistItems: prev.checklistItems.map((item) =>
          item.id === 6 ? { ...item, completed: true } : item,
        ),
      }));

      // Show success message
      toast({
        title: "تم التقديم بنجاح!",
        description: "تم تقديم رابط مشروعك بنجاح.",
      });

      // Track progress
      trackStageProgress("lovable_mission", "link_submitted");
    } catch (error) {
      console.error("Error submitting link:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? `حدث خطأ: ${error.message}`
            : "حدث خطأ أثناء تقديم الرابط. يرجى المحاولة مرة أخرى. تأكد من أن الرابط يحتوي على lovable.dev أو lovable.app",
      }));
    }
  };

  // Initialize action functions
  useEffect(() => {
    // Update checklist items with action functions
    setState((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) => {
        if (item.id === 2) {
          return { ...item, action: copyFinalPrompt };
        } else if (item.id === 3) {
          return { ...item, action: openLovable };
        }
        return item;
      }),
    }));
  }, []);

  return (
    <div className="flex flex-col h-full p-4">
      {/* Student Info Modal - only shown if not completed */}
      {!state.isStudentInfoCompleted && (
        <StudentInfoModal onComplete={handleStudentInfoComplete} />
      )}

      {/* Celebration Animation */}
      <CelebrationAnimation
        isVisible={state.showCelebration}
        onComplete={handleCelebrationComplete}
      />
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Chat Panel - 75% width */}
        <div className="w-[75%] flex flex-col bg-card rounded-lg shadow-sm border">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {state.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white border"
                    } ${message.className || ""}`}
                    dir={
                      message.content
                        .trim()
                        .match(/^[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/)
                        ? "rtl"
                        : "ltr"
                    }
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center mb-2 gap-2">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden">
                          <img
                            src={drPengyAvatar}
                            alt="Dr. Pengy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-bold">د. بنجي</span>
                      </div>
                    )}
                    {message.role === "assistant" &&
                    message.content === welcomeMessage.content
                      ? message.content
                      : message.content}
                  </div>
                </div>
              ))}

              {/* Option buttons shown outside chat bubbles, aligned to the right */}
              {state.messages.length === 1 && state.isChatLocked && (
                <div className="flex justify-end mb-4 mr-4 mt-4">
                  <div className="flex flex-col gap-2 items-end">
                    <p className="text-xs text-gray-500 mb-1">
                      اختر نوع المشروع:
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          const userMessage = "لعبة";
                          // Add as user message with right alignment
                          const newMessage: ChatMessage = {
                            role: "user",
                            content: userMessage,
                            className: "justify-end", // Align to right
                          };

                          // Create immediate follow-up question
                          const immediateFollowupMessage: ChatMessage = {
                            role: "assistant",
                            content: "كفو! إيش لعبتك المفضلة؟",
                          };

                          setState((prev) => ({
                            ...prev,
                            messages: [
                              ...prev.messages,
                              newMessage,
                              immediateFollowupMessage,
                            ],
                            prompt: "",
                            isChatLocked: false, // Unlock chat after selection
                            isLoading: false,
                          }));

                          try {
                            // Save user message to the database
                            const firebaseUid =
                              localStorage.getItem("firebaseUid") || "";

                            await fetch("/api/lovable-mission/chat", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                firebaseUid,
                                role: "user",
                                content: userMessage,
                              }),
                            });

                            // Also save Dr. Pengy's immediate follow-up question
                            await fetch("/api/lovable-mission/chat", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                firebaseUid,
                                role: "assistant",
                                content: immediateFollowupMessage.content,
                              }),
                            });
                          } catch (error) {
                            console.error("Error saving chat message:", error);
                            // We don't need to show an error here as the messages are already displayed
                          }
                        }}
                        variant="outline"
                        className="bg-white border-purple-500 text-purple-700 hover:bg-purple-50"
                      >
                        لعبة 🎮
                      </Button>
                      <Button
                        onClick={async () => {
                          const userMessage = "تطبيق";
                          // Add as user message with right alignment
                          const newMessage: ChatMessage = {
                            role: "user",
                            content: userMessage,
                            className: "justify-end", // Align to right
                          };

                          // Create immediate follow-up question
                          const immediateFollowupMessage: ChatMessage = {
                            role: "assistant",
                            content: "كفو! إيش تطبيقك المفضل؟",
                          };

                          setState((prev) => ({
                            ...prev,
                            messages: [
                              ...prev.messages,
                              newMessage,
                              immediateFollowupMessage,
                            ],
                            prompt: "",
                            isChatLocked: false, // Unlock chat after selection
                            isLoading: false,
                          }));

                          try {
                            // Save user message to the database
                            const firebaseUid =
                              localStorage.getItem("firebaseUid") || "";

                            await fetch("/api/lovable-mission/chat", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                firebaseUid,
                                role: "user",
                                content: userMessage,
                              }),
                            });

                            // Also save Dr. Pengy's immediate follow-up question
                            await fetch("/api/lovable-mission/chat", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                firebaseUid,
                                role: "assistant",
                                content: immediateFollowupMessage.content,
                              }),
                            });
                          } catch (error) {
                            console.error("Error saving chat message:", error);
                            // We don't need to show an error here as the messages are already displayed
                          }
                        }}
                        variant="outline"
                        className="bg-white border-purple-500 text-purple-700 hover:bg-purple-50"
                      >
                        تطبيق 📱
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Form */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={state.prompt}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    prompt: e.target.value,
                    error: "",
                  }))
                }
                placeholder={
                  state.isChatLocked
                    ? "الرجاء اختيار نوع المشروع أولاً..."
                    : "اكتب رسالتك هنا..."
                }
                className="flex-1 resize-none"
                rows={1}
                disabled={state.isChatLocked} // Disable when chat is locked
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={
                  state.isLoading || !state.prompt.trim() || state.isChatLocked
                }
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {state.isChatLocked && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                ⬆️ اختر تطبيق أو لعبة للبدء في المحادثة
              </p>
            )}
          </div>
        </div>

        {/* Checklist Panel - 25% width */}
        <div className="w-[25%] bg-card rounded-lg shadow-sm p-4 overflow-y-auto border">
          <h3 className="font-semibold mb-2 text-center">قائمة المهام</h3>
          <Separator className="my-2" />

          <div className="space-y-3">
            {state.checklistItems.map((item) => (
              <div key={item.id} className="flex flex-col">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={`checklist-${item.id}`}
                    checked={item.completed}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <Label
                      htmlFor={`checklist-${item.id}`}
                      className={`text-sm font-bold ${item.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {item.text}
                    </Label>
                    {item.description && (
                      <span
                        className={`text-xs text-muted-foreground ${item.completed ? "line-through" : ""}`}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>

                {item.type === "button" && (
                  <Button
                    onClick={item.action}
                    className="mt-1 ml-6 text-xs"
                    size="sm"
                    variant="outline"
                  >
                    {item.id === 2
                      ? "انسخ الفكرة النهائية"
                      : "افتح Lovable.dev"}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Project Link Submission */}
          {!state.isSubmitted ? (
            <form onSubmit={handleLinkSubmit} className="mt-4">
              <div className="flex flex-col gap-3">
                <div>
                  <Label htmlFor="project-link" className="text-sm font-bold">
                    رابط المشروع
                  </Label>
                  <Input
                    id="project-link"
                    placeholder="https://...lovable.app"
                    value={state.projectLink}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        projectLink: e.target.value,
                        error: "",
                        isProjectLinkValid: false, // Reset validation on change
                      }))
                    }
                    className="text-sm bg-white-50 mt-1"
                  />

                  {/* URL Validation Button */}
                  <Button
                    type="button"
                    onClick={() => {
                      // Check URL validity
                      if (!state.projectLink) {
                        setState((prev) => ({
                          ...prev,
                          error: "الرجاء إدخال رابط المشروع.",
                        }));
                        return;
                      }

                      // Make sure the URL has a proper protocol prefix
                      let projectLink = state.projectLink;
                      if (
                        !projectLink.startsWith("http://") &&
                        !projectLink.startsWith("https://")
                      ) {
                        projectLink = "https://" + projectLink;
                      }

                      // Validate that the URL contains lovable.dev or lovable.app
                      if (
                        !projectLink.includes("lovable.dev") &&
                        !projectLink.includes("lovable.app")
                      ) {
                        setState((prev) => ({
                          ...prev,
                          error:
                            "الرابط غير صالح. يجب أن يكون رابط مشروع Lovable (lovable.dev أو lovable.app).",
                        }));
                        return;
                      }

                      // Update state with valid URL
                      setState((prev) => ({
                        ...prev,
                        projectLink,
                        isProjectLinkValid: true,
                        error: "",
                      }));
                    }}
                    className="mt-2 w-full text-sm bg-green-50"
                    variant="outline"
                    disabled={state.isProjectLinkValid}
                  >
                    {state.isProjectLinkValid
                      ? "تم التحقق من الرابط ✓"
                      : "التحقق من الرابط"}
                  </Button>
                </div>

                {/* Project Name Field - Only show when URL is valid */}
                {state.isProjectLinkValid && (
                  <div className="mt-2">
                    <Label htmlFor="project-name" className="text-sm font-bold">
                      اسم المشروع
                    </Label>
                    <Input
                      id="project-name"
                      placeholder="....."
                      value={state.projectName}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          projectName: e.target.value,
                        }))
                      }
                      className="text-sm bg-white mt-1"
                    />
                  </div>
                )}

                {/* Submit Button - Only enable when URL is valid and name is entered */}
                <Button
                  type="submit"
                  disabled={
                    state.isLoading ||
                    !state.isProjectLinkValid ||
                    (!state.projectName && state.isProjectLinkValid)
                  }
                  className="bg-green-600 hover:bg-green-700 text-white mt-2"
                >
                  {state.isLoading ? "جارٍ التقديم..." : "انتهيت 🎉"}
                </Button>
              </div>
            </form>
          ) : (
            <Alert variant="default" className="bg-green-100 mt-4">
              <Check className="h-4 w-4" />
              <AlertTitle className="text-sm">تم التقديم!</AlertTitle>
              <AlertDescription className="text-sm">
                تم تقديم رابط مشروعك بنجاح.
              </AlertDescription>
            </Alert>
          )}

          {state.error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          {/* All Projects Link */}
          <div className="mt-4 text-center">
            <Link
              href="/missions/lovable/submissions"
              className="text-primary text-sm hover:underline"
            >
              عرض جميع المشاريع
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
