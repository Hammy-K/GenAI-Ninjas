import { Link } from "wouter";
import VideoList from "./VideoList";
import { FileVideo, Sparkles, Zap, Play, ArrowRight } from "lucide-react";

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-[#f5f2e8] font-sans">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        {/* <div className="mb-5">
          <Link to="/" className="">
            <button className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium transition-colors group">
              <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              الرئيسية
            </button>
          </Link>
        </div> */}
        <div className="mb-8 min-h-[200px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 rounded-2xl border border-purple-200 shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileVideo className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">
                  معرض الفيديوهات الذكي
                </h1>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
              </div>
            </div>

            <p className="text-lg text-purple-100 mb-6 leading-relaxed">
              استعرض وشاهد مجموعتك من الفيديوهات بتجربة مميزة وسهلة. جميع
              فيديوهاتك منظمة ومتاحة بنقرة واحدة!
            </p>

            <div className="flex items-center flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>تحميل سريع</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Play className="w-4 h-4 text-yellow-300" />
                <span>مشاهدة مباشرة</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <FileVideo className="w-4 h-4 text-yellow-300" />
                <span>جودة عالية</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>مشاهدة ممتعة للجميع</span>
            </div>
          </div>
        </div>

        {/* Navigation breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link to="/" className="text-violet-600 hover:underline">
            الرئيسية
          </Link>

          <span className="text-gray-400">/</span>
          <span className="text-violet-600 font-medium">معرض الفيديوهات</span>
        </div>

        {/* Video List */}
        <VideoList />
      </div>
    </div>
  );
}
