import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>تضمين الوسائط (فيديو/صوت/حركة بسيطة)</>,
  description: (
    <>استخدام iframe للفيديو، وعناصر الصوت، أو حركات خفيفة لإثراء التجربة.</>
  ),
  cardHeading: <>ابدأ بإضافة وسيط</>,
  cardLead: <>فيديو/صوت + حركة خفيفة = تجربة أغنى</>,
  bullets: [
    {
      icon: "🎬",
      text: <>فيديو: تضمين YouTube عبر iframe مع تحكّم (تشغيل/إيقاف/كتم)</>,
    },
    { icon: "🎧", text: <>صوت: عنصر صوت بخصائص controls و preload مناسبة</> },
    {
      icon: "✨",
      text: <>حركة بسيطة: تلاشي/انزلاق عند الدخول أو التبديل بين الأقسام</>,
    },
    {
      icon: "♿",
      text: <>الوصولية: تسميات واضحة، وتجنّب التشغيل التلقائي دون كتم</>,
    },
  ],
  formula: <>وسائط مناسبة + تحكّم واضح + وصولية = تجربة جذّابة 🔥</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما نوع الوسيط المطلوب (فيديو/صوت/حركة)؟ وما المصدر/الرابط؟ وما الضبط
      المطلوب (autoplay/muted/loop/controls)؟ وأين تُطبّق الحركة؟
    </>
  ),
};

const aiWelcomeMessage = `\nاكتب لي التفاصيل التالية لبناء تجربة وسائط مدمجة:\n1) نوع الوسيط: فيديو YouTube (رابط)، ملف فيديو، صوت (mp3)، أو حركة بسيطة.\n2) إعدادات الفيديو: start (بالثواني)، autoplay (نعم/لا)، muted، loop، إظهار controls، ونسبة الأبعاد (مثال 16:9).\n3) إعدادات الصوت: رابط الملف، controls (نعم/لا)، preload (auto/metadata/none)، وloop/muted إن لزم.\n4) الحركة: النوع (تلاشي/انزلاق)، الهدف (بطاقة/قسم/عنصر)، والمدة بالمللي ثانية.\n5) التخطيط: داخل بطاقة، بعرض كامل، أو ضمن شبكة.\n6) الثيم/الألوان: فاتح/داكن أو ألوان محددة.\nسأولّد نموذج HTML/JS يضمّن iframe للفيديو أو عنصر الصوت مع خصائص الوصولية ولوحة مفاتيح، ويضيف حركة خفيفة عند الدخول/التبديل.`;

export default function EmbeddedMediaPlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
      systemPrompt={""}
    />
  );
}
