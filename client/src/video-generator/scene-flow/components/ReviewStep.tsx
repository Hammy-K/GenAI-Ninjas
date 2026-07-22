import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  CheckCircle,
  Video,
} from "lucide-react";

interface ReviewStepProps {
  onBack: () => void;
}

export function ReviewStep({ onBack }: ReviewStepProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center shadow-xl">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            إبداعك جاهز!
          </h2>
          <p className="text-muted">تم إنشاء جميع فيديوهاتك بنجاح</p>
        </div>

        {/* Success Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-4 text-center shadow-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-xl font-bold text-green-600">3</div>
            <div className="text-xs text-muted">فيديوهات</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-4 text-center shadow-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="text-xl font-bold text-primary">100%</div>
            <div className="text-xs text-muted">نجح</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-4 text-center shadow-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">AI</span>
            </div>
            <div className="text-xl font-bold text-blue-600">Veo</div>
            <div className="text-xs text-muted">تقنية</div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4 text-center">
            ماذا تريد أن تفعل الآن؟
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download All */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">
                  تحميل الفيديوهات
                </span>
              </div>
              <p className="text-xs text-green-700 mb-3">
                احفظ جميع فيديوهاتك على جهازك
              </p>
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
                onClick={() => {
                  // This would trigger download of all videos
                  console.log("Download all videos");
                }}
              >
                تحميل الكل
              </Button>
            </div>

            {/* Share */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">شارك إبداعك</span>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                شارك فيديوهاتك مع الأصدقاء
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                onClick={() => {
                  // This would open share options
                  console.log("Share videos");
                }}
              >
                مشاركة
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="space-y-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="w-full h-12 border-primary text-primary hover:bg-primary rounded-xl"
            data-testid="button-back-to-scenes"
          >
            <ArrowLeft className="ml-2 w-4 h-4" />
            تعديل المشاهد
          </Button>

          <Button
            onClick={() => window.location.reload()}
            size="lg"
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg"
            data-testid="button-start-new-session"
          >
            <RefreshCw className="ml-2 w-4 h-4" />
            إنشاء فيديوهات جديدة
          </Button>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-4 shadow-lg">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-yellow-500">💡</span>
            نصائح سريعة
          </h4>
          <div className="space-y-2 text-sm text-muted">
            <div className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>يمكنك تحميل كل فيديو منفرداً من المشاهد</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>جرب نسب عرض مختلفة للمنصات المختلفة</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>احفظ النصوص المستخدمة للمشاريع القادمة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
