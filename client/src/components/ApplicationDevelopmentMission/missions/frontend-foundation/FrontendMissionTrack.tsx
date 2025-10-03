// src/components/FrontendMissionTrack.tsx
import { Concept } from "../../playground/config/types";
import { FrontendConceptCard } from "./FrontendConceptCard";
import { Lock, CheckCircle2 } from "lucide-react";

interface ConceptCardProps {
  weekRange: string;
  title: string;
  description: string;
  concepts: Concept[];
  color: string;
  progress: { [key: string]: boolean };
  currentVaultIndex: number;
}

export const FrontendMissionTrack = ({
  weekRange,
  title,
  description,
  concepts,
  color,
  progress,
  currentVaultIndex,
}: ConceptCardProps) => {
  return (
    <div className="relative">
      {/* Header */}

      {/* Journey Layout */}
      <div className="relative space-y-6">
        {/* Connecting Line */}
        <div className="absolute right-[31px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200" />

        {concepts.map((concept, index) => {
          // Extract mission slug from URL
          // URL format: "/missions/app-development/frontend-foundation/inputs-outputs"
          const missionSlug = concept.url.split("/").pop() as string;

          const isCompleted = progress?.[missionSlug] || false;
          const isActive = index === currentVaultIndex;
          const isLocked = index > currentVaultIndex;

          return (
            <div key={concept.slug} className="relative">
              {/* Step Circle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-green-500 scale-100"
                        : isActive
                          ? "bg-blue-600 scale-110 ring-4 ring-blue-200 animate-pulse"
                          : "bg-gray-300 scale-90"
                    }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>
              </div>

              {/* Concept Card */}
              <div className="mr-24">
                <FrontendConceptCard
                  concept={concept}
                  color={color}
                  isCompleted={isCompleted}
                  isLocked={isLocked}
                  isActive={isActive}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
