import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useXpTracker } from "@/hooks/useXpTracker";
import { trackStageProgress } from "@/lib/firebase";
import { useDebounce } from "@/hooks/useDebounce";
import SearchInput from "./SearchInput";
import LoadingSpinner from "../LoadingSpinner";
import GalleryGrid from "./GalleryGrid";
import ImageModal from "./ImageModal";

interface GalleryExplorationStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface GalleryImage {
  id: number;
  imageUrl: string;
  studentName: string;
  missionNumber: number;
  likes: number;
  createdAt: string;
}

interface PaginationData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export function SimpleGalleryStageV2({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: GalleryExplorationStageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAlreadyAwarded, markAsAwarded } = useXpTracker();

  const [hasLikedImage, setHasLikedImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedImageIds, setLikedImageIds] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 12,
    sortBy: "likes",
    sortOrder: "desc",
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    trackStageProgress("gallery_exploration", "started");
  }, []);

  useEffect(() => {
    setQueryParams((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  const {
    data: galleryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "/api/gallery/all",
      queryParams.page,
      queryParams.limit,
      debouncedSearch,
      queryParams.sortBy,
      queryParams.sortOrder,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: queryParams.page.toString(),
        limit: queryParams.limit.toString(),
        search: debouncedSearch,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      });

      const response = await fetch(`/api/gallery/all?${searchParams}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch gallery images");
      }

      const data = await response.json();

      return {
        images: data.images as GalleryImage[],
        pagination: data.pagination as PaginationData,
      };
    },
    staleTime: 1000,
  });

  const likeMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch("/api/gallery/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to like image");
      }

      return (await response.json()) as GalleryImage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/api/gallery/all",
          queryParams.page,
          queryParams.limit,
          debouncedSearch,
          queryParams.sortBy,
          queryParams.sortOrder,
        ],
      });

      if (!hasLikedImage) {
        setHasLikedImage(true);

        if (!isAlreadyAwarded("gallery_exploration_like", "xp")) {
          onEarnXp(10, "gallery_exploration_like");
          markAsAwarded("gallery_exploration_like", "xp");

          trackStageProgress("gallery_exploration", "xp_earned", {
            amount: 10,
            source: "gallery_exploration_like",
          });
        }

        const badgeSource = "gallery_exploration";
        const badgeName = "gallery_explorer_badge";
        let badgeAwarded = false;

        if (!isAlreadyAwarded(badgeSource, badgeName)) {
          onUnlockBadge(badgeName, badgeSource);
          markAsAwarded(badgeSource, badgeName);
          badgeAwarded = true;
        }

        if (badgeAwarded) {
          trackStageProgress("gallery_exploration", "badge_unlocked", {
            badge_name: "gallery_explorer_badge",
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في الإعجاب بالصورة. حاول مرة أخرى لاحقًا.",
        variant: "destructive",
      });
      console.error("Error liking image:", error);
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch("/api/gallery/unlike", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to unlike image");
      }

      return (await response.json()) as GalleryImage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/api/gallery/all",
          queryParams.page,
          queryParams.limit,
          debouncedSearch,
          queryParams.sortBy,
          queryParams.sortOrder,
        ],
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء الإعجاب بالصورة. حاول مرة أخرى لاحقًا.",
        variant: "destructive",
      });
      console.error("Error unliking image:", error);
    },
  });

  const handleLike = (imageId: number) => {
    if (likedImageIds.has(imageId)) {
      setLikedImageIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });

      unlikeMutation.mutate(imageId);

      toast({
        title: "تم إلغاء الإعجاب",
        description: "تم إلغاء إعجابك بالصورة",
        variant: "default",
      });

      return;
    }

    setLikedImageIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(imageId);
      return newSet;
    });

    likeMutation.mutate(imageId);
  };

  const handleStageComplete = () => {
    window.location.href = "/";
  };

  const handleComplete = () => {
    trackStageProgress("gallery_exploration", "completed");
    // onComplete();
    handleStageComplete();
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams((prev) => ({ ...prev, page: newPage }));
  };

  const images = galleryData?.images || [];
  const pagination = galleryData?.pagination;

  return (
    <div className="gallery-exploration-stage">
      <Card className="mb-4 border-0 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-center">
            استكشف معرض الصور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p>
              استمتع بمشاهدة الصور التي أنشأها الطلاب باستخدام الذكاء الاصطناعي.
              اضغط على زر الإعجاب للصور المفضلة لديك!
            </p>
          </div>

          <SearchInput value={searchQuery} onChange={setSearchQuery} />

          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                حدث خطأ أثناء تحميل الصور. يرجى المحاولة مرة أخرى.
              </AlertDescription>
            </Alert>
          ) : images.length === 0 ? (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p className="text-lg font-semibold">
                {debouncedSearch
                  ? `لا توجد نتائج لـ "${debouncedSearch}"`
                  : "لا توجد صور في المعرض حاليًا"}
              </p>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? "جرب البحث بكلمات مختلفة"
                  : "يمكنك أن تكون أول من يشارك إبداعاته في المعرض!"}
              </p>
            </div>
          ) : (
            <>
              <GalleryGrid
                images={images}
                likedImageIds={likedImageIds}
                onLike={handleLike}
                onImageClick={setSelectedImage}
                isLiking={likeMutation.isPending || unlikeMutation.isPending}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    الصفحة {pagination.currentPage} من {pagination.totalPages} (
                    {pagination.totalCount} صورة)
                  </span>

                  <Button
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          onClick={onBack}
          className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md"
        >
          <ArrowRight className="h-4 w-4" />
          للخلف
        </Button>

        <div className="relative">
          {/* Celebration effects */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          <div className="absolute -top-1 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-bounce opacity-70"></div>

          <Button
            onClick={handleComplete}
            className="relative flex items-center gap-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-6 py-3 text-lg font-bold border-2 border-green-400/30"
          >
            {/* Sparkle effects inside button */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded"></div>

            <div className="flex items-center gap-3 relative z-10">
              <Trophy className="h-5 w-5 text-yellow-300 animate-pulse" />
              <span className="bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent font-extrabold">
                أكملت الرحلة! 🎉
              </span>
              <Sparkles className="h-5 w-5 text-yellow-300 animate-spin" />
            </div>

            <ArrowLeft className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {selectedImage && (
          <ImageModal
            image={selectedImage}
            isLiked={likedImageIds.has(selectedImage.id)}
            onClose={() => setSelectedImage(null)}
            onLike={() => handleLike(selectedImage.id)}
            isLiking={likeMutation.isPending || unlikeMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
