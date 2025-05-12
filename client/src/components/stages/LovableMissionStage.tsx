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
  Loader2,
  LayoutGrid,
  Gamepad2,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
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
    description: "انتبه! عندك بس ٥ محادثات مع Lovable، استخدمها بحكمة.",
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
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handler for when celebration animation completes
  const handleCelebrationComplete = () => {
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
      let systemPromptContent = "";

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
          content: data.text,
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
  const handleCopyPrompt = () => {
    const finalPrompt = state.finalPrompt || "";
    if (finalPrompt) {
      navigator.clipboard.writeText(finalPrompt);
      toast({
        title: "تم النسخ!",
        description: "تم نسخ الملخص إلى الحافظة بنجاح.",
      });

      // Mark item 2 as completed
      setState((prev) => ({
        ...prev,
        checklistItems: prev.checklistItems.map((item) =>
          item.id === 2 ? { ...item, completed: true } : item,
        ),
      }));

      // Track progress
      trackStageProgress("lovable_mission", "prompt_copied");
    }
  };

  // Handle open Lovable.dev in new tab
  const handleOpenLovable = () => {
    window.open("https://lovable.dev/", "_blank");

    // Mark item 3 as completed
    setState((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) =>
        item.id === 3 ? { ...item, completed: true } : item,
      ),
    }));

    // Track progress
    trackStageProgress("lovable_mission", "lovable_opened");
  };

  // Function to validate Lovable project link
  const validateLovableLink = (link: string) => {
    return (
      link.includes("lovable.dev") ||
      link.includes("lovable.app") ||
      link.includes("lovable.repl.co")
    );
  };

  // Handle project selection
  const handleProjectTypeSelection = async (type: "app" | "game") => {
    try {
      setState((prev) => ({
        ...prev,
        projectType: type,
        isChatLocked: false, // Unlock chat now that they've chosen
      }));

      // Create a question based on the project type
      const questionContent =
        type === "app"
          ? "ممتاز! اختيار رائع. قبل أن نبدأ، خبرني عن تطبيقك المفضل. ما هو وليش تحبه؟"
          : "كفو! اختيار ممتاز. قبل أن نبدأ، خبرني عن لعبتك المفضلة. شنو هي وليش تحبها؟";

      // Add a message from Dr. Pengy asking about their favorite app/game
      const assistantQuestion: ChatMessage = {
        role: "assistant",
        content: questionContent,
      };

      setState((prev) => {
        const updatedMessages = [...prev.messages, assistantQuestion];
        // Save to localStorage
        localStorage.setItem(
          "lovable_mission_messages",
          JSON.stringify(updatedMessages),
        );
        return {
          ...prev,
          messages: updatedMessages,
        };
      });

      // Track progress
      trackStageProgress("lovable_mission", `selected_${type}`);
    } catch (error) {
      console.error("Error in project type selection:", error);
    }
  };

  // Handle project submission
  const handleSubmitProject = async () => {
    if (!state.projectLink) {
      setState((prev) => ({
        ...prev,
        error: "الرجاء إدخال رابط مشروعك.",
      }));
      return;
    }

    if (!state.projectName) {
      setState((prev) => ({
        ...prev,
        error: "الرجاء إدخال اسم مشروعك.",
      }));
      return;
    }

    if (!validateLovableLink(state.projectLink)) {
      setState((prev) => ({
        ...prev,
        error: "الرابط غير صالح. يجب أن يكون رابط مشروع Lovable.",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: "",
    }));

    try {
      // Get student name and noon code from localStorage
      const studentName = localStorage.getItem("lovable_student_name") || "";
      const noonCode = localStorage.getItem("lovable_noon_code") || "";

      const response = await fetch("/api/lovable-mission/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: localStorage.getItem("firebaseUid") || "",
          projectType: state.projectType,
          projectLink: state.projectLink,
          projectName: state.projectName,
          finalPrompt: state.finalPrompt,
          studentName: studentName, // Include student name
          noonCode: noonCode, // Include noon code
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit project");
      }

      // Project submitted successfully
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isSubmitted: true,
        showCelebration: true, // Show celebration animation
        checklistItems: prev.checklistItems.map((item) => ({
          ...item,
          completed: true,
        })),
      }));

      // Save to localStorage
      localStorage.setItem("lovable_mission_project_link", state.projectLink);

      // Award badge if not already awarded
      if (!isAlreadyAwarded("mission", "lovable")) {
        markAsAwarded("mission", "lovable");
      }

      // Track progress
      trackStageProgress("lovable_mission", "submitted", {
        projectType: state.projectType,
        projectLink: state.projectLink,
        projectName: state.projectName,
      });

      // Add a congratulatory message from Dr. Pengy
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          "🎉 مبروووك! تم تسليم مشروعك بنجاح. شكرًا لك على المشاركة وإبداعك. يمكنك استعراض مشروعك والمشاريع الأخرى في صفحة المشاريع.",
      };

      setState((prev) => {
        const updatedMessages = [...prev.messages, assistantMessage];
        // Save to localStorage
        localStorage.setItem(
          "lovable_mission_messages",
          JSON.stringify(updatedMessages),
        );
        return {
          ...prev,
          messages: updatedMessages,
        };
      });
    } catch (error) {
      console.error("Error submitting project:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "حدث خطأ أثناء تسليم المشروع. يرجى المحاولة مرة أخرى.",
      }));
    }
  };

  // Initialize button actions when the component mounts
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) => {
        if (item.id === 2) {
          return {
            ...item,
            action: handleCopyPrompt,
          };
        }
        if (item.id === 3) {
          return {
            ...item,
            action: handleOpenLovable,
          };
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
      
      {/* Main content layout - fixed two column layout */}
      <div className="flex h-[calc(100vh-2rem)] gap-4 overflow-hidden">
        {/* Checklist Sidebar - fixed width */}
        <div className="w-64 flex-shrink-0 bg-card rounded-lg shadow-sm p-4 border h-full flex flex-col">
          <h3 className="font-semibold mb-2 text-center">قائمة المهام</h3>
          <Separator className="my-2" />
          
          <div className="space-y-3 overflow-y-auto flex-grow">
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
                      <p
                        className={`text-xs mt-0.5 ${
                          item.completed ? "line-through text-muted-foreground" : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
                {/* Button for items with action */}
                {item.type === "button" && !item.completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 ml-6 text-sm h-8"
                    onClick={item.action}
                  >
                    {item.id === 3
                      ? t("Open Lovable.dev")
                      : t("Copy")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel - fills remaining space */}
        <div className="flex-grow flex flex-col bg-card rounded-lg shadow-sm border h-full overflow-hidden">
          {/* Messages Container - scrollable */}
          <div className="flex-grow overflow-y-auto p-4">
            <div className="space-y-4">
              {state.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } ${message.className || ""}`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] text-card-foreground rounded-lg p-3 flex items-start",
                      message.role === "assistant"
                        ? "bg-tertiary/25 rounded-br-none flex-wrap"
                        : "bg-primary text-white rounded-bl-none",
                      message.className?.includes("loading") && "animate-pulse",
                    )}
                  >
                    {/* Dr. Pengy avatar for assistant messages */}
                    {message.role === "assistant" && !message.className?.includes("loading") && (
                      <img
                        src="/images/pengy.png"
                        alt="Dr. Pengy"
                        className="w-6 h-6 mr-2 rounded-full"
                      />
                    )}
                    {message.content}
                  </div>
                </div>
              ))}
              {state.isLoading && (
                <div className="text-center w-full">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Project type selection buttons (only shown before first selection) */}
          {state.isChatLocked && (
            <div className="flex items-center justify-center gap-4 my-4 flex-shrink-0">
              <Button
                className="bg-white text-violet-700 border-2 border-violet-700 hover:bg-violet-100"
                onClick={() => handleProjectTypeSelection("app")}
                variant="outline"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                {t("Create an App")}
              </Button>
              <Button
                className="bg-white text-violet-700 border-2 border-violet-700 hover:bg-violet-100"
                onClick={() => handleProjectTypeSelection("game")}
                variant="outline"
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                {t("Create a Game")}
              </Button>
            </div>
          )}

          {/* Project submission form (shown after first message) */}
          {!state.isChatLocked && !state.isSubmitted && (
            <div className="p-4 border-t-2 flex-shrink-0">
              <div className="flex flex-col gap-2 mb-4">
                {/* Project link instructions & input */}
                <h3 className="text-sm font-bold">
                  {t("Project Submission")}
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={state.projectLink}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        projectLink: e.target.value,
                        isProjectLinkValid: validateLovableLink(e.target.value),
                        error: "",
                      }))
                    }
                    placeholder="https://your-project.lovable.app/"
                    className={`flex-1 bg-green-50 ${
                      state.projectLink &&
                      (state.isProjectLinkValid
                        ? "border-green-500 focus-visible:ring-green-500"
                        : "border-red-500 focus-visible:ring-red-500")
                    }`}
                  />
                  <Button
                    onClick={handleSubmitProject}
                    disabled={
                      !state.isProjectLinkValid ||
                      state.isLoading ||
                      state.projectLink === ""
                    }
                    className="bg-green-700 hover:bg-green-800"
                  >
                    {t("Submit")}
                  </Button>
                </div>
                {/* Project name input */}
                <Input
                  value={state.projectName}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      projectName: e.target.value,
                    }))
                  }
                  placeholder="اسم المشروع"
                  className="flex-1 mt-2 bg-green-50"
                />
                {state.error && (
                  <p className="text-sm text-red-500">{state.error}</p>
                )}
                {state.projectLink && !state.isProjectLinkValid && (
                  <p className="text-xs text-red-500">
                    {t(
                      "Invalid link. Must be a Lovable project link (lovable.dev or lovable.app).",
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chat input (shown when not submitted and chat is not locked) */}
          {!state.isSubmitted && (
            <div className="border-t-2 p-4 flex-shrink-0">
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
          )}
        </div>
      </div>
    </div>
  );
}