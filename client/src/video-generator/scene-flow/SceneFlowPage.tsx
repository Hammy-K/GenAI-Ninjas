import { useState } from 'react';
import { VideoFlowProvider, useVideoFlowContext } from './contexts/VideoFlowContext';
import { GoogleSignInStep } from './components/GoogleSignInStep';
import { FacilitatorSelectStep } from './components/FacilitatorSelectStep';
import { SceneBuilderStep } from './components/SceneBuilderStep';
import { ReviewStep } from './components/ReviewStep';
import { ProgressIndicator } from './components/ProgressIndicator';

export type FlowStep = 'signin' | 'facilitator' | 'scenes' | 'review';

function SceneFlowContent() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('signin');
  const { user, isAuthenticated, facilitator } = useVideoFlowContext();

  // Auto-advance through steps based on auth state
  const handleStepComplete = (nextStep: FlowStep) => {
    setCurrentStep(nextStep);
  };

  const getStepNumber = (step: FlowStep): number => {
    switch (step) {
      case 'signin': return 1;
      case 'facilitator': return 2;
      case 'scenes': return 3;
      case 'review': return 4;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎬 مولد الفيديو التفاعلي
          </h1>
          <p className="text-xl text-gray-600">
            أنشئ ثلاثة مقاطع فيديو مذهلة بالذكاء الاصطناعي
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator 
          currentStep={getStepNumber(currentStep)}
          totalSteps={4}
          className="mb-8"
        />

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 'signin' && (
            <GoogleSignInStep 
              onComplete={() => handleStepComplete('facilitator')}
            />
          )}
          
          {currentStep === 'facilitator' && isAuthenticated && (
            <FacilitatorSelectStep 
              userEmail={user?.email || ''}
              onComplete={() => handleStepComplete('scenes')}
            />
          )}
          
          {currentStep === 'scenes' && facilitator && (
            <SceneBuilderStep 
              onComplete={() => handleStepComplete('review')}
            />
          )}
          
          {currentStep === 'review' && (
            <ReviewStep 
              onBack={() => setCurrentStep('scenes')}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>مدعوم بتقنية Vertex AI Veo 3 Fast</p>
        </div>
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