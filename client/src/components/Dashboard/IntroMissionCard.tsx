import React from "react";
import { Star, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import penguinAvatar from "@assets/WelcomePenguin.png";

interface IntroMissionCardProps {
  title?: string;
  description?: string;
  isComplete?: boolean;
  showStreamContent?: boolean;
  onStartMission?: () => void;
  vibrant?: boolean;
}

export default function IntroMissionCard({
  title = "المهمة التعريفية",
  description = "تعرف على الذكاء الاصطناعي التوليدي",
  isComplete = false,
  showStreamContent = false,
  onStartMission,
  vibrant = false,
}: IntroMissionCardProps) {
  if (vibrant) {
    return (
      <div
        className={`relative mb-8 min-h-[200px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-800 p-8 rounded-2xl border border-purple-200 shadow-2xl transform hover:scale-[1.02] transition-all duration-300 overflow-hidden ${
          showStreamContent ? "collapsed" : ""
        }`}
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>

        {/* Content */}
        <div className="relative z-10 min-h-[130px] flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <img
                src={penguinAvatar}
                alt="د. بنجي"
                className="w-8 h-8 pointer-events-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
          </div>
          <p className="text-lg text-purple-100 mb-6 leading-relaxed">
            {description}
          </p>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-purple-200">
              {isComplete ? (
                <CheckCircle className="w-4 h-4 text-green-300" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-300" />
              )}
              <span>{isComplete ? "مكتملة" : "قيد التقدم"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <Star className="w-4 h-4 text-yellow-300" />
              <span>مهمة أساسية</span>
            </div>
          </div>
          <div className="mt-auto flex justify-end">
            <button
              onClick={onStartMission}
              className={`group font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 text-lg ${
                isComplete
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-white"
                  : "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900"
              }`}
            >
              <Star className="w-5 h-5 group-hover:animate-spin" />
              {isComplete ? "إعادة المهمة" : "ابدأ هنا"}
              {isComplete ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-8 min-h-[160px] bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl hover:shadow-xl transition-shadow duration-300 ${
        showStreamContent ? "collapsed" : ""
      }`}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500 rounded-lg">
            <img
              src={penguinAvatar}
              alt="د. بنجي"
              className="w-5 h-5 pointer-events-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-purple-800">{title}</h2>
            <Star className="w-5 h-5 text-purple-600 animate-spin" />
          </div>
        </div>
        <p className="text-purple-700 mb-6 leading-relaxed">{description}</p>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-purple-600">
            {isComplete ? (
              <CheckCircle className="w-4 h-4 text-purple-500" />
            ) : (
              <Clock className="w-4 h-4 text-purple-500" />
            )}
            <span>{isComplete ? "مكتملة" : "قيد التقدم"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Star className="w-4 h-4 text-purple-500" />
            <span>مهمة أساسية</span>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onStartMission}
            className={`font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 ${
              isComplete
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            <Star className="w-4 h-4" />
            {isComplete ? "إعادة المهمة" : "ابدأ هنا"}
            {isComplete ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
