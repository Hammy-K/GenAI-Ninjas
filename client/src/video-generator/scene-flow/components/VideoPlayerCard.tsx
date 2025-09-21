import {
  Play,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GenerateVideoResponse } from "@shared/video-flow.schema";
import { useState, useEffect } from "react";

interface VideoPlayerCardProps {
  result: GenerateVideoResponse;
  sceneNumber: number;
  "data-testid"?: string;
}

export function VideoPlayerCard({
  result,
  sceneNumber,
  "data-testid": testId,
}: VideoPlayerCardProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    if (result.status === "completed") {
      if (result.videoUrl) {
        setVideoSrc(result.videoUrl);
      } else if ((result as any).videoBase64) {
        try {
          const base64Data = (result as any).videoBase64;
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "video/mp4" });
          const blobUrl = URL.createObjectURL(blob);
          setVideoSrc(blobUrl);

          return () => URL.revokeObjectURL(blobUrl);
        } catch (error) {
          console.error("Failed to convert base64 to blob:", error);
        }
      }
    }
  }, [result]);

  const handleDownload = () => {
    if (videoSrc) {
      const link = document.createElement("a");
      link.href = videoSrc;
      link.download = `scene-${sceneNumber}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusConfig = () => {
    switch (result.status) {
      case "completed":
        return {
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          borderColor: "border-green-300",
          textColor: "text-green-800",
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          message: "اكتمل بنجاح!",
        };
      case "failed":
        return {
          bgColor: "bg-gradient-to-r from-red-50 to-pink-50",
          borderColor: "border-red-300",
          textColor: "text-red-800",
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          message: "فشل في الإنشاء",
        };
      default:
        return {
          bgColor: "bg-gradient-to-r from-purple-50 to-indigo-50",
          borderColor: "border-purple-300",
          textColor: "text-purple-800",
          icon: <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />,
          message: "جاري الإنشاء...",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`rounded-xl border-2 ${config.bgColor} ${config.borderColor} overflow-hidden shadow-sm`}
      data-testid={testId}
    >
      {/* Compact Status Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/50">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className={`text-sm font-semibold ${config.textColor}`}>
            {config.message}
          </span>
        </div>

        <span className="text-xs text-gray-500 font-mono">
          #{result.jobId.substring(0, 6)}
        </span>
      </div>

      {/* Video Player */}
      {result.status === "completed" && videoSrc && (
        <div className="p-3 space-y-3">
          <video
            controls
            className="w-full rounded-lg border border-gray-200 bg-black shadow-sm"
            data-testid={`video-player-${sceneNumber}`}
          >
            <source src={videoSrc} type="video/mp4" />
            متصفحك لا يدعم تشغيل الفيديو.
          </video>

          {/* Compact Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="flex-1 h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
              data-testid={`button-download-${sceneNumber}`}
            >
              <Download className="w-3 h-3 ml-1" />
              تحميل
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const video = document.querySelector(
                  `[data-testid="video-player-${sceneNumber}"]`,
                ) as HTMLVideoElement;
                if (video) {
                  video.currentTime = 0;
                  video.play();
                }
              }}
              className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
              data-testid={`button-replay-${sceneNumber}`}
            >
              <Play className="w-3 h-3 ml-1" />
              إعادة
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {result.status === "failed" && result.error && (
        <div className="p-3 text-red-700">
          <p className="text-xs font-medium mb-1">سبب المشكلة:</p>
          <p className="text-xs">{result.error}</p>
        </div>
      )}

      {/* Processing Message */}
      {result.status === "processing" && (
        <div className="p-3 text-purple-700">
          <p className="text-xs">يتم إنشاء الفيديو الآن، انتظر قليلاً...</p>
        </div>
      )}
    </div>
  );
}
