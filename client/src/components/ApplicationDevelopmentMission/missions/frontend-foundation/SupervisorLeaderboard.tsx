import { Trophy, Users, Target, ChevronDown, ChevronUp } from "lucide-react";
import { SupervisorLeaderboardEntry } from "@/hooks/useSupervisorLeaderboard";
import { useState } from "react";

interface SupervisorLeaderboardProps {
  leaderboard: SupervisorLeaderboardEntry[];
  isLoading: boolean;
}

export function SupervisorLeaderboard({
  leaderboard,
  isLoading,
}: SupervisorLeaderboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg border-2 border-yellow-300">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h2 className="text-lg font-bold text-gray-900">لوحة المتصدرين</h2>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          لا توجد بيانات بعد
        </p>
      </div>
    );
  }

  const displayedLeaderboard = isExpanded
    ? leaderboard
    : leaderboard.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl p-5 shadow-xl border-2 border-yellow-400 sticky top-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-yellow-600" />
        <h2 className="text-lg font-bold text-gray-900">لوحة المتصدرين</h2>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        متوسط الخزائن المفتوحة لكل طالب
      </p>

      <div className="space-y-2">
        {displayedLeaderboard.map((entry, index) => {
          const isTopThree = index < 3;
          const bgColors = [
            "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-400",
            "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300",
            "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300",
          ];
          const defaultBg = "bg-white border-gray-200";

          return (
            <div
              key={entry.supervisor}
              className={`${isTopThree ? bgColors[index] : defaultBg} rounded-xl p-3 border-2 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isTopThree && (
                    <span className="text-xl flex-shrink-0">
                      {medals[index]}
                    </span>
                  )}
                  {!isTopThree && (
                    <span className="text-sm text-gray-400 flex-shrink-0">
                      #{index + 1}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-gray-900 truncate">
                      {entry.supervisor}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {entry.studentCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Target className="w-2.5 h-2.5" />
                        {entry.totalVaults}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-blue-600">
                    {entry.avgVaultsCompleted.toFixed(1)}
                  </div>
                  <div className="text-[9px] text-gray-500">من 6</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(entry.avgVaultsCompleted / 6) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors py-2 rounded-lg hover:bg-blue-50"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              عرض أقل
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              عرض الكل ({leaderboard.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
