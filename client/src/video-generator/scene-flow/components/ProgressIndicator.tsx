import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressIndicator({ currentStep, totalSteps, className }: ProgressIndicatorProps) {
  const steps = [
    { number: 1, label: 'تسجيل الدخول' },
    { number: 2, label: 'اختيار المعلم' },
    { number: 3, label: 'إنشاء المشاهد' },
    { number: 4, label: 'تسليم المشروع' },
  ];

  return (
    <div className={cn('flex justify-center items-center space-x-4 space-x-reverse', className)}>
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors',
              step.number === currentStep
                ? 'bg-blue-600 border-blue-600 text-white'
                : step.number < currentStep
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-border border-border text-muted'
            )}
          >
            {step.number < currentStep ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <span className="text-sm font-bold">{step.number}</span>
            )}
          </div>

          {/* Step Label */}
          <div className="mr-3">
            <p
              className={cn(
                'text-sm font-medium',
                step.number <= currentStep ? 'text-foreground' : 'text-muted'
              )}
            >
              {step.label}
            </p>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-16 h-0.5 mx-4 transition-colors',
                step.number < currentStep ? 'bg-green-600' : 'bg-gray-300'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}