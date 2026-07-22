import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVideoFlowContext } from "../contexts/VideoFlowContext";
import { Loader2, User, CheckCircle, GraduationCap } from "lucide-react";

interface FacilitatorSelectStepProps {
  userEmail: string;
  onComplete: () => void;
}

export function FacilitatorSelectStep({
  userEmail,
  onComplete,
}: FacilitatorSelectStepProps) {
  const [assignedFacilitator, setAssignedFacilitator] = useState<string>("");
  const [autoConfirming, setAutoConfirming] = useState(false);
  const {
    facilitatorsData,
    confirmFacilitator,
    isConfirmingFacilitator,
    facilitatorError,
    hasFacilitator,
    isFacilitatorsLoading,
    facilitatorsError,
  } = useVideoFlowContext();

  // Auto-advance when facilitator is confirmed
  useEffect(() => {
    if (hasFacilitator && !isConfirmingFacilitator) {
      onComplete();
    }
  }, [hasFacilitator, isConfirmingFacilitator, onComplete]);

  // Auto-assign facilitator and confirm
  useEffect(() => {
    if (facilitatorsData && !assignedFacilitator && !autoConfirming) {
      let facilitatorToAssign = facilitatorsData.matchedFacilitatorName;
      
      // If no matched facilitator found, fallback to المشرف المسؤول
      if (!facilitatorToAssign) {
        const fallbackFacilitator = facilitatorsData.facilitators?.find(
          f => f.name === 'المشرف المسؤول'
        );
        facilitatorToAssign = fallbackFacilitator ? fallbackFacilitator.name : facilitatorsData.facilitators?.[0]?.name || '';
      }

      if (facilitatorToAssign) {
        setAssignedFacilitator(facilitatorToAssign);
        setAutoConfirming(true);
        
        // Auto-confirm the assigned facilitator
        confirmFacilitator({ facilitatorName: facilitatorToAssign });
      }
    }
  }, [facilitatorsData, assignedFacilitator, autoConfirming, confirmFacilitator]);

  const isLoading = isConfirmingFacilitator || isFacilitatorsLoading || autoConfirming;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              تخصيص المعلم
            </h2>
            <p className="text-muted text-sm">
              سيتم تخصيص معلمك تلقائياً لبدء إنشاء المحتوى
            </p>
          </div>

          {/* User Email Display */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">
                  بريدك الإلكتروني
                </p>
                <p className="text-blue-800 font-semibold">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Assigned Facilitator Display */}
          {assignedFacilitator && (
            <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">
                    معلمك المخصص
                  </p>
                  <p className="text-green-800 font-semibold">
                    {assignedFacilitator}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-800 font-medium">
                  {isFacilitatorsLoading 
                    ? "جاري تحميل المعلمين..." 
                    : "جاري تخصيص معلمك..."}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(facilitatorError || facilitatorsError) && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl">
              <p className="text-red-700 font-medium">
                حدث خطأ، يرجى المحاولة مرة أخرى
              </p>
              {facilitatorsError && (
                <p className="text-red-600 text-xs mt-1">
                  تحقق من تسجيل الدخول وحاول مرة أخرى
                </p>
              )}
            </div>
          )}

          {/* Auto Assignment Message */}
          {!isLoading && assignedFacilitator && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">
                  تم تخصيص معلمك تلقائياً وسيتم الانتقال للخطوة التالية...
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="mt-6 text-xs text-muted text-center leading-relaxed">
            آمن ومحمي • سيتم تخصيص معلمك تلقائياً
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-8 h-2 bg-primary rounded-full"></div>
          <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
