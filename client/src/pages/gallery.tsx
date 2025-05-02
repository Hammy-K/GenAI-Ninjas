import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuest } from "@/hooks/useQuest";
import { useIsMobile } from "@/hooks/use-mobile";
import { z } from "zod";

interface GalleryImage {
  id: number;
  imageUrl: string;
  studentName: string;
  missionNumber: number;
  likes: number;
  createdAt: string;
}

export default function Gallery() {
  const { xp } = useQuest();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for fetching gallery images
  const { data: images = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/gallery/all'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/gallery/all', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch gallery images");
        }
        
        // Get the response data - should have an 'images' property
        const responseData = await response.json();
        const galleryImages = responseData.images || [];
        
        console.log(`Gallery page: Fetched ${galleryImages.length} gallery images`);
        
        // Filter out images with expired or invalid URLs on the client side
        const currentTime = new Date().getTime();
        const validImages = galleryImages.filter(img => {
          // Skip images without a valid URL
          if (!img || !img.imageUrl) return false;
          
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
                  console.log(`Gallery page: Filtering out expired image ID ${img.id}, expired at ${expirationISO}`);
                  return false;
                }
              }
            } catch (err) {
              console.error('Error parsing image URL expiration:', err);
            }
          }
          return true;
        });
        
        console.log(`Gallery page: Returning ${validImages.length} valid gallery images`);
        return validImages;
      } catch (err) {
        console.error("Error fetching gallery images:", err);
        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: true
  });

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

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Header xp={xp} />
      
      <main className="flex-1 container max-w-7xl py-6 space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">معرض الصور</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            استعرض الصور التي أنشأها الطلاب باستخدام الذكاء الاصطناعي. انقر على زر الإعجاب للتصويت للصور المفضلة لديك!
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-muted rounded-lg">
            <p className="text-lg font-semibold text-destructive">حدث خطأ أثناء تحميل الصور</p>
            <p className="text-muted-foreground">الرجاء المحاولة مرة أخرى لاحقًا</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center p-8 bg-muted rounded-lg">
            <p className="text-lg font-semibold">لا توجد صور في المعرض حاليًا</p>
            <p className="text-muted-foreground">كن أول من يشارك إبداعاته في المعرض!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images
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
                    <div className="mt-3 flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => handleLike(image.id)}
                        disabled={likeMutation.isPending}
                      >
                        <span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-heart"
                          >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </span>
                        <span>{image.likes}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}