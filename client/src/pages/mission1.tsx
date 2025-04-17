import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { WelcomeStage } from '@/components/stages/WelcomeStage';
import { TryAIStage } from '@/components/stages/TryAIStage';
import { ImageGenerationStage } from '@/components/stages/ImageGenerationStage';
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

export default function Mission1() {
  const { 
    currentStage,
    totalStages,
    goToNextStage,
    goToPrevStage,
    restart,
    xp, 
    earnXp, 
    unlockBadge,
    unlockedBadges,
    completeMission,
    setStage,
    markStageVisited,
    isStageVisited,
    markStageTimerExpired,
    isStageTimerExpired
  } = useQuest();
  
  const [location, navigate] = useLocation();
  const [, params] = useRoute('/mission1/stage/:stageName');
  const stageName = params?.stageName;
  
  // Get time limit for the current stage
  const getStageTimeLimit = (stage: number): number => {
    switch (stage) {
      case 2: return 5;  // TryAI - 5 minutes
      case 3: return 5;  // Prompt Challenge - 5 minutes
      case 4: return 5;  // Image Generation - 5 minutes
      case 5: return 25; // HTML Generator - 25 minutes
      default: return 0; // No timer for other stages
    }
  };
  
  // Mark the current stage as visited when it's first loaded
  useEffect(() => {
    markStageVisited(currentStage);
  }, [currentStage, markStageVisited]);
  
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
        case 'webbuilder':
          targetStage = 5;
          break;
        case 'submission':
          targetStage = 6;
          break;
        case 'wrapup':
          targetStage = 7;
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
  // 5. Build a Web App with AI (HTML Generator)
  // 6. Submission Form
  // 7. Final Celebratory Page
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
            onBack={goToPrevStage}
          />
        );
      case 3:
        return (
          <PromptChallengeStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStage}
          />
        );
      case 4:
        return (
          <ImageGenerationStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStage}
          />
        );
      case 5:
        return (
          <HTMLGeneratorStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStage}
          />
        );
      case 6:
        return (
          <SubmissionFormStage
            onComplete={goToNextStage}
            onBack={goToPrevStage}
          />
        );
      case 7:
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
      
      {/* Time Management UI */}
      {getStageTimeLimit(currentStage) > 0 && (
        <div className="bg-white border-b py-2">
          <div className="max-w-6xl mx-auto px-4 flex justify-end">
            <CountdownTimer 
              minutes={getStageTimeLimit(currentStage)} 
              onTimeUp={handleTimeUp}
            />
          </div>
        </div>
      )}
      
      {/* Time Up Alert */}
      {isStageTimerExpired(currentStage) && (
        <div className="max-w-6xl mx-auto px-4 mt-2">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-sm">
              انتهى الوقت المقترح لهذه المرحلة، لكن يمكنك أن تأخذ وقتك إذا احتجت لوقت إضافي.
              يمكنك الانتقال إلى المرحلة التالية عندما تكون جاهزاً.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <main className="flex-grow p-4 md:p-6">
        {renderStage()}
      </main>
      
      <Footer />
    </div>
  );
}