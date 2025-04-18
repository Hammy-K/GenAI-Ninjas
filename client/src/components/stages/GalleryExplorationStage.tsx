import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackStageProgress } from "@/lib/firebase";

// Define the component props
interface GalleryExplorationStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

// Define the GalleryImage interface
interface GalleryImage {
  id: number;
  imageUrl: string;
  studentName: string;
  likes: number;
  createdAt: string;
}

export function GalleryExplorationStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: GalleryExplorationStageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasEarnedXp, setHasEarnedXp] = useState(false);
  const [hasUnlockedBadge, setHasUnlockedBadge] = useState(false);

  // Query for fetching gallery images
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['/api/gallery/all'],
    queryFn: async () => {
      const response = await fetch('/api/gallery/all', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch gallery images");
      }
      return await response.json() as GalleryImage[];
    }
  });

  // Sort images by likes (most liked first)
  const sortedImages = [...images].sort((a, b) => b.likes - a.likes);

  // Mutation for liking an image
  const likeMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch('/api/gallery/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId }),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to like image");
      }
      return await response.json() as GalleryImage;
    },
    onSuccess: () => {
      // Invalidate the gallery query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/gallery/all'] });
      
      // Award XP if not already awarded and this is the first like
      if (!hasEarnedXp) {
        onEarnXp(10, "gallery_exploration_like");
        setHasEarnedXp(true);
        
        // Track the event
        trackStageProgress("gallery_exploration", "xp_earned", {
          source: "gallery_exploration_like",
          amount: 10
        });
      }
      
      // Unlock badge if not already unlocked and user has liked at least one image
      if (!hasUnlockedBadge) {
        onUnlockBadge("gallery_explorer_badge", "gallery_exploration");
        setHasUnlockedBadge(true);
        
        // Track the event
        trackStageProgress("gallery_exploration", "badge_unlocked", {
          badge: "gallery_explorer_badge"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في الإعجاب بالصورة. حاول مرة أخرى لاحقًا.",
        variant: "destructive",
      });
      console.error("Error liking image:", error);
    }
  });

  // Handle liking an image
  const handleLike = (imageId: number) => {
    likeMutation.mutate(imageId);
  };

  // Track the page view when the component mounts
  useEffect(() => {
    trackStageProgress("gallery_exploration", "started");
    
    // Complete the stage when user navigates away
    return () => {
      trackStageProgress("gallery_exploration", "completed");
    };
  }, []);

  return (
    <div className="gallery-exploration-stage">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">
              معرض الصور الإبداعية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p>
                استكشف الصور التي أنشأها الطلاب الآخرون وشارك بإعجابك بالصور المفضلة لديك!
              </p>
            </div>

            {/* Gallery Display */}
            <div className="mb-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p className="text-lg font-semibold text-destructive">حدث خطأ أثناء تحميل الصور</p>
                  <p className="text-muted-foreground">الرجاء المحاولة مرة أخرى لاحقًا</p>
                </div>
              ) : sortedImages.length === 0 ? (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p className="text-lg font-semibold">لا توجد صور في المعرض حاليًا</p>
                  <p className="text-muted-foreground">كن أول من يشارك إبداعاته في المعرض!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedImages.map((image) => (
                    <div key={image.id} className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <div className="aspect-square relative overflow-hidden">
                        <img 
                          src={image.imageUrl} 
                          alt={`صورة بواسطة ${image.studentName}`}
                          className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <p className="font-bold">بواسطة: {image.studentName}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleLike(image.id)}
                            disabled={likeMutation.isPending}
                          >
                            <Heart className="h-4 w-4 fill-current text-red-500" />
                            <span>{image.likes}</span>
                          </Button>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">
                            {new Date(image.createdAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                السابق
              </span>
            </Button>
            <Button
              onClick={onComplete}
              size="lg"
            >
              <span className="flex items-center">
                التالي
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}