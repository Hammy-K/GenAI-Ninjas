import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatArea } from "@/lovable-mission/chat/ChatArea";
import { ChatInput } from "@/lovable-mission/chat/ChatInput";
import { useStoryboardChat } from "../hooks/useStoryboardChat";
import type { ChatMessage as LovableChatMessage } from "@/lovable-mission/types/lovable.types";
import type { ChatMessage } from "../types/storyboard.types";

export default function ChatPage() {
  const { toast } = useToast();
  const {
    history,
    draft,
    isLoading,
    conversationState,
    lastResponse,
    setDraft,
    send,
    resetAll,
  } = useStoryboardChat();

  // Convert our chat messages to the format expected by the existing chat components
  const convertedMessages: LovableChatMessage[] = history.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const handleCopy = useCallback(
    (text: string) => {
      toast({
        title: text,
        duration: 2000,
      });
    },
    [toast]
  );

  const handleReset = useCallback(() => {
    resetAll();
    toast({
      title: "تم إعادة تعيين المحادثة",
      duration: 2000,
    });
  }, [resetAll, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-foreground font-tajawal" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900" data-testid="page-title">
              د. بنجي - مولد القصص المرئية
            </h1>
            <p className="text-sm text-gray-600 mt-1" data-testid="page-subtitle">
              من فكرة إلى storyboard احترافي في دقائق
            </p>
          </div>
          
          {/* Reset button */}
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            data-testid="button-reset"
          >
            بداية جديدة
          </button>
        </div>
      </div>

      {/* Status indicator */}
      {conversationState.phase !== "initial" && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700" data-testid="status-phase">
                المرحلة الحالية: {getPhaseText(conversationState.phase)}
              </span>
              
              {lastResponse?.isStoryboardGenerated && (
                <span className="text-green-700 font-medium" data-testid="status-storyboard">
                  ✅ تم إنتاج الـ Storyboard
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <ChatArea 
        messages={convertedMessages}
        onCopy={handleCopy}
        isLoading={isLoading}
      />

      {/* Chat Input */}
      <ChatInput
        value={draft}
        onChange={setDraft}
        onSend={send}
        disabled={isLoading || lastResponse?.isConversationComplete}
      />

      {/* Footer info */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs text-gray-500" data-testid="footer-info">
            د. بنجي يساعدك في تطوير فكرتك وتحويلها إلى storyboard مكون من 6 مشاهد لفيديو 30 ثانية
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to get phase text in Arabic
function getPhaseText(phase: string): string {
  switch (phase) {
    case "initial":
      return "استقبال الفكرة";
    case "clarifying":
      return "توضيح التفاصيل";
    case "confirming":
      return "تأكيد القصة";
    case "storyboard_generated":
      return "تم إنتاج الـ Storyboard";
    case "complete":
      return "اكتملت المحادثة";
    default:
      return "غير معروف";
  }
}