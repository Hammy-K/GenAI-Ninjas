import React from "react";
import { Heart, User, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: number;
  imageUrl: string;
  studentName: string;
  missionNumber: number;
  likes: number;
  createdAt: string;
}

interface ImageCardProps {
  image: GalleryImage;
  isLiked: boolean;
  onLike: () => void;
  onClick: () => void;
  isLiking: boolean;
}

export default function ImageCard({
  image,
  isLiked,
  onLike,
  onClick,
  isLiking,
}: ImageCardProps) {
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
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 border border-purple-100"
      onClick={onClick}
    >
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-violet-200/30 to-transparent rounded-full blur-xl group-hover:animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-lg"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={getImageUrl(image.imageUrl)}
            alt={`صورة بواسطة ${image.studentName}`}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110 cursor-pointer"
            onClick={onClick}
            onLoad={() => console.log(`Image loaded: ${image.id}`)}
            onError={(e) => {
              console.log(
                `Image error loading: ${image.id}, URL: ${image.imageUrl}`,
              );
              const card = e.currentTarget.closest(".group");
              if (card) card.classList.add("hidden");
            }}
          />

          {/* Always visible overlay with details */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {image.studentName}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike();
                  }}
                  disabled={isLiking}
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    isLiked
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-lg scale-105"
                      : "bg-white/20 hover:bg-red-500 text-white hover:text-white border border-white/30 hover:border-red-500 backdrop-blur-sm"
                  }`}
                  title={isLiked ? "إلغاء الإعجاب" : "أعجبني"}
                >
                  <Heart
                    className={`w-4 h-4 transition-all duration-200 ${
                      isLiked ? "fill-current " : ""
                    }`}
                  />
                  <span className="font-medium">{image.likes}</span>
                </Button>
              </div>

              {image.createdAt && (
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">{formatDate(image.createdAt)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs opacity-75">
                  المهمة # {image.missionNumber}
                </span>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">عرض</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mission badge */}
          {/* <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-xs font-medium shadow-lg">
            مهمة #{image.missionNumber}
          </div> */}
        </div>
      </div>

      {/* Decorative dots */}
      <div className="absolute top-4 left-4 opacity-30">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping"></div>
          <div
            className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
