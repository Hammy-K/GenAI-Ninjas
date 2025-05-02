import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/**
 * MissionTemplate Props
 */
interface MissionTemplateProps {
  /**
   * Total number of steps in the mission
   */
  totalSteps: number;
  
  /**
   * Current step index (1-based)
   */
  currentStep: number;
  
  /**
   * Function to handle moving to the next step
   */
  onNext: () => void;
  
  /**
   * Function to handle moving to the previous step
   */
  onBack: () => void;
  
  /**
   * Optional title for the mission
   */
  title?: string;
  
  /**
   * Optional subtitle for the mission
   */
  subtitle?: string;
  
  /**
   * Optional content to display in the step
   */
  children?: ReactNode;
  
  /**
   * Optional flag to disable the next button (e.g. if input is required)
   */
  nextDisabled?: boolean;
  
  /**
   * Optional flag to disable the back button (e.g. if on first step)
   */
  backDisabled?: boolean;
  
  /**
   * Optional custom text for the next button
   */
  nextText?: string;
  
  /**
   * Optional custom text for the back button
   */
  backText?: string;
}

/**
 * MissionTemplate Component
 * 
 * A reusable template for mission steps with navigation and progress tracking.
 * Designed to be used as a container for mission content.
 */
export function MissionTemplate({
  totalSteps,
  currentStep,
  onNext,
  onBack,
  title,
  subtitle,
  children,
  nextDisabled = false,
  backDisabled = false,
  nextText = "التالي",
  backText = "رجوع"
}: MissionTemplateProps) {
  // Calculate progress percentage
  const progressValue = (currentStep / totalSteps) * 100;
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-tajawal" dir="rtl">
      <main className="flex-1 container max-w-4xl py-6 px-4">
        {/* Optional Title Section */}
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>}
            {subtitle && <h2 className="text-xl font-medium text-center text-muted-foreground mb-6">{subtitle}</h2>}
          </div>
        )}
        
        {/* Progress Tracking */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-primary">
              الخطوة {currentStep} من {totalSteps}
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
        
        {/* Content Area */}
        <div className="bg-card rounded-lg p-8 shadow-sm min-h-[300px] mb-6">
          {children || (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">محتوى هذه الخطوة قيد التطوير</p>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons - Fixed at Bottom */}
        <div className="flex justify-between mt-6 sticky bottom-4 bg-background py-2">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
            disabled={backDisabled}
          >
            <ArrowRight className="h-4 w-4" />
            <span>{backText}</span>
          </Button>
          
          <Button
            onClick={onNext}
            variant="default"
            size="lg"
            className="flex items-center gap-2"
            disabled={nextDisabled}
          >
            <span>{nextText}</span>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}