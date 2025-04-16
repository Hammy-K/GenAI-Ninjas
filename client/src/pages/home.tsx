import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { WelcomeStage } from '@/components/stages/WelcomeStage';
import { DiscoveryStage } from '@/components/stages/DiscoveryStage';
import { TryAIStage } from '@/components/stages/TryAIStage';
import { CodeEditorStage } from '@/components/stages/CodeEditorStage';
import { HTMLGeneratorStage } from '@/components/stages/HTMLGeneratorStage';
import { PromptChallengeStage } from '@/components/stages/PromptChallengeStage';
import { ProjectIdeaStage } from '@/components/stages/ProjectIdeaStage';
import { WrapUpStage } from '@/components/stages/WrapUpStage';
import { useQuest } from '@/hooks/useQuest';

export default function Home() {
  const { 
    xp, 
    earnXp, 
    unlockBadge
  } = useQuest();
  
  // Simple no-op function since we don't need navigation
  const noOp = () => {};
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-700 font-tajawal">
      <Header xp={xp} />
      
      <main className="flex-grow p-4 md:p-6">
        <HTMLGeneratorStage 
          onComplete={noOp} 
          onEarnXp={earnXp}
          onUnlockBadge={unlockBadge}
          onBack={noOp}
        />
      </main>
      
      <Footer />
    </div>
  );
}
