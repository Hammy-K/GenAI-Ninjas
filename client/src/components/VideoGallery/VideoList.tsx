import { useVideos } from "@/hooks/video-gallery/useVideos";
import VideoItem from "./VideoItem";
import { Loader2, AlertCircle, FileVideo, Sparkles } from "lucide-react";

export default function VideoList() {
  const { data: videos, isLoading, error } = useVideos();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-yellow-800 animate-pulse" />
          </div>
        </div>
        <p className="text-lg font-semibold text-gray-700 mb-2">
          جاري تحميل الفيديوهات...
        </p>
        <p className="text-sm text-gray-500">يرجى الانتظار قليلاً</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg mb-4">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <p className="text-lg font-semibold text-red-600 mb-2">
          حدث خطأ في تحميل الفيديوهات
        </p>
        <p className="text-sm text-gray-500">يرجى المحاولة مرة أخرى لاحقاً</p>
      </div>
    );
  }

  if (!videos?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
            <FileVideo className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </div>
        <p className="text-xl font-bold text-gray-700 mb-2">
          لا توجد فيديوهات حالياً
        </p>
        <p className="text-sm text-gray-500 text-center max-w-md">
          لم يتم العثور على أي فيديوهات في المعرض. يرجى التحقق من المجلد أو
          إضافة فيديوهات جديدة.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg">
              <FileVideo className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">إجمالي الفيديوهات</h3>
              <p className="text-sm text-gray-600">
                {videos.length} فيديو متاح
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold text-violet-600">
            {videos.length}
          </div>
        </div>
      </div>

      {/* Videos grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video: any, index: number) => (
          <div
            key={video.id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <VideoItem video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}
