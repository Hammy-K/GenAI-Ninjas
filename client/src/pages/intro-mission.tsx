import { ProgressBarV2 } from "@/components/layout/ProgressBarV2";
import { PromptChallengeStage } from "@/components/stages/PromptChallengeStage";
import { ImageGenerationStageV2 } from "@/components/stages/ImageGenerationStageV2";
import { useQuest } from "@/hooks/useQuest";
import { useEffect } from "react";
import { useRoute } from "wouter";
import { trackStageProgress } from "@/lib/firebase";
import { SimpleGalleryStageV2 } from "@/components/SimpleGalleryStage/SimpleGalleryStageV2";

// 🚀 Mission 1: minimal 3-step flow
// 3. Prompt Engineering
// 4. Image Generation
// 5. Gallery Exploration

export default function Mission1() {
  const {
    currentStage,
    totalStages: _originalTotalStages, // kept for potential future use
    goToNextStage: goToNextStageOriginal,
    goToPrevStage,
    xp,
    earnXp,
    unlockBadge,
    unlockedBadges,
    completeMission: completeMissionOriginal,
    setStage,
    markStageVisited,
    isStageVisited,
  } = useQuest();

  /* ---------------- Navigation helpers ---------------- */
  const goToNextStage = () => {
    const completedStage = currentStage;
    const nextStage = currentStage + 1;

    trackStageProgress("mission1", `stage_${completedStage}_completed`, {
      xp_earned: xp,
      badges_count: unlockedBadges.length,
    });

    if (nextStage <= 5) {
      trackStageProgress("mission1", `stage_${nextStage}_started`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    goToNextStageOriginal();
  };

  const goToPrevStageWithScroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    goToPrevStage();
  };

  const completeMission = (missionId: number) => {
    trackStageProgress("mission1", "completed", {
      mission_id: missionId,
      total_xp_earned: xp,
      total_badges_earned: unlockedBadges.length,
    });

    completeMissionOriginal(missionId);
  };

  /* ------------- Direct stage navigation (dev) ------------- */
  const [, params] = useRoute("/mission1/stage/:stageName");
  const stageName = params?.stageName;

  useEffect(() => {
    setStage(3);

    if (stageName && process.env.NODE_ENV === "development") {
      let targetStage = 0;
      switch (stageName) {
        case "prompt":
          targetStage = 3;
          break;
        case "images":
          targetStage = 4;
          break;
        case "gallery":
          targetStage = 5;
          break;
      }
      if (targetStage >= 3 && targetStage <= 5) {
        setStage(targetStage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----------------- First-visit tracking ----------------- */
  useEffect(() => {
    markStageVisited(currentStage);

    if (!isStageVisited(currentStage)) {
      trackStageProgress("mission1", `stage_${currentStage}_visited`, {
        current_xp: xp,
      });

      if (currentStage === 3) {
        trackStageProgress("mission1", "started");
      }
    }
  }, [currentStage, markStageVisited, isStageVisited, xp]);

  /* -------------------- Stage renderer -------------------- */
  const renderStage = () => {
    switch (currentStage) {
      case 3:
        return (
          <PromptChallengeStage
            onComplete={goToNextStage}
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
        );
      case 4:
        return (
          <ImageGenerationStageV2
            onComplete={goToNextStage}
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
          // <ImageGenerationStage
          //   onComplete={goToNextStage}
          //   onEarnXp={earnXp}
          //   onUnlockBadge={unlockBadge}
          //   onBack={goToPrevStageWithScroll}
          // />
        );
      case 5:
        return (
          <SimpleGalleryStageV2
            onComplete={() => completeMission(1)}
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
        );
      default:
        return (
          <PromptChallengeStage
            onComplete={goToNextStage}
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
        );
    }
  };

  // Map internal stage numbers (3,4,5) → progress positions (1,2,3)
  const progressPosition = currentStage - 2; // 3→1, 4→2, 5→3

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f2e8] text-foreground font-tajawal p-4">
      <ProgressBarV2 currentStage={progressPosition} totalStages={3} />

      <main className="flex-grow">{renderStage()}</main>
    </div>
  );
}
