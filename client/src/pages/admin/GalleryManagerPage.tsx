import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

interface GalleryImage {
  id: number;
  imageUrl: string;
  studentName: string;
  missionNumber: number;
  likes: number;
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function GalleryManagerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [queryParams] = useState({
    page: 1,
    limit: 200,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [debouncedSearch] = useState(""); // Empty since we don’t need search here

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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/gallery/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete image");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery/all"] });
      toast({ title: "تم الحذف", description: "تم حذف الصورة بنجاح." });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الصورة. حاول مرة أخرى لاحقًا.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="p-4 bg-background border-0">
      <CardHeader>
        <CardTitle className="text-2xl">إدارة الصور في المعرض</CardTitle>
        <CardDescription>
          <b>{galleryData?.images.length}</b> صور في المعرض.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>حدث خطأ أثناء تحميل الصور.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {galleryData?.images.map((img) => (
              <div
                key={img.id}
                className="relative shadow-md rounded-lg overflow-hidden"
              >
                <img
                  src={img.imageUrl}
                  alt={`Image by ${img.studentName}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-2 text-sm">
                  <p className="font-bold">{img.studentName}</p>
                  <p className="text-muted-foreground text-xs">
                    مهمة رقم {img.missionNumber} - {img.likes} إعجاب
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="absolute top-2 right-2"
                  size="sm"
                  onClick={() => deleteMutation.mutate(img.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
