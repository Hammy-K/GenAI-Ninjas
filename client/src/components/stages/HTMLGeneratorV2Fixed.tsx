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
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
  UIEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { v4 as uuidv4 } from "uuid";

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

export function HTMLGeneratorV2({
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

  // Clear stale state if needed
  useEffect(() => {
    // This will clear any stale state on component mount to prevent stuck states
    try {
      const storageKey = "genAIQuest_html_generator_v2_state";
      const savedState = localStorage.getItem(storageKey);

      if (savedState) {
        const parsedState = JSON.parse(savedState);

        // Force reset isSaving to false and any error messages on component mount
        console.log(
          "Ensuring clean state on mount - previous isSaving:",
          parsedState.isSaving,
        );

        const cleanState = {
          ...parsedState,
          isSaving: false,
          error: "",
          isChatOpen: true, // Chat is always visible in new layout
        };

        localStorage.setItem(storageKey, JSON.stringify(cleanState));
      }
    } catch (e) {
      console.error("Error checking saved state:", e);
      // Just in case there's an error, clear the entire localStorage entry
      localStorage.removeItem("genAIQuest_html_generator_v2_state");
    }
  }, []);

  // Initialize state with localStorage values or defaults
  const [state, setState] = useStageState<HTMLGeneratorState>(
    "html_generator_v2",
    initialState,
  );

  // Initialize toast hook for notifications
  const { toast } = useToast();

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    // Use both approaches for maximum compatibility
    // 1. Use scrollIntoView for standard behavior
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // 2. Set scrollTop to ensure it works in all browsers
    const chatArea = document.querySelector(".chat-area");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }, [state.messages, state.isLoading]);

  // Handler for copying the HTML code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.currentHTML);
    toast({
      title: "تم نسخ الكود",
      description: "تم نسخ كود HTML إلى الحافظة بنجاح.",
    });

    // Track progress for analytics
    trackStageProgress("html_generator", "copy_code", {
      project_length: state.currentHTML.length,
    });
  };

  // Handle shared link copied from dialog
  const handleCopyShareLink = () => {
    if (state.shareUrl) {
      navigator.clipboard.writeText(state.shareUrl);
      toast({
        title: "تم نسخ الرابط",
        description: "يمكنك الآن مشاركة رابط المشروع مع الآخرين.",
      });

      // Mark the link as copied in the state
      setState((prev) => ({
        ...prev,
        hasSharedLink: true,
      }));

      // Track sharing for analytics
      trackStageProgress("html_generator", "share_link_copied");
    }
  };

  // Handler for toggling the view between preview and code
  const toggleView = () => {
    setState((prevState) => ({
      ...prevState,
      viewMode: prevState.viewMode === "preview" ? "code" : "preview",
    }));

    // Track view toggle for analytics
    trackStageProgress(
      "html_generator",
      `switch_to_${state.viewMode === "preview" ? "code" : "preview"}_view`,
      {}
    );
  };

  // Auto-save the project if it has changed
  useEffect(() => {
    // Only auto-save if there is actual content and a projectId
    if (state.currentHTML.trim() && state.projectId && !state.isSaving) {
      const saveTimer = setTimeout(() => {
        const firebaseUid = localStorage.getItem("firebaseUid");
        if (firebaseUid && state.projectId) {
          setState((prev) => ({ ...prev, isSaving: true }));
          saveProject(state.projectId, state.currentHTML)
            .then(() => {
              setState((prev) => ({ ...prev, isSaving: false }));
            })
            .catch((err) => {
              console.error("Error auto-saving project:", err);
              setState((prev) => ({
                ...prev,
                isSaving: false,
                error: "فشل في حفظ المشروع تلقائيًا. الرجاء المحاولة مرة أخرى.",
              }));
            });
        }
      }, 3000); // Auto-save after 3 seconds of inactivity

      return () => clearTimeout(saveTimer);
    }
  }, [state.currentHTML, state.projectId]);

  // Generate project ID on initial HTML generation if needed
  useEffect(() => {
    if (state.currentHTML && !state.projectId) {
      setState((prev) => ({
        ...prev,
        projectId: uuidv4(),
      }));
    }
  }, [state.currentHTML, state.projectId]);

  const handleGenerateHTML = async () => {
    // Skip if already loading or no input
    if (state.isLoading) return;

    const userInput = state.prompt.trim();
    
    // If we're in the clarification flow, the prompt handling
    // is different than the initial input
    if (
      state.flowStep === "clarify" ||
      state.flowStep === "confirm" ||
      state.flowStep === "satisfied"
    ) {
      // Just add the message to the chat, don't generate HTML yet
      const userMessage: HTMLMessage = {
        role: "user",
        content: userInput,
      };

      setState((prevState) => ({
        ...prevState,
        prompt: "",
        messages: [...prevState.messages, userMessage],
        isLoading: true,
      }));

      if (state.flowStep === "clarify") {
        // This is the answer to the clarification question
        setState((prevState) => ({
          ...prevState,
          clarificationAnswer: userInput,
          isLoading: true,
        }));

        try {
          // Get the project summary based on original idea and clarification
          const summaryResult = await getProjectSummary(
            state.originalIdea,
            userInput
          );

          const assistantMessage: HTMLMessage = {
            role: "assistant",
            content: `شكراً على التوضيح. هذا ما سأقوم ببنائه:\n\n${summaryResult.summary}\n\nهل هذا ما تريده؟`,
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
          console.error("Error getting project summary:", error);
          const errorMessage: HTMLMessage = {
            role: "assistant",
            content: "عذراً، حدث خطأ أثناء تلخيص المشروع. يرجى المحاولة مرة أخرى.",
          };

          setState((prevState) => ({
            ...prevState,
            messages: [...prevState.messages, errorMessage],
            isLoading: false,
            error: "فشل في الحصول على ملخص المشروع",
          }));
        }
      } else if (state.flowStep === "satisfied") {
        // User has provided feedback
        const isSatisfied = state.isSatisfied;

        // Add a system message about satisfaction
        const satisfactionMessage: HTMLMessage = {
          role: "assistant",
          content: isSatisfied
            ? "رائع! سعيد بأن النتيجة أعجبتك. يمكنك الاستمرار في تعديل المشروع أو مشاركته مع الآخرين."
            : "أفهم، دعنا نحسن المشروع. أخبرني بالتحديد ما الذي ترغب بتغييره وسأقوم بتعديل الكود.",
        };

        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, satisfactionMessage],
          isLoading: false,
          flowStep: isSatisfied ? "satisfied" : "modify",
          showConfirmButtons: false,
          showSatisfactionButtons: false,
        }));

        // If not satisfied, set up for a new generation
        if (!isSatisfied) {
          // We'll wait for the next user message with specific feedback
        }

        // Track satisfaction for analytics
        trackStageProgress("html_generator", isSatisfied ? "satisfied" : "not_satisfied", {
          project_length: state.currentHTML.length,
        });
      } else if (state.flowStep === "confirm") {
        // This is a normal message after the initial generation
        try {
          // Now we'll update the HTML based on the feedback
          setState((prevState) => ({
            ...prevState,
            isLoading: true,
          }));

          // Generate HTML based on all the context we've gathered
          const htmlResult = await generateHTML(state.messages);

          // Check if we received a valid response
          if (htmlResult && htmlResult.html) {
            // Create the assistant message with confirmation
            const assistantMessage: HTMLMessage = {
              role: "assistant",
              content: htmlResult.message?.content || "تم إنشاء كود HTML بناءً على طلبك. هل أنت راضٍ عن النتيجة؟",
            };

            setState((prevState) => ({
              ...prevState,
              messages: [...prevState.messages, assistantMessage],
              currentHTML: htmlResult.html,
              isLoading: false,
              showSatisfactionButtons: true,
              flowStep: "modify", // Move to modification/feedback stage
            }));

            // Award XP if not already awarded
            if (!state.hasEarnedXp) {
              setState((prevState) => ({
                ...prevState,
                hasEarnedXp: true,
              }));

              onEarnXp(50, "HTML generator");

              if (!state.hasUnlockedBadge) {
                setState((prevState) => ({
                  ...prevState,
                  hasUnlockedBadge: true,
                }));
                onUnlockBadge("html_pro", "HTML generator");
                
                // Show confetti for badge
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
              }
            }
          } else {
            throw new Error("No HTML in response");
          }
        } catch (error) {
          console.error("Error generating HTML:", error);
          const errorMessage: HTMLMessage = {
            role: "assistant",
            content: "عذراً، واجهت مشكلة في إنشاء الكود. يرجى المحاولة مرة أخرى بوصف أكثر تفصيلاً.",
          };

          setState((prevState) => ({
            ...prevState,
            messages: [...prevState.messages, errorMessage],
            isLoading: false,
            error: "فشل في إنشاء كود HTML",
          }));
        }
      }
      return;
    }

    // Validate input to prevent harmful content
    const validationResult = validateInput(userInput);
    if (!validationResult.isValid) {
      setState((prevState) => ({
        ...prevState,
        error: validationResult.errorMessage,
      }));
      toast({
        variant: "destructive",
        title: "محتوى غير مناسب",
        description: validationResult.errorMessage,
      });
      return;
    }

    // Add user message to the chat
    const userMessage: HTMLMessage = {
      role: "user",
      content: userInput,
    };

    // Start loading state and add the message
    setState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, userMessage],
      isLoading: true,
      prompt: "", // Clear the input field
      originalIdea: userInput, // Store the original idea for the clarify & confirm flow
      flowStep: "clarify", // Move to clarification step
    }));

    try {
      // Get a clarifying question based on the user's idea
      const clarificationResult = await getClarifyingQuestion(userInput);
      
      if (clarificationResult && clarificationResult.question) {
        const assistantMessage: HTMLMessage = {
          role: "assistant",
          content: clarificationResult.question,
        };

        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, assistantMessage],
          isLoading: false,
        }));

        // Log prompt to Firestore for analytics
        const firebaseUid = localStorage.getItem("firebaseUid");
        if (firebaseUid) {
          logPromptToFirestore(userInput, "html_generator")
            .catch(console.error);
        }
      } else {
        throw new Error("No clarifying question received");
      }
    } catch (error) {
      console.error("Error getting clarifying question:", error);
      // Handle the error with a message to the user
      const errorMessage: HTMLMessage = {
        role: "assistant",
        content:
          "عذراً، واجهت مشكلة في فهم طلبك. هل يمكنك وصف ما تريد بناءه بطريقة أخرى؟",
      };

      setState((prevState) => ({
        ...prevState,
        messages: [...prevState.messages, errorMessage],
        isLoading: false,
        error: "فشل في الحصول على سؤال توضيحي",
        flowStep: "input", // Reset to input step
      }));
    }
  };

  // Handle confirmation or rejection of the project summary
  const handleConfirmSummary = async (isConfirmed: boolean) => {
    // Reset the confirm buttons state
    setState((prevState) => ({
      ...prevState,
      showConfirmButtons: false,
      isLoading: true,
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
          { role: "assistant", content: "سؤال للتوضيح: " + state.clarificationAnswer },
          { role: "user", content: state.clarificationAnswer },
          { role: "assistant", content: "تلخيص المشروع: " + fullSummaryResult.summary },
          { role: "user", content: "نعم هذا ما أريده" },
        ];

        const htmlResult = await generateHTML(messages);

        if (htmlResult && htmlResult.html) {
          // Add a message to confirm generation
          const assistantMessage: HTMLMessage = {
            role: "assistant",
            content: htmlResult.message?.content || "تم إنشاء كود HTML بناءً على طلبك. هل أنت راضٍ عن النتيجة؟",
          };

          setState((prevState) => ({
            ...prevState,
            messages: [...prevState.messages, assistantMessage],
            currentHTML: htmlResult.html,
            isLoading: false,
            flowStep: "modify", // Move to modification stage
            showSatisfactionButtons: true, // Show satisfaction buttons
          }));

          // Award XP if not already awarded
          if (!state.hasEarnedXp) {
            setState((prevState) => ({
              ...prevState,
              hasEarnedXp: true,
            }));

            onEarnXp(50, "HTML generator");

            if (!state.hasUnlockedBadge) {
              setState((prevState) => ({
                ...prevState,
                hasUnlockedBadge: true,
              }));
              onUnlockBadge("html_pro", "HTML generator");
              
              // Show confetti for badge
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3000);
            }
          }
        } else {
          throw new Error("No HTML in response");
        }
      } catch (error) {
        console.error("Error generating HTML:", error);
        const errorMessage: HTMLMessage = {
          role: "assistant",
          content: "عذراً، واجهت مشكلة في إنشاء الكود. يرجى المحاولة مرة أخرى.",
        };

        setState((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, errorMessage],
          isLoading: false,
          error: "فشل في إنشاء كود HTML",
          flowStep: "input", // Reset to input step
        }));
      }
    } else {
      // User rejected the summary, ask for refinement
      const assistantMessage: HTMLMessage = {
        role: "assistant",
        content:
          "بالتأكيد. أخبرني ما الذي ترغب في تعديله أو إضافته للوصف، وسأقوم بتحديث فهمي للمشروع.",
      };

      setState((prevState) => ({
        ...prevState,
        messages: [...prevState.messages, assistantMessage],
        isLoading: false,
        flowStep: "confirm", // Stay in confirm step for refinement
      }));
    }
  };

  // Handle satisfaction with the generated HTML
  const handleSatisfaction = (satisfied: boolean) => {
    setState((prevState) => ({
      ...prevState,
      isSatisfied: satisfied,
      showSatisfactionButtons: false,
      flowStep: "satisfied",
    }));

    // The rest will be handled in the next user message
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

  // Handle sharing project
  const handleShareProject = async () => {
    // If we already have a project ID and HTML, create the share URL
    if (state.projectId && state.currentHTML) {
      // First save/update the project to ensure it's persisted
      try {
        const firebaseUid = localStorage.getItem("firebaseUid") || "anonymous";
        await saveProject(state.projectId, state.currentHTML);
        
        // Generate and set the share URL
        const shareUrl = `${window.location.origin}/project/${state.projectId}`;
        setState((prev) => ({
          ...prev,
          shareUrl,
          showShareDialog: true,
        }));

        // Track share action for analytics
        trackStageProgress("html_generator", "share_project", {
          project_id: state.projectId,
        });
      } catch (error) {
        console.error("Error saving project for sharing:", error);
        toast({
          variant: "destructive",
          title: "فشل المشاركة",
          description: "حدث خطأ أثناء حفظ المشروع للمشاركة. يرجى المحاولة مرة أخرى.",
        });
      }
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Different behavior based on the current flow step
    handleGenerateHTML();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatHTML = () => {
    let formatted = state.currentHTML;
    // Add simple HTML formatting logic here if needed
    return formatted;
  };

  const handleTryAgain = () => {
    setState((prevState) => ({
      ...prevState,
      error: "",
    }));
  };

  // Render the HTML preview
  const renderHTMLPreview = () => {
    // Sometimes we need to render an empty iframe to avoid stale content
    if (!state.currentHTML) {
      return (
        <div className="flex items-center justify-center h-full bg-neutral-50 rounded-md">
          <p className="text-muted-foreground text-center">
            قم بكتابة وصف للمشروع وسوف يظهر هنا عرض HTML الخاص بك
          </p>
        </div>
      );
    }

    return (
      <iframe
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full bg-white rounded-md"
        srcDoc={state.currentHTML}
      />
    );
  };

  // Show the HTML code view
  const renderHTMLCode = () => {
    if (!state.currentHTML) {
      return (
        <div className="flex items-center justify-center h-full bg-neutral-50 rounded-md p-4">
          <p className="text-muted-foreground text-center">
            قم بكتابة وصف للمشروع وسوف يظهر هنا كود HTML الخاص بك
          </p>
        </div>
      );
    }

    // Simple code viewer with syntax highlighting would go here
    return (
      <ScrollArea className="h-full bg-neutral-900 text-white p-4 rounded-md font-mono text-sm">
        <pre>{formatHTML()}</pre>
      </ScrollArea>
    );
  };

  // Check if any messages are loading
  const hasLoadingMessage = state.messages.some((msg) =>
    msg.className?.includes("loading"),
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-2rem)] p-2 gap-4">
      {/* Preview Section - 70% width on desktop, full on mobile */}
      <div className="w-full md:w-[70%] h-full flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader className="justify-between flex-row items-center py-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">
                {state.viewMode === "preview" ? "معاينة الموقع" : "عرض الكود"}
              </CardTitle>

              {state.isSaving && (
                <div className="flex items-center text-xs">
                  <Loader2 className="w-3 h-3 animate-spin ml-1" />
                  <span className="text-muted-foreground">جاري الحفظ...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {state.currentHTML && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={handleCopyCode}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    <span className="hidden sm:inline">نسخ الكود</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={handleShareProject}
                  >
                    <Share className="h-4 w-4 ml-2" />
                    <span className="hidden sm:inline">مشاركة</span>
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={toggleView}
              >
                {state.viewMode === "preview" ? (
                  <>
                    <Code className="h-4 w-4 ml-2" />
                    <span className="hidden sm:inline">عرض الكود</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 ml-2" />
                    <span className="hidden sm:inline">المعاينة</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={handleResetHTML}
              >
                <Plus className="h-4 w-4 ml-2 rotate-45" />
                <span className="hidden sm:inline">اعادة</span>
              </Button>
            </div>
          </CardHeader>

          {/* Show any error messages */}
          {state.error && (
            <div className="px-6 pb-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>
                  {state.error}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleTryAgain}
                  >
                    المحاولة مرة أخرى
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <CardContent className="flex-1 p-0 overflow-hidden">
            {/* Placeholder when no HTML has been generated */}
            {!state.currentHTML && state.viewMode === "preview" && (
              <div className="flex flex-col items-center justify-center h-full p-4 bg-neutral-50">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">
                    مرحباً في محرر HTML التوليدي
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    استخدم الدردشة على اليمين لوصف موقع الويب أو التطبيق الذي
                    تريد إنشاؤه، وسأقوم بتوليد كود HTML مباشرةً هنا.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
                  {/* Sample ideas */}
                  {[
                    "لعبة تخمين كلمات",
                    "آلة حاسبة بسيطة",
                    "صفحة شخصية",
                    "متجر إلكتروني بسيط",
                    "تطبيق طقس",
                    "لوحة رسم",
                  ].map((idea) => (
                    <Button
                      key={idea}
                      variant="outline"
                      className="h-auto py-3 text-center"
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          prompt: idea,
                        }));
                      }}
                    >
                      {idea}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview vs. Code View */}
            {state.viewMode === "preview"
              ? renderHTMLPreview()
              : renderHTMLCode()}
          </CardContent>
        </Card>
      </div>

      {/* Chat Section - 30% width on desktop */}
      <div className="w-full md:w-[30%] h-full flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader className="py-3">
            <CardTitle className="text-xl">الدردشة مع الدكتور بنجي</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
            {/* Messages area with scroll */}
            <ScrollArea className="flex-1 p-4 chat-area">
              <div className="space-y-4">
                {/* Render messages */}
                {state.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } ${message.className || ""}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[85%] ${
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
                          <span className="text-xs font-medium">
                            د. بنجي - مساعد HTML
                          </span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator if needed */}
                {state.isLoading && !hasLoadingMessage && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      <span>د. بنجي يكتب...</span>
                    </div>
                  </div>
                )}

                {/* Show confirm buttons if we're in the confirm step */}
                {state.showConfirmButtons && (
                  <div className="flex justify-center space-x-2 my-2">
                    <Button
                      variant="outline"
                      className="ml-2"
                      onClick={() => handleConfirmSummary(false)}
                    >
                      <ArrowRight className="h-4 w-4 ml-1" />
                      لا، أحتاج تعديل
                    </Button>
                    <Button 
                      onClick={() => handleConfirmSummary(true)}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      نعم، ابدأ الكود
                    </Button>
                  </div>
                )}

                {/* Show satisfaction buttons if needed */}
                {state.showSatisfactionButtons && (
                  <div className="flex justify-center space-x-2 my-2">
                    <Button
                      variant="outline"
                      className="ml-2"
                      onClick={() => handleSatisfaction(false)}
                    >
                      <ThumbsDown className="h-4 w-4 ml-1" />
                      أحتاج تعديل
                    </Button>
                    <Button 
                      onClick={() => handleSatisfaction(true)}
                    >
                      <ThumbsUp className="h-4 w-4 ml-1" />
                      رائع!
                    </Button>
                  </div>
                )}

                {/* Element for scrolling to bottom */}
                <div ref={chatEndRef}></div>
              </div>
            </ScrollArea>

            {/* Input form */}
            <Separator />
            <form
              onSubmit={handleSubmit}
              className="p-4 flex items-center space-x-2"
            >
              <Input
                value={state.prompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={
                  state.flowStep === "input"
                    ? "اكتب وصف لموقع الويب أو التطبيق الذي تريد..."
                    : state.flowStep === "clarify"
                    ? "أجب على السؤال التوضيحي..."
                    : state.flowStep === "confirm"
                    ? "أكتب أي تعديلات على الوصف..."
                    : "اكتب تعليقك أو طلب التعديل..."
                }
                className="flex-1 ml-2"
                disabled={state.isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={state.isLoading || !state.prompt.trim()}
                className={`h-10 w-10 rounded-full ${
                  state.isLoading ? "opacity-50" : ""
                }`}
              >
                {state.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={state.showResetDialog}
        onOpenChange={(open) => {
          if (!open) cancelResetHTML();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>هل أنت متأكد من إعادة ضبط المشروع؟</DialogTitle>
            <DialogDescription>
              سيؤدي هذا إلى حذف كافة الرسائل والكود الذي تم إنشاؤه حتى الآن.
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={cancelResetHTML}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmResetHTML}
            >
              نعم، إعادة ضبط
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>مشاركة المشروع</DialogTitle>
            <DialogDescription>
              يمكنك مشاركة هذا الرابط مع الآخرين لعرض المشروع الخاص بك.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input
              value={state.shareUrl || ""}
              readOnly
              className="ml-2"
            />
            <Button
              type="button"
              size="sm"
              className="px-3"
              onClick={handleCopyShareLink}
            >
              <span className="sr-only">نسخ</span>
              {state.hasSharedLink ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={closeShareDialog}
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confetti effect for unlocking badges */}
      {showConfetti && <Confetti />}
    </div>
  );
}