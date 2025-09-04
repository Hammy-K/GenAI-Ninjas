import { Video } from "../content/video-gallery.types";
import VideoItem from "./VideoItem";

export default function VideoList({
  categorySlug,
  videos,
}: {
  categorySlug: string;
  videos: Video[];
}) {
  if (!videos.length) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-bold text-gray-700 mb-2">لا توجد فيديوهات</p>
        <p className="text-sm text-gray-500">
          سيتم إضافة محتوى هذه الفئة قريبًا.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((v) => (
        <VideoItem key={v.slug} categorySlug={categorySlug} video={v} />
      ))}
    </div>
  );
}
