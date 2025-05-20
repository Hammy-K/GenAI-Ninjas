import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { PromptChallengeStage } from "@/components/stages/PromptChallengeStage";
import { ImageGenerationStage } from "@/components/stages/ImageGenerationStage";
import { SimpleGalleryStage as GalleryExplorationStage } from "@/components/stages/SimpleGalleryStage";
import { useQuest } from "@/hooks/useQuest";
import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { trackStageProgress } from "@/lib/firebase";

// 🚀 Mission 1 now consists of **only three stages**
// 1. Prompt Engineering (internal stage number 3)
// 2. Image Generation   (internal stage number 4)
// 3. Gallery Exploration(internal stage number 5)
// All other stages have been removed from this flow.

export default function Mission1() {
  const {
    currentStage,
    totalStages: _originalTotalStages, // no longer used for the progress bar
    goToNextStage: goToNextStageOriginal,
    goToPrevStage,
    restart,
    xp,
    earnXp,
    unlockBadge,
    unlockedBadges,
    completeMission: completeMissionOriginal,
    setStage,
    markStageVisited,
    isStageVisited,
  } = useQuest();

  /* -------------------------------------------------------
     Navigation helpers (analytics + smooth‑scroll)          
  ------------------------------------------------------- */
  const goToNextStage = () => {
    const completedStage = currentStage;
    const nextStage = currentStage + 1;

    // analytics
    trackStageProgress("mission1", `stage_${completedStage}_completed`, {
      xp_earned: xp,
      badges_count: unlockedBadges.length,
    });

    if (nextStage <= 5) {
      trackStageProgress("mission1", `stage_${nextStage}_started`);
    }

    // UX
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

  /* -------------------------------------------------------
     Routing helpers ("/mission1/stage/:stageName")          
  ------------------------------------------------------- */
  const [location, navigate] = useLocation();
  const [, params] = useRoute("/mission1/stage/:stageName");
  const stageName = params?.stageName;

  // On mount: start at stage 3 by default (Prompt Engineering)
  useEffect(() => {
    setStage(3);

    // Allow direct navigation in *development* only
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

  /* -------------------------------------------------------
     Track first visit to each stage                         
  ------------------------------------------------------- */
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

  /* -------------------------------------------------------
     Dashboard navigation                                    
  ------------------------------------------------------- */
  const handleBackToDashboard = () => navigate("/");

  /* -------------------------------------------------------
     Stage renderer                                          
  ------------------------------------------------------- */
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
          <ImageGenerationStage
            onComplete={goToNextStage}
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
        );
      case 5:
        return (
          <GalleryExplorationStage
            onComplete={() => completeMission(1)}
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
        );
      default:
        // If any unexpected stage number sneaks in, treat it as stage 3
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
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-700 font-tajawal">
      <Header xp={xp} />

      {/* Back to Dashboard */}
      <div className="bg-white border-b py-2">
        <div className="max-w-6xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="flex items-center text-sm"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة إلى لوحة المهام
          </Button>
        </div>
      </div>

      {/* Progress bar for 3‑step flow */}
      <ProgressBar currentStage={progressPosition} totalStages={3} />

      <main className="flex-grow p-4 md:p-6">{renderStage()}</main>

      <Footer />
    </div>
  );
}
