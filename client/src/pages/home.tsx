import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { WelcomeStage } from '@/components/stages/WelcomeStage';
import { DiscoveryStage } from '@/components/stages/DiscoveryStage';
import { TryAIStage } from '@/components/stages/TryAIStage';
import { HTMLGeneratorStage } from '@/components/stages/HTMLGeneratorStage';
import { PromptChallengeStage } from '@/components/stages/PromptChallengeStage';
import { ProjectIdeaStage } from '@/components/stages/ProjectIdeaStage';
import { WrapUpStage } from '@/components/stages/WrapUpStage';
import { useQuest } from '@/hooks/useQuest';

export default function Home() {
  const { 
    currentStage,
    totalStages,
    goToNextStage,
    goToPrevStage,
    restart,
    xp, 
    earnXp, 
    unlockBadge,
    unlockedBadges
  } = useQuest();
  
  // Render current stage based on stage number
  const renderStage = () => {
    switch (currentStage) {
      case 1:
        return <WelcomeStage onComplete={goToNextStage} />;
      case 2:
        return (
          <DiscoveryStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
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
          <PromptChallengeStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onBack={goToPrevStage}
          />
        );
      case 6:
        return (
          <ProjectIdeaStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPrevStage}
          />
        );
      case 7:
        return (
          <WrapUpStage 
            onRestart={restart}
            totalXp={xp}
            unlockedBadges={unlockedBadges}
          />
        );
      default:
        return <WelcomeStage onComplete={goToNextStage} />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-700 font-tajawal">
      <Header xp={xp} />
      <ProgressBar currentStage={currentStage} totalStages={totalStages} />
      
      <main className="flex-grow p-4 md:p-6">
        {renderStage()}
      </main>
      
      <Footer />
    </div>
  );
}
