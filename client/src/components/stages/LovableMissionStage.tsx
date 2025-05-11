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
import drPengyAvatar from "@assets/Pengy_chat.png";

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
  studentName: string;
  isSubmitted: boolean;
  error: string;
  isProjectLinkValid: boolean;
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
  const [state, setState] = useState<LovableMissionState>({
    messages: [welcomeMessage],
    prompt: "",
    isLoading: false,
    currentStep: 1,
    checklistItems: initialChecklistItems,
    finalPrompt: "",
    projectLink: "",
    studentName: "",
    isSubmitted: false,
    error: "",
    isProjectLinkValid: false,
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
      // Save user message to the database
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
      
      // Prepare message history for the Assistant API
      const messageHistory = state.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Call the OpenAI Assistant API
      const response = await fetch("/api/lovable-mission/assistant-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid,
          message: currentPrompt,
          messageHistory,
          // Optional system prompt can be added here if needed
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response from assistant");
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
      if (data.response.includes("نسخ هذا الملخص") || 
          data.response.includes("استخدامه كتوجيه في Lovable") ||
          data.response.includes("تشغيل مشروعك")) {
        
        // Extract the final prompt from the response if available
        const finalPromptMatch = data.response.match(/"([^"]+)"/);
        const finalPrompt = finalPromptMatch ? finalPromptMatch[1] : state.messages[state.messages.length - 2].content;
        
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
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));
      
      // Track progress
      trackStageProgress("lovable_mission", "assistant_message_sent", {
        threadId: data.threadId
      });
    } catch (error) {
      console.error("Error in assistant chat:", error);

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

    if (!state.projectLink) {
      setState((prev) => ({
        ...prev,
        error: "الرجاء إدخال رابط المشروع.",
      }));
      return;
    }
    
    // Make sure the URL has a proper protocol prefix
    let projectLink = state.projectLink;
    if (!projectLink.startsWith('http://') && !projectLink.startsWith('https://')) {
      projectLink = 'https://' + projectLink;
    }
    
    // Validate that the URL contains lovable.dev or lovable.app
    if (!projectLink.includes("lovable.dev") && !projectLink.includes("lovable.app")) {
      setState((prev) => ({
        ...prev,
        error: "الرابط غير صالح. يجب أن يكون رابط مشروع Lovable (lovable.dev أو lovable.app).",
      }));
      return;
    }
    
    // Update the state with formatted URL and set URL as valid
    setState(prev => ({
      ...prev, 
      projectLink,
      isProjectLinkValid: true,
      error: ""
    }));

    setState((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      const firebaseUid = localStorage.getItem("firebaseUid") || "";
      
      // Debug logging to check Firebase UID
      console.log("Firebase UID for submission:", firebaseUid);
      
      if (!firebaseUid) {
        throw new Error("لم يتم العثور على معرف المستخدم. يرجى تسجيل الدخول مرة أخرى.");
      }

      // Call API to submit link with the formatted URL
      console.log("Submitting project:", { firebaseUid, projectLink });
      
      const response = await fetch("/api/lovable-mission/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid,
          projectLink: projectLink, // Use the formatted URL with protocol
        }),
      });

      if (!response.ok) {
        // Get detailed error information
        const errorData = await response.json();
        console.error("URL submission error:", errorData);
        throw new Error(errorData.error || "Failed to submit project link");
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
        error: error instanceof Error 
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
                    {message.role === "assistant" && message.content === welcomeMessage.content ? (
                      <>
                        {message.content}
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={() => {
                              const userMessage = "تطبيق";
                              // Add as user message
                              const newMessage: ChatMessage = {
                                role: "user",
                                content: userMessage,
                              };
                              setState(prev => ({
                                ...prev,
                                messages: [...prev.messages, newMessage],
                                prompt: "",
                              }));
                              // Send the message
                              setTimeout(() => {
                                handleSubmit(new Event('submit') as unknown as React.FormEvent);
                              }, 100);
                            }}
                            variant="outline" 
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            تطبيق 📱
                          </Button>
                          <Button 
                            onClick={() => {
                              const userMessage = "لعبة";
                              // Add as user message
                              const newMessage: ChatMessage = {
                                role: "user",
                                content: userMessage,
                              };
                              setState(prev => ({
                                ...prev,
                                messages: [...prev.messages, newMessage],
                                prompt: "",
                              }));
                              // Send the message
                              setTimeout(() => {
                                handleSubmit(new Event('submit') as unknown as React.FormEvent);
                              }, 100);
                            }}
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            لعبة 🎮
                          </Button>
                        </div>
                      </>
                    ) : (
                      message.content
                    )}
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
              <div className="flex flex-col"></div>
              <div className="flex flex-col gap-2 mt-1">
                <Input
                  id="project-link"
                  placeholder="https://...lovable.app"
                  value={state.projectLink}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      projectLink: e.target.value,
                      error: "",
                    }))
                  }
                  className="text-sm bg-green-50"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={state.isLoading || !state.projectLink}
                  className="bg-green-600 hover:bg-green-700 text-white"
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
