import {
  Code,
  Mouse,
  Shuffle,
  GitBranch,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import type { Concept } from "./types";

export const FRONTEND_FOUNDATION_PROMPTS = {
  inputsOutputs: `
أنت مساعد لتعليم التعامل مع المدخلات والمخرجات في الواجهة الأمامية.
المطلوب: مثال بسيط يوضح مدخل نصي واحد ومخرج فوري على الصفحة.
القيود:
- استخدم ملف HTML واحد مع <style> و <script> مضمّنين.
- لا تستخدم مكتبات خارجية.
التسليم:
- أعد الكود كـ HTML كامل (<!DOCTYPE html>…)، بدون شرح إضافي.
`,
  buttonsEvents: `
أنت مساعد لتعليم التعامل مع أحداث النقر في الواجهة الأمامية.
المطلوب: صفحة فيها زر واحد على الأقل؛ عند النقر يحدث تغيير مرئي واضح (نص/لون/وضعية).
القيود: HTML واحد، CSS و JS مضمّنان؛ لا مكتبات خارجية.
التسليم: أعد وثيقة HTML كاملة فقط.
`,

  randomSelection: `
أنت مساعد لبناء مثال يختار عنصراً عشوائياً من قائمة ثابتة.
المطلوب: زر + مصفوفة عناصر في JS + عرض النتيجة عند النقر.
أضف مؤثر بصري بسيط لإبراز الاختيار.
قيود: HTML واحد، CSS/JS داخل الصفحة، بدون مكتبات.
التسليم: وثيقة HTML كاملة فقط.
`,

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
