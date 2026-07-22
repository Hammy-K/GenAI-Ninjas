import { useQuery } from "@tanstack/react-query";
import { videoFlowApi } from "../api/video-flow.api";
import { cn } from "@/lib/utils";
import { Video, AlertTriangle, CheckCircle } from "lucide-react";

interface UsageTrackerProps {
  className?: string;
}

export function UsageTracker({ className }: UsageTrackerProps) {
  const { data: usage, isLoading } = useQuery({
    queryKey: ["video-flow", "usage"],
    queryFn: videoFlowApi.getUsage,
    refetchInterval: false,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  if (isLoading || !usage) {
    return (
      <div className={cn("text-center", className)}>
        <div className="animate-pulse bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-3">
          <div className="h-3 bg-border rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  const remaining = usage.limit - usage.used;
  const isNearLimit = remaining <= 1;
  const isAtLimit = remaining === 0;

  const getStatusConfig = () => {
    if (isAtLimit) {
      return {
        bgColor: "bg-gradient-to-r from-red-50 to-pink-50",
        borderColor: "border-red-300",
        textColor: "text-red-800",
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        message: "انتهت المحاولات",
      };
    }
    if (isNearLimit) {
      return {
        bgColor: "bg-gradient-to-r from-yellow-50 to-orange-50",
        borderColor: "border-yellow-300",
        textColor: "text-yellow-800",
        icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
        message: `محاولة واحدة متبقية`,
      };
    }
    return {
      bgColor: "bg-gradient-to-r from-purple-50 to-indigo-50",
      borderColor: "border-primary",
      textColor: "text-primary",
      icon: <Video className="w-4 h-4 text-primary" />,
      message: `${remaining} فيديو متاح`,
    };
  };

  const config = getStatusConfig();

  return (
    <div className={cn("", className)}>
      <div
        className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border-2 ${config.bgColor} ${config.borderColor} shadow-sm`}
      >
        {/* Icon */}
        <div className="flex-shrink-0">{config.icon}</div>

        {/* Progress Dots */}
        <div className="flex gap-1">
          {Array.from({ length: usage.limit }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < usage.used
                  ? "bg-muted scale-90"
                  : isAtLimit
                    ? "bg-red-400"
                    : isNearLimit
                      ? "bg-yellow-400"
                      : "bg-primary"
              }`}
              data-testid={`usage-dot-${i + 1}`}
            />
          ))}
        </div>

        {/* Status Text */}
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.message}
        </span>

        {/* Success indicator when not at limit */}
        {!isAtLimit && !isNearLimit && (
          <CheckCircle className="w-4 h-4 text-primary" />
        )}
      </div>
    </div>
  );
}
