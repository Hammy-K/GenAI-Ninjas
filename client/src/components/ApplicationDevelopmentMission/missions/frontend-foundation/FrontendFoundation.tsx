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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-[60%] mx-auto px-3 py-3">
        {/* Back Button */}
        <button
          onClick={() => {
            const url = organization.isMain
              ? "/missions/app-development/"
              : `/${organization.name}/missions/app-development/`;
            window.location.href = url;
          }}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 mb-3 transition-colors font-medium text-sm"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          العودة
        </button>

        {/* Header - Compact */}
        <div className="text-center mb-4">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Code className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              أساسيات الواجهة الأمامية
            </h1>
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border-2 border-blue-300 shadow-md">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-lg text-blue-900">
                {completedCount} / {FRONTEND_FOUNDATION_CONCEPTS.length}
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-3 text-sm">
            تعلّم كيف تبني واجهات تفاعلية — من أفكار بسيطة إلى تطبيقات خرافية
          </p>

          {/* Progress Badge - Compact */}
        </div>

        {/* Main Content - Single column on tablet */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 text-center shadow-lg mt-4">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-lg font-bold text-green-900 mb-1">
                  مبروك! أكملت جميع الخزائن
                </h2>
                <p className="text-green-700 text-sm">
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
