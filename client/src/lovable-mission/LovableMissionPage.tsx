import { useState } from "react";
import { Container } from "./layout/Container";
import { ChatArea } from "./chat/ChatArea";
import { ChatInput } from "./chat/ChatInput";
import { EmptyWelcomeSeed } from "./chat/EmptyWelcomeSeed";
import { SubmitProjectModal } from "./submissions/SubmitProjectModal";
import { useLovableChat } from "./hooks/useLovableChat";
import { toastError, toastSuccess } from "./ui/Toast";
import { LABELS } from "./constants";
import { FloatingActionsPanel } from "./ui/FloatingActionsPanel";
import { ChatLayout } from "./ui/ChatLayout";
import { useLocation } from "wouter";
import { GoogleSignInCTA } from "./ui/auth/GoogleSignInCta";
import { useLovableAuth } from "./auth/AuthProvider";

export default function LovableMissionPage() {
  const {
    history,
    draft,
    isLoading,
    lastResponse,
    progress,
    setDraft,
    send,
    openLovable,
    setBuildingOngoing,
    resetAll,
  } = useLovableChat();

  const { user } = useLovableAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const promptLink = lastResponse?.lovablePromptLink;
  const [, navigate] = useLocation();

  const handleOpenLovable = () => {
    setBuildingOngoing(true);
    openLovable();
  };

  const handleViewSubmissions = () => {
    navigate("/missions/lovable/submissions");
  };

  const handleOpenSubmitModal = () => {
    if (!user) {
      toastError("الرجاء تسجيل الدخول عبر Google قبل إرسال المشروع.");
      return;
    }
    setModalOpen(true);
  };

  if (!user) {
    return (
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <GoogleSignInCTA />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mx-auto max-w-7xl py-6">
        <div className="flex items-start justify-center gap-6">
          <FloatingActionsPanel
            progress={progress}
            promptLink={promptLink}
            onOpenLovable={handleOpenLovable}
            onReset={resetAll}
            onSubmitProject={handleOpenSubmitModal}
            onViewSubmissions={handleViewSubmissions}
            resetLabel={LABELS.restart}
            submitLabel={LABELS.submitProject}
          />

          <ChatLayout className="flex-[1_1_960px]">
            <div className="flex-1 min-h-0 overflow-y-auto">
              {history.length === 0 && <EmptyWelcomeSeed />}
              <ChatArea
                messages={history}
                onCopy={(msg) => toastSuccess(msg || LABELS.copied)}
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

      <SubmitProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onToast={({ type, message }) =>
          type === "success" ? toastSuccess(message) : toastError(message)
        }
      />
    </Container>
  );
}
