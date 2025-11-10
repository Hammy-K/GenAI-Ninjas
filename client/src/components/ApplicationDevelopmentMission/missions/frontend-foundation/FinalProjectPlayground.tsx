import React from "react";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";
import AppDevAiPlayground from "../../playground/AiPlayground";
import { FINAL_PROJECT_PROMPT } from "../../playground/config/prompts/final-project.prompt";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>المشروع النهائي ← خطِّط ثم ابنِ</>,
  description: (
    <>
      صمّم مشروعًا واحدًا يدمج **٤ مفاهيم أو أكثر** من أساسيات الواجهة
      (مدخلات/أزرار/عشوائية/منطق/تصميم/صور)، ثم سنولّد الكود النهائي بعد إقرار
      الخطة.
    </>
  ),
  cardHeading: <>ابدأ بالخطة الذكية</>,
  cardLead: <>فكرة واضحة + رحلة مستخدم قصيرة + ٤+ مفاهيم = تنفيذ نظيف</>,
  bullets: [
    { icon: "🎯", text: <>الثيمة والهدف: وش يسوي المستخدم؟ وش النتيجة؟</> },
    {
      icon: "🧩",
      text: <>اختر ٤+ مفاهيم: Inputs/Buttons/Random/Logic/Layout/Images</>,
    },
    { icon: "⚙️", text: <>مزايا لكل مفهوم: وش الحدث؟ وش التغيير المرئي؟</> },
    {
      icon: "🧵",
      text: <>الدمج: كيف ترتبط الأجزاء؟ صفحة وحدة ولا تنقّلات بسيطة؟</>,
    },
    { icon: "🎨", text: <>الستايل: ألوان، مسافات، استجابة للجوال (RTL)</> },
  ],
  formula: <>خطة دقيقة + متطلبات واضحة = كود نهائي أسرع وأجمل 🔥</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما الثيمة؟ ما هدف المستخدم؟ وما المفاهيم الأربع (أو أكثر) التي تريد دمجها؟
    </>
  ),
};

const aiWelcomeMessage =
  "اكتب: 1) الثيمة والهدف 2) رحلة المستخدم (٣–٥ خطوات) 3) ٤+ مفاهيم (مدخلات/أزرار/عشوائية/منطق/تصميم/صور) 4) ميزات مختصرة لكل مفهوم 5) أسلوب التصميم (ألوان/شبكة/استجابة). بعد التأكيد سأقدّم ملخّصًا تفصيليًا ثم أبني HTML/CSS/JS في خطوة التنفيذ.";

export default function FinalProjectPlayground() {
  return (
    <AppDevAiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
      systemPrompt={FINAL_PROJECT_PROMPT}
      mission="final-project"
      mainMission="frontend-foundation"
      youtubeTutorialVideoId=""
    />
  );
}
