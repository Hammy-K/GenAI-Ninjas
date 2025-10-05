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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Back Button */}
        <button
          onClick={() => {
            const url = organization.isMain
              ? "/missions/app-development/"
              : `/${organization.name}/missions/app-development/`;
            window.location.href = url;
          }}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 transition-colors font-medium text-sm sm:text-base"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
              <Code className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              أساسيات الواجهة الأمامية
            </h1>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 animate-bounce" />
          </div>

          <p className="text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl px-4">
            تعلّم كيف تبني واجهات تفاعلية — من أفكار بسيطة إلى تطبيقات خرافية
          </p>

          {/* Progress Badge */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border-2 border-blue-300 shadow-lg">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            <span className="font-bold text-xl sm:text-2xl md:text-3xl text-blue-900">
              {completedCount} / {FRONTEND_FOUNDATION_CONCEPTS.length}
            </span>
            <span className="text-blue-700 font-medium text-sm sm:text-base md:text-lg">
              خزنة مفتوحة
            </span>
          </div>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 lg:gap-8">
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-6 sm:p-8 text-center shadow-xl mt-6 sm:mt-8 animate-bounce">
                <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4">
                  🎉
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900 mb-2">
                  مبروك! أكملت جميع الخزائن
                </h2>
                <p className="text-green-700 text-sm sm:text-base md:text-lg">
                  لقد فتحت جميع خزائن أساسيات الواجهة الأمامية!
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Leaderboard */}
          <div>
            <SupervisorLeaderboard
              leaderboard={leaderboard}
              isLoading={leaderboardLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
