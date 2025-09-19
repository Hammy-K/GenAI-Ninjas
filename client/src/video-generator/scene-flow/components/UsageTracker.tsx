import { useQuery } from '@tanstack/react-query';
import { videoFlowApi } from '../api/video-flow.api';
import { cn } from '@/lib/utils';

interface UsageTrackerProps {
  className?: string;
}

export function UsageTracker({ className }: UsageTrackerProps) {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['video-flow', 'usage'],
    queryFn: videoFlowApi.getUsage,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  if (isLoading || !usage) {
    return (
      <div className={cn('text-center', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  const remaining = usage.limit - usage.used;
  const isNearLimit = remaining <= 1;
  const isAtLimit = remaining === 0;

  return (
    <div className={cn('text-center', className)}>
      <div className={`inline-flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-full ${
        isAtLimit 
          ? 'bg-red-100 text-red-800'
          : isNearLimit 
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-blue-100 text-blue-800'
      }`}>
        <div className="flex space-x-1 space-x-reverse">
          {Array.from({ length: usage.limit }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < usage.used 
                  ? 'bg-gray-400' 
                  : isAtLimit
                  ? 'bg-red-400'
                  : isNearLimit
                  ? 'bg-yellow-400'
                  : 'bg-blue-400'
              }`}
              data-testid={`usage-dot-${i + 1}`}
            />
          ))}
        </div>
        
        <span className="text-sm font-medium">
          {isAtLimit 
            ? '❌ تم استنفاد الحد المسموح'
            : `${remaining} فيديو متبقي من ${usage.limit}`
          }
        </span>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        الحد الأقصى: {usage.limit} فيديوهات لكل مستخدم
      </p>
    </div>
  );
}