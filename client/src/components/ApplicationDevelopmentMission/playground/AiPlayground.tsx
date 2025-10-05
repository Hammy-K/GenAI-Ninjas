import { useState, useEffect, useRef } from "react";
import {
  Database,
  Loader2,
  Plus,
  Send,
  Share2,
  Mic,
  Loader,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import penguinAvatar from "@/assets/Group 26087843.png";
import confetti from "canvas-confetti";
import Cookies from "js-cookie";
import { toast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { AiResponse, Message } from "@/components/AiHtmlGenerator/types";
import { transcribeAudio } from "@/components/AiHtmlGenerator/ai-html-api";
import HtmlGeneratorStudentModal from "@/components/modals/HtmlGeneratorStudentModal ";
import NewProjectDialog from "@/components/AiHtmlGenerator/NewProjectDialog";
import { Button } from "@/components/ui/button";
import PlaygroundWelcomeCard, {
  PlaygroundWelcomeCardProps,
} from "./PlaygroundWelcomeCard";
import ChatMessage from "@/components/AiHtmlGenerator/ChatMessage";
import { Textarea } from "@/components/ui/textarea";
import {
  callAppDevCodeGenApi,
  saveAppDevProject,
} from "./callAppDevCodeGenApi";
import { MAIN_MISSION, MissionSlug } from "./config/types";
import { AppDevProjectShareDialog } from "./AppDevProjectShareDialog";
import { getTutorialSeen } from "../YoutubeTutorials/tutorialSeenStore";
import YoutubeTutorialGateScreen from "../YoutubeTutorials/YoutubeTutorialGateScreen";
import YoutubeTutorialModal from "../YoutubeTutorials/YoutubeTutorialModal";

interface AppDevAiPlaygroundProps {
  aiWelcomeMessage: string;
  playgroundWelcomeCardProps: PlaygroundWelcomeCardProps;
  systemPrompt: string;
  mission: MissionSlug;
  mainMission: MAIN_MISSION;
  youtubeTutorialVideoId: string;
}

export default function AppDevAiPlayground({
  aiWelcomeMessage,
  playgroundWelcomeCardProps,
  systemPrompt,
  mission,
  mainMission,
  youtubeTutorialVideoId,
}: AppDevAiPlaygroundProps) {
  const welcomeMessage: Message = {
    role: "assistant",
    content: aiWelcomeMessage,
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [isProjectSaving, setIsProjectSaving] = useState(false);
  const [openShareProjectDialog, setOpenShareProjectDialog] = useState(false);
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
  const organization = useOrganization();

  // youtube tutorial
  const [showYoutubeTutorialGate, setShowYoutubeTutorialGate] = useState(
    !getTutorialSeen({ org: organization.name, mainMission, mission }),
  );

  const [openYoutubeTutorialModal, setYoutubeTutorialOpenModal] =
    useState(false);

  const missionAiMessagesKey = `${mission}AiMessages`;
  const missionAiHtmlContentKey = `${mission}AiHtmlContent`;
  const missionProjectIdKey = `${mission}ProjectId`;
  const missionLastSavedHtmlContentKey = `${mission}LastSavedHtmlContent`;

  const getAiMessagesFromLocatStorage = () => {
    return localStorage.getItem(missionAiMessagesKey);
  };

  const setAiMessagesToLocalStorage = (messages: Message[]) => {
    localStorage.setItem(missionAiMessagesKey, JSON.stringify(messages));
  };

  const getAiHtmlContentFromLocatStorage = () => {
    return localStorage.getItem(missionAiHtmlContentKey);
  };

  const setAiHtmlContentToLocalStorage = (htmlContent: string) => {
    localStorage.setItem(missionAiHtmlContentKey, htmlContent);
  };

  const removeAiMessagesFromLocalStorage = () => {
    localStorage.removeItem(missionAiMessagesKey);
  };

  const removeAiHtmlContentFromLocalStorage = () => {
    localStorage.removeItem(missionAiHtmlContentKey);
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

  useEffect(() => {
    const savedMessages = getAiMessagesFromLocatStorage();
    const savedHtml = getAiHtmlContentFromLocatStorage();
    const savedProjectId = getProjectIdFromLocalStorage();
    const savedLastSavedHtml = getLastSavedHtmlContentFromLocalStorage();

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if (savedHtml) {
      setHtmlContent(savedHtml);
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
    setAiHtmlContentToLocalStorage(htmlContent || "");
  }, [messages, htmlContent]);

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
    confetti({
      particleCount: 500,
      spread: 1080,
    });

    setTimeout(() => {
      confetti.reset();
    }, 2000);
  };

  const handleAiResponseSideEffects = (response: AiResponse) => {
    if (response.isHtmlGenerated) {
      setHtmlContent(() => response.htmlContent);
    }

    if (response.isConversationComplete) {
      handleTriggerConversationCompleted();
    }
  };

  const sendMessage = async (userMessage: string): Promise<void> => {
    try {
      const userMsg: Message = {
        role: "user",
        content: userMessage,
      };

      const newMessages: Message[] = [...messages, userMsg];
      setMessages(() => newMessages);
      setIsLoading(true);

      const loadingMsg: Message = {
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

      const assistantMsg: Message = {
        role: "assistant",
        content: response.aiMessage,
      };

      handleAiResponseSideEffects(response);

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(
          (msg) => msg.className !== "loading-animation",
        );

        return [...updatedMessages, assistantMsg];
      });
    } catch (error) {
      console.error("Error sending message to API:", error);

      const errorMsg: Message = {
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

  const saveAndShareProject = async () => {
    if (!htmlContent || isProjectSaving) {
      console.warn("Save canceled: No HTML content or already saving");
      return;
    }

    // check if content has changed since last save
    if (htmlContent === lastSavedHtmlContent) {
      setOpenShareProjectDialog(() => true);
      handleTriggerConfetti();

      return;
    }

    setIsProjectSaving(true);

    try {
      const studentId = Cookies.get("studentId");

      if (!studentId) {
        throw new Error("No student ID found in cookies");
      }

      const projectId = await saveAppDevProject({
        htmlContent,
        studentId,
        organization: organization.name,
        mission,
      });

      setProjectId(() => projectId!);

      setLastSavedHtmlContent(() => htmlContent);

      setOpenShareProjectDialog(() => true);

      handleTriggerConfetti();
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setIsProjectSaving(false);
    }
  };

  useEffect(() => {
    const autoSave = async () => {
      if (!htmlContent) {
        return;
      }

      // only save if content has changed since last save
      if (htmlContent === lastSavedHtmlContent) {
        return;
      }

      const studentId = Cookies.get("studentId");

      if (!studentId) {
        console.error("No student ID found in cookies");
        return;
      }

      try {
        const savedProjectId = await saveAppDevProject({
          htmlContent,
          studentId,
          organization: organization.name,
          mission,
        });

        setLastSavedHtmlContent(() => htmlContent);

        setProjectId(savedProjectId!);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    };

    if (htmlContent && htmlContent.trim()) {
      autoSave();
    }
  }, [htmlContent]);

  const startNewProject = () => {
    setMessages([welcomeMessage]);
    setHtmlContent(undefined);
    setLastSavedHtmlContent(undefined);
    setProjectId(undefined);

    removeAiMessagesFromLocalStorage();
    removeAiHtmlContentFromLocalStorage();
    removeProjectIdFromLocalStorage();
    removeLastSavedHtmlContentFromLocalStorage();

    toast({
      title: "تم بدء مشروع جديد",
      description: "يمكنك الآن بدء مشرa�ع جديد",
      variant: "default",
    });

    setOpenNewProjectDialog(() => false);
  };

  const handleOpenNewProjectDialog = () => {
    setOpenNewProjectDialog(() => true);
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
        description: "تعذر الوصول إلى اt�ميكروفون",
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

  if (showYoutubeTutorialGate) {
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
    <div
      className="min-h-screen flex flex-col text-foreground font-tajawal"
      dir="rtl"
    >
      <main className="flex-1">
        <div
          className="min-h-screen flex flex-col bg-[#f5f2e8] text-foreground font-tajawal"
          dir="rtl"
        >
          <HtmlGeneratorStudentModal />

          <AppDevProjectShareDialog
            onClose={() => {
              setOpenShareProjectDialog(() => false);
            }}
            shareUrl={`${window.location.origin}/app-development/projects/${projectId}`}
            open={openShareProjectDialog}
          />

          <NewProjectDialog
            open={openNewProjectDialog}
            onClose={() => {
              setOpenNewProjectDialog(() => false);
            }}
            onConfirmed={startNewProject}
          />

          <button
            onClick={() => setYoutubeTutorialOpenModal(true)}
            className="fixed bottom-4 left-4 px-4 py-2 rounded-full shadow bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            🎥 عرض الشرح
          </button>

          {/* Reopen modal */}
          <YoutubeTutorialModal
            open={openYoutubeTutorialModal}
            onClose={() => setYoutubeTutorialOpenModal(false)}
            videoId={youtubeTutorialVideoId}
            title="شرح المهمة"
            description="يمكنك مشاهدة الفيديو مرة أخرى في أي وقت"
          />

          <div className="flex-1">
            <div className="">
              <div className="flex flex-col md:flex-row h-[87vh] gap-4 p-2">
                <div className="w-full md:w-[60%] flex flex-col h-full min-h-0">
                  <Card className="h-full flex flex-col border-lg bg-white border-0">
                    <CardHeader className="p-3 flex flex-row justify-between items-center border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        {/* Add the Go Back button here */}

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleOpenNewProjectDialog}
                        >
                          <Plus className="ml-2 h-4 w-4" />
                          <span>بدء مشروع جديد</span>
                        </Button>
                        <Button
                          variant="default"
                          className="flex items-center gap-2"
                          onClick={goToSubmissions}
                        >
                          <Database className="h-4 w-4" />
                          <span>عرض جميع المشاريع</span>
                        </Button>
                      </div>

                      {htmlContent && (
                        <div className="flex items-center gap-2 px-4 py-2">
                          <div className="flex border rounded overflow-hidden">
                            <Button
                              type="button"
                              variant={
                                viewMode === "preview" ? "outline" : "default"
                              }
                              className="rounded-none px-3 py-1 h-8 text-xs"
                              onClick={() => setViewMode("preview")}
                            >
                              معاينة
                            </Button>
                            <Button
                              type="button"
                              variant={
                                viewMode === "code" ? "outline" : "default"
                              }
                              className="rounded-none px-3 py-1 h-8 text-xs"
                              onClick={() => setViewMode("code")}
                            >
                              الكود
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1 p-0 bg-white border-lg">
                      {htmlContent ? (
                        viewMode === "preview" ? (
                          <div className="flex-grow bg-white h-full bg-white">
                            <div className="w-full h-full overflow-hidden">
                              <iframe
                                title="HTML Preview"
                                srcDoc={htmlContent}
                                className="w-full h-full border-0"
                                sandbox="allow-scripts allow-popups allow-forms"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        ) : (
                          <pre className="text-xs p-4 whitespace-pre-wrap overflow-auto max-h-96 bg-gray-50 rounded">
                            <code>{htmlContent}</code>
                          </pre>
                        )
                      ) : (
                        <PlaygroundWelcomeCard
                          {...playgroundWelcomeCardProps}
                        />
                      )}
                    </CardContent>
                    <CardFooter className=" m-0 pb-2"></CardFooter>
                  </Card>
                </div>

                {/* Chat Panel */}
                <div className="w-full md:w-[40%] h-full flex flex-col ">
                  <Card className="h-full flex flex-col bg-white border-0">
                    <CardHeader className="p-3 flex flex-row space-x-2 justify-end items-center border-b border-gray-200 rouneded-full">
                      <CardTitle className="font-medium text-lg">
                        د. بنجي
                      </CardTitle>
                      <img
                        src={penguinAvatar}
                        alt="د. بنجي"
                        className="h-8 w-8 rounded-full mr-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const url = organization.isMain
                            ? "/missions/app-development/frontend-foundation"
                            : `/${organization.name}/missions/app-development/frontend-foundation`;
                          window.location.href = url;
                        }}
                        className="flex items-center gap-1"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span>رجوع</span>
                      </Button>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                      <ScrollArea className="flex-1 chat-area p-4">
                        <div className="space-y-4 mt-3">
                          {messages.length > 0 ? (
                            messages.map((message, index) => (
                              <div key={index} className="flex flex-col">
                                <ChatMessage message={message} />
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-400 py-8 text-sm">
                              ابدأ محادثة مع د. بنجي
                            </div>
                          )}
                          <div ref={bottomRef} />
                        </div>
                      </ScrollArea>
                    </CardContent>

                    <CardFooter className="border-t p-3 border-gray-200">
                      <div className="flex gap-2 w-full items-center">
                        {/* Textarea */}
                        <div className="flex-1 relative">
                          <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={
                              isRecording
                                ? "جاري التسجيل..."
                                : "اكتب رسالة وبنجي في مساعدتك ..."
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                              }
                            }}
                            disabled={isLoading || isRecording}
                            className="w-full min-h-10 max-h-32 px-3 py-2 text-right bg-white border border-gray-200 rounded-md resize-none overflow-y-auto"
                            dir="rtl"
                            rows={1}
                            style={{
                              height: "auto",
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = "auto";
                              target.style.height = target.scrollHeight + "px";
                            }}
                          />
                        </div>

                        {/* Button - Mic or Send */}
                        <div className="flex-shrink-0">
                          {!inputValue.trim() || isRecording ? (
                            <button
                              className={`p-2 rounded-md transition-colors ${
                                isRecording
                                  ? "text-red-500 bg-red-50 animate-pulse"
                                  : isProcessingAudio
                                    ? "text-blue-500 bg-blue-50"
                                    : "text-gray-500 hover:bg-gray-100"
                              }`}
                              onClick={handleMicClick}
                              disabled={isProcessingAudio || isLoading}
                            >
                              {isProcessingAudio ? (
                                <Loader
                                  className="animate-spin duration-700 primary"
                                  size={20}
                                />
                              ) : (
                                <Mic size={20} />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={isLoading || !inputValue.trim()}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Send size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
