import React from "react";
import ImageCard from "./ImageCard";

interface GalleryImage {
  id: number;
  imageUrl: string;
  studentName: string;
  missionNumber: number;
  likes: number;
  createdAt: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  likedImageIds: Set<number>;
  onLike: (imageId: number) => void;
  onImageClick: (image: GalleryImage) => void;
  isLiking: boolean;
}

export default function GalleryGrid({
  images,
  likedImageIds,
  onLike,
  onImageClick,
  isLiking,
}: GalleryGridProps) {
  const validImages = images.filter(
    (image) => image.imageUrl && image.imageUrl.trim() !== "",
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {validImages.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          isLiked={likedImageIds.has(image.id)}
          onLike={() => onLike(image.id)}
          onClick={() => onImageClick(image)}
          isLiking={isLiking}
        />
      ))}
    </div>
  );
}
