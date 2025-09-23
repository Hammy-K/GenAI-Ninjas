import { useState, useEffect } from "react";
import {
  VideoFlowProvider,
  useVideoFlowContext,
} from "./contexts/VideoFlowContext";
import { GoogleSignInStep } from "./components/GoogleSignInStep";
import { FacilitatorSelectStep } from "./components/FacilitatorSelectStep";
import { SceneBuilderStep } from "./components/SceneBuilderStep";
import { SubmissionPage } from "./components/SubmissionPage";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { Sparkles } from "lucide-react";

export type FlowStep = "signin" | "facilitator" | "scenes" | "review";

function SceneFlowContent() {
  // Initialize currentStep intelligently based on persisted state
  const [currentStep, setCurrentStep] = useState<FlowStep>(() => {
    try {
      const savedStep = localStorage.getItem(
        "videoFlowCurrentStep",
      ) as FlowStep;
      return savedStep || "signin";
    } catch (error) {
      console.error("Failed to load current step from localStorage:", error);
      return "signin";
    }
  });

  const { user, isAuthenticated, facilitator, hasFacilitator } =
    useVideoFlowContext();

  // Persist current step to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("videoFlowCurrentStep", currentStep);
    } catch (error) {
      console.error("Failed to save current step to localStorage:", error);
    }
  }, [currentStep]);

  // Smart step detection based on auth state
  useEffect(() => {
    // Only auto-advance if we're not already in the correct state
    if (
      isAuthenticated &&
      hasFacilitator &&
      currentStep !== "scenes" &&
      currentStep !== "review"
    ) {
      setCurrentStep("scenes");
    } else if (
      isAuthenticated &&
      !hasFacilitator &&
      currentStep !== "facilitator"
    ) {
      setCurrentStep("facilitator");
    } else if (!isAuthenticated && currentStep !== "signin") {
      setCurrentStep("signin");
    }
  }, [isAuthenticated, hasFacilitator, currentStep]);

  // Auto-advance through steps based on auth state
  const handleStepComplete = (nextStep: FlowStep) => {
    setCurrentStep(nextStep);
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
              <SubmissionPage onBack={() => setCurrentStep("scenes")} />
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
