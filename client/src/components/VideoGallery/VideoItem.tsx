import { Link } from "wouter";
import { Play, FileVideo, HardDrive, Eye } from "lucide-react";

export default function VideoItem({ video }: { video: any }) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 بايت";
    const k = 1024;
    const sizes = ["بايت", "كيلو بايت", "ميجا بايت", "جيجا بايت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 border border-purple-100 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-200/30 to-transparent rounded-full blur-xl group-hover:animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-lg"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Video preview/thumbnail area */}
        <div className="mb-4">
          <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-lg group/preview">
            {video.embedUrl ? (
              <iframe
                src={video.embedUrl}
                className="w-full h-full object-cover"
                title={`Preview of ${video.name}`}
                loading="lazy"
                allow="autoplay"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600">
                <FileVideo className="w-12 h-12 text-white opacity-80" />
              </div>
            )}

            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform scale-90 group-hover/preview:scale-100 transition-transform duration-300 shadow-xl">
                <Play className="w-8 h-8 text-violet-600" />
              </div>
            </div>

            {/* Video type badge */}
            {video.mimeType && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                {video.mimeType.split("/")[1].toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Video info */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-md">
            <FileVideo className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 mb-2 truncate group-hover:text-violet-600 transition-colors">
              {video.name}
            </h2>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <HardDrive className="w-4 h-4 text-violet-500" />
                <span>{formatFileSize(parseInt(video.size))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <Link to={`/missions/videos/${video.id}`}>
          <button className="w-full group/btn bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3">
            <Play className="w-5 h-5 group-hover/btn:animate-pulse" />
            <span>مشاهدة الفيديو</span>
            <Eye className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>

      {/* Decorative dots */}
      <div className="absolute top-4 left-4 opacity-30">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping"></div>
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping animation-delay-100"></div>
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping animation-delay-200"></div>
        </div>
      </div>
    </div>
  );
}
