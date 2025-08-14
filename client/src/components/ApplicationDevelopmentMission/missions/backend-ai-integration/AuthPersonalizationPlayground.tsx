// src/app/missions/app-development/backend-ai-integration/AuthPersonalizationPlayground.tsx
import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>مصادقة بسيطة أو تخصيص المستخدم</>,
  description: (
    <>
      محاكاة تسجيل دخول أو تعريف مستخدم لعرض تجربة مخصّصة مع حماية مكوّنات
      ومسارات.
    </>
  ),
  cardHeading: <>ابدأ بجلسة مستخدم خفيفة</>,
  cardLead: <>تحديد هوية + تفضيلات + حماية واجهة = تجربة شخصية</>,
  bullets: [
    {
      icon: "🧑‍💻",
      text: <>نموذج دخول تجريبي (اسم/كلمة مرور) أو “تحديد اسم فقط”</>,
    },
    {
      icon: "🪪",
      text: (
        <>حالة مستخدم (guest/authenticated/role) وتخزين جلسة آمن (لا أسرار)</>
      ),
    },
    {
      icon: "🧭",
      text: <>حماية عناصر/مسارات وفق الحالة (Route Guard أو شرط عرض)</>,
    },
    { icon: "🎛️", text: <>تخصيص: لغة/ثيم/اسم ترحيبي ولوحة معلومات مبسّطة</> },
    { icon: "⏱️", text: <>انتهاء الجلسة/Remember me + تسجيل خروج واضح</> },
    {
      icon: "⚠️",
      text: <>رسائل خطأ ودعم حالات التحميل والتجربة على الشبكات البطيئة</>,
    },
  ],
  formula: <>تعريف هوية + حالة جلسة + تخصيص = منتج يشعر أنه لك 🔒</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      هل تريد دخولاً بالاسم/كلمة مرور تجريبية أم تعريفاً سريعاً بالاسم فقط؟ ما
      الحقول الشخصية (اللغة/الثيم/الاسم)؟ ما المسارات أو المكوّنات التي تُحمى؟
      وهل تحتاج “تذكّرني” ووقت انتهاء للجلسة؟
    </>
  ),
};

const aiWelcomeMessage = `\nأرسل التفاصيل التالية لأبني لك مصادقة/تخصيص بسيطين (واجهة + منطق حالة):\n1) نوع الدخول: (اسم فقط) أو (اسم + كلمة مرور تجريبية).\n2) الحقول الشخصية: name, language(ar|en), theme(light|dark)…\n3) حالة المستخدم والأدوار إن وجدت: guest/user/admin.\n4) ما الذي سيُحمى؟ (مكوّنات/مسارات محددة) وكيفية التعامل عند عدم السماح.\n5) تفضيلات التخزين: sessionStorage/localStorage مع مدة صلاحية (remember me).\n6) رسائل وتجربة الخطأ: نصوص عربية، إعادة المحاولة، مؤشرات تحميل.\n7) شكل العرض: بطاقة ترحيب، لوحة مبسطة، قائمة إعدادات.\n\nسأولّد كود TypeScript يوفّر: state موحّد للمستخدم، دوال login/logout, savePrefs، Route Guard شرطي، وتخزين جلسة بلا أسرار (تعليمي).`;

export default function AuthPersonalizationPlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
    />
  );
}
