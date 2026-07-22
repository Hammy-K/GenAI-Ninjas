import { useState } from "react";
import { createPortal } from "react-dom";
import type { LovableProgressFlags } from "../types/lovable.types";

interface ProgressDisplayProps {
  progress: LovableProgressFlags;
  videoUrl?: string;
  videoTitle?: string;
}

export function ProgressDisplay({
  progress,
  videoUrl = "https://www.youtube.com/embed/WkBfskJllwI?si=RBxG95JOGcBwoLgW", // Replace with your actual video URL
  videoTitle = "خطوات المشروع",
}: ProgressDisplayProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  // Calculate progress percentage for display
  const steps = [
    { key: "welcomeDone", label: "الترحيب" },
    { key: "ideationOngoing", label: "توليد الأفكار" },
    { key: "readyDone", label: "جاهزية المشروع" },
    { key: "buildingOngoing", label: "بدء البناء" },
  ] as const;

  const isDone = (k: keyof LovableProgressFlags) => Boolean(progress?.[k]);
  const completedCount = steps.filter((s) => isDone(s.key)).length;
  const totalSteps = steps.length;
  const pct = Math.round((completedCount / totalSteps) * 100);

  const handleVideoClick = () => {
    setIsEnlarged(true);
  };

  const handleCloseVideo = () => {
    setIsEnlarged(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsEnlarged(false);
    }
  };

  return (
    <>
      {/* Compact Video Display */}
      <div dir="rtl" className="space-y-3">
        {/* Video Container */}
        <div className="relative">
          <div
            onClick={handleVideoClick}
            className="relative aspect-video w-full rounded-lg overflow-hidden cursor-pointer group border border-border shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Video Iframe */}
            <iframe
              src={videoUrl}
              title={videoTitle}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ pointerEvents: "none" }} // Prevent interaction in compact mode
            />
          </div>
        </div>
      </div>

      {/* Enlarged Video Modal */}
      {isEnlarged &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4"
            style={{
              zIndex: 2147483647, // Maximum safe integer for z-index
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              isolation: "isolate", // Creates new stacking context
            }}
            onClick={handleBackdropClick}
          >
            <div
              className="relative w-full max-w-6xl mx-auto"
              style={{ zIndex: 2147483647 }}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseVideo}
                className="absolute -top-12 right-0 text-white hover:text-muted transition-colors duration-200 bg-black bg-opacity-50 rounded-full p-2"
                aria-label="إغلاق الفيديو"
                style={{ zIndex: 2147483647 }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Enlarged Video */}
              <div
                className="aspect-video w-full rounded-lg overflow-hidden shadow-2xl"
                style={{
                  zIndex: 2147483646,
                  position: "relative",
                  isolation: "isolate",
                }}
              >
                <iframe
                  src={videoUrl}
                  title={videoTitle}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ zIndex: 2147483645 }}
                />
              </div>

              {/* Video Info */}
              <div className="text-center mt-4" style={{ zIndex: 2147483644 }}>
                <h3 className="text-white text-lg font-semibold">
                  {videoTitle}
                </h3>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
