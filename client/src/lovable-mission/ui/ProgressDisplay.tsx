import type { LovableProgressFlags } from "../types/lovable.types";

interface ProgressDisplayProps {
  progress: LovableProgressFlags;
}

export function ProgressDisplay({ progress }: ProgressDisplayProps) {
  // Steps mapped to flags (order matters)
  const steps = [
    { key: "welcomeDone", label: "الترحيب" },
    { key: "ideationOngoing", label: "توليد الأفكار" },
    { key: "readyDone", label: "جاهزية المشروع" },
    { key: "buildingOngoing", label: "بدء البناء" },
  ] as const;

  // status per step
  const isDone = (k: keyof LovableProgressFlags) => Boolean(progress?.[k]);
  const completedCount = steps.filter((s) => isDone(s.key)).length;
  const totalSteps = steps.length;

  // current step = first not-done; if all done, the last step is current
  const currentIndex = Math.min(
    steps.findIndex((s) => !isDone(s.key)) === -1
      ? totalSteps - 1
      : steps.findIndex((s) => !isDone(s.key)),
    totalSteps - 1,
  );

  const pct = Math.round((completedCount / totalSteps) * 100);

  return (
    <div dir="rtl" className="space-y-4">
      {/* Progress bar */}
      <div
        aria-hidden="true"
        className="flex items-center justify-between text-xs text-gray-600"
      >
        <span>
          الخطوة {currentIndex + 1} من {totalSteps}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`التقدم العام: ${pct}%`}
      >
        <div
          className="h-full bg-indigo-600 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stepper */}
      <ol className="space-y-2" role="list" aria-label="مراحل التقدم">
        {steps.map((s, idx) => {
          const completed = isDone(s.key);
          const current = idx === currentIndex && !completed;
          const pending = !completed && !current;

          return (
            <li
              key={s.key}
              className="flex items-center justify-between gap-3"
              aria-current={current ? "step" : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    completed &&
                      "bg-green-100 text-green-800 ring-1 ring-green-200",
                    current &&
                      "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200",
                    pending && "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>
                <span
                  className={[
                    "text-sm",
                    completed && "text-gray-700",
                    current && "text-gray-900 font-medium",
                    pending && "text-gray-500",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {s.label}
                </span>
              </div>

              <span aria-hidden="true" className="text-sm">
                {completed ? "✅" : current ? "🔄" : "⏳"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
