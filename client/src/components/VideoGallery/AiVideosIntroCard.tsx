import React from "react";
import { Video, Sparkles, Zap, ArrowLeft } from "lucide-react";

export default function AIVideoIntroCard() {
  const handleGenerateClick = () => {
    const currentUrl = window.location.origin;
    window.open(`${currentUrl}/missions/videos`, "_blank");
  };

  return (
    <div className="mb-8 min-h-[160px] bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl hover:shadow-xl transition-shadow duration-300">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-purple-800">
              مشاهدة فيديوهات الذكاء الاصطناعي
            </h2>
            <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
          </div>
        </div>
        <p className="text-purple-700 mb-6 leading-relaxed">
          اكتشف عالم الذكاء الاصطناعي من خلال مجموعة مختارة من الفيديوهات
          التعليمية والتطبيقية المتطورة
        </p>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Zap className="w-4 h-4 text-purple-500" />
            <span>محتوى تعليمي</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>فيديوهات متنوعة</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Video className="w-4 h-4 text-purple-500" />
            <span>تعلم تفاعلي</span>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleGenerateClick}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            شاهد الآن
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
