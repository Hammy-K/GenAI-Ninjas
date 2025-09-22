import { Concept } from "../../playground/config/types";
import { FrontendConceptCard } from "./FrontendConceptCard";

interface ConceptCardProps {
  weekRange: string;
  title: string;
  description: string;
  concepts: Concept[];
  color: string;
}

export const FrontendMissionTrack = ({
  weekRange,
  title,
  description,
  concepts,
  color,
}: ConceptCardProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium mb-4">
          <span>الأسابيع {weekRange}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>

      {/* Journey Layout */}
      <div className="relative max-w-2xl mx-auto">
        {/* Connecting Line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gradient-to-b from-blue-300 to-blue-500 h-full rounded-full opacity-40" />

        {concepts.map((concept, index) => (
          <div key={index} className="relative mb-4 last:mb-0">
            {/* Step Circle */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4 z-10">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg border-4 border-white font-bold text-white text-xs ${
                  concept.isCompleted ? "bg-green-500" : ""
                }`}
                style={{
                  backgroundColor: concept.isCompleted ? "#10b981" : color,
                }}
              >
                {concept.isCompleted ? "✓" : index + 1}
              </div>
            </div>

            {/* Concept Card */}
            <div className="px-6">
              <div className="max-w-md mx-auto">
                <FrontendConceptCard {...concept} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
