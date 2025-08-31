import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>التنقّل بين أقسام التطبيق</>,
  description: (
    <>إنشاء تبويبات/شاشات متعددة ليشعر المستخدم بتجربة تطبيق حقيقية.</>
  ),
  cardHeading: <>ابدأ بتنظيم الشاشات</>,
  cardLead: <>تبويبات + حالة نشطة + محتوى لكل تبويب</>,
  bullets: [
    {
      icon: "🧭",
      text: <>بنية التبويبات: الصفحة الرئيسية | ملفي | الإعدادات</>,
    },
    {
      icon: "🔗",
      text: <>طريقة التنقّل: أزرار/روابط مع حالة نشطة (Active State)</>,
    },
    {
      icon: "✨",
      text: <>الحيوية: انتقالات خفيفة عند التبديل (تلاشي/انزلاق)</>,
    },
    {
      icon: "🧠",
      text: <>الحالة: احتفظ ببيانات كل تبويب أثناء التنقّل (اختياري)</>,
    },
  ],
  formula: <>شاشات واضحة + حالة نشطة محكمة = تجربة سلسة 🔥</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما هي التبويبات المطلوبة؟ ما التبويب الافتراضي؟ وما المحتوى داخل كل تبويب؟
    </>
  ),
};

const aiWelcomeMessage = `
اكتب لي التفاصيل التالية لبناء واجهة تنقّل بالتبويبات:
1) قائمة التبويبات: الاسم الظاهر + المعرّف (مثال: "الصفحة الرئيسية" = home، "ملفي" = profile، "الإعدادات" = settings).
2) التبويب الافتراضي عند فتح الصفحة.
3) محتوى كل تبويب (نص قصير أو HTML بسيط لكل تبويب).
4) تفضيل الحالة: هل نحتفظ بقيم الحقول داخل كل تبويب عند التبديل؟ (نعم/لا).
5) نوع الانتقال بين التبويبات: بدون/تلاشي/انزلاق.
6) استراتيجية الرابط: هل تريد مزامنة التبويب مع #hash في عنوان الصفحة للتنقّل المباشر؟ (نعم/لا).
سأولّد نموذج HTML/JS لتبويبات مع حالة نشطة، دعم لوحة المفاتيح (الأسهم والـ Enter)، وانتقالات خفيفة، واختياريًا مزامنة مع #hash.`;

export default function NavigationPlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
      systemPrompt={""}
    />
  );
}
