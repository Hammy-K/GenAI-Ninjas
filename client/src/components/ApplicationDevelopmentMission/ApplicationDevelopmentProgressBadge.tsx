import { Star } from "lucide-react";

export const ApplicationDevelopmentProgressBadge = ({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
}) => (
  <div
    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
    style={{ backgroundColor: `${color}20`, color }}
  >
    <Star className="w-4 h-4" />

    <span>
      {completed}/{total} مكتمل
    </span>
  </div>
);
