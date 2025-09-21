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
  ChevronRight,
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

  const isSceneValid =
    scene.description.length >= 10 && scene.voiceover.length >= 5;

  // Get usage data to enforce limits
  const { data: usage } = useQuery({
    queryKey: ["video-flow", "usage"],
    queryFn: videoFlowApi.getUsage,
    refetchInterval: 5000,
  });

  const isAtUsageLimit = usage ? usage.used >= usage.limit : false;

  // Polling effect for video status with timeout
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
            setGenerationError(`انتهت مهلة الإنشاء. حاول مرة أخرى.`);
            onComplete(false);
            setIsPolling(false);
            return;
          }

          const statusResult = await videoFlowApi.checkStatus(
            videoResult.jobId,
          );
          setVideoResult(statusResult);

          if (statusResult.status === "completed") {
            onComplete(true);
            setIsPolling(false);
            queryClient.invalidateQueries({
              queryKey: ["video-flow", "usage"],
            });
          } else if (statusResult.status === "failed") {
            setGenerationError(statusResult.error || "فشل في إنشاء الفيديو");
            onComplete(false);
            setIsPolling(false);
          }
        } catch (error) {
          console.error("Status polling error:", error);
          setGenerationError("خطأ في التحقق من حالة الفيديو");
          setIsPolling(false);
        }
      };

      pollStatus();
      pollInterval = setInterval(pollStatus, 5000);

      timeoutTimer = setTimeout(() => {
        setGenerationError(`انتهت مهلة الإنشاء. حاول مرة أخرى.`);
        onComplete(false);
        setIsPolling(false);
      }, TIMEOUT_MS);
    } else {
      setIsPolling(false);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
    };
  }, [videoResult?.status, videoResult?.jobId, onComplete, queryClient]);

  // Generate video mutation
  const generateVideoMutation = useMutation({
    mutationFn: videoFlowApi.generateVideo,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data: GenerateVideoResponse) => {
      setVideoResult(data);
      setGenerationError(null);
      if (data.status !== "processing") {
        setIsPolling(false);
      }

      if (data.status === "completed") {
        onComplete(true);
        queryClient.invalidateQueries({ queryKey: ["video-flow", "usage"] });
      } else if (data.status === "failed") {
        onComplete(false);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "حدث خطأ، حاول مرة أخرى";
      setGenerationError(errorMessage);
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
    if (isLocked) return <Lock className="w-5 h-5 text-gray-400" />;
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (videoResult?.status === "processing")
      return <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />;
    return <div className="w-5 h-5 rounded-full border-2 border-purple-400" />;
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
        className={`rounded-2xl transition-all duration-300 ${getCardStyle()}`}
        data-testid={testId}
      >
        {/* Card Header */}
        <CollapsibleTrigger
          className="w-full p-6 flex items-center justify-between hover:bg-white/50 transition-all duration-200 rounded-2xl"
          disabled={isLocked}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-200 flex items-center justify-center">
              {getStatusIcon()}
            </div>

            <div className="text-right">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                المشهد {sceneNumber}
              </h3>

              {scene.description && (
                <p className="text-sm text-gray-600 max-w-64 truncate">
                  {scene.description.substring(0, 40)}...
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {videoResult?.status === "completed" && (
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                <Play className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">جاهز</span>
              </div>
            )}

            {videoResult?.status === "processing" && (
              <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-sm font-medium text-purple-800">
                  جاري الإنشاء
                </span>
              </div>
            )}

            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
            />
          </div>
        </CollapsibleTrigger>

        {/* Card Content */}
        <CollapsibleContent>
          <div className="px-6 pb-6">
            {isLocked ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium">أكمل المشهد السابق أولاً</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Scene Description */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Film className="w-5 h-5 text-purple-600" />
                    <Label
                      htmlFor={`description-${sceneNumber}`}
                      className="text-base font-semibold text-gray-900"
                    >
                      وصف المشهد
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    صف ما تريد أن يظهر في الفيديو
                  </p>
                  <Textarea
                    id={`description-${sceneNumber}`}
                    value={scene.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="مثال: منظر طبيعي جميل لشروق الشمس فوق الجبال..."
                    rows={3}
                    className="resize-none bg-white/80 border-purple-200 focus:border-purple-400 focus:ring-purple-500 rounded-xl"
                    data-testid={`input-description-${sceneNumber}`}
                  />
                  <div
                    className={`text-xs mt-2 ${scene.description.length >= 10 ? "text-green-600" : "text-gray-500"}`}
                  >
                    {scene.description.length >= 10 ? "✓" : "○"}{" "}
                    {scene.description.length}/10 أحرف
                  </div>
                </div>

                {/* Voiceover Script */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Mic className="w-5 h-5 text-purple-600" />
                    <Label
                      htmlFor={`voiceover-${sceneNumber}`}
                      className="text-base font-semibold text-gray-900"
                    >
                      التعليق الصوتي
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    النص الذي سيقرأه الراوي
                  </p>
                  <Textarea
                    id={`voiceover-${sceneNumber}`}
                    value={scene.voiceover}
                    onChange={(e) => updateField("voiceover", e.target.value)}
                    placeholder="مثال: في هذا المشهد الجميل، نرى روعة الطبيعة..."
                    rows={2}
                    className="resize-none bg-white/80 border-purple-200 focus:border-purple-400 focus:ring-purple-500 rounded-xl"
                    data-testid={`input-voiceover-${sceneNumber}`}
                  />
                  <div
                    className={`text-xs mt-2 ${scene.voiceover.length >= 5 ? "text-green-600" : "text-gray-500"}`}
                  >
                    {scene.voiceover.length >= 5 ? "✓" : "○"}{" "}
                    {scene.voiceover.length}/5 أحرف
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    الشكل
                  </Label>
                  <RadioGroup
                    value={scene.aspectRatio}
                    onValueChange={(value) =>
                      updateField("aspectRatio", value as AspectRatio)
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center gap-3 p-4 bg-white/80 border-2 border-purple-200 rounded-xl hover:border-purple-300 transition-colors">
                      <RadioGroupItem
                        value="16:9"
                        id={`ratio-169-${sceneNumber}`}
                        className="text-purple-600"
                      />
                      <Label
                        htmlFor={`ratio-169-${sceneNumber}`}
                        className="font-medium cursor-pointer"
                      >
                        16:9 أفقي
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/80 border-2 border-purple-200 rounded-xl hover:border-purple-300 transition-colors">
                      <RadioGroupItem
                        value="9:16"
                        id={`ratio-916-${sceneNumber}`}
                        className="text-purple-600"
                      />
                      <Label
                        htmlFor={`ratio-916-${sceneNumber}`}
                        className="font-medium cursor-pointer"
                      >
                        9:16 عمودي
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Usage Limit Warning */}
                {isAtUsageLimit && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">
                        تم استنفاد الحد المسموح
                      </span>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={
                      !isSceneValid ||
                      generateVideoMutation.isPending ||
                      isAtUsageLimit
                    }
                    size="lg"
                    className="w-full h-14 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid={`button-generate-${sceneNumber}`}
                  >
                    {generateVideoMutation.isPending ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري الإنشاء...</span>
                      </div>
                    ) : isAtUsageLimit ? (
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        <span>تم استنفاد الحد المسموح</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Film className="w-5 h-5" />
                        <span>إنشاء الفيديو</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* Video Result */}
                {videoResult && (
                  <VideoPlayerCard
                    result={videoResult}
                    sceneNumber={sceneNumber}
                    data-testid={`video-result-${sceneNumber}`}
                  />
                )}

                {/* Generation Error */}
                {generationError && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-red-700 font-medium mb-1">حدث خطأ</p>
                        <p className="text-red-600 text-sm mb-3">
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
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          إعادة المحاولة
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
