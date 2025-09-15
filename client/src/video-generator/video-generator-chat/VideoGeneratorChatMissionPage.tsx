import { Container } from "./layout/Container";
import { ChatArea } from "./chat/ChatArea";
import { ChatInput } from "./chat/ChatInput";
import { EmptyWelcomeSeed } from "./chat/EmptyWelcomeSeed";
import { ChatLayout } from "./ui/ChatLayout";
import { useLocation } from "wouter";
import { useVideoGeneratorChat } from "./hooks/useVideoGeneratorChat";
import { toastSuccess } from "@/lovable-mission/ui/Toast";

export default function VideoGeneratorChatMissionPage() {
  const { history, draft, isLoading, setDraft, send, resetAll } =
    useVideoGeneratorChat();

  const [, navigate] = useLocation();

  // const handleViewSubmissions = () => {
  //   navigate("/missions/lovable/submissions");
  // };

  return (
    <Container>
      <div className="mx-auto max-w-7xl py-6">
        <div className="flex items-start justify-center gap-6">
          <ChatLayout className="flex flex-col h-full min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* {history.length === 0 && <EmptyWelcomeSeed />} */}

              <ChatArea
                messages={history}
                onCopy={(msg) => toastSuccess(msg || "تم النسخ")}
                isLoading={isLoading}
              />
            </div>

            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={send}
              disabled={isLoading}
            />
          </ChatLayout>
        </div>
      </div>
    </Container>
  );
}
