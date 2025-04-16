import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStage: number;
  totalStages: number;
}

export function ProgressBar({ currentStage, totalStages }: ProgressBarProps) {
  const { t } = useTranslation();
  
  // Calculate progress percentage
  const progress = (currentStage / totalStages) * 100;
  
  // Generate array of stages for rendering
  const stages = Array.from({ length: totalStages }, (_, i) => ({
    number: i + 1,
    name: t(`stage${i + 1}`),
    active: i + 1 <= currentStage
  }));
  
  return (
    <div className="relative px-4 py-3 bg-neutral-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-neutral-700">تقدمك في الرحلة</h2>
        <span className="text-sm font-medium text-primary">
          {t('progress', { current: currentStage, total: totalStages })}
        </span>
      </div>
      
      <div className="relative h-3 bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 right-0 h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-neutral-500 font-medium">
        {stages.map(stage => (
          <div key={stage.number} className="flex flex-col items-center">
            <div 
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-white text-xs transition-colors duration-300",
                stage.active ? "bg-primary-light" : "bg-neutral-300"
              )}
            >
              {stage.number}
            </div>
            <span>{stage.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
