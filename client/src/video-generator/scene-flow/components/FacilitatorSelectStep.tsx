import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVideoFlowContext } from '../contexts/VideoFlowContext';
import { Loader2, User, CheckCircle } from 'lucide-react';

interface FacilitatorSelectStepProps {
  userEmail: string;
  onComplete: () => void;
}

export function FacilitatorSelectStep({ userEmail, onComplete }: FacilitatorSelectStepProps) {
  const [selectedFacilitator, setSelectedFacilitator] = useState<string>('');
  const { 
    facilitatorsData, 
    confirmFacilitator, 
    isConfirmingFacilitator, 
    facilitatorError,
    hasFacilitator,
    isFacilitatorsLoading,
    facilitatorsError
  } = useVideoFlowContext();

  // Auto-advance when facilitator is confirmed
  useEffect(() => {
    if (hasFacilitator) {
      onComplete();
    }
  }, [hasFacilitator, onComplete]);

  // Auto-select matched facilitator
  useEffect(() => {
    if (facilitatorsData?.matchedFacilitatorName && !selectedFacilitator) {
      setSelectedFacilitator(facilitatorsData.matchedFacilitatorName);
    }
  }, [facilitatorsData, selectedFacilitator]);

  const handleConfirm = () => {
    if (selectedFacilitator) {
      confirmFacilitator({ facilitatorName: selectedFacilitator });
    }
  };

  const isLoading = isConfirmingFacilitator;
  const canConfirm = selectedFacilitator && !isLoading;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">👨‍🏫</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          اختيار المعلم
        </h2>
        <p className="text-lg text-gray-600">
          اختر معلمك لاستخدام مفتاح API الخاص به
        </p>
      </div>

      {/* User Email Display */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-medium">
            البريد الإلكتروني: {userEmail}
          </span>
        </div>
      </div>

      {/* Matched Facilitator Display */}
      {facilitatorsData?.matchedFacilitatorName && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">
              تم العثور على معلمك: {facilitatorsData.matchedFacilitatorName}
            </span>
          </div>
        </div>
      )}

      {/* Facilitator Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اختر المعلم:
        </label>
        <Select 
          value={selectedFacilitator} 
          onValueChange={setSelectedFacilitator}
          data-testid="select-facilitator"
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر معلمك من القائمة" />
          </SelectTrigger>
          <SelectContent>
            {facilitatorsData?.facilitators.map((facilitator) => (
              <SelectItem 
                key={facilitator.name} 
                value={facilitator.name}
                data-testid={`facilitator-option-${facilitator.name}`}
              >
                {facilitator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading Facilitators */}
      {isFacilitatorsLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
            <span className="text-blue-800">جاري تحميل قائمة المعلمين...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(facilitatorError || facilitatorsError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">
            ❌ خطأ: {facilitatorError?.message || facilitatorsError?.message}
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
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        data-testid="button-confirm-facilitator"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            جاري التأكيد...
          </>
        ) : (
          'تأكيد المعلم والمتابعة'
        )}
      </Button>

      <p className="mt-4 text-sm text-gray-500 text-center">
        سيتم استخدام مفتاح API الخاص بمعلمك لتوليد الفيديوهات
      </p>
    </div>
  );
}