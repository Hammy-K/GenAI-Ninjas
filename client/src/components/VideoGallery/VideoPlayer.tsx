import { useVideoEmbedUrl } from "@/hooks/video-gallery/useVideoEmbedUrl";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Play,
  Loader2,
  AlertCircle,
  Maximize2,
  Home,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

export default function VideoPlayer() {
  const [location] = useLocation();
  const videoId = location.split("/").pop();

  if (!videoId) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            الفيديو غير موجود
          </h2>
          <p className="text-gray-600 mb-6">
            لم يتم العثور على الفيديو المطلوب
          </p>
          <Link to="/missions/videos">
            <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto">
              <Home className="w-4 h-4" />
              العودة للمعرض
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: embedUrl, isLoading } = useVideoEmbedUrl(videoId || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mx-auto">
              <Play className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            جاري تحميل الفيديو...
          </h2>
          <p className="text-gray-600">يرجى الانتظار قليلاً</p>
        </div>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            فشل في تحميل الفيديو
          </h2>
          <p className="text-gray-600 mb-6">
            الفيديو غير متاح حالياً أو تم حذفه
          </p>
          <Link to="/missions/videos">
            <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto">
              <Home className="w-4 h-4" />
              العودة للمعرض
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2e8] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/missions/videos">
              <button className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium transition-colors group">
                <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                العودة للمعرض
              </button>
            </Link>

            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Link to="/" className="text-violet-600 hover:underline">
                الرئيسية
              </Link>
              {/* <span>الرئيسية</span> */}
              <span>/</span>
              <Link
                to="/missions/videos"
                className="text-violet-600 hover:underline"
              >
                معرض الفيديوهات
              </Link>
              <span>/</span>
              <span>مشغل الفيديو</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  مشغل الفيديو
                </h1>
                <p className="text-purple-100">
                  استمتع بمشاهدة الفيديو بأفضل جودة
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-100">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm">وضع ملء الشاشة</span>
              </div>
            </div>
          </div>

          <div className="relative bg-black">
            <iframe
              title="مشغل الفيديو"
              src={embedUrl}
              allow="autoplay; fullscreen; picture-in-picture"
              className="w-full h-[500px] md:h-[600px] lg:h-[700px]"
              style={{ border: "none" }}
            />
          </div>

          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Play className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    يتم التشغيل الآن
                  </p>
                  <p className="text-xs text-gray-500">فيديو من Google Drive</p>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                معرف الفيديو: {videoId.substring(0, 8)}...
              </div>
            </div>
          </div>
        </div>

        {/* Additional Controls */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white rounded-xl p-2 shadow-lg border border-purple-100 flex items-center gap-4">
            <div className="text-sm text-gray-600">
              💡 يمكنك استخدام مفاتيح المسافة للتشغيل والإيقاف
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
