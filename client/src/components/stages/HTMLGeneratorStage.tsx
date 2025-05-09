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
import { generateHTML, HTMLMessage, getClarifyingQuestion, getProjectSummary, GenerateHTMLResponse } from "@/lib/openai";
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
  error: string | undefined;
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
  flowStep: "input" | "clarify" | "confirm" | "generate" | "modify";
  showConfirmButtons: boolean;
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

  // Helper function to handle clarification step
  const handleClarificationStep = async (idea: string) => {
    try {
      const clarificationResult = await getClarifyingQuestion(idea);
      
      if (clarificationResult.error) {
        setState(prev => ({
          ...prev,
          error: clarificationResult.error || "Failed to get clarifying question",
          isLoading: false
        }));
        return;
      }
      
      // Add the clarifying question to chat
      const clarifyingMessage: HTMLMessage = {
        role: "assistant",
        content: clarificationResult.question
      };
      
      setState(prev => ({
        ...prev,
        originalIdea: idea,
        messages: [...prev.messages, clarifyingMessage],
        flowStep: "clarify",
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to get clarifying question",
        isLoading: false
      }));
    }
  };
  
  // Helper function to handle confirmation step
  const handleConfirmationStep = async (idea: string, clarification: string) => {
    try {
      const summaryResult = await getProjectSummary(idea, clarification);
      
      if (summaryResult.error) {
        setState(prev => ({
          ...prev,
          error: summaryResult.error || "Failed to get project summary",
          isLoading: false
        }));
        return;
      }
      
      // Add the summary to chat
      const summaryMessage: HTMLMessage = {
        role: "assistant",
        content: `${summaryResult.summary}\n\nهل تبي نبدأ؟`
      };
      
      setState(prev => ({
        ...prev,
        projectSummary: summaryResult.summary,
        clarificationAnswer: clarification,
        messages: [...prev.messages, summaryMessage],
        flowStep: "confirm",
        showConfirmButtons: true,
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to get project summary",
        isLoading: false
      }));
    }
  };
  
  // Helper function to handle HTML generation
  const handleGenerateHtml = async (idea: string, clarification: string) => {
    // Create a combined prompt that includes both the original idea and clarification
    const enhancedPrompt = `${idea}\nAdditional details: ${clarification}`;
    
    try {
      // Display exactly what the enhanced input is in the UI
      const userMessage: HTMLMessage = {
        role: "user",
        content: enhancedPrompt,
      };
      
      // Add user message to message history
      const updatedMessages = [...state.messages, userMessage];
      
      // Generate HTML with the combined context
      const htmlResponse = await generateHTML(updatedMessages);
      
      if (htmlResponse.error) {
        setState((prev) => ({
          ...prev,
          error: htmlResponse.error || "Failed to generate HTML",
          isLoading: false,
        }));
        return;
      }

      // Track successful generation
      trackStageProgress("html_generator", "html_generated", {
        html_length: htmlResponse.html.length,
      });

      // Use the response message from the API
      const aiResponse: HTMLMessage = htmlResponse.message || {
        role: "assistant",
        content: "لقد بنيت فكرتك! جربها وأخبرني إذا كنت ترغب في إجراء أي تغييرات.",
      };

      // Update state with the AI response and HTML
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, aiResponse],
        currentHTML: htmlResponse.html,
        isLoading: false,
        flowStep: "modify" // Move to modify step
      }));
      
      // Award XP for first response
      if (state.messages.length <= 4) { // Adjust for our longer flow
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
        error: error instanceof Error ? error.message : "Failed to generate HTML",
        isLoading: false,
      }));
    }
  };
  
  // Helper function to handle changes to existing HTML
  const handleModifyHtml = async (prompt: string) => {
    // Check that we have HTML to modify
    if (!state.currentHTML) {
      console.log("No HTML to modify, treating this as a new project request");
      // Instead of showing an error, handle this as a new project
      await handleClarificationStep(prompt);
      return;
    }
    
    // Display what the user typed in the UI
    const userMessage: HTMLMessage = {
      role: "user",
      content: prompt,
    };
    
    // Add context about the HTML for the API (not shown to user)
    const apiContent = `The user said: "${prompt}" about the code: \n\`\`\`html\n${state.currentHTML}\n\`\`\``;
    
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      prompt: "",
      isLoading: true,
      error: "",
    }));
    
    try {
      // Create a modified version of the messages array with the HTML context
      const apiMessages = [...state.messages];
      apiMessages.push({
        role: "user",
        content: apiContent
      });
      
      // Generate HTML with the context
      const htmlResponse = await generateHTML(apiMessages);
      
      if (htmlResponse.error) {
        setState((prev) => ({
          ...prev,
          error: htmlResponse.error || "Failed to update HTML",
          isLoading: false,
        }));
        return;
      }

      // Track the modification
      trackStageProgress("html_generator", "html_modified", {
        html_length: htmlResponse.html.length,
      });

      // Use the response message
      const aiResponse: HTMLMessage = htmlResponse.message || {
        role: "assistant",
        content: "تم تحديث الكود! شوف النتيجة.",
      };

      // Update state with the AI response and new HTML
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, aiResponse],
        currentHTML: htmlResponse.html,
        isLoading: false,
      }));
      
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to update HTML",
        isLoading: false,
      }));
    }
  };

  // Handle user response to confirmation step
  const handleConfirmation = (confirmed: boolean) => {
    if (confirmed) {
      // User clicked "Yalla!" - proceed with HTML generation
      setState(prev => ({
        ...prev,
        isLoading: true,
        showConfirmButtons: false,
        flowStep: "generate"
      }));
      
      // Generate HTML with combined context
      handleGenerateHtml(state.originalIdea, state.clarificationAnswer);
    } else {
      // User clicked "No" - ask what they want to change
      const changeMessage: HTMLMessage = {
        role: "assistant",
        content: "اوكي، وش تبي نغير؟"
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, changeMessage],
        showConfirmButtons: false,
        flowStep: "input" // Back to input for changes
      }));
    }
  };
  
  // Handle prompt submission with clarify & confirm flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.isLoading) return;

    // Validate input
    const validation = validateInput(state.prompt);
    if (!validation.isValid) {
      const validationWarning: HTMLMessage = {
        role: "assistant",
        content: validation.errorMessage || "الرجاء إدخال وصف واضح لما تريد إنشاءه.",
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, validationWarning],
        error: validation.errorMessage,
      }));
      return;
    }
    
    // Add user message to chat
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
      if (state.messages.length === 2) {
        if (awardIfNotAlreadyAwarded(onEarnXp, 20, "html_generator_first_prompt")) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }

      // Track this step
      trackStageProgress("html_generator", "prompt_submitted", {
        message_count: state.messages.length + 1,
        flow_step: state.flowStep
      });

      // Log the prompt to Firestore
      await logPromptToFirestore("html_generation", state.prompt, {
        message_history_length: state.messages.length,
        flow_step: state.flowStep
      });
      
      // Handle different steps of the flow
      switch (state.flowStep) {
        case "input":
          // Initial input - go to clarification
          if (state.currentHTML === "") {
            // Only for new projects (not modifications)
            await handleClarificationStep(state.prompt);
          } else {
            // We already have HTML - this is a modification
            await handleModifyHtml(state.prompt);
          }
          break;
          
        case "clarify":
          // User answered clarification - go to confirmation
          await handleConfirmationStep(state.originalIdea, state.prompt);
          break;
          
        case "modify":
          // User is modifying existing HTML
          if (state.currentHTML) {
            await handleModifyHtml(state.prompt);
          } else {
            // If somehow we're in modify state but have no HTML, revert to input flow
            console.log("In modify state but no HTML found, reverting to new project flow");
            await handleClarificationStep(state.prompt);
          }
          break;
          
        default:
          // Fallback for any other state
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: "Unexpected flow state. Please try again."
          }));
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
    // Only proceed if the user has satisfied all requirements (saved project and copied link)
    if (state.projectId && state.hasSharedLink) {
      // Award AI-Coder badge if not already awarded
      if (!state.hasUnlockedBadge) {
        if (!isAlreadyAwarded("html_generator_badge", "ai_coder_badge")) {
          onUnlockBadge("ai_coder_badge", "html_generator_badge");
          markAsAwarded("html_generator_badge", "ai_coder_badge");
          setState((prev) => ({ ...prev, hasUnlockedBadge: true }));
        }
      }
      
      // Track completion of this stage with all requirements met
      trackStageProgress("html_generator", "completed", {
        requirements_met: true,
        has_project: Boolean(state.projectId),
        has_shared_link: state.hasSharedLink
      });
      
      onComplete();
    } else {
      // Show a toast notification explaining the requirements
      toast({
        title: "متطلبات إتمام المهمة",
        description: !state.projectId 
          ? "يجب عليك حفظ مشروعك أولاً قبل الانتقال للمرحلة التالية" 
          : "يجب نسخ رابط مشروعك قبل الانتقال للمرحلة التالية",
        variant: "default",
        className: "bg-amber-50 border-amber-200 text-amber-800"
      });
      
      // Track attempt to proceed without meeting requirements
      trackStageProgress("html_generator", "continue_attempted", {
        requirements_met: false,
        has_project: Boolean(state.projectId),
        has_shared_link: state.hasSharedLink
      });
    }
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

      // Create a shareable URL using the current hostname
      const shareUrl = `${window.location.origin}/project/${projectId}`;
      console.log("Share URL:", shareUrl);

      // Update state with project ID and share URL
      setState((prev) => ({
        ...prev,
        projectId,
        shareUrl,
        isSaving: false,
        showShareDialog: true,
      }));

      // Award badge for saving project if not already awarded
      if (
        !isAlreadyAwarded("project_saved", "ai_coder_badge") &&
        !state.hasUnlockedBadge
      ) {
        onEarnXp(50, "project_saved");
        
        // Track the project saving event
        trackStageProgress("html_generator", "project_saved", {
          project_id: projectId,
          has_html: Boolean(state.currentHTML),
        });
      }
    } catch (error) {
      console.error("Error saving project:", error);

      // Attempt to save to localStorage as backup on error
      try {
        const backupKey = `html_backup_${Date.now()}`;
        localStorage.setItem(backupKey, state.currentHTML);
        console.log("HTML content backed up to localStorage with key:", backupKey);
      } catch (backupError) {
        console.error("Failed to backup HTML to localStorage:", backupError);
      }

      // Reset saving state but don't clear any existing project info
      setState((prev) => {
        if (error instanceof Error) {
          return { 
            ...prev, 
            error: error.message, 
            isSaving: false 
          };
        }
        return { ...prev, isSaving: false };
      });
    }
  };

  // Copy the share URL to clipboard
  const copyShareUrl = () => {
    if (!state.shareUrl) return;

    navigator.clipboard
      .writeText(state.shareUrl)
      .then(() => {
        setState((prev) => ({
          ...prev,
          hasSharedLink: true,
        }));

        toast({
          title: "تم نسخ الرابط",
          description: "يمكنك الآن مشاركة المشروع مع الآخرين!",
          duration: 3000,
        });

        // Track this event
        trackStageProgress("html_generator", "link_copied", {
          project_id: state.projectId,
        });

        // Award badge if not already awarded
        if (
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
    // Reset state to initial state while preserving any existing session ID
    // This ensures thread continuity with the OpenAI Assistant API
    setState((prev) => ({
      ...prev,
      currentHTML: "",
      messages: [welcomeMessage, examplesMessage], // Retain the welcome message and examples
      projectId: null,
      shareUrl: null,
      hasSharedLink: false, // Reset the shared link flag
      showShareDialog: false,
      showResetDialog: false,
    }));
    
    // Track this for analytics
    trackStageProgress("html_generator", "new_project_started", {
      previous_messages_count: state.messages.length
    });
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
              className={`px-3 ${state.projectId && !state.hasSharedLink ? "animate-pulse bg-green-100 hover:bg-green-200 text-green-800" : ""}`}
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
            <DialogTitle>بدء مشروع جديد</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من أنك تريد البدء من جديد؟ سيؤدي هذا إلى حذف الكود الحالي.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-start mt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                startNewProject();
                setState((prev) => ({ ...prev, showResetDialog: false }));
              }}
            >
              <Plus className="ml-2 h-4 w-4" />
              <span>بدء مشروع جديد</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setState((prev) => ({ ...prev, showResetDialog: false }))
              }
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Main Content Area - Two Columns Layout */}
      <div className="flex-grow p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row h-[calc(100vh-250px)]">
            {/* Left Column: Preview Panel - 70% width */}
            <div className="w-full md:w-[70%] h-full mb-4 md:mb-0 md:pr-2">
              <div className="bg-gray-100 border rounded-t px-4 py-2 flex items-center justify-between">
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
                        variant={state.currentHTML && !state.projectId ? "default" : "outline"}
                        className={`h-8 flex items-center gap-1 text-xs ${state.currentHTML && !state.projectId ? "animate-pulse" : ""}`}
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

              <div className="flex-grow bg-white h-full border-x border-b rounded-b">
                {!state.currentHTML ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>سيظهر إبداعك هنا</p>
                  </div>
                ) : state.viewMode === "preview" ? (
                  <div className="w-full h-full overflow-hidden">
                    <iframe
                      title="HTML Preview"
                      srcDoc={state.currentHTML}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-popups allow-forms"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <ScrollArea className="w-full h-full rounded-md">
                    <pre className="p-4 overflow-x-auto text-sm">
                      <code className="language-html">{state.currentHTML}</code>
                    </pre>
                  </ScrollArea>
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
                          {msg.role === "assistant" &&
                          (msg.content.includes("<!DOCTYPE html") ||
                            msg.content.includes("<html"))
                            ? "سويت لك الصفحة! شوف النتيجة في الجهة اليسرى 👈"
                            : msg.content.split("<!DOCTYPE html")[0] ||
                              msg.content}
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
                        <div className="text-xs relative pr-4">
                          <span className="inline-block">يكتب</span>
                          <span className="absolute left-0 top-0">
                            <span className="inline-block w-1 h-1 bg-amber-500 rounded-full animate-bounce mx-0.5"></span>
                            <span className="inline-block w-1 h-1 bg-amber-500 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "0.2s" }}></span>
                            <span className="inline-block w-1 h-1 bg-amber-500 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "0.4s" }}></span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Confirmation Buttons - only show during confirmation step */}
                    {state.showConfirmButtons && (
                      <div className="flex gap-2 my-3 justify-center">
                        <Button 
                          onClick={() => handleConfirmation(true)} 
                          variant="outline"
                          size="sm"
                          className="px-3 py-1 h-8"
                          disabled={state.isLoading}
                        >
                          نعم
                        </Button>
                        <Button 
                          onClick={() => handleConfirmation(false)} 
                          variant="outline" 
                          size="sm"
                          className="px-3 py-1 h-8"
                          disabled={state.isLoading}
                        >
                          لا
                        </Button>
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

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={state.prompt}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, prompt: e.target.value }))
                    }
                    placeholder={
                      state.flowStep === "clarify" 
                        ? "أجب على سؤال د. بنجي..." 
                        : "صف ما تريد بناءه..."
                    }
                    disabled={state.isLoading || state.showConfirmButtons}
                    className="flex-grow text-sm h-9"
                    dir="auto"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9"
                    disabled={!state.prompt.trim() || state.isLoading || state.showConfirmButtons}
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
              onClick={handleContinue} 
              size="lg"
              className={!state.projectId || !state.hasSharedLink ? "relative" : ""}
              variant={state.projectId && state.hasSharedLink ? "default" : "outline"}
            >
              {!state.projectId || !state.hasSharedLink ? (
                <div className="absolute -top-8 right-0 bg-amber-100 text-amber-800 text-xs py-1 px-2 rounded whitespace-nowrap">
                  {!state.projectId ? "احفظ مشروعك" : "انسخ الرابط"}
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