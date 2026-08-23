import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Plus,
  Send,
  Mic,
  Loader,
  ArrowRight,
  Home,
  Menu,
  Database,
  Youtube,
  Maximize2,
  X,
} from "lucide-react";
import penguinAvatar from "@/assets/Group 26087843.png";
import { celebrate } from "@/lib/celebrate";
import Cookies from "js-cookie";
import { toast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { useLocation } from "wouter";
import { getStudentIdCookie } from "@/student-auth/cookies.utils";
import { AiResponse, Message } from "@/components/AiHtmlGenerator/types";
import { transcribeAudio } from "@/components/AiHtmlGenerator/ai-html-api";
import HtmlGeneratorStudentModal from "@/components/modals/HtmlGeneratorStudentModal ";
import NewProjectDialog from "@/components/AiHtmlGenerator/NewProjectDialog";
import { Textarea } from "@/components/ui/textarea";
import {
  callAppDevCodeGenApi,
  saveAppDevProject,
} from "./callAppDevCodeGenApi";
import { MAIN_MISSION, MissionSlug } from "./config/types";
import { getTutorialSeen } from "../YoutubeTutorials/tutorialSeenStore";
import YoutubeTutorialGateScreen from "../YoutubeTutorials/YoutubeTutorialGateScreen";
import YoutubeTutorialModal from "../YoutubeTutorials/YoutubeTutorialModal";

// Extended Message type to include HTML content
interface ExtendedMessage extends Message {
  htmlContent?: string;
}

interface AppDevAiPlaygroundProps {
  aiWelcomeMessage: string;
  systemPrompt: string;
  mission: MissionSlug;
  mainMission: MAIN_MISSION;
  youtubeTutorialVideoId: string;
}

export const aiUniversalWelcomeMessage =
  "هلا! أنا د. بنقي 🐧 جاهز أساعدك تبني فكرتك خطوة بخطوة 💡 يلا نبرمجها سوا! 🚀";

export default function AppDevAiPlayground({
  aiWelcomeMessage,
  systemPrompt,
  mission,
  mainMission,
  youtubeTutorialVideoId,
}: AppDevAiPlaygroundProps) {
  const welcomeMessage: ExtendedMessage = {
    role: "assistant",
    content: aiUniversalWelcomeMessage,
    // content: aiWelcomeMessage,
  };

  const [messages, setMessages] = useState<ExtendedMessage[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedPreviewIndex, setExpandedPreviewIndex] = useState<
    number | null
  >(null);
  const [isProjectSaving, setIsProjectSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [openNewProjectDialog, setOpenNewProjectDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [lastSavedHtmlContent, setLastSavedHtmlContent] = useState<
    string | undefined
  >(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const organization = useOrganization();
  const [, navigate] = useLocation();

  // youtube tutorial
  const [showYoutubeTutorialGate, setShowYoutubeTutorialGate] = useState(
    !getTutorialSeen({ org: organization.name, mainMission, mission }),
  );
  const [openYoutubeTutorialModal, setYoutubeTutorialOpenModal] =
    useState(false);

  const missionAiMessagesKey = `${mission}AiMessages`;
  const missionProjectIdKey = `${mission}ProjectId`;
  const missionLastSavedHtmlContentKey = `${mission}LastSavedHtmlContent`;

  const getAiMessagesFromLocatStorage = () => {
    return localStorage.getItem(missionAiMessagesKey);
  };

  const setAiMessagesToLocalStorage = (messages: ExtendedMessage[]) => {
    localStorage.setItem(missionAiMessagesKey, JSON.stringify(messages));
  };

  const removeAiMessagesFromLocalStorage = () => {
    localStorage.removeItem(missionAiMessagesKey);
  };

  const getProjectIdFromLocalStorage = () => {
    return localStorage.getItem(missionProjectIdKey);
  };

  const setProjectIdToLocalStorage = (projectId: string) => {
    localStorage.setItem(missionProjectIdKey, projectId);
  };

  const removeProjectIdFromLocalStorage = () => {
    localStorage.removeItem(missionProjectIdKey);
  };

  const getLastSavedHtmlContentFromLocalStorage = () => {
    return localStorage.getItem(missionLastSavedHtmlContentKey);
  };

  const setLastSavedHtmlContentToLocalStorage = (html: string) => {
    localStorage.setItem(missionLastSavedHtmlContentKey, html);
  };

  const removeLastSavedHtmlContentFromLocalStorage = () => {
    localStorage.removeItem(missionLastSavedHtmlContentKey);
  };

  // Get latest HTML content from messages
  const getLatestHtmlContent = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].htmlContent) {
        return messages[i].htmlContent;
      }
    }
    return undefined;
  };

  useEffect(() => {
    const savedMessages = getAiMessagesFromLocatStorage();
    const savedProjectId = getProjectIdFromLocalStorage();
    const savedLastSavedHtml = getLastSavedHtmlContentFromLocalStorage();

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if (!projectId && savedProjectId) {
      setProjectId(savedProjectId);
    }

    if (savedLastSavedHtml) {
      setLastSavedHtmlContent(savedLastSavedHtml);
    }
  }, []);

  useEffect(() => {
    setAiMessagesToLocalStorage(messages);
  }, [messages]);

  useEffect(() => {
    if (projectId) {
      setProjectIdToLocalStorage(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (lastSavedHtmlContent !== undefined) {
      setLastSavedHtmlContentToLocalStorage(lastSavedHtmlContent);
    }
  }, [lastSavedHtmlContent]);

  const handleTriggerConversationCompleted = () => {
    console.log("Conversation completed!");
    handleTriggerConfetti();
  };

  const handleTriggerConfetti = () => {
    celebrate("small");
  };

  const handleAiResponseSideEffects = (
    response: AiResponse,
    newMessages: ExtendedMessage[],
  ) => {
    if (response.isConversationComplete) {
      handleTriggerConversationCompleted();
    }

    // If HTML was generated, attach it to the last assistant message
    if (response.isHtmlGenerated && response.htmlContent) {
      const updatedMessages = [...newMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      if (lastMessage.role === "assistant") {
        lastMessage.htmlContent = response.htmlContent;
      }
      setMessages(updatedMessages);
    }
  };

  const sendMessage = async (userMessage: string): Promise<void> => {
    try {
      const userMsg: ExtendedMessage = {
        role: "user",
        content: userMessage,
      };

      const newMessages: ExtendedMessage[] = [...messages, userMsg];
      setMessages(() => newMessages);
      setIsLoading(true);

      const loadingMsg: ExtendedMessage = {
        role: "assistant",
        content: "",
        className: "loading-animation",
      };

      setMessages(() => [...newMessages, loadingMsg]);

      const studentId = Cookies.get("studentId");

      const response: AiResponse = await callAppDevCodeGenApi(
        userMessage,
        newMessages,
        studentId ?? "",
        systemPrompt,
      );

      const assistantMsg: ExtendedMessage = {
        role: "assistant",
        content: response.aiMessage,
        htmlContent: response.isHtmlGenerated
          ? response.htmlContent
          : undefined,
      };

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(
          (msg) => msg.className !== "loading-animation",
        );
        const finalMessages = [...updatedMessages, assistantMsg];

        // Handle side effects after state update
        handleAiResponseSideEffects(response, finalMessages);

        return finalMessages;
      });
    } catch (error) {
      console.error("Error sending message to API:", error);

      const errorMsg: ExtendedMessage = {
        role: "assistant",
        content: "عذراً، حدث خطأ في الاتصال",
      };

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(
          (msg) => msg.className !== "loading-animation",
        );

        return [...updatedMessages, errorMsg];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addUserMessage = (message: string): void => {
    if (message.trim() && !isLoading) {
      sendMessage(message);
    }
  };

  const handleSubmit = () => {
    if (inputValue.trim() && !isLoading) {
      addUserMessage(inputValue);
      setInputValue("");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const goToSubmissions = () => {
    const desitinationUrl = organization.isMain
      ? `/missions/app-development/${mainMission}/submissions`
      : `/${organization.name}/missions/app-development/${mainMission}/submissions`;

    window.open(desitinationUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const autoSave = async () => {
      const latestHtml = getLatestHtmlContent();

      if (!latestHtml) {
        return;
      }

      if (latestHtml === lastSavedHtmlContent) {
        return;
      }

      const studentId = Cookies.get("studentId");

      if (!studentId) {
        console.error("No student ID found in cookies");
        return;
      }

      try {
        const savedProjectId = await saveAppDevProject({
          htmlContent: latestHtml,
          studentId,
          organization: organization.name,
          mission,
        });

        setLastSavedHtmlContent(() => latestHtml);
        setProjectId(savedProjectId!);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    };

    const latestHtml = getLatestHtmlContent();
    if (latestHtml && latestHtml.trim()) {
      autoSave();
    }
  }, [messages]);

  const startNewProject = () => {
    setMessages([welcomeMessage]);
    setLastSavedHtmlContent(undefined);
    setProjectId(undefined);

    removeAiMessagesFromLocalStorage();
    removeProjectIdFromLocalStorage();
    removeLastSavedHtmlContentFromLocalStorage();

    toast({
      title: "تم بدء مشروع جديد",
      description: "يمكنك الآن بدء مشروع جديد",
      variant: "default",
    });

    setOpenNewProjectDialog(() => false);
  };

  const handleOpenNewProjectDialog = () => {
    setOpenNewProjectDialog(() => true);
    setMenuOpen(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        setIsProcessingAudio(() => true);
        setIsRecording(() => false);

        try {
          const transcribedText = await transcribeAudio(audioBlob);
          setInputValue(() => transcribedText.trim());
        } catch (error) {
          console.error("Error during transcription:", error);

          toast({
            title: "خطأ في التسجيل",
            description: "حدث خطأ أثناء تحويل الصوت إلى نص",
            variant: "destructive",
          });
        } finally {
          setIsProcessingAudio(() => false);
          stream.getTracks().forEach((track) => track.stop());
          setMediaRecorder(null);
          setAudioChunks([]);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      console.error("Error starting recording:", error);

      toast({
        title: "خطأ في التسجيل",
        description: "تعذر الوصول إلى الميكروفون",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (showYoutubeTutorialGate && youtubeTutorialVideoId.trim() !== "") {
    return (
      <YoutubeTutorialGateScreen
        org={organization.name}
        mainMission={mainMission}
        mission={mission}
        videoId={youtubeTutorialVideoId}
        title="🎥 شرح سريع للمهمة"
        description="شاهد هذا الفيديو القصير لتفهم الفكرة قبل أن تبدأ"
        onDismiss={() => setShowYoutubeTutorialGate(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-tajawal" dir="rtl">
      <HtmlGeneratorStudentModal />

      <NewProjectDialog
        open={openNewProjectDialog}
        onClose={() => setOpenNewProjectDialog(false)}
        onConfirmed={startNewProject}
      />

      {youtubeTutorialVideoId.trim() !== "" && (
        <YoutubeTutorialModal
          open={openYoutubeTutorialModal}
          onClose={() => setYoutubeTutorialOpenModal(false)}
          videoId={youtubeTutorialVideoId}
          title="شرح المهمة"
          description="يمكنك مشاهدة الفيديو مرة أخرى في أي وقت"
        />
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const url = organization.isMain
                ? "/missions/app-development/frontend-foundation"
                : `/${organization.name}/missions/app-development/frontend-foundation`;
              navigate(url);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="font-medium">رجوع</span>
          </button>
          <button
            type="button"
            onClick={() => {
              getStudentIdCookie();
              navigate(organization.isMain ? "/" : `/${organization.name}/`);
            }}
            className="rounded-lg p-2 text-violet-700 transition-colors hover:bg-violet-50"
            title="الرئيسية"
            aria-label="الرئيسية"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <img
            src={penguinAvatar}
            alt="د. بنجي"
            className="w-8 h-8 rounded-full"
          />
          <h1 className="text-lg font-bold text-gray-900">د. بنجي</h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Menu Dropdown */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute left-0 top-12 bg-white rounded-lg shadow-xl p-2 min-w-[200px] z-30 border border-gray-200">
                <button
                  onClick={handleOpenNewProjectDialog}
                  className="w-full text-right px-4 py-3 hover:bg-gray-50 rounded flex items-center gap-3 text-gray-700"
                >
                  <Plus className="w-4 h-4 text-red-500" />
                  <span>بدء مشروع جديد</span>
                </button>
                <button
                  onClick={() => {
                    goToSubmissions();
                    setMenuOpen(false);
                  }}
                  className="w-full text-right px-4 py-3 hover:bg-gray-50 rounded flex items-center gap-3 text-gray-700"
                >
                  <Database className="w-4 h-4 text-blue-500" />
                  <span>عرض جميع المشاريع</span>
                </button>
                <button
                  onClick={() => {
                    setYoutubeTutorialOpenModal(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-right px-4 py-3 hover:bg-gray-50 rounded flex items-center gap-3 text-gray-700"
                >
                  <Youtube className="w-4 h-4 text-purple-500" />
                  <span>عرض الشرح</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx}>
              {/* Message bubble */}
              <div
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                {msg.className === "loading-animation" ? (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-white border border-gray-200 text-gray-900"
                        : "text-gray-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Preview Card (if this message has HTML) */}
              {msg.htmlContent && (
                <div className="flex justify-end mt-2">
                  <div className="w-[90%] bg-white rounded-2xl shadow-lg border-2 border-purple-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 flex items-center justify-between border-b border-purple-200">
                      <button
                        onClick={() => setExpandedPreviewIndex(idx)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div
                        className="relative bg-gray-100 rounded-lg overflow-hidden"
                        style={{ height: "400px" }}
                      >
                        <iframe
                          srcDoc={msg.htmlContent}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-popups allow-forms"
                          title={`Preview ${idx}`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        جرب التفاعل مع المشروع بالضغط على العناصر
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Expanded Preview Overlay */}
      {expandedPreviewIndex !== null &&
        messages[expandedPreviewIndex]?.htmlContent && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-40 flex flex-col">
            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
              <span className="text-white font-bold">معاينة كاملة</span>
              <button
                onClick={() => setExpandedPreviewIndex(null)}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-white">
              <iframe
                srcDoc={messages[expandedPreviewIndex].htmlContent}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-popups allow-forms"
                title="Full Preview"
              />
            </div>
          </div>
        )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <button
            onClick={handleMicClick}
            disabled={isLoading || isProcessingAudio}
            className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
              isRecording
                ? "text-red-500 bg-red-50 animate-pulse"
                : isProcessingAudio
                  ? "text-blue-500 bg-blue-50"
                  : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {isProcessingAudio ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                isRecording ? "جاري التسجيل..." : "اكتب رسالة ودعني أساعدك..."
              }
              disabled={isLoading || isRecording}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-sm min-h-[48px] max-h-[120px]"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
