import React, { useState } from "react";
import { useLocation } from "wouter";
import { MissionTemplate } from "@/components/MissionTemplate";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useQuest } from "@/hooks/useQuest";

/**
 * EmptyMission
 * 
 * A page demonstrating the MissionTemplate component with empty content.
 * This serves as a starting point for building new mission workflows.
 */
export default function EmptyMission() {
  const [location, navigate] = useLocation();
  const { xp } = useQuest();
  
  // State to track which step we're on
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 5; // Total number of steps in this mission
  
  // Navigation handlers
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // On last step, navigate back to dashboard
      navigate("/");
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // On first step, navigate back to dashboard
      navigate("/");
    }
  };
  
  // Customize next button text on last step
  const nextText = currentStep === TOTAL_STEPS ? "إنهاء" : "التالي";
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-tajawal" dir="rtl">
      <Header xp={xp} />
      
      <MissionTemplate
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onBack={handleBack}
        title="قالب المهمة"
        subtitle="نموذج فارغ للمهمات التعليمية"
        nextText={nextText}
        backDisabled={false} // Always allow going back in this demo
      >
        {/* Placeholder content showing which step we're on */}
        <div className="flex flex-col items-center justify-center py-10">
          <h2 className="text-2xl font-bold mb-4">المحتوى للخطوة {currentStep}</h2>
          <p className="text-muted-foreground">
            هذا محتوى توضيحي فقط. يمكن استبداله بأي محتوى مطلوب لكل خطوة.
          </p>
        </div>
      </MissionTemplate>
      
      <Footer />
    </div>
  );
}