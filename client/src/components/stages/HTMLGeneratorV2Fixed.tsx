import penguinAvatar from "@/assets/Group 26087843.png";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useStageState } from "@/hooks/useStageState";
import { useXpTracker } from "@/hooks/useXpTracker";
import {
  loadProject,
  logPromptToFirestore,
  saveProject,
  trackStageProgress,
} from "@/lib/firebase";
import { validateInput } from "@/lib/inputFilter";
import {
  generateHTML,
  getClarifyingQuestion,
  getFullProjectSummary,
  getProjectSummary,
  HTMLMessage,
  SummaryResponse,
  ClarificationResponse,
  GenerateHTMLResponse,
} from "@/lib/openai";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Code,
  Loader2,
  Plus,
  Save,
  Send,
  Share,
  ThumbsDown,
  ThumbsUp,
  X,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { StudentInfoModal } from "@/components/modals/StudentInfoModal";
import React from "react";

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
  hasSharedLink: boolean; // Track if the user has copied the share link
  showShareDialog: boolean;
  showResetDialog: boolean;

  // New clarify & confirm flow states
  originalIdea: string;
  clarificationAnswer: string;
  projectSummary: string;
  flowStep:
    | "input"
    | "clarify"
    | "confirm"
    | "generate"
    | "modify"
    | "satisfied";
  showConfirmButtons: boolean;

  isSatisfied: boolean;
  showSatisfactionButtons: boolean;
}

