import React from "react";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";
import { FRONTEND_FOUNDATION_PROMPTS } from "../../playground/config/concepts.config";
import AppDevAiPlayground from "../../playground/AiPlayground";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>تخطيط + ألوان + طباعة</>,
  description: (
    <>
      صمّم واجهة مرتّبة باستخدام الحاويات، الشبكات/المرن، لوحة ألوان واضحة، وخط
      مناسب.
    </>
  ),
  cardHeading: <>ابدأ بنظام تصميم بسيط</>,
  cardLead: (
    <>حاوية + شبكة/مرن + لوحة ألوان + خط = واجهة متوازنة وسهلة القراءة</>
  ),
  bullets: [
    { icon: "🧱", text: <>التخطيط: Grid/Flex وعدد الأعمدة عبر المقاسات</> },
    {
      icon: "📦",
      text: (
        <>
          الحاوية: <code>max-width</code> و <code>padding</code> داخلي متناسق
        </>
      ),
    },
    {
      icon: "🎨",
      text: (
        <>
          الألوان: <code>primary</code> / الخلفية / النص كقيم #HEX
        </>
      ),
    },
    { icon: "🔤", text: <>الطباعة: اسم الخط، الحجم الأساس، الأوزان</> },
  ],
  formula: <>متغيرات CSS + شبكة + تباعد ثابت = تصميم نظيف 🔥</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      كم عمود تريد على الموبايل/التابلت/الدسكتوب؟ ما لوحة الألوان والخط؟ وما
      العناصر التي تودّ تنسيقها (زر/بطاقة/ترويسة)؟
    </>
  ),
};

const aiWelcomeMessage =
  "اكتب: 1) نوع التخطيط (grid أو flex) + الأعمدة للموبايل/تابلت/دسكتوب \
(مثال: 1/2/3) 2) مقاس الحاوية max-width و padding داخلي \
3) لوحة الألوان (#hex لـ primary/background/text) \
4) الخط (مثل 'IBM Plex Sans Arabic' أو system) + الحجم الأساس \
5) نصف القطر والظل + المسافات (8/16/24..) \
6) المكوّنات المراد توليدها (زر/بطاقة/ترويسة). \
سأبني HTML + CSS بمتغيرات :root، تخطيط responsive (RTL)، وأمثلة مكوّنات مطبَّقة على التصميم.";

export default function LayoutDesignPlayground() {
  return (
    <AppDevAiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
      systemPrompt={FRONTEND_FOUNDATION_PROMPTS.layoutDesign}
      mission="layout-design"
      mainMission="frontend-foundation"
    />
  );
}
