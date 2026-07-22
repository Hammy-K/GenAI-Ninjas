import { PromptChallengeStage } from "@/components/stages/PromptChallengeStage";
import { useQuest } from "@/hooks/useQuest";
import { useLocation } from "wouter";

// Standalone Prompt Engineering challenge.
// XP and badges are wired to the persistent quest state so finished work is never
// dropped. The session loop closes back onto the journey rather than a no-op.
export default function PromptEngineering() {
  const [, navigate] = useLocation();
  const { earnXp, unlockBadge } = useQuest();

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f2e8] text-foreground font-tajawal p-4">
      <main className="flex-grow">
        <PromptChallengeStage
          onComplete={() => navigate("/")}
          onEarnXp={earnXp}
          onUnlockBadge={unlockBadge}
          onBack={() => navigate("/")}
        />
      </main>
    </div>
  );
}
