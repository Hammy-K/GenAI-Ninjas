import React from "react";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";
import {
  FRONTEND_FOUNDATION_PROMPTS,
  MISSION_TUTORIALS,
} from "../../playground/config/concepts.config";
import AppDevAiPlayground from "../../playground/AiPlayground";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>مدخل ← شرط (if/else) ← مخرج</>,
  description: (
    <>
      حوّل المدخل إلى مخرج مناسب عبر قواعد واضحة باستخدام if / else if / else.
    </>
  ),
  cardHeading: <>ابدأ بقاعدة واحدة</>,
  cardLead: <>شرط واضح + ترتيب صحيح للقواعد = نتيجة متوقعة دائمًا</>,
  bullets: [
    {
      icon: "🧠",
      text: <>أنواع الشروط: مساواة، أكبر/أصغر، نطاقات (min–max)</>,
    },
    {
      icon: "📐",
      text: (
        <>
          ترتيب القواعد مهم: الأكثر تحديدًا أولاً ثم الأعم، ثم <code>else</code>
        </>
      ),
    },
    {
      icon: "🧪",
      text: (
        <>التحقق: تأكد من النوع (Number/String) والتعامل مع القيم الفارغة</>
      ),
    },
    { icon: "🎨", text: <>المخرجات: نص/لون/صورة/إظهار قسم/تعطيل زر…</> },
  ],
  formula: <>مدخل + قواعد if/else مرتبة + حالة افتراضية = منطق موثوق 🔥</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما الشروط المطلوبة؟ ما المخرج لكل شرط؟ وما الحالة الافتراضية (
      <code>else</code>)؟
    </>
  ),
};

const aiWelcomeMessage =
  "اكتب: 1) نوع الإدخال (نص/رقم/اختيار) 2) القواعد كسطور (شرط ⇒ مخرج)، مثال: \
if العمر &lt; 12 ⇒ 'سهل' | if 12–17 ⇒ 'متوسط' | else ⇒ 'صعب' \
3) طريقة العرض (نص/لون/صورة/إظهار قسم). سأبني HTML/JS يقرأ الإدخال، يطبّق if/else مرتبة، ويدعم المقارنات (<, ≤, نطاقات) مع حالة افتراضية.";

export default function ConditionalLogicPlayground() {
  return (
    <AppDevAiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
      systemPrompt={FRONTEND_FOUNDATION_PROMPTS.conditionalLogic}
      mission="conditional-logic"
      mainMission="frontend-foundation"
      youtubeTutorialVideoId={MISSION_TUTORIALS["conditional-logic"].videoId}
    />
  );
}
