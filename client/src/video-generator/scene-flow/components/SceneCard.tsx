import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Lock,
  CheckCircle,
  Loader2,
  Play,
  AlertTriangle,
  Film,
  Mic,
} from "lucide-react";
import { videoFlowApi } from "../api/video-flow.api";
import { VideoPlayerCard } from "./VideoPlayerCard";
import { useVideoFlowContext } from "../contexts/VideoFlowContext";
import type {
  Scene,
  AspectRatio,
  GenerateVideoResponse,
} from "@shared/video-flow.schema";

interface SceneCardProps {
  sceneNumber: number;
  scene: Scene;
  isExpanded: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onUpdate: (scene: Scene) => void;
  onComplete: (isComplete: boolean) => void;
  onExpand: () => void;
  "data-testid"?: string;
}

export function SceneCard({
  sceneNumber,
  scene,
  isExpanded,
  isCompleted,
  isLocked,
  onUpdate,
  onComplete,
  onExpand,
  "data-testid": testId,
}: SceneCardProps) {
  const [videoResult, setVideoResult] = useState<GenerateVideoResponse | null>(
    null,
  );
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const queryClient = useQueryClient();
  const { saveCompletedVideo, getCompletedVideo } = useVideoFlowContext();

  const isSceneValid =
    scene.description.length >= 10 && scene.voiceover.length >= 5;

  const { data: usage } = useQuery({
    queryKey: ["video-flow", "usage"],
    queryFn: videoFlowApi.getUsage,
    refetchInterval: 5000,
  });

  const isAtUsageLimit = usage ? usage.used >= usage.limit : false;

  // Load saved video on mount
  useEffect(() => {
    const savedVideo = getCompletedVideo(sceneNumber);
    if (savedVideo) {
      setVideoResult(savedVideo);
      if (savedVideo.status === "completed") {
        onComplete(true);
      }
    }
  }, [sceneNumber, getCompletedVideo, onComplete]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    if (videoResult?.status === "processing" && videoResult.jobId) {
      setIsPolling(true);
      const startTime = Date.now();
      const TIMEOUT_MINUTES = 5;
      const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

      const pollStatus = async () => {
        try {
          if (Date.now() - startTime > TIMEOUT_MS) {
            setGenerationError(`انتهت مهلة الإنشاء`);
            onComplete(false);
            setIsPolling(false);
            return;
          }

          const statusResult = await videoFlowApi.checkStatus(
            videoResult.jobId,
          );
          setVideoResult(statusResult);

          // Save updated status to context/localStorage
          saveCompletedVideo(sceneNumber, statusResult);

          if (statusResult.status === "completed") {
            onComplete(true);
            setIsPolling(false);
            queryClient.invalidateQueries({
              queryKey: ["video-flow", "usage"],
            });
          } else if (statusResult.status === "failed") {
            setGenerationError("فشل في الإنشاء");
            onComplete(false);
            setIsPolling(false);
          }
        } catch (error) {
          setGenerationError("خطأ في التحقق");
          setIsPolling(false);
        }
      };

      pollStatus();
      pollInterval = setInterval(pollStatus, 5000);

      timeoutTimer = setTimeout(() => {
        setGenerationError(`انتهت المهلة`);
        onComplete(false);
        setIsPolling(false);
      }, TIMEOUT_MS);
    } else {
      setIsPolling(false);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [videoResult?.status, videoResult?.jobId, onComplete, queryClient]);

  const generateVideoMutation = useMutation({
    mutationFn: videoFlowApi.generateVideo,
    retry: 1,
    onSuccess: (data: GenerateVideoResponse) => {
      setVideoResult(data);
      setGenerationError(null);
      saveCompletedVideo(sceneNumber, data);

      // Invalidate usage immediately when generation starts
      queryClient.invalidateQueries({ queryKey: ["video-flow", "usage"] });

      if (data.status !== "processing") setIsPolling(false);
      if (data.status === "completed") {
        onComplete(true);
      } else if (data.status === "failed") {
        onComplete(false);
      }
    },
    onError: (error: any) => {
      setGenerationError("حدث خطأ");
      setVideoResult(null);
      onComplete(false);
    },
  });

  const handleGenerate = () => {
    if (isSceneValid && !isAtUsageLimit) {
      setGenerationError(null);
      generateVideoMutation.mutate({ scene });
    }
  };

  const updateField = (field: keyof Scene, value: string | AspectRatio) => {
    const updatedScene = { ...scene, [field]: value };
    onUpdate(updatedScene);

    const newIsValid =
      updatedScene.description.length >= 10 &&
      updatedScene.voiceover.length >= 5;
    if (newIsValid && videoResult?.status === "completed") {
      onComplete(true);
    } else if (!newIsValid) {
      onComplete(false);
    }
  };

  const getStatusIcon = () => {
    if (isLocked) return <Lock className="w-4 h-4 text-gray-400" />;
    if (isCompleted) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (videoResult?.status === "processing")
      return <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />;
    return <div className="w-4 h-4 rounded-full border-2 border-purple-400" />;
  };

  const getCardStyle = () => {
    if (isLocked) return "border-gray-200 bg-gray-50/50";
    if (isCompleted)
      return "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50";
    if (isExpanded)
      return "border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg";
    return "border-gray-200 bg-white hover:border-purple-200 hover:shadow-md";
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={(open) => open && onExpand()}>
      <div
        className={`rounded-xl transition-all duration-300 ${getCardStyle()}`}
        data-testid={testId}
      >
        {/* Compact Header */}
        <CollapsibleTrigger
          className="w-full p-3 flex items-center justify-between hover:bg-white/50 transition-all duration-200 rounded-xl"
          disabled={isLocked}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/80 border border-purple-200 flex items-center justify-center">
              {getStatusIcon()}
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold text-gray-900">
                المشهد {sceneNumber}
              </h3>
              {scene.description && (
                <p className="text-xs text-gray-600 max-w-32 truncate">
                  {scene.description.substring(0, 20)}...
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {videoResult?.status === "completed" && (
              <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                <Play className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-800">جاهز</span>
              </div>
            )}

            {videoResult?.status === "processing" && (
              <div className="flex items-center gap-1 bg-purple-100 px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                <span className="text-xs font-medium text-purple-800">
                  إنشاء
                </span>
              </div>
            )}

            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
            />
          </div>
        </CollapsibleTrigger>

        {/* Compact Content */}
        <CollapsibleContent>
          <div className="px-3 pb-3">
            {isLocked ? (
              <div className="text-center py-6 text-gray-500">
                <Lock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs">أكمل المشهد السابق</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Description */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Film className="w-3 h-3 text-purple-600" />
                    <Label className="text-xs font-semibold">وصف المشهد</Label>
                  </div>
                  <Textarea
                    value={scene.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="صف ما تريد أن يظهر..."
                    rows={2}
                    className="text-xs resize-none"
                    data-testid={`input-description-${sceneNumber}`}
                  />
                  <div
                    className={`text-xs mt-1 ${scene.description.length >= 10 ? "text-green-600" : "text-gray-500"}`}
                  >
                    {scene.description.length >= 10 ? "✓" : "○"}{" "}
                    {scene.description.length}/10
                  </div>
                </div>

                {/* Voiceover */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Mic className="w-3 h-3 text-purple-600" />
                    <Label className="text-xs font-semibold">
                      التعليق الصوتي
                    </Label>
                  </div>
                  <Textarea
                    value={scene.voiceover}
                    onChange={(e) => updateField("voiceover", e.target.value)}
                    placeholder="النص الذي سيقرأه الراوي..."
                    rows={2}
                    className="text-xs resize-none"
                    data-testid={`input-voiceover-${sceneNumber}`}
                  />
                  <div
                    className={`text-xs mt-1 ${scene.voiceover.length >= 5 ? "text-green-600" : "text-gray-500"}`}
                  >
                    {scene.voiceover.length >= 5 ? "✓" : "○"}{" "}
                    {scene.voiceover.length}/5
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">
                    الشكل
                  </Label>
                  <RadioGroup
                    value={scene.aspectRatio}
                    onValueChange={(value) =>
                      updateField("aspectRatio", value as AspectRatio)
                    }
                    className="flex gap-2"
                  >
                    <div
                      className={`flex items-center gap-1 p-2 border-2 rounded-lg flex-1 transition-all cursor-pointer ${
                        scene.aspectRatio === "16:9"
                          ? "bg-purple-100 border-purple-400 shadow-md"
                          : "bg-white/80 border-gray-300 hover:border-purple-300"
                      }`}
                      onClick={() => updateField("aspectRatio", "16:9")}
                    >
                      <RadioGroupItem
                        value="16:9"
                        id={`ratio-169-${sceneNumber}`}
                        className="w-3 h-3"
                      />
                      <Label
                        htmlFor={`ratio-169-${sceneNumber}`}
                        className={`text-xs cursor-pointer font-semibold ${
                          scene.aspectRatio === "16:9"
                            ? "text-purple-800"
                            : "text-gray-600"
                        }`}
                      >
                        أفقي
                      </Label>
                    </div>
                    <div
                      className={`flex items-center gap-1 p-2 border-2 rounded-lg flex-1 transition-all cursor-pointer ${
                        scene.aspectRatio === "9:16"
                          ? "bg-purple-100 border-purple-400 shadow-md"
                          : "bg-white/80 border-gray-300 hover:border-purple-300"
                      }`}
                      onClick={() => updateField("aspectRatio", "9:16")}
                    >
                      <RadioGroupItem
                        value="9:16"
                        id={`ratio-916-${sceneNumber}`}
                        className="w-3 h-3"
                      />
                      <Label
                        htmlFor={`ratio-916-${sceneNumber}`}
                        className={`text-xs cursor-pointer font-semibold ${
                          scene.aspectRatio === "9:16"
                            ? "text-purple-800"
                            : "text-gray-600"
                        }`}
                      >
                        عمودي
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Usage Warning */}
                {isAtUsageLimit && (
                  <div className="p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-yellow-600" />
                      <span className="text-xs text-yellow-800 font-medium">
                        تم استنفاد الحد
                      </span>
                    </div>
                  </div>
                )}

                {/* Generate Button - Enhanced with proper variant */}
                <Button
                  onClick={handleGenerate}
                  disabled={
                    !isSceneValid ||
                    generateVideoMutation.isPending ||
                    isAtUsageLimit
                  }
                  size="sm"
                  variant={isAtUsageLimit ? "secondary" : "default"}
                  className="w-full"
                  data-testid={`button-generate-${sceneNumber}`}
                >
                  {generateVideoMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      إنشاء...
                    </>
                  ) : isAtUsageLimit ? (
                    <>
                      <AlertTriangle />
                      استنفد الحد
                    </>
                  ) : (
                    <>
                      <Film />
                      إنشاء فيديو
                    </>
                  )}
                </Button>

                {/* Video Result */}
                {videoResult && (
                  <div className="pt-2">
                    <VideoPlayerCard
                      result={videoResult}
                      sceneNumber={sceneNumber}
                      data-testid={`video-result-${sceneNumber}`}
                    />
                  </div>
                )}

                {/* Error - Enhanced with better button styling */}
                {generationError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-red-700 font-medium mb-2">
                          {generationError}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleGenerate}
                          disabled={
                            !isSceneValid ||
                            generateVideoMutation.isPending ||
                            isAtUsageLimit
                          }
                          className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                        >
                          إعادة
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
