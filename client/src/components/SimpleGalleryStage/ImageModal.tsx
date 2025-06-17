import React, { useEffect } from "react";
import { X, Heart, User, Calendar, Star, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: number;
  imageUrl: string;
  studentName: string;
  missionNumber: number;
  likes: number;
  createdAt: string;
}

interface ImageModalProps {
  image: GalleryImage;
  isLiked: boolean;
  onClose: () => void;
  onLike: () => void;
  isLiking: boolean;
}

export default function ImageModal({
  image,
  isLiked,
  onClose,
  onLike,
  isLiking,
}: ImageModalProps) {
  const getImageUrl = (url: string) => {
    if (
      url.startsWith("/generated-images/") ||
      url.startsWith("/api/ai/image-proxy")
    ) {
      return url;
    }
    if (url.startsWith("http")) {
      return `/api/ai/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("ar-SA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden"; // Prevent background scrolling

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(getImageUrl(image.imageUrl));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${image.studentName}-mission-${image.missionNumber}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Modal overlay */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal content */}
      <div className="relative max-w-6xl max-h-[95vh] w-full flex flex-col lg:flex-row bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-10 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 rounded-full w-10 h-10 p-0"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Image section */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center min-h-[60vh] lg:min-h-[80vh]">
          <img
            src={getImageUrl(image.imageUrl)}
            alt={`صورة بواسطة ${image.studentName}`}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "90vh" }}
          />

          {/* Floating details overlay */}
          {/* <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-sm">{image.studentName}</span>
            </div>
          </div> */}
        </div>

        {/* Details sidebar */}
        <div className="w-full lg:w-80 bg-white p-6 flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              تفاصيل الصورة
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"></div>
          </div>

          {/* Student info */}
          <div className="mb-6">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {image.studentName}
                </h3>
                <p className="text-sm text-gray-600">منشئ الصورة</p>
              </div>
            </div>
          </div>

          {/* Mission info */}
          <div className="mb-6">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  المهمة #{image.missionNumber}
                </h3>
                <p className="text-sm text-gray-600">مهمة الذكاء الاصطناعي</p>
              </div>
            </div>
          </div>

          {/* Date info */}
          {image.createdAt && (
            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <div className="flex-shrink-0 p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">تاريخ الإنشاء</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(image.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex-1 flex flex-col justify-end space-y-3">
            {/* Like button */}
            <Button
              onClick={onLike}
              disabled={isLiking}
              className={`w-full py-3 transition-all duration-300 ${
                isLiked
                  ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg transform scale-105"
                  : "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-red-50 hover:to-pink-50 text-gray-700 hover:text-red-600 border-2 border-gray-200 hover:border-red-200"
              }`}
            >
              <Heart
                className={`w-5 h-5 mr-2 transition-all duration-200 ${
                  isLiked ? "fill-current" : ""
                }`}
              />
              <span className="font-bold">
                {isLiked ? "أعجبني" : "أعجبني"} ({image.likes})
              </span>
            </Button>

            {/* Download button */}
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full py-3 border-2 border-violet-200 hover:bg-violet-50 hover:border-violet-300 text-violet-700 font-bold"
            >
              <Download className="w-5 h-5 mr-2" />
              تحميل الصورة
            </Button>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              اضغط على Esc أو انقر خارج الصورة للإغلاق
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
