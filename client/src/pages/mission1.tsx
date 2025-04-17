import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { WelcomeStage } from '@/components/stages/WelcomeStage';
import { TryAIStage } from '@/components/stages/TryAIStage';
import { HTMLGeneratorStage } from '@/components/stages/HTMLGeneratorStage';
import { PromptChallengeStage } from '@/components/stages/PromptChallengeStage';
import { SubmissionFormStage } from '@/components/stages/SubmissionFormStage';
import { WrapUpStage } from '@/components/stages/WrapUpStage';
import { useQuest } from '@/hooks/useQuest';
import { useEffect } from 'react';
import { useLocation, useRoute, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
    setStage
  } = useQuest();
  
  const [location, navigate] = useLocation();
  const [, params] = useRoute('/mission1/stage/:stageName');
  const stageName = params?.stageName;
  
  // Return to dashboard when mission is complete and user attempts to proceed
  useEffect(() => {
    if (currentStage > totalStages) {
      navigate('/');
    }
  }, [currentStage, totalStages, navigate]);
  
  // Handle direct navigation to a specific stage only once on mount
  useEffect(() => {
    if (stageName) {
      let targetStage = 0;
      
      switch (stageName) {
        case 'welcome':
          targetStage = 1;
          break;
        case 'prompt':
          targetStage = 2;
          break;
        case 'tryai':
          targetStage = 3;
          break;
        case 'webbuilder':
          targetStage = 4;
          break;
        case 'submission':
          targetStage = 5;
          break;
        case 'wrapup':
          targetStage = 6;
          break;
      }
      
      if (targetStage > 0 && targetStage !== currentStage) {
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
  // Same stage flow as before:
  // 1. Welcome to your first GenAI mission
  // 2. Prompt Engineering 101
  // 3. Try AI Tools (Text and Image)
  // 4. Build a Web App
  // 5. Submission Form
  // 6. Final Celebratory Page
  const renderStage = () => {
    switch (currentStage) {
      case 1:
        return <WelcomeStage onComplete={goToNextStage} />;
      case 2:
        return (
          <PromptChallengeStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStage}
          />
        );
      case 3:
        return (
          <TryAIStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStage}
          />
        );
      case 4:
        return (
          <HTMLGeneratorStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStage}
          />
        );
      case 5:
        return (
          <SubmissionFormStage
            onComplete={goToNextStage}
            onBack={goToPrevStage}
          />
        );
      case 6:
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mission Dashboard
          </Button>
        </div>
      </div>
      
      <ProgressBar currentStage={currentStage} totalStages={totalStages} />
      
      <main className="flex-grow p-4 md:p-6">
        {renderStage()}
      </main>
      
      <Footer />
    </div>
  );
}