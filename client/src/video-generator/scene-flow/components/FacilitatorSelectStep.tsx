import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [selectedFacilitator, setSelectedFacilitator] = useState<string>("");
  const {
    facilitatorsData,
    confirmFacilitator,
    isConfirmingFacilitator,
    facilitatorError,
    hasFacilitator,
    isFacilitatorsLoading,
    facilitatorsError,
  } = useVideoFlowContext();

  // REMOVED: Auto-advance was causing premature scene transitions
  // Users should manually proceed after confirming facilitator selection
  // The onComplete() will be called from handleConfirm() instead

  // Auto-select matched facilitator
  useEffect(() => {
    if (facilitatorsData?.matchedFacilitatorName && !selectedFacilitator) {
      setSelectedFacilitator(facilitatorsData.matchedFacilitatorName);
    }
  }, [facilitatorsData, selectedFacilitator]);

  const handleConfirm = () => {
    if (selectedFacilitator) {
      confirmFacilitator({ facilitatorName: selectedFacilitator });
      // Manually advance to next step after confirming
      onComplete();
    }
  };

  const isLoading = isConfirmingFacilitator;
  const canConfirm = selectedFacilitator && !isLoading;

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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              اختر معلمك
            </h2>
            <p className="text-gray-600 text-sm">
              سيتم ربطك بمعلمك لبدء إنشاء المحتوى
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

          {/* Matched Facilitator Display */}
          {facilitatorsData?.matchedFacilitatorName && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">
                    تم العثور على معلمك
                  </p>
                  <p className="text-green-800 font-semibold">
                    {facilitatorsData.matchedFacilitatorName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Facilitator Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              اختر المعلم:
            </label>
            <Select
              value={selectedFacilitator}
              onValueChange={setSelectedFacilitator}
              data-testid="select-facilitator"
            >
              <SelectTrigger className="w-full h-14 bg-white/80 border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-purple-500 text-right">
                <SelectValue placeholder="اختر معلمك من القائمة" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border border-purple-200 rounded-2xl shadow-xl">
                {facilitatorsData?.facilitators.map((facilitator) => (
                  <SelectItem
                    key={facilitator.name}
                    value={facilitator.name}
                    className="text-right hover:bg-purple-50 focus:bg-purple-50 rounded-xl mx-1 my-1"
                    data-testid={`facilitator-option-${facilitator.name}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium">{facilitator.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isFacilitatorsLoading && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-800 font-medium">
                  جاري تحميل المعلمين...
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

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            size="lg"
            variant="positive"
            className="w-full h-14 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            data-testid="button-confirm-facilitator"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التأكيد...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <span>تأكيد والمتابعة</span>
              </div>
            )}
          </Button>

          {/* Footer */}
          <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
            آمن ومحمي • سيتم حفظ اختيارك تلقائياً
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
