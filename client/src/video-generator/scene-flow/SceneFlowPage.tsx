import { useState, useEffect } from "react";
import {
  VideoFlowProvider,
  useVideoFlowContext,
} from "./contexts/VideoFlowContext";
import { GoogleSignInStep } from "./components/GoogleSignInStep";
import { FacilitatorSelectStep } from "./components/FacilitatorSelectStep";
import { SceneBuilderStep } from "./components/SceneBuilderStep";
import { ReviewStep } from "./components/ReviewStep";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { Sparkles } from "lucide-react";

export type FlowStep = "signin" | "facilitator" | "scenes" | "review";

function SceneFlowContent() {
  const [currentStep, setCurrentStep] = useState<FlowStep>("signin");
  const { user, isAuthenticated, facilitator } = useVideoFlowContext();

  // Load persisted step on mount and determine correct step based on auth state
  useEffect(() => {
    // Load saved step from localStorage
    try {
      const savedStep = localStorage.getItem('video_flow_current_step');
      if (savedStep && ["signin", "facilitator", "scenes", "review"].includes(savedStep)) {
        const step = savedStep as FlowStep;
        
        // Only restore the step if the user has the required state for that step
        if (step === "signin") {
          setCurrentStep("signin");
        } else if (step === "facilitator" && isAuthenticated) {
          setCurrentStep("facilitator");
        } else if (step === "scenes" && isAuthenticated && facilitator) {
          setCurrentStep("scenes");
        } else if (step === "review" && isAuthenticated && facilitator) {
          setCurrentStep("review");
        } else {
          // Fallback to appropriate step based on current auth state
          if (!isAuthenticated) {
            setCurrentStep("signin");
          } else if (!facilitator) {
            setCurrentStep("facilitator");
          } else {
            setCurrentStep("scenes");
          }
        }
        
        console.log('Current step determined:', step);
      } else {
        // Auto-advance based on current authentication state
        if (!isAuthenticated) {
          setCurrentStep("signin");
        } else if (!facilitator) {
          setCurrentStep("facilitator");
        } else {
          setCurrentStep("scenes");
        }
      }
    } catch (error) {
      console.error('Failed to load current step from localStorage:', error);
      // Fallback to step based on auth state
      if (!isAuthenticated) {
        setCurrentStep("signin");
      } else if (!facilitator) {
        setCurrentStep("facilitator");
      } else {
        setCurrentStep("scenes");
      }
    }
  }, [isAuthenticated, facilitator]);

  // Persist step changes to localStorage
  const handleStepComplete = (nextStep: FlowStep) => {
    setCurrentStep(nextStep);
    
    // Persist step to localStorage
    try {
      localStorage.setItem('video_flow_current_step', nextStep);
      console.log('Current step persisted to localStorage:', nextStep);
    } catch (error) {
      console.error('Failed to persist current step to localStorage:', error);
    }
  };

  const getStepNumber = (step: FlowStep): number => {
    switch (step) {
      case "signin":
        return 1;
      case "facilitator":
        return 2;
      case "scenes":
        return 3;
      case "review":
        return 4;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              استوديو الفيديو
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            أنشئ فيديوهات رائعة بالذكاء الاصطناعي
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={getStepNumber(currentStep)}
          totalSteps={4}
          className="mb-6"
        />

        {/* Step Content */}
        {currentStep === "scenes" ? (
          // Scenes step without container
          <>
            {facilitator && (
              <SceneBuilderStep
                onComplete={() => handleStepComplete("review")}
              />
            )}
          </>
        ) : (
          // Other steps with container
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {currentStep === "signin" && (
              <GoogleSignInStep
                onComplete={() => handleStepComplete("facilitator")}
              />
            )}

            {currentStep === "facilitator" && isAuthenticated && (
              <FacilitatorSelectStep
                userEmail={user?.email || ""}
                onComplete={() => handleStepComplete("scenes")}
              />
            )}

            {currentStep === "review" && (
              <ReviewStep onBack={() => setCurrentStep("scenes")} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SceneFlowPage() {
  return (
    <VideoFlowProvider>
      <SceneFlowContent />
    </VideoFlowProvider>
  );
}
