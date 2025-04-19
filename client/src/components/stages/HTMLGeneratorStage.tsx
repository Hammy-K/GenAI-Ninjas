import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useXpTracker } from "@/hooks/useXpTracker";
import { useStageState } from "@/hooks/useStageState";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Code,
  Loader2,
  Send,
  Wand2,
  X,
  Share2,
  Save,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Confetti } from "@/components/ui/confetti";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateHTML, HTMLMessage } from "@/lib/openai";
import {
  saveProject,
  loadProject,
  logPromptToFirestore,
  trackStageProgress,
} from "@/lib/firebase";
import { useLocation } from "wouter";
import penguinAvatar from "@/assets/Group 26087843.png";
import { validateInput } from "@/lib/inputFilter";

interface HTMLGeneratorStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface HTMLGeneratorState {
  messages: HTMLMessage[];
  prompt: string;
  currentHTML: string;
  isLoading: boolean;
  error: string;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
  viewMode: "preview" | "code";
  isChatOpen: boolean;
  projectId: string | null;
  isSaving: boolean;
  shareUrl: string | null;
  showShareDialog: boolean;
  showResetDialog: boolean;
}

export function HTMLGeneratorStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: HTMLGeneratorStageProps) {
  const { t } = useTranslation();
  const { isAlreadyAwarded, markAsAwarded, awardIfNotAlreadyAwarded } =
    useXpTracker();
  const [showConfetti, setShowConfetti] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get the current location for routing
  const [location, setLocation] = useLocation();

  // Define initial state with welcome message
  const welcomeMessage: HTMLMessage = {
    role: "assistant",
    content:
      'أهلًا في أداة بناء المواقع بالذكاء الاصطناعي! أنا هنا أساعدك تبني تطبيق ويب من خلال كتابة الكود حسب وصفك. جرّب توصف اللي تبغى تسويه، مثلاً: "سوي آلة حاسبة بتصميم داكن" أو "لعبة snake محدثة". حاول توصف ايش تبغى تبني! 😊',
  };

  const initialState: HTMLGeneratorState = {
    messages: [welcomeMessage],
    prompt: "",
    currentHTML: "",
    isLoading: false,
    error: "",
    hasEarnedXp: false,
    hasUnlockedBadge: false,
    viewMode: "preview",
    isChatOpen: false, // Start with chat closed, will open after delay
    projectId: null,
    isSaving: false,
    shareUrl: null,
    showShareDialog: false,
    showResetDialog: false,
  };

  // Clear stale state if needed
  useEffect(() => {
    // This will clear any stale state on component mount to prevent stuck states
    try {
      const storageKey = "genAIQuest_html_generatorState";
      const savedState = localStorage.getItem(storageKey);

      if (savedState) {
        const parsedState = JSON.parse(savedState);

        // Force reset isSaving to false and any error messages on component mount
        // And ensure the chat is always open on first visit, even if previously closed
        console.log(
          "Ensuring clean state on mount - previous isSaving:",
          parsedState.isSaving,
        );

        const cleanState = {
          ...parsedState,
          isSaving: false,
          error: "",
          isChatOpen: false, // Start with chat closed, will open after delay
        };

        localStorage.setItem(storageKey, JSON.stringify(cleanState));

        // Force chat open regardless of saved state with a 5-second delay
        setTimeout(() => {
          setState((prev) => ({ ...prev, isChatOpen: true }));
        }, 5000);
      }
    } catch (e) {
      console.error("Error checking saved state:", e);
      // Just in case there's an error, clear the entire localStorage entry
      localStorage.removeItem("genAIQuest_html_generatorState");
    }
  }, []);

  // Initialize state with localStorage values or defaults
  const [state, setState] = useStageState<HTMLGeneratorState>(
    "html_generator",
    initialState,
  );

  // Initialize toast hook for notifications
  const { toast } = useToast();

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
    // Use both approaches for maximum compatibility
    // 1. Use scrollIntoView for standard behavior
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // 2. Use a timeout as a fallback to ensure scrolling happens after render
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [state.messages]);

  // Handle prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (state.isLoading) return;

    // Validate input using the shared utility function
    const validation = validateInput(state.prompt);
    if (!validation.isValid) {
      // Add a warning message from د. بنجي about the invalid input
      const validationWarning: HTMLMessage = {
        role: "assistant",
        content:
          validation.errorMessage || "الرجاء إدخال وصف واضح لما تريد إنشاءه.",
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, validationWarning],
        error: validation.errorMessage,
      }));

      return;
    }

    // Add user message
    const userMessage: HTMLMessage = {
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
      // Award XP for the first prompt if not already awarded
      if (state.messages.length === 0) {
        if (
          awardIfNotAlreadyAwarded(onEarnXp, 20, "html_generator_first_prompt")
        ) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }

      // Track this step
      trackStageProgress("html_generator", "prompt_submitted", {
        message_count: state.messages.length + 1,
      });

      // Log the prompt to Firestore
      await logPromptToFirestore("html_generation", state.prompt, {
        message_history_length: state.messages.length,
      });

      // Generate HTML using the complete message history
      const response = await generateHTML([...state.messages, userMessage]);

      if (response.error) {
        setState((prev) => ({
          ...prev,
          error: response.error || "Failed to generate HTML",
          isLoading: false,
        }));
        return;
      }

      // Track successful generation
      trackStageProgress("html_generator", "html_generated", {
        html_length: response.html.length,
      });

      // Create a friendly assistant response instead of showing the raw HTML
      const friendlyResponse: HTMLMessage = {
        role: "assistant",
        content:
          "لقد بنيت فكرتك! جربها وأخبرني إذا كنت ترغب في إجراء أي تغييرات.",
      };

      // Update state with the new message and HTML
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage, friendlyResponse],
        currentHTML: response.html,
        isLoading: false,
      }));

      // Award XP for receiving a response if not already awarded
      if (state.messages.length <= 2) {
        if (
          awardIfNotAlreadyAwarded(
            onEarnXp,
            30,
            "html_generator_first_response",
          )
        ) {
          setState((prev) => ({ ...prev, hasEarnedXp: true }));
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "An error occurred",
        isLoading: false,
      }));
    }
  };

  // Award badge when user continues to next stage
  const handleContinue = () => {
    // Award AI-Coder badge if not already awarded
    if (!state.hasUnlockedBadge) {
      if (!isAlreadyAwarded("html_generator_badge", "ai_coder_badge")) {
        onUnlockBadge("ai_coder_badge", "html_generator_badge");
        markAsAwarded("html_generator_badge", "ai_coder_badge");
        setState((prev) => ({ ...prev, hasUnlockedBadge: true }));
      }
    }
    onComplete();
  };

  // Handle toggling the chat widget
  const toggleChat = () => {
    setState((prev) => ({ ...prev, isChatOpen: !prev.isChatOpen }));
  };

  // Check if project ID is in URL (for shared projects)
  useEffect(() => {
    const pathParts = location.split("/");
    if (pathParts.length >= 3 && pathParts[1] === "project") {
      const projectId = pathParts[2];
      loadSharedProject(projectId);
    }
  }, [location]);

  // Load a shared project
  const loadSharedProject = async (projectId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: "" }));

      const project = await loadProject(projectId);

      if (project && project.html) {
        setState((prev) => ({
          ...prev,
          currentHTML: project.html,
          projectId,
          isLoading: false,
          shareUrl: window.location.href,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: "Project not found",
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to load project",
        isLoading: false,
      }));
    }
  };

  // Save the current project to Firebase
  const saveAndShareProject = async () => {
    // Don't proceed if no HTML content or already saving
    if (!state.currentHTML || state.isSaving) {
      console.log("Save canceled: No HTML content or already saving");
      return;
    }

    console.log("Starting save and share process...");

    // Set saving state immediately to prevent multiple clicks
    setState((prev) => ({ ...prev, isSaving: true, error: "" }));

    try {
      // Save the project to Firebase with timeout protection
      console.log("Calling saveProject function...");
      let projectId: string;

      try {
        // Add a safety timeout to prevent indefinite hanging
        const savePromise = saveProject(state.currentHTML);

        // Extend timeout to 30 seconds for Firebase operations in Replit
        const timeoutPromise = new Promise<string>((resolve) => {
          setTimeout(() => {
            console.log("Save operation timed out, using fallback ID");
            // Try to save to localStorage as backup
            try {
              const backupKey = `html_backup_${Date.now()}`;
              localStorage.setItem(backupKey, state.currentHTML);
              console.log(
                "HTML content backed up to localStorage with key:",
                backupKey,
              );
            } catch (backupError) {
              console.error(
                "Failed to backup HTML to localStorage:",
                backupError,
              );
            }

            resolve(`project_${Date.now()}_timeout`);
          }, 30000); // 30 second timeout - Firebase operations can be slow in Replit
        });

        // Double attempt: Try native save first, if it fails within 15 seconds, use a different approach
        const attemptTimeoutPromise = new Promise<string>(async (resolve) => {
          setTimeout(async () => {
            console.log(
              "First save attempt taking too long, trying alternative save method...",
            );
            try {
              // Create simplified project ID without Firebase
              const localProjectId = `project_${Date.now()}_local`;

              // Store in localStorage as a last resort
              const projectData = {
                html: state.currentHTML,
                createdAt: new Date().toISOString(),
              };
              localStorage.setItem(
                `project_${localProjectId}`,
                JSON.stringify(projectData),
              );
              console.log("Project saved to localStorage as backup");

              resolve(localProjectId);
            } catch (err) {
              console.error("Alternative save method failed:", err);
              resolve(`project_${Date.now()}_fallback`);
            }
          }, 15000); // Try alternative approach after 15 seconds
        });

        // Race between the actual save, the alternative approach, and the final timeout
        projectId = await Promise.race([
          savePromise,
          attemptTimeoutPromise,
          timeoutPromise,
        ]);
      } catch (saveError: any) {
        console.error("Error during project save:", saveError);
        projectId = `project_${Date.now()}_error_fallback`;
      }

      console.log("Project saved with ID:", projectId);

      // Create share URL
      const shareUrl = `${window.location.origin}/project/${projectId}`;
      console.log("Share URL created:", shareUrl);

      // Update state with project info
      setState((prev) => ({
        ...prev,
        projectId,
        shareUrl,
        isSaving: false,
        showShareDialog: true,
      }));

      // Award XP and badge for saving project if not already awarded
      if (
        awardIfNotAlreadyAwarded(onEarnXp, 15, "html_generator_save_project")
      ) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      // Award the AI-Coder badge when project is saved
      if (
        !state.hasUnlockedBadge &&
        !isAlreadyAwarded("project_saving", "ai_coder_badge")
      ) {
        onUnlockBadge("ai_coder_badge", "project_saving");
        markAsAwarded("project_saving", "ai_coder_badge");
        setState((prev) => ({
          ...prev,
          hasUnlockedBadge: true,
        }));
      }
    } catch (error: any) {
      console.error("Unexpected error in saveAndShareProject:", error);

      // Ensure loading state is always cleared
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to save project",
        isSaving: false,
      }));
    } finally {
      // Double-ensure the saving state is cleared in case of any errors
      setTimeout(() => {
        setState((prev) => {
          if (prev.isSaving) {
            console.log("Clearing stuck saving state via setTimeout");
            return { ...prev, isSaving: false };
          }
          return prev;
        });
      }, 15000); // 15 second backup timeout
    }
  };

  // Removed utility function that was causing errors

  // Copy share URL to clipboard
  const copyShareUrl = () => {
    if (!state.shareUrl) return;

    navigator.clipboard
      .writeText(state.shareUrl)
      .then(() => {
        // Show minimalist toast notification
        toast({
          description: "Copied to clipboard",
          duration: 2000,
          className: "bg-green-50 text-green-800 border-green-200",
        });

        // Award the AI-Coder badge when the user copies the share URL
        if (
          !state.hasUnlockedBadge &&
          !isAlreadyAwarded("project_sharing", "ai_coder_badge")
        ) {
          onUnlockBadge("ai_coder_badge", "project_sharing");
          markAsAwarded("project_sharing", "ai_coder_badge");
          setState((prev) => ({
            ...prev,
            hasUnlockedBadge: true,
          }));
        }
      })
      .catch((err) => {
        setState((prev) => ({
          ...prev,
          error: "Failed to copy URL to clipboard",
        }));
      });
  };

  // Start a new project
  const startNewProject = () => {
    setState((prev) => ({
      ...prev,
      currentHTML: "",
      messages: [welcomeMessage], // Retain the welcome message
      projectId: null,
      shareUrl: null,
      showShareDialog: false,
      showResetDialog: false,
    }));
  };

  // Confirm before starting new project
  const confirmReset = () => {
    setState((prev) => ({ ...prev, showResetDialog: true }));
  };

  return (
    <div className="html-generator-stage min-h-screen flex flex-col">
      {showConfetti && <Confetti />}

      {/* Share Project Dialog */}
      <Dialog
        open={state.showShareDialog}
        onOpenChange={(open) =>
          setState((prev) => ({ ...prev, showShareDialog: open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تم حفظ المشروع!</DialogTitle>
            <DialogDescription>
              تم حفظ مشروعك بنجاح. شارك الرابط أدناه لعرض إبداعك للآخرين.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={state.shareUrl || ""}
                className="text-xs"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="px-3"
              onClick={copyShareUrl}
            >
              <span className="sr-only">نسخ</span>
              نسخ
            </Button>
          </div>

          <DialogFooter className="sm:justify-start mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setState((prev) => ({ ...prev, showShareDialog: false }))
              }
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Reset Dialog */}
      <Dialog
        open={state.showResetDialog}
        onOpenChange={(open) =>
          setState((prev) => ({ ...prev, showResetDialog: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بدء مشروع جديد؟</DialogTitle>
            <DialogDescription>
              سيؤدي هذا إلى حذف مشروعك الحالي وسجل المحادثة. تأكد من حفظ عملك
              إذا كنت ترغب في الاحتفاظ به.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-4">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">
              لا يمكن التراجع عن هذا الإجراء.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setState((prev) => ({ ...prev, showResetDialog: false }))
              }
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                startNewProject();
                setState((prev) => ({ ...prev, showResetDialog: false }));
              }}
            >
              بدء مشروع جديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="py-6 border-b bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-medium text-center flex items-center justify-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-500" />
            منشئ الويب بالذكاء الاصطناعي
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            اكتب ما ترغب ببنائه، وشاهده يتحول إلى واقع فوراً.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col relative">
        {/* Preview Panel - Full Width */}
        <div className="flex-grow flex flex-col">
          <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
            <span className="font-medium text-sm">
              {state.viewMode === "preview" ? "معاينة مباشرة" : "كود HTML"}
            </span>

            {state.currentHTML && (
              <div className="flex items-center gap-2">
                <div className="flex border rounded overflow-hidden">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      state.viewMode === "preview" ? "default" : "outline"
                    }
                    className="rounded-none px-3 py-1 h-8 text-xs"
                    onClick={() =>
                      setState((prev) => ({ ...prev, viewMode: "preview" }))
                    }
                  >
                    معاينة
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={state.viewMode === "code" ? "default" : "outline"}
                    className="rounded-none px-3 py-1 h-8 text-xs"
                    onClick={() =>
                      setState((prev) => ({ ...prev, viewMode: "code" }))
                    }
                  >
                    الكود
                  </Button>
                </div>

                {/* Project Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex items-center gap-1 text-xs"
                    onClick={saveAndShareProject}
                    disabled={state.isSaving}
                  >
                    {state.isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3 w-3" />
                        حفظ ومشاركة
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex items-center gap-1 text-xs"
                    onClick={confirmReset}
                  >
                    <Plus className="h-3 w-3" />
                    مشروع جديد
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-grow bg-white h-[75vh]">
            {!state.currentHTML ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>سيظهر إبداعك هنا</p>
              </div>
            ) : state.viewMode === "preview" ? (
              <iframe
                title="HTML Preview"
                className="w-full h-full border-0"
                srcDoc={state.currentHTML}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <ScrollArea className="h-full w-full">
                <pre className="p-4 text-xs text-gray-800 whitespace-pre-wrap">
                  {state.currentHTML}
                </pre>
              </ScrollArea>
            )}
          </div>
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
                    className="h-6 w-6 ml-2"
                  />
                  <span className="font-medium text-sm">دردشة مع د. بنجي</span>
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
                {state.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    <p>ماذا ترغب في بناءه؟</p>
                    <p className="text-xs mt-2">أمثلة:</p>
                    <ul className="text-xs mt-1 space-y-1 text-right">
                      <li>"آلة حاسبة بمظهر داكن"</li>
                      <li>"قائمة مهام مع تخزين محلي"</li>
                      <li>"أداة اختيار الألوان"</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                          جاري الإنشاء...
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                )}
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
                  <Input
                    value={state.prompt}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, prompt: e.target.value }))
                    }
                    placeholder="صف ما تريد بناءه..."
                    disabled={state.isLoading}
                    className="flex-grow text-sm h-9"
                    dir="auto"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9"
                    disabled={!state.prompt.trim() || state.isLoading}
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
      </div>

      {/* Footer with Navigation */}
      <div className="bg-white border-t py-4 mt-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowRight className="ml-2 h-4 w-4" />
              <span>السابق</span>
            </Button>
            <Button onClick={handleContinue} size="lg">
              <span>التالي</span>
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