export default function HTMLGeneratorV2Fixed({
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
  const [codeCopied, setCodeCopied] = useState(false);
  const [showStudentInfoModal, setShowStudentInfoModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: localStorage.getItem("studentName") || "",
    id: localStorage.getItem("studentId") || "",
  });

  // Get the current location for routing
  const [location, setLocation] = useLocation();

  // Define initial state with welcome message
  const welcomeMessage: HTMLMessage = {
    role: "assistant",
    content:
      "أهلًا في أداة بناء المواقع بالذكاء الاصطناعي! أنا هنا أساعدك تبني تطبيق ويب من خلال كتابة الكود حسب وصفك. جرّب توصف اللي تبغى تسويه،",
  };

  const examplesMessage: HTMLMessage = {
    role: "assistant",
    content: `
مثلاً:
- لعبة شطرنج (او اي لعبة بسيطة)
- لوحة رسم بسيطة
- كويز تفاعلي فيه كم سؤال مضحك
- صفحة تسهل وش ألبس اليوم من دولابي
- صفحة أختار فيها وجهة سفري المفضلة
- تطبيق يرشّح لك وش تأكل حسب مزاجك
`,
  };

  const initialState: HTMLGeneratorState = {
    messages: [welcomeMessage, examplesMessage],
    prompt: "",
    currentHTML: "",
    isLoading: false,
    error: "",
    hasEarnedXp: false,
    hasUnlockedBadge: false,
    viewMode: "preview",
    isChatOpen: true, // Chat is always visible in the new layout
    projectId: null,
    isSaving: false,
    shareUrl: null,
    hasSharedLink: false, // Initialize as false, will be set to true when the user copies the link
    showShareDialog: false,
    showResetDialog: false,

    // Initialize new clarify & confirm flow states
    originalIdea: "",
    clarificationAnswer: "",
    projectSummary: "",
    flowStep: "input", // Start with input step
    showConfirmButtons: false,

    isSatisfied: false,
    showSatisfactionButtons: false,
  };

  // Check stored student info on component mount
  useEffect(() => {
    const storedName = localStorage.getItem("studentName");
    const storedId = localStorage.getItem("studentId");
    // Only show the modal if either name or ID is missing
    if (!storedName || !storedId) {
      setShowStudentInfoModal(true);
    } else {
      setStudentInfo({
        name: storedName || "",
        id: storedId || "",
      });
    }
  }, []);

  // Initialize state with localStorage values or defaults
  const [state, setState] = useStageState<HTMLGeneratorState>(
    "html_generator",
    initialState
  );

  // Initialize toast hook for notifications
  const { toast } = useToast();

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

  // Auto-save the project if it has changed
  useEffect(() => {
    // Only auto-save if there is actual content and a projectId
    if (state.currentHTML) {
      const saveTimer = setTimeout(() => {
        // Only auto-save if there is HTML content and we're not already saving
        if (state.currentHTML && !state.isSaving) {
          console.log("Auto-saving project...");
          saveProject(state.currentHTML)
            .then((projectId) => {
              console.log("Auto-saved project with ID:", projectId);
              setState((prev) => ({ ...prev, projectId }));
            })
            .catch((error) => {
              console.error("Error auto-saving project:", error);
            });
        }
      }, 3000); // Auto-save after 3 seconds of inactivity

      return () => clearTimeout(saveTimer);
    }
  }, [state.currentHTML]);

  // Combined save and share function - matches original implementation
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
                backupKey
              );
            } catch (backupError) {
              console.error(
                "Failed to backup HTML to localStorage:",
                backupError
              );
            }

            resolve(`project_${Date.now()}_timeout`);
          }, 30000); // 30 second timeout - Firebase operations can be slow in Replit
        });

        // Double attempt: Try native save first, if it fails within 15 seconds, use a different approach
        const attemptTimeoutPromise = new Promise<string>(async (resolve) => {
          setTimeout(async () => {
            console.log(
              "Initial save approaching timeout, trying alternate method..."
            );
            try {
              // This is a fallback save method that bypasses some Firebase checks
              const fallbackId = await saveProject(state.currentHTML, undefined);
              resolve(fallbackId);
            } catch (fallbackError) {
              console.error("Fallback save also failed:", fallbackError);
              resolve(`project_${Date.now()}_fallback_failed`);
            }
          }, 15000); // Try fallback after 15 seconds
        });

        // Race the promises to get the fastest result
        projectId = await Promise.race([
          savePromise,
          timeoutPromise,
          attemptTimeoutPromise,
        ]);
      } catch (saveError) {
        console.error("Error in saveProject:", saveError);
        // Handle error with a fallback ID
        projectId = `project_${Date.now()}_error`;
      }

      console.log("Project saved with ID:", projectId);

      // Generate the share URL
      const shareUrl = `${window.location.origin}/project/${projectId}`;
      
      // Update state with project ID and share URL
      setState((prev) => ({
        ...prev,
        projectId,
        shareUrl,
        isSaving: false,
        showShareDialog: true,
      }));

      // Track successful save for analytics
      trackStageProgress("html_generator", "project_saved", {
        project_id: projectId,
      });

      // Auto-copy URL to clipboard for easier sharing
      try {
        await navigator.clipboard.writeText(shareUrl);
        console.log("Share URL copied to clipboard:", shareUrl);
        
        // Mark as shared so the badge can be awarded
        setState(prev => ({
          ...prev,
          hasSharedLink: true
        }));
        
        toast({
          title: "تم نسخ الرابط",
          description: "تم نسخ رابط المشاركة إلى الحافظة.",
        });
      } catch (clipboardError) {
        console.error("Failed to copy URL to clipboard:", clipboardError);
        // Don't show error toast here, just log the issue
      }
    } catch (error) {
      console.error("Error in saveAndShareProject:", error);
      setState((prev) => ({ 
        ...prev, 
        isSaving: false,
        error: error instanceof Error ? error.message : "فشل حفظ المشروع"
      }));
      
      toast({
        variant: "destructive",
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ المشروع. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  // Handle satisfaction with the generated HTML
  const handleSatisfaction = (satisfied: boolean) => {
    if (satisfied) {
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "user",
            content: "نعم، أريد المتابعة",
          },
        ],
        isSatisfied: true,
        showSatisfactionButtons: false,
        flowStep: "satisfied",
      }));

      // Show save options and automatically save and share the project
      saveAndShareProject();
    } else {
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "user",
            content: "لا، أريد التعديل",
          },
          {
            role: "assistant",
            content: "اوكي، وش تبي نغير؟",
          },
        ],
        isSatisfied: false,
        showSatisfactionButtons: false,
        flowStep: "modify",
      }));
    }

    // Track satisfaction for analytics
    trackStageProgress("html_generator", satisfied ? "satisfied" : "not_satisfied", {
      is_satisfied: satisfied ? "yes" : "no",
    });
  };

  // Handler for resetting the HTML and starting over
  const handleResetHTML = () => {
    // Show confirmation dialog
    setState((prev) => ({
      ...prev,
      showResetDialog: true,
    }));
  };

  // Confirm reset HTML
  const confirmResetHTML = () => {
    // Reset the state to initial
    setState({
      ...initialState,
      messages: [welcomeMessage, examplesMessage], // Keep the welcome message
    });

    // Hide the dialog
    setState((prev) => ({
      ...prev,
      showResetDialog: false,
    }));

    // Track reset for analytics
    trackStageProgress("html_generator", "reset_project");
  };

  // Cancel reset
  const cancelResetHTML = () => {
    setState((prev) => ({
      ...prev,
      showResetDialog: false,
    }));
  };

  // Handle view mode toggle
  const toggleViewMode = () => {
    setState((prev) => ({
      ...prev,
      viewMode: prev.viewMode === "preview" ? "code" : "preview",
    }));
  };

  // Handle copying HTML code
  const copyHtmlCode = () => {
    if (state.currentHTML) {
      navigator.clipboard.writeText(state.currentHTML);
      setCodeCopied(true);
      toast({
        title: "تم النسخ",
        description: "تم نسخ كود HTML إلى الحافظة.",
      });

      // Reset the copied state after a short delay
      setTimeout(() => {
        setCodeCopied(false);
      }, 2000);
    }
  };

  // Legacy handleShareProject function now just calls saveAndShareProject
  const handleShareProject = async () => {
    await saveAndShareProject();
  };

  // Close share dialog
  const closeShareDialog = () => {
    setState((prev) => ({
      ...prev,
      showShareDialog: false,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({
      ...prevState,
      prompt: e.target.value,
    }));
  };

  const handleGenerateHTML = async () => {
    // Different behavior based on the current flow step
    if (!state.prompt.trim() || state.isLoading) return;

    // Validate input
    const validation = validateInput(state.prompt);
    if (!validation.isValid) {
      const validationWarning: HTMLMessage = {
        role: "assistant",
        content: validation.errorMessage || "الرجاء إدخال وصف واضح لما تريد.",
      };

      setState((prevState) => ({
        ...prevState,
        messages: [...prevState.messages, validationWarning],
        error: validation.errorMessage || "",
      }));
      return;
    }

    // Add the user's message to chat
    const userMessage: HTMLMessage = {
      role: "user",
      content: state.prompt,
    };

    setState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, userMessage],
      prompt: "",
      isLoading: true,
      error: "",
    }));

    // Log prompt to analytics
    logPromptToFirestore("html_generator_v2", state.prompt).catch((error) => {
      console.error("Error logging prompt:", error);
    });

    if (state.flowStep === "input" || state.flowStep === "modify") {
      // We're in the initial step or modifying the project, so start with clarification
      try {
        // Get a clarifying question
        const clarificationResult = await getClarifyingQuestion(state.prompt);

        if (clarificationResult.error) {
          const errorMessage: HTMLMessage = {
            role: "assistant",
            content:
              "حدث خطأ أثناء محاولة التواصل مع الذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.",
          };

          setState((prevState) => ({
            ...prevState,
            messages: [...prevState.messages, errorMessage],
            isLoading: false,
            error: clarificationResult.error || "",
          }));
          return;
        }

        // Add the clarifying question to the chat
        const assistantMessage: HTMLMessage = {
          role: "assistant",
          content: clarificationResult.question,
        };

        // Update state with the original idea and clarifying question
        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, assistantMessage],
          originalIdea: state.prompt,
          isLoading: false,
          flowStep: "clarify",
        }));
      } catch (error) {
        const errorMessage: HTMLMessage = {
          role: "assistant",
          content:
            "حدث خطأ أثناء محاولة التواصل مع الذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.",
        };

        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, errorMessage],
          isLoading: false,
          error: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        }));
      }
    } else if (state.flowStep === "clarify") {
      // User has answered the clarifying question, now generate a summary
      try {
        // Store their clarification answer
        setState((prevState) => ({
          ...prevState,
          clarificationAnswer: state.prompt,
        }));

        // Get project summary
        const summaryResult = await getFullProjectSummary(
          state.originalIdea,
          state.prompt
        );

        if (summaryResult.error) {
          const errorMessage: HTMLMessage = {
            role: "assistant",
            content:
              "حدث خطأ أثناء محاولة التواصل مع الذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.",
          };

          setState((prevState) => ({
            ...prevState,
            messages: [...prevState.messages, errorMessage],
            isLoading: false,
            error: summaryResult.error || "",
          }));
          return;
        }

        // Add the summary with confirmation buttons
        const assistantMessage: HTMLMessage = {
          role: "assistant",
          content: summaryResult.summary,
        };

        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, assistantMessage],
          projectSummary: summaryResult.summary,
          isLoading: false,
          flowStep: "confirm",
          showConfirmButtons: true,
        }));
      } catch (error) {
        const errorMessage: HTMLMessage = {
          role: "assistant",
          content:
            "حدث خطأ أثناء محاولة التواصل مع الذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.",
          };

        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, errorMessage],
          isLoading: false,
          error: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateHTML();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle confirmation of project summary
  const handleConfirmation = async (isConfirmed: boolean) => {
    // Add user's response message
    const userMessage: HTMLMessage = {
      role: "user",
      content: isConfirmed ? "نعم، هذا ما أريده!" : "لا، أريد تغيير بعض التفاصيل.",
    };

    // Reset the confirm buttons state
    setState((prevState) => ({
      ...prevState,
      showConfirmButtons: false,
      isLoading: true,
      messages: [...prevState.messages, userMessage],
    }));

    if (isConfirmed) {
      // User confirmed the summary, generate the HTML
      try {
        // Compile a full project summary
        const fullSummaryResult = await getFullProjectSummary(
          state.originalIdea,
          state.clarificationAnswer
        );

        // Generate the HTML based on the full project specification
        // Create a message history for the generateHTML function
        const messages: HTMLMessage[] = [
          { role: "user", content: state.originalIdea },
          {
            role: "assistant",
            content: "سؤال للتوضيح: " + state.clarificationAnswer,
          },
          { role: "user", content: state.clarificationAnswer },
          {
            role: "assistant",
            content: "تلخيص المشروع: " + fullSummaryResult.summary,
          },
          { role: "user", content: "نعم هذا ما أريده" },
        ];

        const htmlResult = await generateHTML(messages);

        if (htmlResult && htmlResult.html) {
          // Add a message to confirm generation
          const assistantMessage: HTMLMessage = {
            role: "assistant",
            content:
              htmlResult.message?.content ||
              "تم إنشاء كود HTML بناءً على طلبك. هل أنت راضٍ عن النتيجة؟",
          };

          setState((prevState) => ({
            ...prevState,
            messages: [...prevState.messages, assistantMessage],
            currentHTML: htmlResult.html,
            isLoading: false,
            flowStep: "satisfied", // Move to satisfied stage
            showSatisfactionButtons: true, // Show satisfaction buttons
          }));

          // Award XP if not already awarded
          if (!state.hasEarnedXp) {
            setState((prevState) => ({
              ...prevState,
              hasEarnedXp: true,
            }));

            onEarnXp(50, "HTML generator");
            
            // Show confetti
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
        } else {
          // Handle error with HTML generation
          const errorMessage: HTMLMessage = {
            role: "assistant",
            content:
              "عذرًا، حدث خطأ أثناء إنشاء HTML. هل يمكنك المحاولة مرة أخرى بوصف مختلف؟",
          };

          setState((prevState) => ({
            ...prevState,
            messages: [...prevState.messages, errorMessage],
            isLoading: false,
            error: htmlResult.error || "",
          }));
        }
      } catch (error) {
        // Handle any errors during generation
        const errorMessage: HTMLMessage = {
          role: "assistant",
          content:
            "عذرًا، حدث خطأ أثناء إنشاء HTML. هل يمكنك المحاولة مرة أخرى بوصف مختلف؟",
        };

        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, errorMessage],
          isLoading: false,
          error: error instanceof Error ? error.message : "فشل في إنشاء HTML",
        }));
      }
    } else {
      // User wants to change details, go back to clarify step
      const assistantMessage: HTMLMessage = {
        role: "assistant",
        content: "لا مشكلة، قم بتوضيح التغييرات التي تريد إجراءها.",
      };

      setState((prevState) => ({
        ...prevState,
        messages: [...prevState.messages, assistantMessage],
        isLoading: false,
        flowStep: "confirm", // Stay in confirm step for refinement
      }));
    }
  };

  const handleStudentInfoSubmit = (name: string, id: string) => {
    setStudentInfo({ name, id });
    localStorage.setItem("studentName", name);
    localStorage.setItem("studentId", id);
    setShowStudentInfoModal(false);
  };

  // Render the HTML Generator interface with side-by-side layout
  return (
    <div className="flex flex-col h-screen bg-[#F9F5EB]">
      {/* Student Information Modal */}
      <StudentInfoModal
        isOpen={showStudentInfoModal}
        onClose={() => setShowStudentInfoModal(false)}
        onSubmit={handleStudentInfoSubmit}
      />

      {/* Title bar */}
      <div className="px-6 py-2 bg-white border-b flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-primary"
          >
            <ArrowRight className="ml-1 h-4 w-4 rtl:rotate-180" />
            عودة
          </Button>
          <h1 className="text-lg font-bold ml-4 text-primary">
            منشئ HTML بالذكاء الاصطناعي
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/missions/html-generator-v2/submissions"
            className="text-sm text-primary hover:underline focus:outline-none"
          >
            عرض المشاريع المحفوظة
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetHTML}
            className="text-destructive"
          >
            <X className="ml-1 h-4 w-4" />
            مسح وإعادة تشغيل
          </Button>
        </div>
      </div>

      {/* Main content - Side by side layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview/Code area - 70% */}
        <div className="w-[70%] flex flex-col border-l relative overflow-hidden">
          <div className="flex justify-between items-center p-2 border-b bg-white">
            <div className="flex">
              <Button
                variant={state.viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setState((prev) => ({ ...prev, viewMode: "preview" }))
                }
                className="rounded-l-md rounded-r-none text-xs h-8"
              >
                معاينة
              </Button>
              <Button
                variant={state.viewMode === "code" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setState((prev) => ({ ...prev, viewMode: "code" }))
                }
                className="rounded-r-md rounded-l-none text-xs h-8"
              >
                الكود
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {state.viewMode === "code" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHtmlCode}
                  className="text-xs h-8"
                >
                  {codeCopied ? (
                    <Check className="ml-1 h-4 w-4" />
                  ) : (
                    <Copy className="ml-1 h-4 w-4" />
                  )}
                  {codeCopied ? "تم النسخ" : "نسخ الكود"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareProject}
                disabled={!state.currentHTML || state.isSaving}
                className="text-xs h-8"
              >
                {state.isSaving ? (
                  <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                ) : (
                  <Share className="ml-1 h-4 w-4" />
                )}
                {state.isSaving ? "جاري الحفظ..." : "حفظ ومشاركة"}
              </Button>
            </div>
          </div>

          {/* Preview or Code content */}
          <div className="flex-1 overflow-auto">
            {state.viewMode === "preview" ? (
              // Preview the HTML
              <div className="h-full bg-white">
                {state.currentHTML ? (
                  <iframe
                    srcDoc={state.currentHTML}
                    title="HTML Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center p-8">
                      <Eye className="mx-auto h-12 w-12 mb-4 opacity-20" />
                      <p className="mb-2 text-lg">لا يوجد محتوى للعرض</p>
                      <p className="text-sm opacity-75">
                        أخبرني عن فكرة موقعك وسأقوم بإنشاءه لك!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Display the HTML code
              <div className="p-4 bg-gray-900 text-gray-300 h-full overflow-auto font-mono text-sm whitespace-pre rtl:text-left">
                {state.currentHTML || "// سيظهر كود HTML هنا بعد الإنشاء"}
              </div>
            )}
          </div>
        </div>

        {/* Chat area - 30% */}
        <div className="w-[30%] flex flex-col bg-white">
          <div className="border-b p-2 text-center">
            <h3 className="font-semibold">المحادثة مع الذكاء الاصطناعي</h3>
          </div>

          {/* Messages area */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              {state.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } ${message.className || ""}`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-[90%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center mb-1">
                        <img
                          src={penguinAvatar}
                          alt="Dr. Pengy"
                          className="w-6 h-6 rounded-full ml-2"
                        />
                        <span className="text-xs font-medium">د. بنجي</span>
                      </div>
                    )}
                    <div
                      className={`whitespace-pre-wrap text-sm ${
                        message.role === "assistant" ? "text-card-foreground" : ""
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Confirmation buttons */}
              {state.showConfirmButtons && (
                <div className="flex justify-center gap-2 my-2">
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleConfirmation(false)}
                  >
                    لا، أريد تغيير التفاصيل
                  </Button>
                  <Button
                    onClick={() => handleConfirmation(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    نعم، هذا ما أريده
                  </Button>
                </div>
              )}

              {/* Satisfaction buttons */}
              {state.showSatisfactionButtons && (
                <div className="flex justify-center gap-2 my-2">
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center"
                    onClick={() => handleSatisfaction(false)}
                  >
                    <ThumbsDown className="w-4 h-4 ml-2" />
                    أريد تعديل المشروع
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                    onClick={() => handleSatisfaction(true)}
                  >
                    <ThumbsUp className="w-4 h-4 ml-2" />
                    أعجبني المشروع
                  </Button>
                </div>
              )}

              {/* Error message */}
              {state.error && (
                <Alert variant="destructive" className="my-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>خطأ</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              {/* Loading indicator */}
              {state.isLoading && (
                <div className="flex justify-center">
                  <div className="bg-muted rounded-lg p-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    <span className="text-sm">جاري التفكير...</span>
                  </div>
                </div>
              )}

              {/* Bottom ref for auto-scrolling */}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="border-t p-3 flex gap-2 items-center"
          >
            <Input
              value={state.prompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={
                state.flowStep === "input"
                  ? "اكتب وصف للموقع الذي تريد إنشاءه..."
                  : state.flowStep === "clarify"
                  ? "أجب على السؤال التوضيحي..."
                  : state.flowStep === "confirm"
                  ? "هل تريد تعديل أي شيء؟ اكتب هنا..."
                  : state.flowStep === "modify"
                  ? "اكتب تعديلاتك هنا..."
                  : "اكتب رسالتك هنا..."
              }
              disabled={state.isLoading || state.showConfirmButtons || state.showSatisfactionButtons}
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={
                !state.prompt.trim() ||
                state.isLoading ||
                state.showConfirmButtons ||
                state.showSatisfactionButtons
              }
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Reset confirmation dialog */}
      <Dialog
        open={state.showResetDialog}
        onOpenChange={(open) => {
          if (!open) cancelResetHTML();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد إعادة البدء</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف المحتوى الحالي وبدء مشروع جديد؟ لن
              تتمكن من استعادة البيانات بعد هذه العملية.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelResetHTML}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmResetHTML}
              className="mr-2"
            >
              نعم، أريد البدء من جديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={state.showShareDialog}
        onOpenChange={(open) => {
          if (!open) closeShareDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مشاركة المشروع</DialogTitle>
            <DialogDescription>
              تم حفظ مشروعك بنجاح! يمكنك مشاركة هذا الرابط مع الآخرين لعرض
              مشروعك.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center">
            <Input
              value={state.shareUrl || ""}
              readOnly
              className="copy-link-input"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              className="mr-2"
              onClick={async () => {
                if (state.shareUrl) {
                  await navigator.clipboard.writeText(state.shareUrl);
                  setState((prev) => ({ ...prev, hasSharedLink: true }));
                  toast({
                    title: "تم النسخ",
                    description: "تم نسخ الرابط إلى الحافظة.",
                  });
                }
              }}
            >
              نسخ
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={closeShareDialog}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confetti effect when earning XP */}
      {showConfetti && <Confetti />}
    </div>
  );
}