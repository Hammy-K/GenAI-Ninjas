import { Header } from "@/components/layout/Header";
import { useQuest } from "@/hooks/useQuest";
import {
  ArrowRight,
  Target,
  Keyboard,
  PanelsTopLeft,
  PlayCircle,
  Brain,
} from "lucide-react";
import { FrontendMissionTrack } from "../frontend-foundation/FrontendMissionTrack";

export default function DynamicInteractionMedia() {
  const { xp } = useQuest();

  const concepts = [
    {
      Icon: Keyboard,
      title: "مدخلات متعددة (مثل: الاسم + المزاج)",
      description: "دمج أكثر من حقل لخلق تجربة أغنى واتخاذ قرارات أدق.",
      examples: [
        "مساعد شخصي: الاسم + المزاج ← رسالة مخصصة",
        "مقترح نشاط: الوقت + الحالة المزاجية ← اقتراح مناسب",
        "تخصيص واجهة: اللغة + حجم الخط ← تطبيق تفضيلاتك",
      ],
      color: "#8B5CF6",
      isCompleted: false,
      url: "/missions/app-development/dynamic-interaction-media/multi-inputs",
    },
    {
      Icon: PanelsTopLeft,
      title: "التنقّل بين أقسام التطبيق",
      description:
        "إنشاء تبويبات/شاشات متعددة ليشعر المستخدم بتجربة تطبيق حقيقية.",
      examples: [
        "تبويبات: الصفحة الرئيسية | ملفي | الإعدادات",
        "خطوات متتابعة: معلومات ← مراجعة ← تأكيد",
        "روابط داخلية بين الشاشات مع حالة نشطة (Active State)",
      ],
      color: "#8B5CF6",
      isCompleted: false,
      url: "/missions/app-development/dynamic-interaction-media/navigation",
    },
    {
      Icon: PlayCircle,
      title: "تضمين الوسائط (فيديو/صوت/حركة بسيطة)",
      description:
        "استخدام iframe للفيديو، وعناصر الصوت، أو حركات خفيفة لإثراء التجربة.",
      examples: [
        "فيديو YouTube داخل بطاقة عرض",
        "مشغل صوتي لبودكاست قصير",
        "أنيميشن بسيط عند الانتقال بين الأقسام",
      ],
      color: "#8B5CF6",
      isCompleted: false,
      url: "/missions/app-development/dynamic-interaction-media/embedded-media",
    },
    {
      Icon: Brain,
      title: "تخزين الحالة محليًا (بدون باكند)",
      description:
        "تتبع مدخلات وخيارات المستخدم داخل الجلسة باستخدام state أو localStorage.",
      examples: [
        "تذكّر آخر تبويب زاره المستخدم",
        "حفظ تفضيلات الثيم وحجم الخط",
        "استرجاع اسم المستخدم لتحية سريعة",
      ],
      color: "#8B5CF6",
      isCompleted: false,
      url: "/missions/app-development/dynamic-interaction-media/local-state",
    },
  ];

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
            <div className="p-3 bg-violet-100 rounded-full">
              <PlayCircle className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              التفاعل الديناميكي + الوسائط
            </h1>
            <span className="text-2xl">🎬</span>
          </div>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            ارتقِ بتطبيقاتك من تجارب بسيطة إلى تجارب غنية:{" "}
            <strong>مدخلات متعددة</strong>،{" "}
            <strong>تنقّل سلس بين الأقسام</strong>،{" "}
            <strong>تضمين فيديو/صوت</strong>، و
            <strong>تخزين حالة محليًا</strong> — وكل ذلك دون الحاجة لباكند.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 font-medium">
            <Target className="w-4 h-4" />
            <span>الأسابيع 5–6 — 4 مفاهيم متقدمة</span>
          </div>
        </div>

        <FrontendMissionTrack
          weekRange="5-6"
          title="المفاهيم المتقدمة المستفادة"
          description="هذه المفاهيم تحوّل مشروعك من صفحة تفاعلية بسيطة إلى تطبيق يشعر المستخدم أنه حيّ ومتجاوب."
          concepts={concepts}
          color="#8B5CF6"
        />

        <div className="bg-white rounded-xl p-8 shadow-md mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            نصائح للنجاح
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-violet-600 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                أثناء التطوير:
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full mt-2"></div>
                  <span>
                    <strong>ابدأ بمدخلين فقط:</strong> زِد التعقيد تدريجيًا حتى
                    لا تتداخل الحالات.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full mt-2"></div>
                  <span>
                    <strong>تنقّل واضح:</strong> اجعل حالة التبويب النشط
                    (Active) مرئية وواضحة.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full mt-2"></div>
                  <span>
                    <strong>وسائط مرنة:</strong> حافظ على تناسب الفيديو داخل
                    الحاوية وجرب أحجام شاشات مختلفة.
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                عند العرض:
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    <strong>أظهر السيناريو:</strong> انتقل بين تبويبات مختلفة
                    لتوضيح تدفّق الاستخدام.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    <strong>اختصر الوسائط:</strong> استخدم مقطعًا قصيرًا (10–20
                    ثانية) لإبقاء الانتباه.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    <strong>تسليط الضوء على الحالة:</strong> وضّح ما يتم حفظه
                    محليًا وكيف يحسن تجربة المستخدم.
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
