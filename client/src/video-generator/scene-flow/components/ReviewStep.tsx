import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ReviewStepProps {
  onBack: () => void;
}

export function ReviewStep({ onBack }: ReviewStepProps) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          تم إنشاء جميع الفيديوهات!
        </h2>
        <p className="text-lg text-gray-600">
          مبروك! لقد أنشأت ثلاثة فيديوهات رائعة باستخدام الذكاء الاصطناعي
        </p>
      </div>

      {/* Success Animation */}
      <div className="mb-8 p-8 bg-green-50 border border-green-200 rounded-xl">
        <div className="text-green-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          مهمة مكتملة ✅
        </h3>
        <p className="text-green-700">
          تم إنشاء جميع المشاهد الثلاثة بنجاح وهي جاهزة للتحميل والمشاركة
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">3</div>
          <div className="text-sm text-blue-800">فيديوهات منشأة</div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">Veo 3</div>
          <div className="text-sm text-purple-800">تقنية Vertex AI</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-600">100%</div>
          <div className="text-sm text-green-800">معدل النجاح</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="w-full"
          data-testid="button-back-to-scenes"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          العودة لتعديل المشاهد
        </Button>

        <Button
          onClick={() => window.location.reload()}
          size="lg"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          data-testid="button-start-new-session"
        >
          🔄 بدء جلسة جديدة
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-right">
        <h4 className="font-medium text-gray-900 mb-2">💡 نصائح:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• يمكنك تحميل الفيديوهات من أزرار التحميل في كل مشهد</li>
          <li>• احفظ نسخة من النصوص المستخدمة للرجوع إليها لاحقاً</li>
          <li>• جرب نسب عرض مختلفة (16:9 أو 9:16) للاستخدامات المختلفة</li>
        </ul>
      </div>
    </div>
  );
}