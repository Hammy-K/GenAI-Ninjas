import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { WelcomeStage } from '@/components/stages/WelcomeStage';
import { TryAIStage } from '@/components/stages/TryAIStage';
import { ImageGenerationStage } from '@/components/stages/ImageGenerationStage';
import { GalleryExplorationStage } from '@/components/stages/GalleryExplorationStage';
import { HTMLGeneratorStage } from '@/components/stages/HTMLGeneratorStage';
import { PromptChallengeStage } from '@/components/stages/PromptChallengeStage';
import { SubmissionFormStage } from '@/components/stages/SubmissionFormStage';
import { WrapUpStage } from '@/components/stages/WrapUpStage';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { useQuest } from '@/hooks/useQuest';
import { useEffect, useState } from 'react';
import { useLocation, useRoute, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trackStageProgress } from '@/lib/firebase';

export default function Mission1() {
  const { 
    currentStage,
    totalStages,
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
    markStageTimerExpired,
    isStageTimerExpired
  } = useQuest();
  
  // Wrapped goToNextStage to track analytics
  const goToNextStage = () => {
    // Get the stage we're completing
    const completedStage = currentStage;
    const nextStage = currentStage + 1;
    
    // Track the completion in Firebase Analytics
    trackStageProgress('mission1', `stage_${completedStage}_completed`, {
      xp_earned: xp,
      badges_count: unlockedBadges.length
    });
    
    // If next stage exists, track starting it
    if (nextStage <= totalStages) {
      trackStageProgress('mission1', `stage_${nextStage}_started`);
    }
    
    // Scroll to top of page when moving to next stage
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Call the original function
    goToNextStageOriginal();
  };
  
  // Wrapped completeMission to track analytics
  const completeMission = (missionId: number) => {
    // Track mission completion
    trackStageProgress('mission1', 'completed', {
      mission_id: missionId,
      total_xp_earned: xp,
      total_badges_earned: unlockedBadges.length
    });
    
    // Call the original function
    completeMissionOriginal(missionId);
  };
  
  // Wrapped goToPrevStage to add scrolling behavior
  const goToPrevStageWithScroll = () => {
    // Scroll to top of page when moving to previous stage
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    goToPrevStage();
  };
  
  const [location, navigate] = useLocation();
  const [, params] = useRoute('/mission1/stage/:stageName');
  const stageName = params?.stageName;
  
  // Get time limit for the current stage
  const getStageTimeLimit = (stage: number): number => {
    switch (stage) {
      case 2: return 5;  // TryAI - 5 minutes
      case 3: return 5;  // Prompt Challenge - 5 minutes
      case 4: return 5;  // Image Generation - 5 minutes
      case 5: return 5;  // Gallery Exploration - 5 minutes
      case 6: return 25; // HTML Generator - 25 minutes
      default: return 0; // No timer for other stages
    }
  };
  
  // Mark the current stage as visited when it's first loaded
  useEffect(() => {
    // First mark as visited in the quest state
    markStageVisited(currentStage);
    
    // Track stage visit in Firebase Analytics
    const isFirstVisit = !isStageVisited(currentStage);
    if (isFirstVisit) {
      trackStageProgress('mission1', `stage_${currentStage}_visited`, {
        current_xp: xp
      });
      
      // Track first time start explicitly
      if (currentStage === 1) {
        trackStageProgress('mission1', 'started');
      }
    }
  }, [currentStage, markStageVisited, isStageVisited, xp]);
  
  // Handle time up event
  const handleTimeUp = () => {
    markStageTimerExpired(currentStage);
  };
  
  // Return to dashboard when mission is complete and user attempts to proceed
  useEffect(() => {
    if (currentStage > totalStages) {
      navigate('/');
    }
  }, [currentStage, totalStages, navigate]);
  
  // Reset stage to 1 when starting the mission, while preserving other progress
  useEffect(() => {
    // Always start from stage 1 when mission component loads
    setStage(1);

    // Handle direct navigation to specific stages (for development/admin purposes only)
    if (stageName && process.env.NODE_ENV === 'development') {
      let targetStage = 0;
      
      switch (stageName) {
        case 'welcome':
          targetStage = 1;
          break;
        case 'tryai':
          targetStage = 2;
          break;
        case 'prompt':
          targetStage = 3;
          break;
        case 'images':
          targetStage = 4;
          break;
        case 'gallery':
          targetStage = 5;
          break;
        case 'webbuilder':
          targetStage = 6;
          break;
        case 'submission':
          targetStage = 7;
          break;
        case 'wrapup':
          targetStage = 8;
          break;
      }
      
      if (targetStage > 0 && targetStage !== 1) {
        setStage(targetStage);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on component mount
  
  // Handle go back to dashboard
  const handleBackToDashboard = () => {
    navigate('/');
  };
  
  // Render current stage based on stage number
  // Updated stage flow (new order):
  // 1. Welcome to your first GenAI mission
  // 2. Try AI Text Generation (Chat with Dr. Pengy)
  // 3. Prompt Engineering 101
  // 4. Create Images with AI
  // 5. Explore Gallery of AI Images
  // 6. Build a Web App with AI (HTML Generator)
  // 7. Submission Form
  // 8. Final Celebratory Page
  const renderStage = () => {
    switch (currentStage) {
      case 1:
        return <WelcomeStage onComplete={goToNextStage} />;
      case 2:
        return (
          <TryAIStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
        );
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
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
        );
      case 6:
        return (
          <HTMLGeneratorStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStageWithScroll}
          />
        );
      case 7:
        return (
          <SubmissionFormStage
            onComplete={goToNextStage}
            onBack={goToPrevStageWithScroll}
          />
        );
      case 8:
        return (
          <WrapUpStage 
            onRestart={restart}
            totalXp={xp}
            unlockedBadges={unlockedBadges}
            onCompleteMission={completeMission}
          />
        );
      default:
        return <WelcomeStage onComplete={goToNextStage} />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-700 font-tajawal">
      <Header xp={xp} />
      
      {/* Back to Dashboard Button */}
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
      
      <ProgressBar currentStage={currentStage} totalStages={totalStages} />
      
      {/* We no longer need the timer here - it's being moved into each stage component */}
      
      <main className="flex-grow p-4 md:p-6">
        {renderStage()}
      </main>
      
      <Footer />
    </div>
  );
}