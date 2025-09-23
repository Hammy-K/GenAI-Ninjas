import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useVideoFlowContext } from "../contexts/VideoFlowContext";
import {
  Loader2,
  User,
  CheckCircle,
  GraduationCap,
  Search,
  ChevronDown,
} from "lucide-react";

interface FacilitatorSelectStepProps {
  userEmail: string;
  onComplete: () => void;
}

export function FacilitatorSelectStep({
  userEmail,
  onComplete,
}: FacilitatorSelectStepProps) {
  const [selectedFacilitator, setSelectedFacilitator] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (hasFacilitator) {
      onComplete();
    }
  }, [hasFacilitator, onComplete]);

  // Auto-select matched facilitator
  useEffect(() => {
    if (facilitatorsData?.matchedFacilitatorName && !selectedFacilitator) {
      setSelectedFacilitator(facilitatorsData.matchedFacilitatorName);
      setSearchQuery(facilitatorsData.matchedFacilitatorName);
    }
  }, [facilitatorsData, selectedFacilitator]);

  // Filter facilitators based on search query
  const filteredFacilitators =
    facilitatorsData?.facilitators.filter((facilitator) =>
      facilitator.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(true);
    setHighlightedIndex(-1);

    // If exact match found, select it
    const exactMatch = facilitatorsData?.facilitators.find(
      (f) => f.name.toLowerCase() === value.toLowerCase(),
    );
    if (exactMatch) {
      setSelectedFacilitator(exactMatch.name);
    } else {
      setSelectedFacilitator("");
    }
  };

  // Handle facilitator selection
  const handleFacilitatorSelect = (facilitatorName: string) => {
    setSelectedFacilitator(facilitatorName);
    setSearchQuery(facilitatorName);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredFacilitators.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredFacilitators.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleFacilitatorSelect(filteredFacilitators[highlightedIndex].name);
        }
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirm = () => {
    if (selectedFacilitator) {
      confirmFacilitator({ facilitatorName: selectedFacilitator });
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
              ابحث واختر معلمك لبدء إنشاء المحتوى
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

          {/* Searchable Facilitator Selection */}
          <div className="mb-8 relative" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ابحث عن المعلم:
            </label>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Search className="w-5 h-5 text-purple-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="اكتب اسم المعلم..."
                className="w-full h-14 bg-white/80 border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none text-right pr-12 pl-12 font-medium transition-all duration-200"
                data-testid="search-facilitator"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown
                  className={`w-4 h-4 text-purple-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
            </div>

            {/* Dropdown Results */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-purple-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto z-50">
                {filteredFacilitators.length > 0 ? (
                  filteredFacilitators.map((facilitator, index) => (
                    <div
                      key={facilitator.name}
                      onClick={() => handleFacilitatorSelect(facilitator.name)}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-150 mx-2 my-1 rounded-xl ${
                        index === highlightedIndex
                          ? "bg-purple-100 border border-purple-300"
                          : "hover:bg-purple-50"
                      } ${selectedFacilitator === facilitator.name ? "bg-purple-100 border border-purple-400" : ""}`}
                      data-testid={`facilitator-option-${facilitator.name}`}
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {facilitator.name}
                      </span>
                      {selectedFacilitator === facilitator.name && (
                        <CheckCircle className="w-4 h-4 text-purple-600 mr-auto" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    لا توجد نتائج للبحث "{searchQuery}"
                  </div>
                )}
              </div>
            )}
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
