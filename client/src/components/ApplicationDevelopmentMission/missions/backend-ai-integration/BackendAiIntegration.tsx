import { Header } from "@/components/layout/Header";
import { useQuest } from "@/hooks/useQuest";
import { ArrowRight, Target, Cloud, Bot, Database, ShieldCheck } from "lucide-react";
import { FrontendMissionTrack } from "../frontend-foundation/FrontendMissionTrack";

export default function BackendAiIntegration() {
  const { xp } = useQuest();

  const concepts = [
    {
      Icon: Cloud,
      title: "استدعاء واجهات خارجية (APIs)",
      description:
        "تعلّم استخدام fetch لجلب البيانات من خدمات حقيقية مع حالات التحميل والأخطاء.",
      examples: [
        "الطقس: استعلام مدينة ← عرض الحرارة والظروف",
        "نكتة عشوائية من API لعرضها فورًا",
        "التعامل مع حالات الفشل وإعادة المحاولة",
      ],
      color: "#06B6D4",
      isCompleted: false,
      url: "/missions/app-development/backend-ai-integration/external-apis",
    },
    {
      Icon: Bot,
      title: "دمج واجهة OpenAI (نصوص/مساعدات)",
      description: "إرسال مُدخل المستخدم للنموذج واستلام الرد وعرضه بشكل جذاب.",
      examples: [
        "مساعد كتابة: موضوع ← فقرة مُقترحة",
        "مُلخِّص نصوص قصيرة",
        "اقتراحات ذكية حسب السياق",
      ],
      color: "#06B6D4",
      isCompleted: false,
      url: "/missions/app-development/backend-ai-integration/openai",
    },
    {
      Icon: Database,
      title: "حفظ بيانات المستخدم (Replit DB أو localStorage)",
      description: "تخزين بسيط للتفضيلات/السجل مع قراءة/كتابة آمنة ومنظمة.",
      examples: [
        "حفظ الاسم واللغة والتفضيلات",
        "سجل آخر الردود لعرضها لاحقًا",
        "تخزين مؤقت (caching) لنتائج الـAPI",
      ],
      color: "#06B6D4",
      isCompleted: false,
      url: "/missions/app-development/backend-ai-integration/persistence",
    },
    {
      Icon: ShieldCheck,
      title: "مصادقة بسيطة أو تخصيص المستخدم",
      description: "محاكاة تسجيل دخول أو تعريف مستخدم لعرض تجربة مخصصة.",
      examples: [
        "تسجيل دخول بالاسم/كلمة مرور تجريبية",
        "ترحيب شخصي ولوحة معلومات مبسّطة",
        "حماية مسارات/مكوّنات حسب الحالة",
      ],
      color: "#06B6D4",
      isCompleted: false,
      url: "/missions/app-development/backend-ai-integration/auth-personalization",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eaf9fb" }}>
      <Header xp={xp} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-8 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى مهام تطوير التطبيقات
        </button>

        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="p-3 bg-cyan-100 rounded-full">
              <Bot className="w-8 h-8 text-cyan-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              باكند أساسي + دمج الذكاء الاصطناعي
            </h1>
            <span className="text-2xl">🤖</span>
          </div>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            انطلق من واجهات بسيطة إلى تطبيقات تتفاعل مع العالم الحقيقي:{" "}
            <strong>استدعاء خدمات خارجية</strong>، <strong>دمج OpenAI</strong>،{" "}
            <strong>حفظ بيانات المستخدم</strong>، و
            <strong>مصادقة أو تخصيص بسيط</strong> — بخطوات عملية وواضحة.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-700 font-medium">
            <Target className="w-4 h-4" />
            <span>الأسابيع 7–9 — 4 مفاهيم أساسية</span>
          </div>
        </div>

        <FrontendMissionTrack
          weekRange="7-9"
          title="المفاهيم المكتسبة"
          description="هذه الوحدات تعلّمك ربط الواجهة بخدمات حقيقية، واستثمار الذكاء الاصطناعي، وحفظ البيانات، وتخصيص التجربة للمستخدم."
          concepts={concepts}
          color="#06B6D4"
        />

        <div className="bg-white rounded-xl p-8 shadow-md mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            نصائح للنجاح
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-cyan-600 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                أثناء التطوير:
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
                  <span>
                    <strong>إدارة المفاتيح بأمان:</strong> لا تضع مفاتيح API في
                    الواجهة الأمامية — استخدم خادمًا وسيطًا أو وظائف سيرفرلس.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
                  <span>
                    <strong>حالات الشبكة أولًا:</strong> حمّل/خطأ/إعادة
                    المحاولة/إلغاء الطلب لجعل التجربة موثوقة.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
                  <span>
                    <strong>نمذجة البيانات:</strong> حدّد شكل JSON المتوقّع
                    واكتب محوّلات/حمايات (guards) بسيطة قبل العرض.
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-600 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                عند العرض:
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <span>
                    <strong>اعرض رحلتين:</strong> مثال API خارجي + مثال OpenAI
                    مع إبراز الرسائل/القيود (rate limits).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <span>
                    <strong>بيّن القيمة:</strong> قبل/بعد حفظ البيانات وعودة
                    المستخدم لرؤية التخصيص.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <span>
                    <strong>سلوك أخلاقي:</strong> اذكر بوضوح مصدر البيانات
                    وكيفية التعامل مع الخصوصية.
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
