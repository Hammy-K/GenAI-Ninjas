import React from "react";
import { Gamepad2, Sparkles, Zap, ArrowRight, ArrowLeft } from "lucide-react";

export default function AIGameGeneratorIntroCard() {
  const handleGenerateClick = () => {
    const currentUrl = window.location.origin;
    window.open(`${currentUrl}/missions/ai-html-generator`, "_blank");
  };

  return (
    <div className="mb-8 min-h-[160px] bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl hover:shadow-xl transition-shadow duration-300">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-purple-800">
              مولد الألعاب بالذكاء الاصطناعي
            </h2>
            <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
          </div>
        </div>

        <p className="text-purple-700 mb-6 leading-relaxed">
          اصنع لعبتك الخاصة في ثوانٍ معدودة! استخدم قوة الذكاء الاصطناعي لإنشاء
          ألعاب HTML تفاعلية بدون أي تعقيدات برمجية
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Zap className="w-4 h-4 text-purple-500" />
            <span>سريع وسهل</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>بدون برمجة</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Gamepad2 className="w-4 h-4 text-purple-500" />
            <span>ألعاب تفاعلية</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerateClick}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            ابدأ الآن
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="mb-8 min-h-[200px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 rounded-2xl border border-purple-200 shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
  //     {/* Animated background elements */}
  //     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
  //     <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>

  //     {/* Content */}
  //     <div className="relative z-10">
  //       <div className="flex items-center gap-3 mb-4">
  //         <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
  //           <Gamepad2 className="w-6 h-6 text-white" />
  //         </div>
  //         <div className="flex items-center gap-2">
  //           <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
  //           <h2 className="text-2xl font-bold text-white">
  //             مولد الألعاب بالذكاء الاصطناعي
  //           </h2>
  //         </div>
  //       </div>

  //       <p className="text-lg text-purple-100 mb-6 leading-relaxed">
  //         اصنع لعبتك الخاصة في ثوانٍ معدودة! استخدم قوة الذكاء الاصطناعي لإنشاء
  //         ألعاب HTML تفاعلية بدون أي تعقيدات برمجية
  //       </p>

  //       <div className="flex items-center gap-4 mb-6">
  //         <div className="flex items-center gap-2 text-sm text-purple-200">
  //           <Zap className="w-4 h-4 text-yellow-300" />
  //           <span>سريع وسهل</span>
  //         </div>
  //         <div className="flex items-center gap-2 text-sm text-purple-200">
  //           <Sparkles className="w-4 h-4 text-yellow-300" />
  //           <span>بدون برمجة</span>
  //         </div>
  //         <div className="flex items-center gap-2 text-sm text-purple-200">
  //           <Gamepad2 className="w-4 h-4 text-yellow-300" />
  //           <span>ألعاب تفاعلية</span>
  //         </div>
  //       </div>

  //       <button
  //         onClick={handleGenerateClick}
  //         className="group bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 text-lg"
  //       >
  //         <Sparkles className="w-5 h-5 group-hover:animate-spin" />
  //         ابدأ إنشاء لعبتك الآن
  //         <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  //       </button>

  //       <p className="text-xs text-purple-200 mt-3 opacity-80">
  //         * لا يتطلب خبرة برمجية مسبقة
  //       </p>
  //     </div>

  //     {/* Decorative elements */}
  //     <div className="absolute top-4 right-4 text-white/30">
  //       <div className="flex gap-1">
  //         <div className="w-2 h-2 bg-white/50 rounded-full animate-ping"></div>
  //         <div className="w-2 h-2 bg-white/50 rounded-full animate-ping animation-delay-100"></div>
  //         <div className="w-2 h-2 bg-white/50 rounded-full animate-ping animation-delay-200"></div>
  //       </div>
  //     </div>
  //   </div>
  // );
}
