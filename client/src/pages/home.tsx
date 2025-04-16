import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { WelcomeStage } from '@/components/stages/WelcomeStage';
import { DiscoveryStage } from '@/components/stages/DiscoveryStage';
import { TryAIStage } from '@/components/stages/TryAIStage';
import { CodeEditorStage } from '@/components/stages/CodeEditorStage';
import { PromptChallengeStage } from '@/components/stages/PromptChallengeStage';
import { ProjectIdeaStage } from '@/components/stages/ProjectIdeaStage';
import { WrapUpStage } from '@/components/stages/WrapUpStage';
import { useQuest } from '@/hooks/useQuest';

export default function Home() {
  const { 
    currentStage, 
    totalStages, 
    xp, 
    unlockedBadges,
    goToNextStage, 
    goToPreviousStage,
    earnXp, 
    unlockBadge,
    resetQuest
  } = useQuest();
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-700 font-tajawal">
      <Header xp={xp} />
      
      <ProgressBar 
        currentStage={currentStage} 
        totalStages={totalStages} 
      />
      
      <main className="flex-grow p-4 md:p-6">
        {currentStage === 1 && (
          <WelcomeStage onComplete={goToNextStage} />
        )}
        
        {currentStage === 2 && (
          <DiscoveryStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onBack={goToPreviousStage}
          />
        )}
        
        {currentStage === 3 && (
          <TryAIStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPreviousStage}
          />
        )}
        
        {currentStage === 4 && (
          <CodeEditorStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPreviousStage}
          />
        )}
        
        {currentStage === 5 && (
          <PromptChallengeStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onBack={goToPreviousStage}
          />
        )}
        
        {currentStage === 6 && (
          <ProjectIdeaStage 
            onComplete={goToNextStage} 
            onEarnXp={earnXp}
            onUnlockBadge={unlockBadge}
            onBack={goToPreviousStage}
          />
        )}
        
        {currentStage === 7 && (
          <WrapUpStage 
            onRestart={resetQuest} 
            totalXp={xp} 
            unlockedBadges={unlockedBadges}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}
