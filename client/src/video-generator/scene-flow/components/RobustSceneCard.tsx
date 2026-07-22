import { useState, useEffect } from "react";
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
  RefreshCw,
} from "lucide-react";
import { VideoPlayerCard } from "./VideoPlayerCard";
import { useVideoFlowContext } from "../contexts/VideoFlowContext";
import { videoFlowApi } from "../api/video-flow.api";
import type { Scene, AspectRatio } from "@shared/video-flow.schema";

interface RobustSceneCardProps {
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

export function RobustSceneCard({
  sceneNumber,
  scene,
  isExpanded,
  isCompleted,
  isLocked,
  onUpdate,
  onComplete,
  onExpand,
  "data-testid": testId,
}: RobustSceneCardProps) {
  const { saveCompletedVideo, completedVideos } = useVideoFlowContext();
  
  // Get video result from context instead of broken useVideoJob hook
  const videoResult = completedVideos[sceneNumber];
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  const [generationError, setGenerationError] = useState<string | null>(null);

  const isSceneValid =
    scene.description.length >= 10 && scene.voiceover.length >= 5;

  // Determine if video generation is available
  const hasCompletedVideo = videoResult?.status === "completed" && videoResult.videoUrl;
  const hasFailed = videoResult?.status === "failed";
  const canGenerate = isSceneValid && !isGenerating && (!videoResult || hasFailed);

  // Update completion status based on video result
  useEffect(() => {
    if (hasCompletedVideo) {
      onComplete(true);
    } else if (hasFailed || (!isSceneValid && !isGenerating)) {
      onComplete(false);
    }
  }, [hasCompletedVideo, hasFailed, isSceneValid, isGenerating, onComplete]);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    try {
      setGenerationError(null);
      setJobError(null);
      setIsGenerating(true);
      
      // Use working video-flow API
      const result = await videoFlowApi.generateVideo({
        scene: {
          description: scene.description,
          voiceover: scene.voiceover,
          aspectRatio: scene.aspectRatio
        }
      });

      // Save result to context
      saveCompletedVideo(sceneNumber, result);
      
      console.log(`Started video generation for scene ${sceneNumber}:`, result);
    } catch (error) {
      console.error(`Failed to start video generation for scene ${sceneNumber}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGenerationError(`فشل في بدء إنشاء الفيديو: ${errorMessage}`);
      setJobError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setGenerationError(null);
    setJobError(null);
  };

  const updateField = (field: keyof Scene, value: string | AspectRatio) => {
    const updatedScene = { ...scene, [field]: value };
    onUpdate(updatedScene);

    // Clear completed video if user changes scene significantly 
    if (hasCompletedVideo && (field === 'description' || field === 'aspectRatio')) {
      const newIsValid = updatedScene.description.length >= 10 && updatedScene.voiceover.length >= 5;
      if (!newIsValid) {
        saveCompletedVideo(sceneNumber, null);
      }
    }
  };

  const getStatusIcon = () => {
    if (isLocked) return <Lock className="w-4 h-4 text-muted" />;
    if (hasCompletedVideo) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (isGenerating) return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    if (hasFailed) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 rounded-full border-2 border-purple-400" />;
  };

  const getCardStyle = () => {
    if (isLocked) return "border-border bg-card/50";
    if (hasCompletedVideo)
      return "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50";
    if (isExpanded)
      return "border-primary bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg";
    return "border-border bg-white hover:border-purple-200 hover:shadow-md";
  };

  const getStatusMessage = () => {
    if (jobError) return `خطأ في الاتصال: ${jobError}`;
    if (generationError) return generationError;
    if (isGenerating) return "جاري إنشاء الفيديو...";
    
    if (videoResult) {
      switch (videoResult.status) {
        case "processing":
          return "جاري إنشاء الفيديو...";
        case "completed":
          return "تم إنشاء الفيديو بنجاح! ✅";
        case "failed":
          return `فشل في إنشاء الفيديو: ${videoResult.error || 'خطأ غير معروف'}`;
      }
    }
    
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <Collapsible open={isExpanded} onOpenChange={onExpand}>
      <div
        className={`rounded-lg border-2 p-4 transition-all duration-200 ${getCardStyle()}`}
        data-testid={testId}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="text-left">
              <h3 className="font-medium text-foreground">
                المشهد {sceneNumber}
              </h3>
              {statusMessage && (
                <p className="text-sm text-muted mt-1">{statusMessage}</p>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted" />
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 pt-4">
          {!isLocked && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  وصف المشهد
                </Label>
                <Textarea
                  value={scene.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="اكتب وصفاً مفصلاً للمشهد..."
                  className="min-h-[100px] resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted">
                  {scene.description.length}/10 حرف على الأقل
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  النص الصوتي
                </Label>
                <Textarea
                  value={scene.voiceover}
                  onChange={(e) => updateField("voiceover", e.target.value)}
                  placeholder="اكتب النص الذي سيُقرأ في الفيديو..."
                  className="min-h-[80px] resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted">
                  {scene.voiceover.length}/5 أحرف على الأقل
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  نسبة العرض إلى الارتفاع
                </Label>
                <RadioGroup
                  value={scene.aspectRatio}
                  onValueChange={(value) =>
                    updateField("aspectRatio", value as AspectRatio)
                  }
                  className="flex flex-wrap gap-4"
                  disabled={isGenerating}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="16:9" id={`${sceneNumber}-16-9`} />
                    <Label htmlFor={`${sceneNumber}-16-9`} className="text-sm">
                      16:9 (أفقي)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="9:16" id={`${sceneNumber}-9-16`} />
                    <Label htmlFor={`${sceneNumber}-9-16`} className="text-sm">
                      9:16 (عمودي)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1:1" id={`${sceneNumber}-1-1`} />
                    <Label htmlFor={`${sceneNumber}-1-1`} className="text-sm">
                      1:1 (مربع)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-3 pt-2">
                {canGenerate && (
                  <Button
                    onClick={handleGenerate}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid={`generate-video-${sceneNumber}`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    إنشاء الفيديو
                  </Button>
                )}

                {hasFailed && (
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    data-testid={`retry-video-${sceneNumber}`}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    إعادة المحاولة
                  </Button>
                )}

                {isGenerating && (
                  <Button
                    disabled
                    className="flex-1 bg-muted text-white cursor-not-allowed"
                  >
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الإنشاء...
                  </Button>
                )}
              </div>

              {/* Show video if completed */}
              {hasCompletedVideo && videoResult.videoUrl && (
                <div className="mt-4">
                  <VideoPlayerCard
                    videoUrl={videoResult.videoUrl}
                    sceneNumber={sceneNumber}
                  />
                </div>
              )}

              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && videoResult && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
                  <div>Job ID: {videoResult.jobId}</div>
                  <div>Status: {videoResult.status}</div>
                  <div>Generating: {isGenerating ? 'Yes' : 'No'}</div>
                  {videoResult.error && <div>Error: {videoResult.error}</div>}
                </div>
              )}
            </>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}