import { useState } from "react";
import { ChatArea } from "@/lovable-mission/chat/ChatArea";
import { ChatInput } from "@/lovable-mission/chat/ChatInput";
import { ChatLayout } from "@/lovable-mission/ui/ChatLayout";
import { Container } from "@/lovable-mission/layout/Container";
import { useStoryboardChat } from "@/hooks/useStoryboardChat";
import { Button } from "@/components/ui/button";
import { RotateCcw, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const { history, draft, isLoading, setDraft, send, resetAll } = useStoryboardChat();
  const { toast } = useToast();

  const handleCopy = (message?: string) => {
    if (message) {
      navigator.clipboard.writeText(message);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرسالة إلى الحافظة",
      });
    }
  };

  return (
    <Container>
      <div className="mx-auto max-w-4xl py-6">
        <div className="mb-6 text-center">
          <h1 data-testid="chat-title" className="text-3xl font-bold text-primary mb-2">
            د. بنجي - خبير القصص
          </h1>
          <p data-testid="chat-subtitle" className="text-lg text-muted-foreground">
            طور فكرتك إلى storyboard احترافي لفيديو فيروسي
          </p>
          <Button
            data-testid="reset-button"
            onClick={resetAll}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            إعادة تشغيل
          </Button>
        </div>

        <ChatLayout>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ChatArea
              messages={history}
              onCopy={handleCopy}
              isLoading={isLoading}
            />
          </div>

          <ChatInput
            value={draft}
            onChange={setDraft}
            onSend={send}
            disabled={isLoading}
            placeholder="شاركني فكرتك للفيديو..."
          />
        </ChatLayout>

        <div data-testid="chat-footer" className="mt-4 text-center text-sm text-muted-foreground">
          د. بنجي سيساعدك في تطوير فكرتك خطوة بخطوة حتى تصل لـ storyboard مكتمل ✨
        </div>
      </div>
    </Container>
  );
}