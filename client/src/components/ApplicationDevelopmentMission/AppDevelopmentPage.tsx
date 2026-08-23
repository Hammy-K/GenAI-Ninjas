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
import { useOrganization } from "@/hooks/useOrganization";
import { useLocation } from "wouter";

const missions = [
  {
    icon: Lightbulb,
    title: "الاكتشاف",
    description: "ابدأ رحلتك مع أول تطبيق",
    path: "/missions/lovable",
    colorVar: "var(--color-success)",
    missions: 2,
    step: 1,
  },
  {
    icon: Code,
    title: "أساسيات الواجهة",
    description: "تعلم بناء واجهات تفاعلية",
    path: "/missions/app-development/frontend-foundation",
    colorVar: "var(--color-info)",
    missions: 6,
    step: 2,
  },
  {
    icon: Zap,
    title: "التفاعل والوسائط",
    description: "أضف الحياة لتطبيقك",
    path: "/missions/app-development/dynamic-interaction-media",
    colorVar: "var(--color-warning)",
    missions: 4,
    step: 3,
  },
  {
    icon: Rocket,
    title: "الذكاء الاصطناعي",
    description: "اربط تطبيقك بالعالم الحقيقي",
    path: "/missions/app-development/backend-ai-integration",
    colorVar: "var(--color-primary)",
    missions: 4,
    step: 4,
  },
  {
    icon: Trophy,
    title: "التحفة النهائية",
    description: "اجمع كل ما تعلمته",
    path: "/missions/app-development/masterpiece-creation",
    colorVar: "var(--color-danger)",
    missions: 1,
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
    <div className="min-h-screen bg-background">
      {/* <Header xp={xp} /> */}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-elevated">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              رحلة تطوير التطبيقات
            </h1>
          </div>

          <p className="text-muted mb-6 text-lg">
            5 خطوات لبناء تطبيقك الأول
          </p>
        </div>

        {/* Journey Path */}
        <div className="relative">
          {/* Journey Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-primary h-full rounded-full opacity-30" />

          {missions.map((mission, index) => (
            <div key={index} className="relative mb-8 last:mb-0">
              {/* Step Circle */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-elevated border-4 border-white font-bold text-white text-sm"
                  style={{ backgroundColor: mission.colorVar }}
                >
                  {mission.step}
                </div>
              </div>

              {/* Mission Card */}
              <div
                className={`${index % 2 === 0 ? "pr-8 md:pr-16" : "pl-8 md:pl-16"} ${index % 2 === 0 ? "md:mr-8" : "md:ml-8"}`}
              >
                <div
                  className="bg-card backdrop-blur-sm rounded-2xl p-6 shadow-normal border-2 cursor-pointer transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 hover:scale-105"
                  style={{ borderColor: mission.colorVar, opacity: 0.9 }}
                  onClick={() => {
                    // Handle click logic here
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-normal"
                      style={{ backgroundColor: mission.colorVar, opacity: 0.1 }}
                    >
                      <mission.icon
                        className="w-8 h-8"
                        style={{ color: mission.colorVar }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {mission.title}
                      </h3>
                      <p className="text-muted">{mission.description}</p>
                      <span className="text-xs text-muted">
                        {mission.missions} مهام
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
                    <button
                      className="px-6 py-2 text-white font-semibold rounded-xl shadow-normal hover:shadow-elevated transition-all duration-200 transform hover:scale-105"
                      style={{ backgroundColor: mission.colorVar }}
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
        <div className="text-center mt-12 bg-card backdrop-blur-sm rounded-2xl p-6 shadow-normal border border-primary/30">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-foreground font-medium">
            كل خطوة تقربك من بناء تطبيقك الأول
          </p>
        </div>
      </div>
    </div>
  );
}
