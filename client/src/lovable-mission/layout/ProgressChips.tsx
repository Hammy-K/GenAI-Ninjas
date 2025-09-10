import type { LovableProgressFlags } from "../types/lovable.types";
import { mapProgressToChips } from "../utils/lovable.utils";

interface Props {
  progress: LovableProgressFlags;
}

export function ProgressChips({ progress }: Props) {
  const chips = mapProgressToChips(progress);

  return (
    <div className="flex items-center gap-2">
      {Object.entries(chips).map(([key, state]) => (
        <span
          key={key}
          className={`px-2 py-1 text-xs rounded-full ${
            state === "active"
              ? "bg-green-100 text-green-800"
              : state === "pulse"
                ? "bg-yellow-100 text-yellow-800 animate-pulse"
                : "bg-gray-100 text-gray-500"
          }`}
        >
          {labelMap[key as keyof typeof chips]}
        </span>
      ))}
    </div>
  );
}

const labelMap: Record<string, string> = {
  welcome: "Welcome",
  ideation: "Ideation",
  ready: "Ready",
  building: "Building",
};
