import { Link } from "wouter";
import { ArrowRight, FileVideo, Play } from "lucide-react";

export default function VideoPlayerHeader({
  categoryTitle,
}: {
  categoryTitle: string;
}) {
  return (
    <div
      className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-4 rounded-2xl shadow-xl relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      <div className="relative z-10 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <Play className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-1">مشغل الفيديو</h1>
          <p className="text-purple-100">الفئة: {categoryTitle}</p>
        </div>
        <Link to="/missions/videos">
          <button className="flex items-center gap-2 text-white/90 hover:text-white font-medium transition group">
            <FileVideo className="w-4 h-4  transition" />
            العودة للمعرض
          </button>
        </Link>
      </div>
    </div>
  );
}
