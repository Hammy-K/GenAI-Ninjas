import { Header } from "@/components/layout/Header";
import { useQuest } from "@/hooks/useQuest";
import { Code, ArrowRight, Sparkles } from "lucide-react";
import { FrontendMissionTrack } from "./FrontendMissionTrack";
import { FRONTEND_FOUNDATION_CONCEPTS } from "../../playground/config/concepts.config";

export default function FrontendFoundation() {
  const { xp } = useQuest();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header xp={xp} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors font-medium"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Code className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              أساسيات الواجهة الأمامية
            </h1>
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>

          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            تعلم إنشاء واجهات تفاعلية من المدخلات البسيطة إلى التطبيقات المعقدة
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium">
            <span>6 مفاهيم أساسية</span>
          </div>
        </div>

        {/* Mission Track */}
        <div className="mb-8">
          <FrontendMissionTrack
            weekRange="3-5"
            title="المفاهيم الأساسية"
            description="اللبنات الأساسية لكل تطبيق ويب تفاعلي"
            concepts={FRONTEND_FOUNDATION_CONCEPTS}
            color="#3B82F6"
          />
        </div>

        {/* Quick Tips */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            نصائح سريعة للنجاح
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-600 text-sm">
                أثناء التطوير:
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>ابدأ بسيط، ثم أضف التعقيد تدريجياً</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>اختبر بعد كل تغيير</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>استخدم 2-3 ألوان فقط</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-green-600 text-sm">
                عند العرض:
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>اشرح الفكرة أولاً</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>دع الجمهور يجرب التطبيق</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>شارك التحديات وحلولها</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
