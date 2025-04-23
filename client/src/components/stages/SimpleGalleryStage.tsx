import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, AlertCircle, Heart, Search, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useXpTracker } from "@/hooks/useXpTracker";
import { trackStageProgress } from "@/lib/firebase";
import { Input } from "@/components/ui/input";

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

export function SimpleGalleryStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: GalleryExplorationStageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAlreadyAwarded, markAsAwarded } = useXpTracker();
  const [hasLikedImage, setHasLikedImage] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [likedImageIds, setLikedImageIds] = useState<Set<number>>(new Set());
  
  // Debounce name filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(nameFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [nameFilter]);

  // Track stage progress on mount
  useEffect(() => {
    trackStageProgress("gallery_exploration", "started");
  }, []);

  // Query for fetching gallery images
  const {
    data: images = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/gallery/all"],
    queryFn: async () => {
      const response = await fetch("/api/gallery/all", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch gallery images");
      }

      // Handle both the new API format and old API format
      const data = await response.json();
      let galleryImages = [];
      
      if (Array.isArray(data)) {
        galleryImages = data; // Old API format
      } else if (data.images && Array.isArray(data.images)) {
        galleryImages = data.images; // New API format
      }

      return galleryImages as GalleryImage[];
    },
    staleTime: 60 * 1000, // 1 minute cache
  });

  // Filter images by student name if filter is provided
  const filteredImages = debouncedFilter 
    ? images.filter(image => 
        image.studentName && 
        image.studentName.toLowerCase().includes(debouncedFilter.toLowerCase())
      )
    : images;
    
  // Sort images by most liked
  const sortedImages = [...filteredImages].sort((a, b) => b.likes - a.likes);

  // Mutation for liking an image
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
      // Invalidate the gallery query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/gallery/all"] });

      // Award XP for first like if not already awarded
      if (!hasLikedImage) {
        setHasLikedImage(true);

        // Award XP and track it
        if (!isAlreadyAwarded("gallery_exploration_like", "xp")) {
          onEarnXp(10, "gallery_exploration_like");
          markAsAwarded("gallery_exploration_like", "xp");

          trackStageProgress("gallery_exploration", "xp_earned", {
            amount: 10,
            source: "gallery_exploration_like",
          });
        }

        // Award badge only once
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

  // Handle liking an image
  const handleLike = (imageId: number) => {
    // Check if the image has already been liked
    if (likedImageIds.has(imageId)) {
      // Image already liked, show toast
      toast({
        title: "ملاحظة",
        description: "لقد قمت بالإعجاب بهذه الصورة مسبقاً",
        variant: "default",
      });
      return;
    }
    
    // Add to liked images set
    setLikedImageIds(prev => {
      const newSet = new Set(prev);
      newSet.add(imageId);
      return newSet;
    });
    
    // Call API to like the image
    likeMutation.mutate(imageId);
  };

  // Handle stage completion
  const handleComplete = () => {
    // Track completion
    trackStageProgress("gallery_exploration", "completed");
    onComplete();
  };

  return (
    <div className="gallery-exploration-stage">
      <Card className="mb-6">
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
          
          {/* Search filter */}
          <div className="relative mb-6">
            <div className="flex items-center border rounded-md px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <Input 
                type="text"
                placeholder="ابحث باسم الطالب..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="border-0 p-0 shadow-none focus-visible:ring-0 w-full text-sm"
                dir="auto"
              />
              {nameFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => setNameFilter("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {debouncedFilter && (
              <p className="text-xs text-muted-foreground mt-1 mr-1">
                عرض النتائج التي تطابق: "{debouncedFilter}"
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                حدث خطأ أثناء تحميل الصور. يرجى المحاولة مرة أخرى.
              </AlertDescription>
            </Alert>
          ) : sortedImages.length === 0 ? (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p className="text-lg font-semibold">
                لا توجد صور في المعرض حاليًا
              </p>
              <p className="text-muted-foreground">
                يمكنك أن تكون أول من يشارك إبداعاته في المعرض!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedImages
                .filter(
                  (image) => image.imageUrl && image.imageUrl.trim() !== ""
                )
                .map((image) => (
                  <div
                    key={image.id}
                    className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={`صورة بواسطة ${image.studentName}`}
                        className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                        onError={(e) => {
                          // Hide the card if image fails to load
                          const card = e.currentTarget.closest(".bg-card");
                          if (card) card.classList.add("hidden");
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <p className="font-bold">تصميم: {image.studentName}</p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant={likedImageIds.has(image.id) ? "default" : "outline"}
                          size="sm"
                          className={`flex items-center gap-2 ${likedImageIds.has(image.id) ? "bg-pink-100 hover:bg-pink-200 border-pink-200" : ""}`}
                          onClick={() => handleLike(image.id)}
                          disabled={likeMutation.isPending || likedImageIds.has(image.id)}
                          title={likedImageIds.has(image.id) ? "لقد قمت بالإعجاب بهذه الصورة" : "أعجبني"}
                        >
                          <Heart className={`h-4 w-4 ${likedImageIds.has(image.id) ? "fill-red-500 text-red-500" : ""}`} />
                          <span>{image.likes}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              للخلف
            </Button>
            <Button
              onClick={handleComplete}
              className="flex items-center gap-2"
            >
              المتابعة
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}