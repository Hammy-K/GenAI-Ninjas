import { useQuest } from "@/hooks/useQuest";
import {
  Code,
  Lightbulb,
  Rocket,
  Smartphone,
  Trophy,
  Zap,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useOrganization } from "@/hooks/useOrganization";
import { useLocation } from "wouter";
import { AppDevelopmentNavigation } from "./AppDevelopmentNavigation";

const missions = [
  {
    icon: Lightbulb,
    title: "الاكتشاف",
    description: "ابدأ رحلتك مع أول تطبيق",
    path: "/missions/lovable",
    color: "#16A34A",
    missions: 2,
    step: 1,
  },
  {
    icon: Code,
    title: "أساسيات الواجهة",
    description: "تعلم بناء واجهات تفاعلية",
    path: "/missions/app-development/frontend-foundation",
    color: "#2563EB",
    missions: 6,
    step: 2,
  },
  {
    icon: Zap,
    title: "التفاعل والوسائط",
    description: "أضف الحياة لتطبيقك",
    path: "/missions/app-development/dynamic-interaction-media",
    color: "#D97706",
    missions: 4,
    step: 3,
  },
  {
    icon: Rocket,
    title: "الذكاء الاصطناعي",
    description: "اربط تطبيقك بالعالم الحقيقي",
    path: "/missions/app-development/backend-ai-integration",
    color: "#7C3AED",
    missions: 4,
    step: 4,
  },
  {
    icon: Trophy,
    title: "التحفة النهائية",
    description: "اجمع كل ما تعلمته",
    path: "/missions/app-development/masterpiece-creation",
    color: "#DC2626",
    missions: 1,
    step: 5,
  },
];

export default function AppDevelopmentPage() {
  const { xp } = useQuest();
  const [, navigate] = useLocation();
  const organization = useOrganization();

  const handleMissionClick = (path: string) => {
    const destinationUrl = organization.isMain
      ? path
      : `/${organization.name}${path}`;
    navigate(destinationUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-tajawal" dir="rtl">
      <Header xp={xp} />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <AppDevelopmentNavigation className="mb-6" />

        <section className="mb-8 rounded-3xl bg-gradient-to-l from-violet-700 via-purple-700 to-indigo-700 px-6 py-8 text-center text-white shadow-lg sm:px-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <Smartphone className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              رحلة تطوير التطبيقات
            </h1>
            <p className="text-base text-violet-100 sm:text-lg">
              خمس خطوات عملية لبناء تطبيقك الأول
            </p>
          </div>
        </section>

        <section className="relative mx-auto max-w-3xl" aria-label="مسار المهام">
          <div className="absolute right-6 top-10 bottom-10 w-1 rounded-full bg-slate-200" />

          <div className="space-y-5">
            {missions.map((mission) => {
              const MissionIcon = mission.icon;

              return (
                <article key={mission.path} className="relative pr-16">
                  <div
                    className="absolute right-0 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-slate-50 text-base font-extrabold text-white shadow-md"
                    style={{ backgroundColor: mission.color }}
                  >
                    {mission.step}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMissionClick(mission.path)}
                    className="group w-full rounded-2xl border bg-white p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-violet-100 sm:p-6"
                    style={{ borderColor: mission.color }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: `${mission.color}18` }}
                        >
                          <MissionIcon
                            className="h-7 w-7"
                            style={{ color: mission.color }}
                          />
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-slate-900">
                            {mission.title}
                          </h2>
                          <p className="mt-1 text-sm text-slate-600">
                            {mission.description}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            {mission.missions} مهام
                          </p>
                        </div>
                      </div>

                      <span
                        className="inline-flex w-fit items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition group-hover:brightness-110"
                        style={{ backgroundColor: mission.color }}
                      >
                        ابدأ الرحلة
                      </span>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-5 text-center shadow-sm">
          <Sparkles className="mx-auto mb-2 h-7 w-7 text-violet-600" />
          <p className="font-bold text-slate-800">
            كل خطوة تقربك من بناء تطبيقك الأول
          </p>
        </section>
      </main>
    </div>
  );
}
