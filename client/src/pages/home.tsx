import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { WelcomeStage } from '@/components/stages/WelcomeStage';
import { TryAIStage } from '@/components/stages/TryAIStage';
import { HTMLGeneratorStage } from '@/components/stages/HTMLGeneratorStage';
import { PromptChallengeStage } from '@/components/stages/PromptChallengeStage';
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
  // New flow:
  // 1. Welcome to your first GenAI mission
  // 2. Prompt Engineering 101 (was Step 5)
  // 3. Try AI Tools (Text and Image) (was Step 3)
  // 4. Build a Web App (was Step 4)
  // 5. Wrap-up with Submission Form (was Step 7)
  const renderStage = () => {
    switch (currentStage) {
      case 1:
        return <WelcomeStage onComplete={goToNextStage} />;
      case 2:
        return (
          <PromptChallengeStage 
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
