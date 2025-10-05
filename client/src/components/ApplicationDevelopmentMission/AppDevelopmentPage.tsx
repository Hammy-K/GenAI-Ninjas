import { useQuest } from "@/hooks/useQuest";
import {
  Code,
  Lightbulb,
  Rocket,
  Smartphone,
  Trophy,
  Zap,
  Sparkles,
  ArrowDown,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ApplicationDevelopmentProgressBadge } from "./ApplicationDevelopmentProgressBadge";
import { ApplicationDevelopmentMissionCard } from "./ApplicationDevelopmentMissionCard";
import { useOrganization } from "@/hooks/useOrganization";
import { useLocation } from "wouter";

const missions = [
  {
    icon: Lightbulb,
    title: "الاكتشاف",
    description: "ابدأ رحلتك مع أول تطبيق",
    path: "/missions/lovable",
    color: "#10B981",
    missions: 2,
    isLocked: false,
    step: 1,
  },
  {
    icon: Code,
    title: "أساسيات الواجهة",
    description: "تعلم بناء واجهات تفاعلية",
    path: "/missions/app-development/frontend-foundation",
    color: "#3B82F6",
    missions: 6,
    isLocked: false,
    step: 2,
  },
  {
    icon: Zap,
    title: "التفاعل والوسائط",
    description: "أضف الحياة لتطبيقك",
    path: "/missions/app-development/dynamic-interaction-media",
    color: "#F59E0B",
    missions: 4,
    isLocked: false,
    step: 3,
  },
  {
    icon: Rocket,
    title: "الذكاء الاصطناعي",
    description: "اربط تطبيقك بالعالم الحقيقي",
    path: "/missions/app-development/backend-ai-integration",
    color: "#8B5CF6",
    missions: 4,
    isLocked: false,
    step: 4,
  },
  {
    icon: Trophy,
    title: "التحفة النهائية",
    description: "اجمع كل ما تعلمته",
    path: "/missions/app-development/masterpiece-creation",
    color: "#EF4444",
    missions: 1,
    isLocked: false,
    step: 5,
  },
];

export default function AppDevelopmentPage() {
  const { xp } = useQuest();
  const [location, navigate] = useLocation();
  const organization = useOrganization();

  const handleMissionClick = (path: string) => {
    const destinationUrl = organization.isMain
      ? path
      : `/${organization.name}${path}`;
    navigate(destinationUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* <Header xp={xp} /> */}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              رحلة تطوير التطبيقات
            </h1>
          </div>

          <p className="text-gray-600 mb-6 text-lg">
            5 خطوات لبناء تطبيقك الأول
          </p>
        </div>

        {/* Journey Path */}
        <div className="relative">
          {/* Journey Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-purple-300 via-purple-400 to-purple-500 h-full rounded-full opacity-30" />

          {missions.map((mission, index) => (
            <div key={index} className="relative mb-8 last:mb-0">
              {/* Step Circle */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white font-bold text-white text-sm"
                  style={{ backgroundColor: mission.color }}
                >
                  {mission.step}
                </div>
              </div>

              {/* Mission Card */}
              <div
                className={`${index % 2 === 0 ? "pr-8 md:pr-16" : "pl-8 md:pl-16"} ${index % 2 === 0 ? "md:mr-8" : "md:ml-8"}`}
              >
                <div
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-105"
                  style={{ borderColor: `${mission.color}40` }}
                  onClick={() => {
                    // Handle click logic here
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                      style={{ backgroundColor: `${mission.color}20` }}
                    >
                      <mission.icon
                        className="w-8 h-8"
                        style={{ color: mission.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {mission.title}
                      </h3>
                      <p className="text-gray-600">{mission.description}</p>
                      <span className="text-xs text-gray-500">
                        {mission.missions} مهام
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
                    <button
                      className="px-6 py-2 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      style={{ backgroundColor: mission.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMissionClick(mission.path);
                      }}
                    >
                      ابدأ الرحلة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Encouragement */}
        <div className="text-center mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-200">
          <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">
            كل خطوة تقربك من بناء تطبيقك الأول
          </p>
        </div>
      </div>
    </div>
  );
}
