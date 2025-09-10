import { useMemo, useState } from "react";

import { Container } from "./layout/Container";
import { Header } from "./layout/Header";
import { ActionsBar } from "./layout/ActionsBar";

import { ChatArea } from "./chat/ChatArea";
import { ChatInput } from "./chat/ChatInput";
import { EmptyWelcomeSeed } from "./chat/EmptyWelcomeSeed";

import { SubmitProjectModal } from "./submissions/SubmitProjectModal";

import { useLovableChat } from "./hooks/useLovableChat";
import { toastError, toastSuccess } from "./ui/Toast";
import { LovableButton } from "./ui/LovableButton";
import { LABELS } from "./constants";

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
  } = useLovableChat();

  const [modalOpen, setModalOpen] = useState(false);

  const isReady = lastResponse?.isReadyToGoToLovable ?? false;
  const promptLink = lastResponse?.lovablePromptLink;

  const actions = useMemo(() => {
    return (
      <div className="flex items-center gap-2">
        {/* Open Lovable */}
        <LovableButton
          promptLink={promptLink}
          ready={isReady}
          onOpen={() => {
            setBuildingOngoing(true);
            openLovable();
          }}
        />

        {/* Submit Project */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50"
        >
          {LABELS.submitProject}
        </button>
      </div>
    );
  }, [isReady, promptLink, openLovable, setBuildingOngoing]);

  return (
    <Container>
      {/* Header with reserved actions area (no flicker) */}
      <Header progress={progress} />

      <ActionsBar>{actions}</ActionsBar>

      {/* Chat body */}
      <div className="flex flex-col h-[calc(100vh-160px)] border border-none rounded-lg bg-white mt-3">
        {history.length === 0 && <EmptyWelcomeSeed />}

        <ChatArea
          messages={history}
          onCopy={(msg) => toastSuccess(msg || LABELS.copied)}
        />

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={send}
          disabled={isLoading}
        />
      </div>

      {/* Submit Modal */}
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
