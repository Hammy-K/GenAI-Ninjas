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
      <div className="bg-white rounded-xl p-3 shadow-lg border border-yellow-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 shadow-lg border-2 border-yellow-300">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-yellow-600" />
          <h2 className="text-sm font-bold text-gray-900">لوحة المتصدرين</h2>
        </div>
        <p className="text-xs text-gray-500 text-center py-2">
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
    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-xl p-3 shadow-lg border-2 border-yellow-400 sticky top-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy className="w-4 h-4 text-yellow-600" />
        <h2 className="text-sm font-bold text-gray-900">لوحة المتصدرين</h2>
      </div>

      <p className="text-xs text-gray-600 mb-2">
        متوسط الخزائن المفتوحة لكل طالب
      </p>

      <div className="space-y-1.5">
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
              className={`${isTopThree ? bgColors[index] : defaultBg} rounded-lg p-2 border transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {isTopThree && (
                    <span className="text-lg flex-shrink-0">
                      {medals[index]}
                    </span>
                  )}
                  {!isTopThree && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      #{index + 1}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xs text-gray-900 truncate">
                      {entry.supervisor}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mt-0.5">
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
                  <div className="text-base font-bold text-blue-600">
                    {entry.percentageCompleted.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${entry.percentageCompleted}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors py-1.5 rounded-lg hover:bg-blue-50"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              عرض أقل
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              عرض الكل ({leaderboard.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
