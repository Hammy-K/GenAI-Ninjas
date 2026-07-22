import { Star } from "lucide-react";

export const ApplicationDevelopmentProgressBadge = ({
  completed,
  total,
  colorVar,
}: {
  completed: number;
  total: number;
  colorVar: string;
}) => (
  <div
    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
    style={{ backgroundColor: colorVar, opacity: 0.2, color: colorVar }}
  >
    <Star className="w-4 h-4" />

    <span>
      {completed}/{total} مكتمل
    </span>
  </div>
);
