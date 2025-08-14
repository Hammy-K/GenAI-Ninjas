import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>زر ← حدث ← نتيجة</>,
  description: (
    <>ابنِ تجربة تفاعلية: ضغطة زر تُحفّز حدثًا واضحًا يغيّر الواجهة فورًا.</>
  ),
  cardHeading: <>ابدأ بحدث واحد</>,
  cardLead: <>زر واحد + حدث (click) = تغيير مرئي فوري</>,
  bullets: [
    { icon: "🖱️", text: <>نوع الحدث: click / dblclick / mouseenter</> },
    { icon: "⌨️", text: <>لوحة المفاتيح: keydown / Enter</> },
    { icon: "🎯", text: <>العنصر المستهدف: زر / رابط / بطاقة / أي عنصر</> },
    {
      icon: "⚙️",
      text: <>الأثر: إظهار رسالة / تبديل .active / تغيير النص أو النمط</>,
    },
  ],
  formula: <>حدث واحد + هدف محدد + أثر واضح = واجهة ممتعة 🔥</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: <>ما الحدث؟ ما الهدف؟ وما النتيجة المرئية المتوقعة؟</>,
};

const aiWelcomeMessage =
  "اكتب: 1) نوع الحدث (click/keydown/hover) 2) الهدف (#id أو .class) 3) الأثر (تنبيه، تبديل فئة .active، تغيير النص/اللون). سأبني لك نموذج HTML/JS يربط مستمع حدث ويطبق الأثر فورًا.";

export default function a() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
    />
  );
}
