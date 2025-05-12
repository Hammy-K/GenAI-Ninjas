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
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import drPengyAvatar from "@assets/Pengy_chat.png";
import CelebrationAnimation from "@/components/animations/CelebrationAnimation";
import StudentInfoModal from "@/components/modals/StudentInfoModal";
import { trackStageProgress } from "@/lib/firebase";

// Interface for chat messages
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  className?: string;
}

// Default welcome message
const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "🚀 أهلاً بك في مهمة Lovable! أنا الدكتور بنجي وراح أساعدك تبني أول تطبيق أو لعبة خاصة فيك باستخدام منصة Lovable.dev. هل تبي تبني تطبيق أو لعبة؟",
  className: "",
};

// Lovable Mission component
export default function LovableMissionStage() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to validate Lovable URLs
  const validateLovableUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.protocol === "https:" &&
        (urlObj.hostname.endsWith("lovable.app") ||
          urlObj.hostname.endsWith("lovable.dev"))
      );
    } catch (e) {
      return false;
    }
  };

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

  // State for the mission
  const [state, setState] = useState({
    messages: [welcomeMessage],
    prompt: "",
    isLoading: false,
    checklistItems: [
      {
        id: 1,
        text: "🤔 حدد نوع المشروع (تطبيق أو لعبة)",
        description: "",
        completed: false,
      },
      {
        id: 2,
        text: "💡 طور فكرتك مع الدكتور بنجي",
        description: "",
        completed: false,
      },
      {
        id: 3,
        text: "🌐 ادخل على Lovable.الصق الفكرة وابدأ بناء فكرتك.",
        description: "انتبه! عندك بس ٥ محادثات مع Lovable، استخدمها بحكمة.",
        completed: false,
        type: "button",
        action: () => {
          window.open("https://lovable.dev", "_blank");
          // Mark step 3 as completed if not already
          if (
            !state.checklistItems.find((item) => item.id === 3)?.completed
          ) {
            setState((prev) => ({
              ...prev,
              checklistItems: prev.checklistItems.map((item) =>
                item.id === 3 ? { ...item, completed: true } : item
              ),
            }));
            // Track progress
            trackStageProgress(
              "lovable_mission",
              "checklist_item_3_toggled"
            );
          }
        },
      },
      {
        id: 5,
        text: "🔗 لما تنتهي،  Publish مشروعك و انسخ رابط",
        description: "",
        completed: false,
      },
      {
        id: 6,
        text: "🎉 شارك مشروعك مع الجميع!",
        description: "",
        completed: false,
      },
    ],
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

  // Handler for student info modal completion
  const handleStudentInfoComplete = () => {
    setState((prev) => ({
      ...prev,
      isStudentInfoCompleted: true,
    }));
  };

  // Load previous messages
  useEffect(() => {
    const loadFromLocalStorage = () => {
      const savedMessages = localStorage.getItem("lovable_mission_messages");
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
              // If there are at least 3 messages, it means they've chosen a project type
              isChatLocked: parsedMessages.length < 3,
              // If we have a saved project link, use it
              projectLink: savedProjectLink,
              // Update checklist items based on progress
              checklistItems: prev.checklistItems.map((item) => {
                if (item.id === 1 && parsedMessages.length >= 3) {
                  return { ...item, completed: true };
                }
                return item;
              }),
            }));
            return true; // Successfully loaded from localStorage
          }
        } catch (error) {
          console.error("Failed to parse saved messages:", error);
        }
      }
      return false; // Failed to load from localStorage
    };

    // Try to load progress from the API if we couldn't load from localStorage
    const loadProgress = async () => {
      try {
        const firebaseUid = localStorage.getItem("firebaseUid") || "";
        // Get student info from localStorage
        const chatStudentName =
          localStorage.getItem("lovable_student_name") || "";
        const chatNoonCode = localStorage.getItem("lovable_noon_code") || "";

        const response = await fetch(
          "/api/lovable-mission/progress?" +
            new URLSearchParams({
              firebaseUid,
              studentName: chatStudentName, // Include student name
              noonCode: chatNoonCode, // Include noon code
            }),
        );

        if (response.ok) {
          const data = await response.json();
          if (data.chatHistory && data.chatHistory.length > 0) {
            // Format chat messages from the database
            const formattedMessages: ChatMessage[] = data.chatHistory.map(
              (msg: any) => ({
                role: msg.role,
                content: msg.content,
                className: msg.role === "user" ? "justify-end" : "",
              }),
            );

            setState((prev) => ({
              ...prev,
              messages: formattedMessages,
              isChatLocked: formattedMessages.length < 3,
              isSubmitted: Boolean(data.progress.projectLink),
              projectLink: data.progress.projectLink || "",
              projectType: data.progress.projectType || "app",
              checklistItems: prev.checklistItems.map((item) => {
                // Mark step 1 as complete if we have chat messages
                if (item.id === 1 && formattedMessages.length >= 3) {
                  return { ...item, completed: true };
                }
                // Mark step 6 as complete if project is submitted
                if (item.id === 6 && Boolean(data.progress.projectLink)) {
                  return { ...item, completed: true };
                }
                return item;
              }),
            }));
            // Save messages to localStorage for future visits
            localStorage.setItem(
              "lovable_mission_messages",
              JSON.stringify(formattedMessages),
            );
            localStorage.setItem(
              "lovable_mission_project_link",
              data.progress.projectLink || "",
            );
          }
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
      // Use smooth scrolling for user experience
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end" 
      });
    }
  }, [state.messages]);
  
  // Also scroll when loading state changes
  useEffect(() => {
    if (messagesEndRef.current && state.isLoading) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end" 
      });
    }
  }, [state.isLoading]);

  // Handle form submission with OpenAI Assistant API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentPrompt = state.prompt.trim();
    if (!currentPrompt || state.isLoading) return;

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

      // Save messages to localStorage
      localStorage.setItem(
        "lovable_mission_messages",
        JSON.stringify([...state.messages, userMessage]),
      );

      const response = await fetch("/api/lovable-mission/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          messageHistory: state.messages.length,
          firebaseUid,
          studentName: chatStudentName, // Include student name
          noonCode: chatNoonCode, // Include noon code
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();

      // Track progress
      trackStageProgress("lovable_mission", "chat_response_sent");

      // Remove loading message and add real response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
      };

      setState((prev) => {
        // Extract the messages without the loading one
        const messagesWithoutLoading = prev.messages.filter(
          (msg) => !msg.className?.includes("loading"),
        );

        // Create the new messages array with the assistant response
        const newMessages = [...messagesWithoutLoading, assistantMessage];

        // Save to localStorage
        localStorage.setItem(
          "lovable_mission_messages",
          JSON.stringify(newMessages),
        );

        return {
          ...prev,
          messages: newMessages,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("Error:", error);
      setState((prev) => {
        // Remove loading message
        const messagesWithoutLoading = prev.messages.filter(
          (msg) => !msg.className?.includes("loading"),
        );

        return {
          ...prev,
          messages: messagesWithoutLoading,
          isLoading: false,
          error: "حدث خطأ في الاتصال بالخادم. حاول مرة أخرى.",
        };
      });
    }
  };

  // Handle project link submission
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.isProjectLinkValid) {
      setState((prev) => ({
        ...prev,
        error:
          "الرابط غير صحيح. يجب أن يبدأ بـ https:// وينتهي بـ lovable.app أو lovable.dev",
      }));
      return;
    }

    if (state.projectName.length < 2) {
      setState((prev) => ({
        ...prev,
        error: "الرجاء إدخال اسم المشروع (على الأقل حرفين)",
      }));
      return;
    }

    try {
      const firebaseUid = localStorage.getItem("firebaseUid") || "";
      // Get student info from localStorage
      const studentName =
        localStorage.getItem("lovable_student_name") || "";
      const noonCode = localStorage.getItem("lovable_noon_code") || "";

      // Get final prompt from the latest assistant message
      const finalPrompt =
        state.messages.find(
          (m) =>
            m.role === "assistant" && m.content.includes("هنا الفكرة النهائية"),
        )?.content || "";

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: "",
      }));

      const response = await fetch("/api/lovable-mission/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectLink: state.projectLink,
          studentName,
          projectName: state.projectName,
          noonCode,
          projectType: state.projectType,
          finalPrompt,
          firebaseUid, // Pass this even if using anonymous mode
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit project");
      }

      const data = await response.json();

      // Save project link to localStorage
      localStorage.setItem("lovable_mission_project_link", state.projectLink);

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
      console.error("Error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "حدث خطأ في تقديم المشروع. حاول مرة أخرى.",
      }));
    }
  };

  return (
    <div className="flex flex-col h-screen p-4">
      {/* Student Info Modal - only shown if not completed */}
      {!state.isStudentInfoCompleted && (
        <StudentInfoModal onComplete={handleStudentInfoComplete} />
      )}

      {/* Celebration Animation */}
      <CelebrationAnimation
        isVisible={state.showCelebration}
        onComplete={handleCelebrationComplete}
      />
      <div className="flex gap-4 h-[calc(100vh-2rem)] overflow-hidden">
        {/* Chat Panel - 75% width with fixed height */}
        <div className="w-[75%] flex flex-col bg-card rounded-lg shadow-sm border overflow-hidden">
          {/* Messages Container - fixed scrolling */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            <div className="space-y-4">
              {state.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 relative group ${
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
                      <>
                        {/* Copy icon button with tooltip */}
                        <div 
                          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 hover:bg-gray-100 rounded-full p-1"
                          title="انسخ"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            toast({
                              title: "تم النسخ!",
                              description: "تم نسخ الرسالة إلى الحافظة."
                            });
                          }}
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                        </div>
                        
                        <div className="flex items-center mb-2 gap-2">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden">
                            <img
                              src={drPengyAvatar}
                              alt="Dr. Pengy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="font-semibold text-sm">
                            الدكتور بنجي
                          </span>
                        </div>
                      </>
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
                        onClick={() => {
                          const userMessage = "لعبة";
                          // Set up the user message
                          const userMessageObj: ChatMessage = {
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
                              userMessageObj,
                              immediateFollowupMessage,
                            ],
                            isChatLocked: false, // Unlock chat
                            projectType: "game", // Set project type to "game"
                            checklistItems: prev.checklistItems.map((item) =>
                              item.id === 1
                                ? { ...item, completed: true }
                                : item
                            ),
                          }));

                          // Save to localStorage
                          localStorage.setItem(
                            "lovable_mission_messages",
                            JSON.stringify([
                              ...state.messages,
                              userMessageObj,
                              immediateFollowupMessage,
                            ])
                          );

                          trackStageProgress("lovable_mission", "game_selected");
                        }}
                        variant="outline"
                        className="bg-white"
                      >
                        لعبة 🎮
                      </Button>
                      <Button
                        onClick={() => {
                          const userMessage = "تطبيق";
                          // Set up the user message
                          const userMessageObj: ChatMessage = {
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
                              userMessageObj,
                              immediateFollowupMessage,
                            ],
                            isChatLocked: false, // Unlock chat
                            projectType: "app", // Set project type to "app"
                            checklistItems: prev.checklistItems.map((item) =>
                              item.id === 1
                                ? { ...item, completed: true }
                                : item
                            ),
                          }));

                          // Save to localStorage
                          localStorage.setItem(
                            "lovable_mission_messages",
                            JSON.stringify([
                              ...state.messages,
                              userMessageObj,
                              immediateFollowupMessage,
                            ])
                          );

                          trackStageProgress("lovable_mission", "app_selected");
                        }}
                        variant="outline"
                        className="bg-white"
                      >
                        تطبيق 📱
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty div for scroll reference */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Form */}
          <div className="p-4 border-t flex-shrink-0">
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
                اختر تطبيق أو لعبة للبدء في المحادثة
              </p>
            )}
          </div>
        </div>

        {/* Checklist Panel - 25% width with fixed height */}
        <div className="w-[25%] flex flex-col bg-card rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-semibold text-center">قائمة المهام</h3>
          </div>
          
          {/* Scrollable checklist items */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {state.checklistItems.map((item) => (
                <div key={item.id} className="flex flex-col">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.completed}
                      onCheckedChange={(isChecked) => {
                        if (isChecked && !item.completed) {
                          // Track progress
                          trackStageProgress(
                            "lovable_mission",
                            `checklist_item_${item.id}_toggled`
                          );
                        }
                        setState((prev) => ({
                          ...prev,
                          checklistItems: prev.checklistItems.map((i) =>
                            i.id === item.id
                              ? { ...i, completed: Boolean(isChecked) }
                              : i
                          ),
                        }));
                      }}
                      className="mt-1"
                      disabled={
                        // Disable step 2 until step 1 is completed
                        (item.id === 2 &&
                          !state.checklistItems.find(
                            (item) => item.id === 1
                          )?.completed) ||
                        // Disable step 6 until link is submitted
                        (item.id === 6 && !state.isSubmitted)
                      }
                    />
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`item-${item.id}`}
                        className={`text-sm ${
                          item.completed ? "line-through text-gray-400" : ""
                        }`}
                      >
                        {item.text}
                      </Label>
                      {item.description && (
                        <span
                          className={`text-xs text-gray-500 mt-0.5 ${
                            item.completed ? "line-through" : ""
                          }`}
                        >
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.id === 3 && item.type === "button" && (
                    <Button
                      onClick={item.action}
                      className="mt-1 ml-6 text-xs"
                      size="sm"
                      variant="outline"
                    >
                      {"افتح Lovable.dev"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Project submission form - fixed at bottom */}
          <div className="p-4 border-t flex-shrink-0">
            {!state.isSubmitted ? (
              <form onSubmit={handleLinkSubmit}>
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
                        const isLovableUrl = validateLovableUrl(state.projectLink);
                        setState((prev) => ({
                          ...prev,
                          isProjectLinkValid: isLovableUrl,
                          error: isLovableUrl
                            ? ""
                            : "الرابط غير صحيح. يجب أن يبدأ بـ https:// وينتهي بـ lovable.app أو lovable.dev",
                        }));
                      }}
                      className="mt-2 text-xs w-full bg-green-100 text-green-800 hover:bg-green-200"
                      size="sm"
                    >
                      تحقق من الرابط
                    </Button>

                    {state.error && (
                      <p className="text-xs text-red-500 mt-1">{state.error}</p>
                    )}
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

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white w-full"
                      disabled={
                        !state.isProjectLinkValid || state.projectName.length < 2
                      }
                    >
                      تقديم المشروع
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto" />
                <p className="text-sm">تم تقديم مشروعك بنجاح!</p>
                <p className="text-xs text-gray-500">
                  {state.projectLink}
                </p>
              </div>
            )}
          </div>

          {/* All Projects Link */}
          <div className="p-4 pt-2 text-center border-t flex-shrink-0">
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
