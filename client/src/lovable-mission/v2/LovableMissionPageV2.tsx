import { useState, useMemo } from "react";
import { Container } from "../layout/Container";
import { ChatArea } from "../chat/ChatArea";
import { ChatInput } from "../chat/ChatInput";
import { EmptyWelcomeSeed } from "../chat/EmptyWelcomeSeed";
import { useLovableChat } from "../hooks/useLovableChat";
import { toastError, toastSuccess } from "../ui/Toast";
import { LABELS } from "../constants";
import { ChatLayout } from "../ui/ChatLayout";
import { useLocation } from "wouter";
import { getStudentIdCookie } from "@/student-auth/cookies.utils";
import StudentMainAuthModal from "@/student-auth/StudentMainAuthModal";
import { progress } from "framer-motion";
import { FloatingActionsPanelV2 } from "./FloatingActionsPanelV2";
import { SubmitProjectModalV2 } from "./SubmitProjectModalV2";

export default function LovableMissionPageV2() {
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

  const [modalOpen, setModalOpen] = useState(false);
  const [, navigate] = useLocation();

  const promptLink = lastResponse?.lovablePromptLink;
  const isAuthed = useMemo(() => Boolean(getStudentIdCookie()), []);

  const handleOpenLovable = () => {
    setBuildingOngoing(true);
    openLovable();
  };

  const handleViewSubmissions = () => {
    navigate("/missions/lovable/submissions");
  };

  const handleOpenSubmitModal = () => {
    // Gate by student-auth cookie
    if (!getStudentIdCookie()) {
      toastError("الرجاء تسجيل الدخول قبل إرسال المشروع.");
      return;
    }
    setModalOpen(true);
  };

  return (
    <Container>
      {/* The modal auto-opens if not authenticated (per its hook). */}
      <StudentMainAuthModal />

      <div className="mx-auto max-w-7xl py-6">
        <div className="flex items-start justify-center gap-6">
          <FloatingActionsPanelV2
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

      <SubmitProjectModalV2
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onToast={({ type, message }) =>
          type === "success" ? toastSuccess(message) : toastError(message)
        }
      />
    </Container>
  );
}
