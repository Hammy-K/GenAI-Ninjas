import { Concept } from "../../playground/config/types";

interface FrontendConceptCardProps {
  concept: Concept;
  color: string;
  isCompleted: boolean;
  isActive: boolean;
}

export const FrontendConceptCard = ({
  concept,
  color,
  isCompleted,
  isActive,
}: FrontendConceptCardProps) => {
  const handleClick = () => {
    window.location.href = concept.url;
  };

  return (
    <div
      onClick={handleClick}
      className={`relative group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden
        cursor-pointer
        ${isActive ? "ring-2 ring-blue-400" : ""}
        ${isCompleted ? "border-2 border-green-400" : "border-2 border-transparent"}
      `}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
      )}

      <div className="p-3 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">
              {concept.title}
            </h3>
            <p className="text-gray-600 text-xs leading-snug">
              {concept.description}
            </p>

            <div className="mt-2">
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ✓ مكتمل
                </span>
              )}
              {isActive && !isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium animate-pulse">
                  🎯 المهمة النشطة
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <concept.Icon className="w-10 h-10" style={{ color }} />
          </div>
        </div>

        <button
          className={`mt-2 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            isCompleted
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isCompleted ? "إعادة الزيارة" : "ابدأ"}
        </button>
      </div>
    </div>
  );
};
