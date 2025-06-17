import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import HomeButton from "../common/HomeButton";

interface ProgressBarProps {
  currentStage: number;
  totalStages: number;
}

export function ProgressBarV2({ currentStage, totalStages }: ProgressBarProps) {
  const { t } = useTranslation();

  const progress = (currentStage / totalStages) * 100;

  const stages = Array.from({ length: totalStages }, (_, i) => {
    const stageNumber = i + 1;
    return {
      number: stageNumber,
      name: t(`stage${stageNumber}`),
      isCompleted: stageNumber < currentStage,
      isCurrent: stageNumber === currentStage,
      isUpcoming: stageNumber > currentStage,
    };
  });

  return (
    <div className="bg-[#f5f2e8] text-foreground font-tajawal mb-5">
      {/* Progress Title */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="absolute right-0">
          <HomeButton />
        </div>

        <h2 className="text-3xl font-bold mx-auto bg-gradient-to-r from-purple-800 to-indigo-700 bg-clip-text text-transparent">
          المهمة التعريفية
        </h2>
      </div>

      <div className="bg-white px-3 py-3 rounded-lg">
        {/* Stages Display */}
        <div className="flex justify-around">
          {stages.map((stage) => (
            <div
              key={stage.number}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                stage.isCurrent && "bg-primary text-white shadow-sm",
                stage.isCompleted && "bg-green-100 text-green-700",
                stage.isUpcoming && "bg-gray-100 text-gray-500",
                currentStage === totalStages && "bg-green-100 text-green-700",
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center font-bold transition-colors duration-300",
                  stage.isCurrent && "bg-white text-primary",
                  stage.isCompleted && "bg-green-500 text-white",
                  stage.isUpcoming && "bg-white",
                  stage.isUpcoming && "text-gray-600",
                  currentStage === totalStages && "bg-green-500 text-white",
                )}
              >
                {stage.number}
              </div>
              <span className="whitespace-nowrap">{stage.name}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar with Sections */}
        <div className="relative h-1 rounded-full overflow-hidden mt-3">
          {/* Background sections */}
          <div className="flex h-full">
            {stages.map((stage, index) => (
              <div
                key={stage.number}
                className={cn(
                  "h-full transition-all duration-500 ease-in-out rounded-lg mx-5",
                  index < stages.length - 1 && "border-r border-gray-300",
                  stage.isCompleted && "bg-green-500",
                  stage.isCurrent && "bg-primary",
                  stage.isUpcoming && "bg-gray-200",
                  currentStage === totalStages &&
                    stage.number <= currentStage &&
                    "bg-green-500",
                )}
                style={{ width: `${100 / totalStages}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
