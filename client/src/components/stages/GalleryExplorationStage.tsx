import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, AlertCircle, Heart, Search, Loader2 } from "lucide-react";
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

// Interface for gallery image from DB
interface GalleryImage {
  id: number;
  imageUrl: string;
  studentName: string;
  missionNumber: number;
  likes: number;
  createdAt: string;
}

// Interface for gallery image from Firebase
interface FirebaseGalleryImage {
  name: string;
  url: string;
  contentType: string;
  size: number;
  timeCreated: string;
  updated: string;
  metadata: {
    studentName?: string;
    missionNumber?: string;
    uploadedAt?: string;
    prompt?: string;
    sessionId?: string;
  };
}

// Generic image type for both sources
type GenericImage = Record<string, any>;

// Interface for gallery response pagination
interface GalleryPagination {
  nextPageToken?: string;
  currentPage: number;
  totalPages?: number;
  totalCount?: number;
  limit: number;
}

// Interface for query result page
interface GalleryPage {
  images: GenericImage[];
  nextPageToken?: string;
  currentPage: number;
}

export function GalleryExplorationStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: GalleryExplorationStageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { awardXpOnce, isAlreadyAwarded, markAsAwarded } = useXpTracker();
  const [hasLikedImage, setHasLikedImage] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

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

  // Function to fetch gallery images with pagination and filtering
  const fetchGalleryImages = async ({ pageParam }: { pageParam?: string }) => {
    // Build query parameters including pagination token and filters
    const queryParams = new URLSearchParams();
    if (pageParam) {
      queryParams.append("pageToken", pageParam);
    }
    if (debouncedFilter) {
      queryParams.append("name", debouncedFilter);
    }
    queryParams.append("limit", "8"); // Request 8 images per page
    
    const url = `/api/gallery/all${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch gallery images");
    }

    const data = await response.json();
    
    // Log fetched data for debugging
    console.log(`Fetched gallery images (page: ${data.pagination?.currentPage || 1})`);
    
    // For API compatibility with older versions
    let images: GenericImage[] = [];
    let nextPageToken: string | undefined;
    let currentPage = 1;
    
    if (data.images && Array.isArray(data.images)) {
      images = data.images;
      nextPageToken = data.pagination?.nextPageToken;
      currentPage = data.pagination?.currentPage || 1;
    } else if (Array.isArray(data)) {
      images = data;
    }
    
    return {
      images,
      nextPageToken,
      currentPage
    } as GalleryPage;
  };

  // Use infinite query for pagination
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ["/api/gallery/all", debouncedFilter],
    queryFn: fetchGalleryImages,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    initialPageParam: undefined as string | undefined,
    staleTime: 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: true,
  });

  // Set up intersection observer for infinite scroll
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      console.log("Intersection observed, loading next page...");
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Set up the observer when loaderRef changes
  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, { threshold: 0.5 });
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [observerCallback, loaderRef]);

  // Helper functions to get data from either image type
  const getStudentName = (img: GenericImage): string => {
    if ('studentName' in img && typeof img.studentName === 'string') {
      return img.studentName;
    } 
    if (img.metadata && 'studentName' in img.metadata && typeof img.metadata.studentName === 'string') {
      return img.metadata.studentName;
    }
    return "طالب مبدع"; // Default name
  };

  const getImageUrl = (img: GenericImage): string => {
    if ('imageUrl' in img && typeof img.imageUrl === 'string') {
      return img.imageUrl;
    }
    if ('url' in img && typeof img.url === 'string') {
      return img.url;
    }
    return ""; // Empty string will be filtered out
  };

  const getImageId = (img: GenericImage): number | string => {
    if ('id' in img && typeof img.id === 'number') {
      return img.id;
    }
    if ('name' in img && typeof img.name === 'string') {
      return img.name; // Use name as fallback id for Firebase images
    }
    return Math.random().toString(36).substring(2, 15); // Random ID as last resort
  };

  const getLikes = (img: GenericImage): number => {
    if ('likes' in img && typeof img.likes === 'number') {
      return img.likes;
    }
    return 0; // Firebase images don't have likes yet
  };

  // Flatten and process the images from all pages
  const allImages = data?.pages.flatMap(page => page.images) || [];
  
  // Sort images by most liked
  const sortedImages = [...allImages].sort((a, b) => getLikes(b) - getLikes(a));

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

      return await response.json();
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
            <div className="flex items-center border rounded-md overflow-hidden">
              <Input
                type="text"
                placeholder="ابحث باسم الطالب..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="flex-grow border-0 focus-visible:ring-0"
                dir="rtl"
              />
              <div className="px-3 py-2 bg-muted">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            {debouncedFilter && (
              <p className="text-xs mt-1 text-muted-foreground">
                نتائج البحث لـ: {debouncedFilter}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedImages
                  .filter(image => {
                    const url = getImageUrl(image);
                    return url && url.trim() !== "";
                  })
                  .map(image => {
                    const imageUrl = getImageUrl(image);
                    const studentName = getStudentName(image);
                    const imageId = getImageId(image);
                    const likes = getLikes(image);
                    
                    return (
                      <div
                        key={imageId.toString()}
                        className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`صورة بواسطة ${studentName}`}
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
                            <p className="font-bold">تصميم: {studentName}</p>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() => typeof imageId === 'number' && handleLike(imageId)}
                              disabled={likeMutation.isPending || typeof imageId !== 'number'}
                            >
                              <Heart className="h-4 w-4" />
                              <span>{likes}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* Infinite scroll loader */}
              {hasNextPage && (
                <div 
                  ref={loaderRef} 
                  className="flex justify-center items-center my-8 py-4"
                >
                  {isFetchingNextPage ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">جاري تحميل المزيد من الصور...</p>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      تحميل المزيد من الصور
                    </Button>
                  )}
                </div>
              )}
            </>
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
