import React from "react";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";
import { FRONTEND_FOUNDATION_PROMPTS } from "../../playground/config/concepts.config";
import AppDevAiPlayground from "../../playground/AiPlayground";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>قائمة ← اختيار عشوائي</>,
  description: (
    <>ابنِ أداة تختار عنصرًا عشوائيًا من قائمة محددة مسبقًا عند النقر.</>
  ),
  cardHeading: <>ابدأ بقائمة بسيطة</>,
  cardLead: <>أدخل الخيارات + زر “اختر” = نتيجة عشوائية واضحة</>,
  bullets: [
    { icon: "🎲", text: <>مصدر الخيارات: سطر لكل خيار أو مفصول بفواصل</> },
    { icon: "🧮", text: <>طريقة الاختيار: موحّد (Math.random) أو موزون</> },
    {
      icon: "🔁",
      text: <>التكرار: منع تكرار آخر نتيجة أو إزالة المختار من القائمة</>,
    },
    { icon: "⚡", text: <>التفاعل: زر/Enter + زر إعادة التوليد</> },
  ],
  formula: <>قائمة + عشوائية مضبوطة = قرارات أسرع وتجربة ممتعة 🔥</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: <>ما قائمة الخيارات؟ هل تسمح بالتكرار؟ وكيف تريد عرض النتيجة؟</>,
};

const aiWelcomeMessage =
  "اكتب: 1) القائمة (كل خيار في سطر أو مفصول بفواصل) 2) التكرار (يسمح/يمنع أو إزالة المختار) 3) طريقة العرض (نص/بطاقة/تنبيه) 4) الاختيار الموزون؟ (خيار=وزن). سأبني لك نموذج HTML/JS يختار عشوائيًا عند الضغط، مع زر إعادة وتصفير القائمة.";

export default function RandomSelectionPlayground() {
  return (
    <AppDevAiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
      systemPrompt={FRONTEND_FOUNDATION_PROMPTS.randomSelection}
      mission="random-selection"
      mainMission="frontend-foundation"
    />
  );
}
