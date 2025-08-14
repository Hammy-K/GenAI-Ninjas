import { FrontendConceptCard } from "./FrontendConceptCard";

interface ConceptCardProps {
  weekRange: string;
  title: string;
  description: string;
  concepts: {
    Icon: any;
    title: string;
    description: string;
    examples: string[];
    color: string;
    isCompleted?: boolean;
    url: string;
  }[];
  color: string;
}

export const FrontendMissionTrack = ({
  weekRange,
  title,
  description,
  concepts,
  color,
}: ConceptCardProps) => (
  <div className="bg-white rounded-xl p-6 shadow-md mb-8">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${color}20`, color }}
        >
          الأسابيع {weekRange}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>
    </div>

    <p className="text-gray-600 mb-6 text-lg">{description}</p>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {concepts.map((concept, index) => (
        <FrontendConceptCard key={index} {...concept} color={color} />
      ))}
    </div>
  </div>
);
