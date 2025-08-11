import { Link } from "wouter";
import VideoList from "./VideoList";
import { FileVideo, Sparkles, Zap, Play } from "lucide-react";
import { Header } from "../layout/Header";
import { useQuest } from "@/hooks/useQuest";

export default function VideoPage() {
  const { xp } = useQuest();

  return (
    <div className="min-h-screen bg-[#f5f2e8] font-sans">
      <Header xp={xp} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 rounded-2xl border border-purple-200 shadow-2xl transform  transition-all duration-300 relative overflow-hidden">
          {/* Animated background elements */}
          {/* <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div> */}
          {/* <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div> */}

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

            <p className="text-lg text-purple-100 leading-relaxed ">
              اكتشف عالم الذكاء الاصطناعي من خلال مجموعة مختارة من الفيديوهات
              التعليمية والتطبيقية المتطورة
            </p>

            {/* <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>مشاهدة ممتعة للجميع</span>
            </div> */}
          </div>
        </div>

        <VideoList />
      </div>
    </div>
  );
}
