import { useState } from "react";
import { PromptInput } from "./PromptInput";
import { LoadingView } from "./LoadingView";
import { ImageResult } from "./ImageResult";
import { ErrorView } from "./ErrorView";
import { ImageModal } from "./ImageModal";
import { useImageGeneration } from "../useImageGeneration";
import { REFERENCE_IMAGE_URL } from "../image-generation.constants";
import { Button } from "@/components/ui/button";

const THEMES = [
  {
    id: "humor",
    label: "الفكاهة",
    description: "رد كوميدي ومضحك",
    promptHelp: "مثال: بنجي البطريق يضحك وهو يصلح الخوادم",
  },
  {
    id: "drama",
    label: "الدراما",
    description: "لحظة درامية حزينة",
    promptHelp: "مثال: بنجي البطريق ينظر للأسفل بحزن",
  },
  {
    id: "redemption",
    label: "الفداء",
    description: "يعود أقوى من قبل",
    promptHelp: "مثال: بنجي البطريق بطل خارق بعد التدريب",
  },
];

export function PengyRedemption() {
  const [userEmail, setUserEmail] = useState("");

  const {
    prompt,
    setPrompt,
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
  } = useImageGeneration("", REFERENCE_IMAGE_URL, userEmail);

  const [isModalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  const openModal = (src: string) => {
    setModalSrc(src);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalSrc(null);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-50 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-[1090px] h-[700px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">عودة بنجي: قصة الفداء</h1>
          <p className="text-sm opacity-90">
            ساعد بنجي في العودة من خلال إنشاء مشهد مانجا
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 p-6 h-full">
            {/* Left Column */}
            <div className="space-y-4">
              {/* GIF Section */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  ردود فعل الطلاب
                </h3>
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src="/src/assets/PengyBullied.gif"
                    alt="Student reactions"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Reference Image */}
              <div className="flex items-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="flex items-center font-semibold text-gray-900 mb-3">
                  صورة بنجي المرجعية
                </h3>
                <div className="flex items-center gap-3">
                  <img
                    src="/src/assets/sad_pengy.png"
                    alt="Reference Pengy"
                    className="flex items-center w-[120px] h-[120px] rounded-lg object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col space-y-4">
              {/* Email Input */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  أدخل إيميل نون
                </h3>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@noonacademy.com أو name@noon.edu.sa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  disabled={isLoading}
                />
                {userEmail &&
                  !userEmail.endsWith("@noonacademy.com") &&
                  !userEmail.endsWith("@noon.edu.sa") && (
                    <p className="text-xs text-red-600 mt-1">
                      يجب أن ينتهي الإيميل بـ @noonacademy.com أو @noon.edu.sa
                    </p>
                  )}
                <p className="text-xs text-gray-500 mt-1">
                  سيتم حفظ صورتك في قاعدة البيانات
                </p>
              </div>

              {/* Generation Interface */}
              <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col">
                {uiState === "idle" ? (
                  <div className="flex flex-col h-full">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      صِف مشهد المانجا
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                      صف كيف سيرد بنجي على التعليقات السلبية - هل سيتدرب؟ هل
                      سيصلح المشاكل؟ كن مبدعًا!
                    </p>
                    <PromptInput
                      value={prompt}
                      onChange={setPrompt}
                      readOnly={isLoading}
                      minLines={4}
                      maxLines={8}
                      placeholder="مثال: بنجي البطريق يجلس أمام الكمبيوتر يصلح الأخطاء البرمجية بتركيز شديد..."
                    />
                    <Button
                      onClick={() => void submit()}
                      disabled={
                        isLoading || !prompt.trim() || !userEmail.trim()
                      }
                      className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700"
                    >
                      أنشئ الصورة
                    </Button>
                  </div>
                ) : uiState === "submitting" ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <LoadingView />
                    <p className="text-gray-600 mt-3 text-sm">
                      جاري الإنشاء...
                    </p>
                  </div>
                ) : uiState === "error" ? (
                  <div className="flex flex-col h-full">
                    <ErrorView
                      error={error ?? "حدث خطأ."}
                      onRetry={() => void submit()}
                      onEdit={() => resetToPrompt()}
                    />
                    <div className="mt-3 flex-1">
                      <PromptInput
                        value={prompt}
                        onChange={setPrompt}
                        readOnly={false}
                        minLines={3}
                        maxLines={6}
                        placeholder="عدّل الوصف وحاول مرة أخرى"
                      />
                    </div>
                    <Button
                      onClick={() => void submit()}
                      disabled={isLoading}
                      className="w-full mt-3"
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : (
                  images.length > 0 && (
                    <div className="flex flex-col h-full">
                      <h3 className="font-semibold text-green-600 mb-3">
                        تم إنشاء الصورة بنجاح
                      </h3>
                      <div className="flex-1 overflow-auto">
                        <ImageResult
                          image={images[0].dataUrl}
                          altText={prompt}
                          onDownload={() => void download(images[0].dataUrl)}
                          onCopy={() => void copy(images[0].dataUrl)}
                          onGenerateAgain={() => void generateAgain()}
                          onNewPrompt={() => newPrompt()}
                          onOpen={() => openModal(images[0].dataUrl)}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageModal open={isModalOpen} src={modalSrc} onClose={closeModal} />
    </div>
  );
}
