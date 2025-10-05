import {
  Code,
  Mouse,
  Shuffle,
  GitBranch,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import type { Concept, MissionTutorials } from "./types";
import { INPUTS_OUTPUTS_PROMPT } from "./prompts/inputs-outputs.prompt";
import { RANDOM_SELECTION_PROMPT } from "./prompts/random-selection.prompt";
import { BUTTONS_EVENTS_PROMPT } from "./prompts/buttons-events.prompt";

export const FRONTEND_FOUNDATION_PROMPTS = {
  inputsOutputs: INPUTS_OUTPUTS_PROMPT,

  buttonsEvents: BUTTONS_EVENTS_PROMPT,

  randomSelection: RANDOM_SELECTION_PROMPT,

  conditionalLogic: `
أنت مساعد يعرض مثالاً للمنطق الشرطي if/else في تطبيق واجهة أمامية.
المطلوب: مدخل (نص/رقم/اختيار) → نتيجة مختلفة بناءً على شروط واضحة.
أضف رسائل أخطاء بسيطة للمدخلات غير الصالحة.
قيود: HTML واحد، CSS/JS مضمّنان، لا مكتبات خارجية.
التسليم: وثيقة HTML كاملة فقط.
`,

  layoutDesign: `
أنت مساعد يركز على التخطيط والتصميم باستخدام CSS فقط.
المطلوب: صفحة تعرض تخطيطاً بسيطاً (رأس/محتوى/تذييل أو شبكة بطاقات) مع ثيمين قابلين للتبديل.
استخدم متغيرات CSS للألوان، واجعل التبديل بزر واحد.
قيود: HTML واحد، CSS/JS داخليان، لا مكتبات.
التسليم: وثيقة HTML كاملة فقط.
`,

  dynamicImages: `
أنت مساعد يعلّم تغيير الصور ديناميكياً بحسب المدخل أو حدث المستخدم.
المطلوب: صور محلية/روابط آمنة + منطق بسيط يبدّل src عند النقر أو بناءً على قيمة المدخل.
أضف حالة تحميل/بديلة عند فشل الصورة.
قيود: HTML واحد، CSS/JS داخليان، لا مكتبات.
التسليم: وثيقة HTML كاملة فقط.
`,
} as const;

export const FRONTEND_FOUNDATION_CONCEPTS: Concept[] = [
  {
    Icon: Code,
    title: "المدخلات والمخرجات",
    description: "المستخدم يكتب شيئاً ← يرى استجابة فورية",
    examples: [
      "مولد الأسماء: اكتب اسمك ← احصل على لقب",
      "حاسبة النصائح: أدخل المبلغ ← احصل على النصيحة",
      "مترجم المزاج: اكتب مشاعرك ← احصل على لون",
    ],
    color: "#3B82F6",
    isCompleted: false,
    url: "/missions/app-development/frontend-foundation/inputs-outputs",
    systemPrompt: FRONTEND_FOUNDATION_PROMPTS.inputsOutputs,
  },
  {
    Icon: Mouse,
    title: "الأزرار والأحداث",
    description: "الزر يحفز إجراءً (إظهار رسالة، تغيير الشاشة، إلخ)",
    examples: [
      "زر 'اكتشف اليوم': انقر ← اعرض نشاطاً عشوائياً",
      "زر 'غيّر الثيم': انقر ← بدّل بين الفاتح والداكن",
      "زر 'ابدأ اللعبة': انقر ← انتقل لشاشة اللعب",
    ],
    color: "#3B82F6",
    isCompleted: false,
    url: "/missions/app-development/frontend-foundation/buttons-events",
    systemPrompt: FRONTEND_FOUNDATION_PROMPTS.buttonsEvents,
  },
  {
    Icon: Shuffle,
    title: "الاختيار العشوائي من قائمة",
    description: "انقر ← يختار عشوائياً من خيارات محددة مسبقاً",
    examples: [
      "عجلة القرارات: قائمة خيارات ← اختيار عشوائي",
      "مولد الاقتباسات: مجموعة اقتباسات ← عرض واحد",
      "اقتراح الوجبات: قائمة طعام ← وجبة اليوم",
    ],
    color: "#3B82F6",
    isCompleted: false,
    url: "/missions/app-development/frontend-foundation/random-selection",
    systemPrompt: FRONTEND_FOUNDATION_PROMPTS.randomSelection,
  },
  {
    Icon: GitBranch,
    title: "المنطق الشرطي (if/else)",
    description: "المدخل يحدد مسار المخرج",
    examples: [
      "اختبار الشخصية: إجابات مختلفة ← نتائج مختلفة",
      "توصيات الطقس: درجة الحرارة ← نصيحة الملابس",
      "مستوى الصعوبة: العمر ← أسئلة مناسبة",
    ],
    color: "#3B82F6",
    isCompleted: false,
    url: "/missions/app-development/frontend-foundation/conditional-logic",
    systemPrompt: FRONTEND_FOUNDATION_PROMPTS.conditionalLogic,
  },
  {
    Icon: Palette,
    title: "التخطيط والتصميم (CSS)",
    description: "استخدام الأقسام، الحاويات، الخطوط، الألوان",
    examples: [
      "ثيمات ملونة: أزرق مهدئ، أحمر طاقة، أخضر طبيعي",
      "تخطيطات مختلفة: شبكة، عمود واحد، بطاقات",
      "خطوط متنوعة: عربي أنيق، إنجليزي حديث",
    ],
    color: "#3B82F6",
    isCompleted: false,
    url: "/missions/app-development/frontend-foundation/layout-design",
    systemPrompt: FRONTEND_FOUNDATION_PROMPTS.layoutDesign,
  },
  {
    Icon: ImageIcon,
    title: "الصور الديناميكية",
    description: "بناءً على المدخل أو ضغط الزر، غيّر الصورة",
    examples: [
      "معرض الحالة المزاجية: مزاج ← صورة معبرة",
      "مولد الشخصيات: اسم ← أفاتار مناسب",
      "خلفيات تفاعلية: وقت اليوم ← منظر طبيعي",
    ],
    color: "#3B82F6",
    isCompleted: false,
    url: "/missions/app-development/frontend-foundation/dynamic-images",
    systemPrompt: FRONTEND_FOUNDATION_PROMPTS.dynamicImages,
  },
];

export const MISSION_TUTORIALS: MissionTutorials = {
  "inputs-outputs": {
    videoId: "dB5NpbNESRg",
    name: "المدخلات والمخرجات",
  },
  "buttons-events": {
    videoId: "-LLPfxXaZps",
    name: "الأزرار والأحداث",
  },
  "random-selection": {
    videoId: "aqFts5kygqE",
  },
  "conditional-logic": {
    videoId: "vdJv5zDU9Ts",
  },
  "layout-design": {
    videoId: "ONfmV-d6RXk",
  },
  "dynamic-images": {
    videoId: "jdv4y_CKVUM",
  },
};
