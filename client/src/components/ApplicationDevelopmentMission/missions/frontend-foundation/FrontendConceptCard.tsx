// FrontendConceptCard.tsx - Bigger text, less white space
import { Concept } from "../../playground/config/types";
import { Lock } from "lucide-react";

interface FrontendConceptCardProps {
  concept: Concept;
  color: string;
  isCompleted: boolean;
  isLocked: boolean;
  isActive: boolean;
}

export const FrontendConceptCard = ({
  concept,
  color,
  isCompleted,
  isLocked,
  isActive,
}: FrontendConceptCardProps) => {
  const handleClick = () => {
    if (isLocked) return;
    window.location.href = concept.url;
  };

  return (
    <div
      onClick={handleClick}
      className={`relative group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden
        ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isActive ? "ring-4 ring-blue-400 scale-105" : ""}
        ${isCompleted ? "border-2 border-green-400" : "border-2 border-transparent"}
      `}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
      )}

      <div className="p-5 relative z-10">
        {" "}
        {/* Reduced from p-6 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {" "}
              {/* Increased from text-xl */}
              {concept.title}
            </h3>
            <p className="text-gray-600 text-base">
              {" "}
              {/* Increased from text-sm */}
              {concept.description}
            </p>

            <div className="mt-3">
              {" "}
              {/* Reduced from mt-4 */}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {" "}
                  {/* Increased from text-xs */}✓ مكتمل
                </span>
              )}
              {isActive && !isCompleted && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium animate-pulse">
                  🎯 الخزنة النشطة
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  <Lock className="w-4 h-4" /> {/* Increased from w-3 h-3 */}
                  مقفل
                </span>
              )}
            </div>
          </div>

          <div className={`text-4xl ${isLocked ? "opacity-30" : ""}`}>
            <concept.Icon className="w-14 h-14" style={{ color }} />{" "}
            {/* Increased from w-12 h-12 */}
          </div>
        </div>
        {!isLocked && (
          <button
            className={`mt-3 w-full py-3 rounded-lg text-base font-medium transition-colors ${
              isCompleted
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isCompleted ? "إعادة الزيارة" : "ابدأ"}
          </button>
        )}
      </div>
    </div>
  );
};
