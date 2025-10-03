import { Header } from "@/components/layout/Header";
import { useQuest } from "@/hooks/useQuest";
import { Code, ArrowRight, Sparkles, Trophy } from "lucide-react";
import { FrontendMissionTrack } from "./FrontendMissionTrack";
import { FRONTEND_FOUNDATION_CONCEPTS } from "../../playground/config/concepts.config";
import { useVaultProgress } from "@/hooks/useVaultProgress";
import { useOrganization } from "@/hooks/useOrganization";
import { useSupervisorLeaderboard } from "@/hooks/useSupervisorLeaderboard";
import { SupervisorLeaderboard } from "@/components/ApplicationDevelopmentMission/missions/frontend-foundation/SupervisorLeaderboard";
import { useMemo } from "react";

export default function FrontendFoundation() {
  const { xp } = useQuest();
  const organization = useOrganization();
  const { progress, isLoading } = useVaultProgress(organization.name);
  const { leaderboard, isLoading: leaderboardLoading } =
    useSupervisorLeaderboard(organization.name);

  // Calculate current vault index (first incomplete vault)
  const currentVaultIndex = useMemo(() => {
    if (isLoading || !progress || Object.keys(progress).length === 0) {
      return 0;
    }

    const index = FRONTEND_FOUNDATION_CONCEPTS.findIndex((concept) => {
      const missionSlug = concept.url.split("/").pop() as string;
      return !progress[missionSlug];
    });

    return index === -1 ? FRONTEND_FOUNDATION_CONCEPTS.length - 1 : index;
  }, [progress, isLoading]);

  const completedCount = useMemo(() => {
    return Object.values(progress).filter(Boolean).length;
  }, [progress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header xp={xp} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => {
            const url = organization.isMain
              ? "/missions/app-development/"
              : `/${organization.name}/missions/app-development/`;
            window.location.href = url;
          }}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors font-medium"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
              <Code className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              أساسيات الواجهة الأمامية
            </h1>
            <Sparkles className="w-6 h-6 text-yellow-500 animate-bounce" />
          </div>

          <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-xl">
            تعلّم كيف تبني واجهات تفاعلية — من أفكار بسيطة إلى تطبيقات خرافية
          </p>

          {/* Progress Badge */}
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border-2 border-blue-300 shadow-lg">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <span className="font-bold text-3xl text-blue-900">
              {completedCount} / {FRONTEND_FOUNDATION_CONCEPTS.length}
            </span>
            <span className="text-blue-700 font-medium text-lg">
              خزنة مفتوحة
            </span>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Left Column - Mission Track */}
          <div>
            <FrontendMissionTrack
              weekRange="3-5"
              title="المفاهيم الأساسية"
              description="اللبنات الأساسية لكل تطبيق ويب تفاعلي"
              concepts={FRONTEND_FOUNDATION_CONCEPTS}
              color="#3B82F6"
              progress={progress}
              currentVaultIndex={currentVaultIndex}
            />

            {/* Completion Celebration */}
            {completedCount === FRONTEND_FOUNDATION_CONCEPTS.length && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-8 text-center shadow-xl mt-8 animate-bounce">
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-900 mb-2">
                  مبروك! أكملت جميع الخزائن
                </h2>
                <p className="text-green-700 text-lg">
                  لقد فتحت جميع خزائن أساسيات الواجهة الأمامية!
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Leaderboard (Sticky) */}
          <div>
            <SupervisorLeaderboard
              leaderboard={leaderboard}
              isLoading={leaderboardLoading}
            />
          </div>
        </div>

        {/* Quick Tips 
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border-2 border-blue-200 mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            نصائح سريعة للنجاح
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-600 flex items-center gap-2">
                <span className="text-xl">💻</span>
                أثناء التطوير:
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>ابدأ بسيط، ثم أضف التعقيد تدريجياً</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>اختبر بعد كل تغيير</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>استخدم 2-3 ألوان فقط</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-green-600 flex items-center gap-2">
                <span className="text-xl">🎤</span>
                عند العرض:
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>اشرح الفكرة أولاً</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>دع الجمهور يجرب التطبيق</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>شارك التحديات وحلولها</span>
                </div>
              </div>
            </div>
          </div>
          </div>
          */}
      </div>
    </div>
  );
}
