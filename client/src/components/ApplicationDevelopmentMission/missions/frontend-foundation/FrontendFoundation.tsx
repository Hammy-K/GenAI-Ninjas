import { Header } from "@/components/layout/Header";
import { useQuest } from "@/hooks/useQuest";
import { CheckCircle, Code, Target, ArrowRight } from "lucide-react";
import { FrontendMissionTrack } from "./FrontendMissionTrack";
import { FRONTEND_FOUNDATION_CONCEPTS } from "../../playground/config/concepts.config";

export default function FrontendFoundation() {
  const { xp } = useQuest();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f2e8" }}>
      <Header xp={xp} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى مهام تطوير التطبيقات
        </button>

        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <Code className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              أساسيات الواجهة الأمامية
            </h1>
            <span className="text-2xl">💻</span>
          </div>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            <strong>بناء عضلات البرمجة الحقيقية!</strong>
            <br />
            تعلم كيفية إنشاء واجهات تفاعلية جميلة من المدخلات البسيطة إلى
            التطبيقات المعقدة. هذه هي اللبنات الأساسية لكل تطبيق عظيم.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium">
            <Target className="w-4 h-4" />
            <span>الأسابيع 3-5 - 6 مفاهيم أساسية</span>
          </div>
        </div>

        {/* <div className="bg-white rounded-xl p-6 shadow-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              تقدمك في المفاهيم الأساسية
            </h2>
            <div className="text-sm text-gray-600">0/6 مكتمل</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: "0%" }}
            ></div>
          </div>
        </div> */}

        <FrontendMissionTrack
          weekRange="3-5"
          title="المفاهيم الأساسية المستفادة"
          description="هذه هي اللبنات الأساسية لكل تطبيق ويب تفاعلي. كل مفهوم يبني على السابق ليخلق تجربة مستخدم رائعة."
          concepts={FRONTEND_FOUNDATION_CONCEPTS}
          color="#3B82F6"
        />

        {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            مسار التعلم المقترح
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏗️</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">الأسابيع 3-4</h3>
              <p className="text-sm text-gray-600">
                المفاهيم الأساسية الأربعة الأولى: المدخلات، الأزرار، العشوائية،
                والمنطق الشرطي
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">الأسبوع 5</h3>
              <p className="text-sm text-gray-600">
                التصميم والصور: اجعل تطبيقاتك جميلة ومرئية مع CSS والصور
                الديناميكية
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                نهاية الأسبوع 5
              </h3>
              <p className="text-sm text-gray-600">
                دمج جميع المفاهيم في مشروع شامل يظهر مهاراتك الجديدة
              </p>
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-xl p-8 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            نصائح للنجاح
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                أثناء التطوير:
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>
                    <strong>ابدأ بسيط:</strong> مدخل واحد، مخرج واحد، ثم أضف
                    التعقيد تدريجياً
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>
                    <strong>اختبر كثيراً:</strong> بعد كل تغيير، تأكد أن التطبيق
                    يعمل
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>
                    <strong>استخدم الألوان بحكمة:</strong> 2-3 ألوان تكفي لمظهر
                    احترافي
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                عند العرض:
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    <strong>اشرح الفكرة أولاً:</strong> ما المشكلة التي يحلها
                    تطبيقك؟
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    <strong>أظهر الميزات:</strong> دع الجمهور يجرب التطبيق
                    بأنفسهم
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    <strong>شارك التحديات:</strong> ما الصعوبات التي واجهتها
                    وكيف حللتها؟
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
