import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Lock, CheckCircle, Loader2, Play, Download, AlertTriangle } from 'lucide-react';
import { videoFlowApi } from '../api/video-flow.api';
import { VideoPlayerCard } from './VideoPlayerCard';
import type { Scene, AspectRatio, GenerateVideoResponse } from '@shared/video-flow.schema';

interface SceneCardProps {
  sceneNumber: number;
  scene: Scene;
  isExpanded: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onUpdate: (scene: Scene) => void;
  onComplete: (isComplete: boolean) => void;
  onExpand: () => void;
  'data-testid'?: string;
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
  'data-testid': testId,
}: SceneCardProps) {
  const [videoResult, setVideoResult] = useState<GenerateVideoResponse | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const queryClient = useQueryClient();

  const isSceneValid = scene.description.length >= 10 && scene.voiceover.length >= 5;

  // Get usage data to enforce limits
  const { data: usage } = useQuery({
    queryKey: ['video-flow', 'usage'],
    queryFn: videoFlowApi.getUsage,
    refetchInterval: 5000,
  });

  const isAtUsageLimit = usage ? usage.used >= usage.limit : false;

  // Polling effect for video status with timeout
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    if (videoResult?.status === 'processing' && videoResult.jobId) {
      setIsPolling(true);
      const startTime = Date.now();
      const TIMEOUT_MINUTES = 5;
      const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000; // 5 minutes
      
      const pollStatus = async () => {
        try {
          // Check for timeout
          if (Date.now() - startTime > TIMEOUT_MS) {
            setGenerationError(`انتهت مهلة إنشاء الفيديو (${TIMEOUT_MINUTES} دقائق). حاول مرة أخرى.`);
            onComplete(false);
            setIsPolling(false);
            return;
          }

          const statusResult = await videoFlowApi.checkStatus(videoResult.jobId);
          setVideoResult(statusResult);

          if (statusResult.status === 'completed') {
            onComplete(true);
            setIsPolling(false);
            // Invalidate usage query to update remaining count
            queryClient.invalidateQueries({ queryKey: ['video-flow', 'usage'] });
          } else if (statusResult.status === 'failed') {
            setGenerationError(statusResult.error || 'فشل في إنشاء الفيديو');
            onComplete(false);
            setIsPolling(false);
          }
        } catch (error) {
          console.error('Status polling error:', error);
          setGenerationError('خطأ في التحقق من حالة الفيديو');
          setIsPolling(false);
        }
      };

      // Start polling immediately
      pollStatus();
      
      // Then poll every 5 seconds
      pollInterval = setInterval(pollStatus, 5000);
      
      // Set up timeout timer
      timeoutTimer = setTimeout(() => {
        setGenerationError(`انتهت مهلة إنشاء الفيديو (${TIMEOUT_MINUTES} دقائق). حاول مرة أخرى.`);
        onComplete(false);
        setIsPolling(false);
      }, TIMEOUT_MS);
    } else {
      // Reset polling state when not processing
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
    retry: 1, // Retry once for network errors
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data: GenerateVideoResponse) => {
      setVideoResult(data);
      setGenerationError(null);
      // Only reset polling state if not processing (to allow polling to start)
      if (data.status !== 'processing') {
        setIsPolling(false);
      }
      
      if (data.status === 'completed') {
        onComplete(true);
        // Invalidate usage query to update remaining count
        queryClient.invalidateQueries({ queryKey: ['video-flow', 'usage'] });
      } else if (data.status === 'failed') {
        onComplete(false);
      }
      // For 'processing' status, the useEffect will handle polling
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'حدث خطأ غير متوقع';
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
    
    // Check if scene is now valid and mark as complete if it has a video
    const newIsValid = updatedScene.description.length >= 10 && updatedScene.voiceover.length >= 5;
    if (newIsValid && videoResult?.status === 'completed') {
      onComplete(true);
    } else if (!newIsValid) {
      onComplete(false);
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={(open) => open && onExpand()}>
      <div
        className={`border rounded-lg transition-all ${
          isLocked
            ? 'border-gray-200 bg-gray-50'
            : isCompleted
            ? 'border-green-200 bg-green-50'
            : isExpanded
            ? 'border-blue-200 bg-blue-50'
            : 'border-gray-200 bg-white'
        }`}
        data-testid={testId}
      >
        {/* Card Header */}
        <CollapsibleTrigger
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          disabled={isLocked}
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            {isLocked ? (
              <Lock className="h-5 w-5 text-gray-400" />
            ) : isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-blue-600" />
            )}
            
            <h3 className="text-lg font-semibold text-gray-900">
              المشهد {sceneNumber}
            </h3>
            
            {scene.description && (
              <span className="text-sm text-gray-500 truncate max-w-64">
                {scene.description.substring(0, 50)}...
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            {videoResult?.status === 'completed' && (
              <div className="flex items-center space-x-1 space-x-reverse text-green-600">
                <Play className="h-4 w-4" />
                <span className="text-sm">جاهز</span>
              </div>
            )}
            
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </CollapsibleTrigger>

        {/* Card Content */}
        <CollapsibleContent>
          <div className="p-4 border-t border-gray-200">
            {isLocked ? (
              <div className="text-center py-8 text-gray-500">
                <Lock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>أكمل المشهد السابق لفتح هذا المشهد</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Scene Description */}
                <div>
                  <Label htmlFor={`description-${sceneNumber}`} className="text-base font-medium">
                    وصف المشهد *
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    صف العناصر البصرية والإعداد والحركة (10 أحرف على الأقل)
                  </p>
                  <Textarea
                    id={`description-${sceneNumber}`}
                    value={scene.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="مثال: منظر طبيعي خلاب لشروق الشمس فوق الجبال مع طيور تحلق في السماء الزرقاء..."
                    rows={3}
                    className="resize-none"
                    data-testid={`input-description-${sceneNumber}`}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {scene.description.length}/10 (الحد الأدنى)
                  </div>
                </div>

                {/* Voiceover Script */}
                <div>
                  <Label htmlFor={`voiceover-${sceneNumber}`} className="text-base font-medium">
                    نص التعليق الصوتي *
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    حوار الراوي لهذا المشهد (5 أحرف على الأقل)
                  </p>
                  <Textarea
                    id={`voiceover-${sceneNumber}`}
                    value={scene.voiceover}
                    onChange={(e) => updateField('voiceover', e.target.value)}
                    placeholder="مثال: في هذا المنظر الساحر، نشاهد جمال الطبيعة وهي تستيقظ مع أول خيوط الفجر..."
                    rows={2}
                    className="resize-none"
                    data-testid={`input-voiceover-${sceneNumber}`}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {scene.voiceover.length}/5 (الحد الأدنى)
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <Label className="text-base font-medium">نسبة العرض إلى الارتفاع</Label>
                  <RadioGroup
                    value={scene.aspectRatio}
                    onValueChange={(value) => updateField('aspectRatio', value as AspectRatio)}
                    className="flex space-x-4 space-x-reverse mt-2"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="16:9" id={`ratio-169-${sceneNumber}`} />
                      <Label htmlFor={`ratio-169-${sceneNumber}`}>16:9 (أفقي)</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="9:16" id={`ratio-916-${sceneNumber}`} />
                      <Label htmlFor={`ratio-916-${sceneNumber}`}>9:16 (عمودي)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Usage Limit Warning */}
                {isAtUsageLimit && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800 text-sm font-medium">
                        تم استنفاد الحد المسموح من الفيديوهات
                      </span>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!isSceneValid || generateVideoMutation.isPending || isAtUsageLimit}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400"
                    data-testid={`button-generate-${sceneNumber}`}
                  >
                    {generateVideoMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري إنشاء الفيديو...
                      </>
                    ) : isAtUsageLimit ? (
                      '🚫 تم استنفاد الحد المسموح'
                    ) : (
                      `🎬 إنشاء فيديو المشهد ${sceneNumber}`
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
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2 space-x-reverse">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-red-700 text-sm font-medium">
                          خطأ في إنشاء الفيديو:
                        </p>
                        <p className="text-red-600 text-sm mt-1">
                          {generationError}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleGenerate}
                          disabled={!isSceneValid || generateVideoMutation.isPending || isAtUsageLimit}
                          className="mt-2"
                        >
                          🔄 إعادة المحاولة
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