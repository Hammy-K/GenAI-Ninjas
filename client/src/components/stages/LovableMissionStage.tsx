import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Send, Check, AlertCircle, Copy, ExternalLink } from "lucide-react";
import drPengyAvatar from "@assets/Penguin.png";

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
  isSubmitted: boolean;
  error: string;
}

// Initial data
const initialChecklistItems: ChecklistItem[] = [
  {
    id: 1,
    text: "✨ فكّر في فكرة تطبيق أو لعبة واضحة.",
    completed: false,
  },
  {
    id: 2,
    text: "📋 انسخ فكرتك النهائية.",
    completed: false,
    type: "button",
    action: () => {},
  },
  {
    id: 3,
    text: "🌐 ادخل على Lovable.dev، الصق الفكرة، وابدأ تبني تطبيقك. ⚠️ انتبه! عندك بس ٥ محادثات مع Lovable، استخدمها بحكمة.",
    completed: false,
    type: "button",
    action: () => {},
  },
  {
    id: 5,
    text: "🔗 خلصت؟ انسخ رابط مشروعك من Lovable.",
    completed: false,
  },
  {
    id: 6,
    text: "📩 ارسل الرابط تحت هنا:",
    completed: false,
  },
  //{ id: 7, text: "(Team activity) Only one project submission per team.", completed: false },
];

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "مرحبًا بك في مهمة Lovable! أنا د. بنجي، وأنا هنا لمساعدتك في إنشاء فكرة تطبيق أو لعبة مميزة. ما هي فكرتك الأولية؟",
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
  const [state, setState] = useState<LovableMissionState>({
    messages: [welcomeMessage],
    prompt: "",
    isLoading: false,
    currentStep: 1,
    checklistItems: initialChecklistItems,
    finalPrompt: "",
    projectLink: "",
    isSubmitted: false,
    error: "",
  });

  // Load progress on mount
  useEffect(() => {
    // Track stage started
    trackStageProgress("lovable_mission", "started");

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
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
      }
    };

    loadProgress();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.prompt.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: "user",
      content: state.prompt,
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
      content: "...",
      className: "loading",
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, loadingMessage],
    }));

    try {
      // Make API request to add user message
      const firebaseUid = localStorage.getItem("firebaseUid") || "";

      await fetch("/api/lovable-mission/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid,
          role: "user",
          content: state.prompt,
        }),
      });

      // Remove loading message
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter(
          (msg) => !msg.className?.includes("loading"),
        ),
        isLoading: false,
      }));

      // Generate a response based on the conversation stage
      let response =
        "شكرًا لمشاركة فكرتك! هل يمكنك إخباري المزيد عن كيفية عمل هذا التطبيق/اللعبة؟";

      if (state.messages.length > 2) {
        response =
          "هذه فكرة رائعة! لنوضح بعض التفاصيل الإضافية: ما هي الميزات الرئيسية التي تريد تضمينها؟";
      }

      if (state.messages.length > 4) {
        response =
          "ممتاز! لديك الآن فكرة واضحة. يمكنك نسخ هذا الملخص واستخدامه كتوجيه في Lovable:\n\n" +
          '"' +
          state.messages[state.messages.length - 2].content +
          '"';

        // Set as final prompt when we reach this stage
        setState((prev) => ({
          ...prev,
          finalPrompt: state.messages[state.messages.length - 2].content,
          checklistItems: prev.checklistItems.map((item) =>
            item.id === 1 ? { ...item, completed: true } : item,
          ),
        }));
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Send assistant message to API
      await fetch("/api/lovable-mission/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid,
          role: "assistant",
          content: response,
        }),
      });

      // Track progress
      trackStageProgress("lovable_mission", "message_sent");
    } catch (error) {
      console.error("Error in chat:", error);

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

    if (!state.projectLink || !state.projectLink.includes("lovable.dev")) {
      setState((prev) => ({
        ...prev,
        error: "الرابط غير صالح. يجب أن يكون رابط مشروع Lovable.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      const firebaseUid = localStorage.getItem("firebaseUid") || "";

      // Call API to submit link
      const response = await fetch("/api/lovable-mission/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid,
          projectLink: state.projectLink,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit project link");
      }

      // Mark as submitted
      setState((prev) => ({
        ...prev,
        isSubmitted: true,
        isLoading: false,
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
        error: "حدث خطأ أثناء تقديم الرابط. يرجى المحاولة مرة أخرى.",
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
    <div className="flex flex-col h-full">
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
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-2">
                      <img
                        src={drPengyAvatar}
                        alt="Dr. Pengy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white border"
                    } ${message.className || ""}`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
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
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={state.isLoading || !state.prompt.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
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
                  <Label
                    htmlFor={`checklist-${item.id}`}
                    className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {item.text}
                  </Label>
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
              <Label htmlFor="project-link" className="text-sm">
                رابط ابداعك:
              </Label>
              <div className="flex flex-col gap-2 mt-1">
                <Input
                  id="project-link"
                  placeholder="https://..."
                  value={state.projectLink}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      projectLink: e.target.value,
                      error: "",
                    }))
                  }
                  className="text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={state.isLoading || !state.projectLink}
                >
                  {state.isLoading ? "جارٍ التقديم..." : "قدم الرابط"}
                </Button>
              </div>
            </form>
          ) : (
            <Alert variant="default" className="bg-primary/20 mt-4">
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
        </div>
      </div>
    </div>
  );
}
