import { useRef, useEffect, useState } from "react";
import { PromptInput } from "./PromptInput";
import { Instructions } from "./Instructions";
import { SubmitRow } from "./SubmitRow";
import { LoadingView } from "./LoadingView";
import { ImageResult } from "./ImageResult";
import { ErrorView } from "./ErrorView";
import { ImageModal } from "./ImageModal";
import { useImageGeneration } from "../useImageGeneration";

export function ImageGenerationPage() {
  const {
    prompt,
    setPrompt,
    size,
    setSize,
    imageSizes,
    isLoading,
    images,
    error,
    uiState,
    submit,
    generateAgain,
    newPrompt,
    resetToPrompt,
    download,
    copy,
  } = useImageGeneration();

  const [isModalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // focus prompt input when idle or when editing after error
    if (uiState === "idle" || uiState === "error") {
      inputRef.current?.focus();
    }
  }, [uiState]);

  const openModal = (src: string) => {
    setModalSrc(src);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalSrc(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-tajawal">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {uiState === "idle" && (
            <>
              <Instructions />

              <div className="mt-6">
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  readOnly={isLoading}
                  minLines={2}
                  maxLines={10}
                  placeholder="اكتب وصف الصورة هنا — اذكر الموضوع، الأسلوب، الإضاءة، وزاوية التصوير..."
                  // forward ref if you want to focus from hook/page
                />
              </div>

              <div className="mt-4">
                <SubmitRow
                  disabled={isLoading}
                  size={size}
                  sizes={imageSizes}
                  onSizeChange={setSize}
                  onSubmit={() => {
                    void submit();
                  }}
                  onGenerateAgain={() => {
                    void generateAgain();
                  }}
                  onNewPrompt={() => newPrompt()}
                  hasResult={images.length > 0}
                />
              </div>
            </>
          )}

          {uiState === "submitting" && (
            <>
              <div className="flex items-center justify-center">
                <LoadingView />
              </div>
            </>
          )}

          {uiState === "error" && (
            <>
              <ErrorView
                error={error ?? "حدث خطأ."}
                onRetry={() => {
                  void submit();
                }}
                onEdit={() => {
                  resetToPrompt();
                }}
              />
              <div className="mt-4">
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  readOnly={false}
                  minLines={2}
                  maxLines={10}
                  placeholder="قم بتعديل البرومبت ثم اضغط توليد"
                />
              </div>
              <div className="mt-4">
                <SubmitRow
                  disabled={isLoading}
                  size={size}
                  sizes={imageSizes}
                  onSizeChange={setSize}
                  onSubmit={() => {
                    void submit();
                  }}
                  onGenerateAgain={() => {
                    void generateAgain();
                  }}
                  onNewPrompt={() => newPrompt()}
                  hasResult={images.length > 0}
                />
              </div>
            </>
          )}

          {uiState === "result" && images.length > 0 && (
            <>
              <div className="mt-4">
                <ImageResult
                  image={images[0].dataUrl}
                  altText={prompt}
                  onDownload={() => {
                    void download(images[0].dataUrl);
                  }}
                  onCopy={() => {
                    void copy(images[0].dataUrl);
                  }}
                  onGenerateAgain={() => {
                    void generateAgain();
                  }}
                  onNewPrompt={() => newPrompt()}
                  onOpen={() => openModal(images[0].dataUrl)}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <ImageModal open={isModalOpen} src={modalSrc} onClose={closeModal} />
    </div>
  );
}
