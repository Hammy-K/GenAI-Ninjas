import React from "react";
import { Smartphone, Code, Rocket, ArrowLeft, Lightbulb } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

const AppDevMissionPath = "/missions/app-development";

export default function ApplicationDevelopmentMissionIntroCard() {
  const organization = useOrganization();

  const handleStartClick = () => {
    const currentUrl = window.location.origin;
    const destinationUrl = organization.isMain
      ? `${currentUrl}${AppDevMissionPath}`
      : `${currentUrl}/${organization.name}${AppDevMissionPath}`;
    window.open(destinationUrl, "_blank");
  };

  return (
    <div className="mb-8 min-h-[160px] bg-gradient-to-r bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl hover:shadow-xl transition-shadow duration-300">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-purple-800">
              رحلة تطوير التطبيقات من الصفر!
            </h2>
            <Rocket className="w-5 h-5 text-purple-600 animate-bounce" />
          </div>
        </div>
        <p className="text-purple-700 mb-6 leading-relaxed">
          ابدأ رحلتك في بناء التطبيقات من الصفر! تعلم كيفية إنشاء تطبيقات ويب
          تفاعلية باستخدام الذكاء الاصطناعي
        </p>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Code className="w-4 h-4 text-purple-500" />
            <span>بناء عضلات البرمجة</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Lightbulb className="w-4 h-4 text-purple-500" />
            <span>تحديات ممتعة</span>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleStartClick}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            ابدأ المهمة
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
