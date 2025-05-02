import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
  
  /**
   * Optional handler for returning to dashboard
   */
  onBackToDashboard?: () => void;
}

/**
 * MissionTemplate Component
 * 
 * A reusable template for mission steps with navigation and progress tracking.
 * Designed to be used as a container for mission content.
 * Based on the exact structure of the Intro Mission.
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
  backText = "رجوع",
  onBackToDashboard
}: MissionTemplateProps) {
  return (
    <>
      {/* Back to Dashboard Button */}
      {onBackToDashboard && (
        <div className="bg-white border-b py-2">
          <div className="max-w-6xl mx-auto px-4">
            <Button 
              variant="ghost" 
              onClick={onBackToDashboard}
              className="flex items-center text-sm"
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة إلى لوحة المهام
            </Button>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      <ProgressBar currentStage={currentStep} totalStages={totalSteps} />
      
      {/* Main Content */}
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {/* Optional Title Section */}
          {(title || subtitle) && (
            <div className="mb-6 text-center">
              {title && <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>}
              {subtitle && <h2 className="text-xl font-medium text-neutral-600 mt-2">{subtitle}</h2>}
            </div>
          )}
          
          {/* Content Card */}
          <Card className="mb-6 shadow-sm">
            <CardContent className="p-6">
              {children || (
                <div className="flex items-center justify-center min-h-[300px]">
                  <p className="text-neutral-500 text-center">محتوى هذه الخطوة قيد التطوير</p>
                </div>
              )}
            </CardContent>
            
            {/* Navigation Buttons */}
            <CardFooter className="flex justify-between px-6 pb-6">
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
            </CardFooter>
          </Card>
        </div>
      </main>
    </>
  );
}