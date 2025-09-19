import { Play, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GenerateVideoResponse } from '@shared/video-flow.schema';

interface VideoPlayerCardProps {
  result: GenerateVideoResponse;
  sceneNumber: number;
  'data-testid'?: string;
}

export function VideoPlayerCard({ result, sceneNumber, 'data-testid': testId }: VideoPlayerCardProps) {
  const handleDownload = () => {
    if (result.videoUrl) {
      const link = document.createElement('a');
      link.href = result.videoUrl;
      link.download = `scene-${sceneNumber}-${result.jobId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border ${
        result.status === 'completed' 
          ? 'border-green-200 bg-green-50' 
          : result.status === 'failed'
          ? 'border-red-200 bg-red-50'
          : 'border-blue-200 bg-blue-50'
      }`}
      data-testid={testId}
    >
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          {result.status === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : result.status === 'failed' ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          )}
          
          <span className={`font-medium ${
            result.status === 'completed' 
              ? 'text-green-800' 
              : result.status === 'failed'
              ? 'text-red-800'
              : 'text-blue-800'
          }`}>
            {result.status === 'completed' 
              ? `✅ الفيديو ${sceneNumber} جاهز!`
              : result.status === 'failed'
              ? `❌ فشل إنشاء الفيديو ${sceneNumber}`
              : `⏳ جاري إنشاء الفيديو ${sceneNumber}...`
            }
          </span>
        </div>

        <span className="text-xs text-gray-500">
          ID: {result.jobId.substring(0, 8)}
        </span>
      </div>

      {/* Video Player */}
      {result.status === 'completed' && result.videoUrl && (
        <div className="space-y-4">
          <video
            controls
            className="w-full rounded-lg border border-gray-200 bg-black"
            poster="/placeholder-video-thumbnail.jpg"
            data-testid={`video-player-${sceneNumber}`}
          >
            <source src={result.videoUrl} type="video/mp4" />
            متصفحك لا يدعم تشغيل الفيديو.
          </video>

          {/* Action Buttons */}
          <div className="flex space-x-2 space-x-reverse">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="flex-1"
              data-testid={`button-download-${sceneNumber}`}
            >
              <Download className="h-4 w-4 mr-1" />
              تحميل الفيديو
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const video = document.querySelector(`[data-testid="video-player-${sceneNumber}"]`) as HTMLVideoElement;
                if (video) {
                  video.currentTime = 0;
                  video.play();
                }
              }}
              data-testid={`button-replay-${sceneNumber}`}
            >
              <Play className="h-4 w-4 mr-1" />
              إعادة تشغيل
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {result.status === 'failed' && result.error && (
        <div className="text-red-700 text-sm">
          <p className="font-medium">سبب الفشل:</p>
          <p>{result.error}</p>
        </div>
      )}

      {/* Processing Message */}
      {result.status === 'processing' && (
        <div className="text-blue-700 text-sm">
          <p>يتم الآن إنشاء الفيديو باستخدام Vertex AI. قد يستغرق الأمر بضع دقائق...</p>
        </div>
      )}
    </div>
  );
}