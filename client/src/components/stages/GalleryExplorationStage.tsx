import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, AlertCircle, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useXpTracker } from '@/hooks/useXpTracker';
import { trackStageProgress } from '@/lib/firebase';

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

export function GalleryExplorationStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack
}: GalleryExplorationStageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { awardXp, awardBadge } = useXpTracker();
  const [hasLikedImage, setHasLikedImage] = useState(false);

  // Track stage progress on mount
  useEffect(() => {
    trackStageProgress('gallery_exploration', 'started');
  }, []);

  // Query for fetching gallery images
  const { data: images = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/gallery/all'],
    queryFn: async () => {
      const response = await fetch('/api/gallery/all', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gallery images');
      }
      
      const galleryImages = await response.json() as GalleryImage[];
      console.log(`Fetched ${galleryImages.length} gallery images`);
      
      // Filter out images with expired or invalid URLs on the client side
      const currentTime = new Date().getTime();
      const validImages = galleryImages.filter(img => {
        // Check for expired DALL-E URLs
        if (img.imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
          // Try to extract expiration time from URL
          try {
            const seMatch = img.imageUrl.match(/se=([^&]+)/);
            if (seMatch && seMatch[1]) {
              const expirationISO = decodeURIComponent(seMatch[1]);
              const expirationTime = new Date(expirationISO).getTime();
              
              // If URL is expired, return false to filter it out
              if (currentTime > expirationTime) {
                console.log(`Filtering out expired image ID ${img.id}, expired at ${expirationISO}`);
                return false;
              }
            }
          } catch (err) {
            console.error('Error parsing image URL expiration:', err);
          }
        }
        return true;
      });
      
      console.log(`Returning ${validImages.length} valid gallery images`);
      return validImages;
    },
    staleTime: 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: true
  });

  // Sort images by most liked
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
        throw new Error('Failed to like image');
      }
      
      return await response.json() as GalleryImage;
    },
    onSuccess: () => {
      // Invalidate the gallery query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/gallery/all'] });
      
      // Award XP for first like if not already awarded
      if (!hasLikedImage) {
        setHasLikedImage(true);
        
        // Award XP only once
        const awarded = awardXp(onEarnXp, 10, 'gallery_exploration_like');
        if (awarded) {
          trackStageProgress('gallery_exploration', 'xp_earned', {
            amount: 10,
            source: 'gallery_exploration_like'
          });
        }
        
        // Award badge only once
        const badgeAwarded = awardBadge(
          onUnlockBadge,
          'gallery_explorer_badge',
          'gallery_exploration'
        );
        
        if (badgeAwarded) {
          trackStageProgress('gallery_exploration', 'badge_unlocked', {
            badge_name: 'gallery_explorer_badge'
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في الإعجاب بالصورة. حاول مرة أخرى لاحقًا.',
        variant: 'destructive',
      });
      console.error('Error liking image:', error);
    }
  });

  // Handle liking an image
  const handleLike = (imageId: number) => {
    likeMutation.mutate(imageId);
  };

  // Handle stage completion
  const handleComplete = () => {
    // Track completion
    trackStageProgress('gallery_exploration', 'completed');
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
              استمتع بمشاهدة الصور التي أنشأها الطلاب باستخدام الذكاء الاصطناعي. اضغط على زر الإعجاب للصور المفضلة لديك!
            </p>
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
              <p className="text-lg font-semibold">لا توجد صور في المعرض حاليًا</p>
              <p className="text-muted-foreground">
                يمكنك أن تكون أول من يشارك إبداعاته في المعرض!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedImages
                .filter(image => image.imageUrl && image.imageUrl.trim() !== "") // Skip images with missing URLs
                .map((image) => (
                  <div key={image.id} className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={image.imageUrl} 
                        alt={`صورة بواسطة ${image.studentName}`}
                        className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                        onError={(e) => {
                          // Hide the card if image fails to load
                          const card = e.currentTarget.closest('.bg-card');
                          if (card) card.classList.add('hidden');
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <p className="font-bold">بواسطة: {image.studentName}</p>
                        <p className="text-sm text-muted-foreground">مهمة {image.missionNumber}</p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleLike(image.id)}
                          disabled={likeMutation.isPending}
                        >
                          <Heart className="h-4 w-4" />
                          <span>{image.likes}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              العودة للخلف
            </Button>
            <Button onClick={handleComplete} className="flex items-center gap-2">
              المتابعة
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}