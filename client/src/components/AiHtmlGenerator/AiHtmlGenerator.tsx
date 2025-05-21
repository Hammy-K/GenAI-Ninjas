import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Database, Loader2, Plus, Send, Share2 } from "lucide-react";
import { AiResponse, Message } from "./types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import { callAiApi } from "./ai-html-api";
import penguinAvatar from "@/assets/Group 26087843.png";
import confetti from "canvas-confetti";
import { PlaygroundWelcomeCard } from "./PlaygroundWelcomeCard";
import { Button } from "../ui/button";
import Cookies from "js-cookie";
import { saveProject } from "@/lib/firebase";
import HtmlGeneratorStudentModal from "../modals/HtmlGeneratorStudentModal ";
import { ProjectShareDialog } from "./ProjectShareDialog";
import { toast } from "@/hooks/use-toast";
import NewProjectDialog from "./NewProjectDialog";

const welcomeMessage: Message = {
  role: "assistant",
  content: `
🎮  ياهلا في أداة بناء الألعاب بالذكاء الاصطناعي! 
أنا د. بنجي، موجود هنا أساعدك تصمّم لعبتك بنفسك. 
كل اللي عليك: توصف لي فكرتك، وأنا أكتب لك الكود ✨
    `,
};

export default function AiHtmlGenerator() {
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

  // Load from cookies on initial load
  useEffect(() => {
    const savedMessages = Cookies.get("aiMessages");
    const savedHtml = Cookies.get("aiHtmlContent");

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if (savedHtml) {
      setHtmlContent(savedHtml);
    }
  }, []);

  // Store messages + HTML content in cookies
  useEffect(() => {
    Cookies.set("aiMessages", JSON.stringify(messages));
    Cookies.set("aiHtmlContent", htmlContent || "");
  }, [messages, htmlContent]);

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
      setMessages(newMessages);
      setIsLoading(true);

      const loadingMsg: Message = {
        role: "assistant",
        content: "جاري الإنشاء",
        className: "loading-animation",
      };

      setMessages([...newMessages, loadingMsg]);

      const studentId = Cookies.get("studentId");

      const response: AiResponse = await callAiApi(
        userMessage,
        newMessages,
        studentId ?? "",
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
    // handleTriggerConfetti();
  }, [messages]);

  const goToSubmissions = () => {
    window.open(
      "/missions/html-generator/submissions",
      "_blank",
      "noopener,noreferrer",
    );
  };

  const saveAndShareProject = async () => {
    if (!htmlContent || isProjectSaving) {
      console.warn("Save canceled: No HTML content or already saving");
      return;
    }

    setIsProjectSaving(true);

    try {
      const studentId = Cookies.get("studentId");

      if (!studentId) {
        throw new Error("No student ID found in cookies");
      }

      const projectId = await saveProject(htmlContent, studentId);

      setProjectId(() => projectId);

      setOpenShareProjectDialog(() => true);

      handleTriggerConfetti();
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setIsProjectSaving(false);
    }
  };

  const startNewProject = () => {
    setMessages([welcomeMessage]);
    setHtmlContent(undefined);
    Cookies.remove("aiMessages");
    Cookies.remove("aiHtmlContent");

    toast({
      title: "تم بدء مشروع جديد",
      description: "يمكنك الآن بدء مشروع جديد",
      variant: "default",
    });

    setOpenNewProjectDialog(() => false);
  };

  const handleOpenNewProjectDialog = () => {
    setOpenNewProjectDialog(() => true);
  };

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

          <ProjectShareDialog
            onClose={() => {
              setOpenShareProjectDialog(() => false);
            }}
            projectId={projectId ?? ""}
            open={openShareProjectDialog}
          />

          <NewProjectDialog
            open={openNewProjectDialog}
            onClose={() => {
              setOpenNewProjectDialog(() => false);
            }}
            onConfirmed={startNewProject}
          />

          <div className="flex-1">
            {/* <div className="flex flex-col md:flex-row h-[87vh] p-2 gap-4"> */}
            <div className="">
              <div className="flex flex-col md:flex-row h-[87vh] gap-4 p-2">
                {/* Playground */}
                {/* <div className="w-full md:w-[70%] h-full"> */}
                <div className="w-full md:w-[70%] flex flex-col h-full min-h-0">
                  <Card className="h-full flex flex-col border-lg bg-white border-0">
                    <CardHeader className="p-3 flex flex-row justify-between items-center border-b border-gray-200">
                      <div className="flex items-center gap-2">
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
                                viewMode === "preview" ? "default" : "outline"
                              }
                              className="rounded-none px-3 py-1 h-8 text-xs"
                              onClick={() => setViewMode("preview")}
                            >
                              معاينة
                            </Button>
                            <Button
                              type="button"
                              variant={
                                viewMode === "code" ? "default" : "outline"
                              }
                              className="rounded-none px-3 py-1 h-8 text-xs"
                              onClick={() => setViewMode("code")}
                            >
                              الكود
                            </Button>
                          </div>
                          <Button
                            variant="default"
                            className={`h-8 flex items-center gap-1 text-xs ${
                              !isProjectSaving ? "" : "animate-pulse"
                            }`}
                            onClick={saveAndShareProject}
                            disabled={isProjectSaving}
                          >
                            {isProjectSaving ? (
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
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <img
                          src={penguinAvatar}
                          alt="د. بنجي"
                          className="h-8 w-8 rounded-full"
                        />
                        <CardTitle className="font-medium text-lg">
                          {htmlContent ? "كود HTML" : "معاينة مباشرة"}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    {/* <CardContent className="flex-1 p-0 overflow-hidden h-[90%] bg-white"> */}
                    <CardContent className="flex-1 p-0 bg-white">
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
                          <pre className="text-xs p-4 whitespace-pre-wrap overflow-auto h-full bg-gray-50 rounded">
                            {htmlContent}
                          </pre>
                        )
                      ) : (
                        PlaygroundWelcomeCard
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Chat Panel */}
                {/* <Card className="w-full md:w-[30%] bg-white border-0"> */}
                <div className="w-full md:w-[30%] h-full flex flex-col ">
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
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                      <ScrollArea className="flex-1 chat-area p-4">
                        {/* <ScrollArea className="flex-1 p-4 overflow-auto"> */}
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
                      <div className="relative w-full">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isLoading || !inputValue.trim()}
                          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-500 hover:bg-gray-100 rounded-sm transition-colors"
                        >
                          <Send size={18} />
                        </button>
                        <Input
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="اكتب رسالة وبنجي في مساعدتك"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleSubmit();
                            }
                          }}
                          disabled={isLoading}
                          className="w-full pr-10 text-right bg-white border-gray-200"
                          dir="rtl"
                        />
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
