import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRoute, useLocation } from 'wouter';
import { useQuest } from '@/hooks/useQuest';
import { useEffect, useState } from 'react';
import { trackStageProgress } from '@/lib/firebase';

export default function GameMission() {
  const [_, params] = useRoute('/game/mission:id');
  const [location, navigate] = useLocation();
  const missionId = params?.id ? parseInt(params.id, 10) : 1;
  
  const {
    xp,
    currentStage,
    completedMissions,
    unlockedBadges
  } = useQuest();
  
  // Progress tracking
  const handleBack = () => {
    // Go back to dashboard
    navigate('/');
  };
  
  const handleNext = () => {
    // If this is the last mission, go back to dashboard
    // Otherwise, go to the next mission
    if (missionId >= 8) {
      navigate('/');
    } else {
      navigate(`/game/mission${missionId + 1}`);
    }
  };
  
  // Track analytics for page view
  useEffect(() => {
    trackStageProgress('game', `mission${missionId}_viewed`, {
      mission_id: missionId,
      xp_earned: xp
    });
  }, [missionId, xp]);
  
  // Get mission title based on mission ID
  const getMissionTitle = (id: number): string => {
    const titles = [
      "ليش نحب الألعاب؟", 
      "وش فكرة لعبتك؟", 
      "الأساسيات والميكانيكيات الرئيسية", 
      "نموذج أولي لأول مرحلة",
      "تصميم الرسومات والشكل البصري",
      "الصوت، الموسيقى، والتفاعل مع اللاعب",
      "الاختبار والتعديل",
      "النشر، الإطلاق، والمشاركة"
    ];
    
    return titles[id - 1] || `مهمة ${id}`;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-tajawal" dir="rtl">
      <Header xp={xp} />
      
      <main className="flex-1 container max-w-4xl py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">تطوير الألعاب</h1>
          <h2 className="text-xl font-medium text-center text-muted-foreground mb-6">
            {getMissionTitle(missionId)}
          </h2>
          
          <ProgressBar currentStage={missionId} totalStages={8} />
        </div>
        
        {/* Empty content area - only placeholder as requested */}
        <div className="bg-card rounded-lg p-8 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            محتوى هذه المهمة قيد التطوير
          </p>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={handleBack}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span>رجوع</span>
          </Button>
          
          <Button
            onClick={handleNext}
            variant="default"
            size="lg"
            className="flex items-center gap-2"
          >
            <span>التالي</span>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}