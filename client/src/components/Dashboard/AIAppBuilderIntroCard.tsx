import React from "react";
import { Smartphone, Bot, Code, ArrowLeft } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

const AiAppBuilderPath = "/missions/lovable";

export default function AIAppBuilderIntroCard() {
  const organization = useOrganization();

  const handleBuildClick = () => {
    const currentUrl = window.location.origin;

    const destinationUrl = organization.isMain
      ? `${currentUrl}${AiAppBuilderPath}`
      : `${currentUrl}/${organization.name}${AiAppBuilderPath}`;

    window.open(destinationUrl, "_blank");
  };

  return (
    <div className="mb-8 min-h-[160px] bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-shadow duration-300">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-blue-800">
              صمم أول تطبيق لك مع د. بنجي
            </h2>
            <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
          </div>
        </div>

        <p className="text-blue-700 mb-6 leading-relaxed">
          ايش رايك نسوي تطبيق خاص فيك بدقائق؟ خل الذكاء الاصطناعي يساعدك تبني
          تطبيقات ويب رهيبة من غير ما تحتاج خبرة في البرمجة!
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Bot className="w-4 h-4 text-blue-500" />
            <span>ذكاء اصطناعي قوي</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Code className="w-4 h-4 text-blue-500" />
            <span>ما يبي لك برمجة</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <span>تطبيقات عصرية</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleBuildClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            يلا نبدأ
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
