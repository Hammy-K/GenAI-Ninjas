import { PromptChallengeStage } from "@/components/stages/PromptChallengeStage";
import { useQuest } from "@/hooks/useQuest";
import { useEffect } from "react";
import { trackStageProgress } from "@/lib/firebase";

// 🚀 Mission 1: Single stage flow
// 3. Prompt Engineering Only

export default function Mission1() {
  const {
    xp,
    earnXp,
    unlockBadge,
    unlockedBadges,
    completeMission: completeMissionOriginal,
    setStage,
    markStageVisited,
    isStageVisited,
  } = useQuest();

  const completeMission = (missionId: number) => {
    trackStageProgress("mission1", "completed", {
      mission_id: missionId,
      total_xp_earned: xp,
      total_badges_earned: unlockedBadges.length,
    });
    completeMissionOriginal(missionId);
  };

  useEffect(() => {
    setStage(3); // Set to prompt stage
    markStageVisited(3);

    if (!isStageVisited(3)) {
      trackStageProgress("mission1", "stage_3_visited", {
        current_xp: xp,
      });
      trackStageProgress("mission1", "started");
    }
  }, [markStageVisited, isStageVisited, xp]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f2e8] text-foreground font-tajawal p-4">
      <main className="flex-grow">
        <PromptChallengeStage
          onComplete={() => completeMission(1)}
          onEarnXp={earnXp}
          onUnlockBadge={unlockBadge}
          onBack={() => {}} // Empty function since there's nowhere to go back to
        />
      </main>
    </div>
  );
}
