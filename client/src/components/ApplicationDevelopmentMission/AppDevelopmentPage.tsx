import { useQuest } from "@/hooks/useQuest";
import { Code, Lightbulb, Rocket, Smartphone, Trophy, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ApplicationDevelopmentProgressBadge } from "./ApplicationDevelopmentProgressBadge";
import { ApplicationDevelopmentMissionCard } from "./ApplicationDevelopmentMissionCard";

const missions = [
  {
    icon: Lightbulb,
    title: "الاكتشاف",
    description:
      "ابدأ رحلتك في بناء التطبيقات مع أول تطبيق لك! اكتشف كيف تعمل التطبيقات من خلال تحديات ممتعة.",
    features: [
      "بناء أول تطبيق في 45 دقيقة",
      "هاكاثون مصغر مع الأصدقاء",
      "لحظة 'لقد صنعت هذا!' الفورية",
    ],
    path: "/missions/app-development/discovery",
    color: "#10B981",
    missions: 2,
    isLocked: false,
  },
  {
    icon: Code,
    title: "أساسيات الواجهة الأمامية",
    description:
      "تعلم كيفية بناء واجهات تفاعلية جميلة. من الأزرار البسيطة إلى التطبيقات المعقدة.",
    features: [
      "المدخلات والمخرجات",
      "الأزرار والأحداث",
      "التصميم والألوان",
      "الصور الديناميكية",
    ],
    path: "/missions/app-development/frontend-foundation",
    color: "#3B82F6",
    missions: 6,
    isLocked: false,
  },
  {
    icon: Zap,
    title: "التفاعل الديناميكي والوسائط",
    description:
      "اجعل تطبيقاتك تنبض بالحياة! أضف الصوت والفيديو والرسوم المتحركة.",
    features: [
      "مدخلات متعددة معقدة",
      "التنقل بين الصفحات",
      "الوسائط المدمجة",
      "حفظ البيانات المؤقتة",
    ],
    path: "/missions/app-development/dynamic-interaction-media",
    color: "#F59E0B",
    missions: 4,
    isLocked: false,
  },
  {
    icon: Rocket,
    title: "الخلفية وتكامل الذكاء الاصطناعي",
    description:
      "اربط تطبيقك بالعالم الحقيقي! تعلم كيفية استخدام الذكاء الاصطناعي والواجهات البرمجية.",
    features: [
      "استدعاء الواجهات البرمجية",
      "تكامل OpenAI",
      "حفظ بيانات المستخدمين",
      "المصادقة البسيطة",
    ],
    path: "/missions/app-development/backend-ai-integration",
    color: "#8B5CF6",
    missions: 4,
    isLocked: false,
  },
  {
    icon: Trophy,
    title: "إنشاء التحفة الفنية",
    description:
      "الوقت لإنشاء تحفتك الفنية! اجمع كل ما تعلمته في تطبيق واحد مذهل.",
    features: [
      "تطبيق كامل الوظائف",
      "8-10 وظائف أساسية",
      "تكامل الذكاء الاصطناعي",
      "عرض نهائي مدته 30 ثانية",
    ],
    path: "/missions/app-development/masterpiece-creation",
    color: "#EF4444",
    missions: 1,
    isLocked: false,
  },
];

export default function AppDevelopmentPage() {
  const { xp } = useQuest();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f2e8" }}>
      <Header xp={xp} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-full">
              <Smartphone className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              رحلة تطوير التطبيقات من الصفر!
            </h1>
            <Rocket className="w-8 h-8 text-purple-600 animate-bounce" />
          </div>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            كل تطبيق عظيم يبدأ صغيرًا. هدفنا الآن ليس تغيير العالم فورًا، بل{" "}
            <strong>بناء العضلات</strong> تحديًا ممتعًا في كل مرة. تعلم كيف تعمل
            التطبيقات تدريجيًا... ثم اجمع كل ما تعلمته في تطبيق واحد يعمل بكامل
            وظائفه -<strong className="text-purple-600"> تحفة فنية 🏆</strong>
          </p>

          <ApplicationDevelopmentProgressBadge
            completed={0}
            total={17}
            color="#8B5CF6"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {missions.map((mission, index) => (
            <ApplicationDevelopmentMissionCard key={index} {...mission} />
          ))}
        </div>

        {/* <div className="mt-16 bg-white rounded-xl p-8 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            الجدول الزمني للمهمة
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">1-2</span>
              </div>
              <p className="text-sm text-gray-600">أسابيع الاكتشاف</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">3-5</span>
              </div>
              <p className="text-sm text-gray-600">أساسيات الواجهة</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-yellow-600 font-bold">5-6</span>
              </div>
              <p className="text-sm text-gray-600">التفاعل الديناميكي</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">7-9</span>
              </div>
              <p className="text-sm text-gray-600">الخلفية والذكاء الاصطناعي</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-red-600 font-bold">10-16</span>
              </div>
              <p className="text-sm text-gray-600">التحفة النهائية</p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
