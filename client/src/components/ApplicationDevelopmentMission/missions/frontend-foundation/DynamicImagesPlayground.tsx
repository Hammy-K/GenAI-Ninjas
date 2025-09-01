import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";
import {
  FRONTEND_FOUNDATION_PROMPTS,
  MISSION_TUTORIALS,
} from "../../playground/config/concepts.config";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>مدخل ← صورة ديناميكية</>,
  description: (
    <>
      غيّر الصورة فورًا بناءً على قيمة مدخل أو حدث زر/اختيار، مع انتقال لطيف
      وحالات بديلة.
    </>
  ),
  cardHeading: <>ابدأ بتعيين بسيط</>,
  cardLead: <>قيمة واحدة ← مصدر صورة محدد + انتقال تلاشي بسيط</>,
  bullets: [
    {
      icon: "🖼️",
      text: <>مصدر الصور: روابط URL خارجية أو أصول محلية (assets)</>,
    },
    { icon: "🗺️", text: <>التعيين: كل قيمة ← رابط/مسار صورة (سطر لكل قيمة)</> },
    {
      icon: "⏳",
      text: (
        <>
          التحميل: عنصر انتظار (spinner) + <code>onload</code>، وخطة فشل عبر{" "}
          <code>onerror</code>
        </>
      ),
    },
    {
      icon: "🎛️",
      text: <>السلوك: يتغيّر أثناء الكتابة، أو عند الضغط، أو عند اختيار قيمة</>,
    },
    { icon: "🎞️", text: <>الانتقال: تلاشي/تكبير بسيط عند تبديل الصورة</> },
    {
      icon: "♿",
      text: (
        <>
          الوصول: نص بديل <code>alt</code> مناسب للصورة المعروضة
        </>
      ),
    },
  ],
  formula: <>مدخل + تعيين قيم→صور + انتقال + بدائل = تجربة مرئية حيّة 🔥</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما نوع الإدخال؟ ما القيم الممكنة؟ وما الصورة المناسبة لكل قيمة؟ وهل تريد
      انتقال (fade/zoom) وحالة بديلة؟
    </>
  ),
};

const aiWelcomeMessage =
  "اكتب: 1) نوع الإدخال (نص/اختيار/زر) 2) التعيين كسطور (قيمة = رابط/مسار صورة) \
3) السلوك (يتغير أثناء الكتابة/عند الضغط) 4) الانتقال (fade/zoom/none) \
5) بديل عند الفشل (رابط بديل أو إخفاء الصورة) 6) الأبعاد (cover/contain والعرض/الارتفاع إن لزم). \
سأبني HTML/JS يهيّئ خريطة القيم→الصور، يبدّل الصورة مع تلاشي، يسبق التحميل، ويستخدم onerror لعرض بديل أو رسالة مناسبة.";

export default function DynamicImagesPlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
      systemPrompt={FRONTEND_FOUNDATION_PROMPTS.dynamicImages}
      mission="dynamic-images"
      mainMission="frontend-foundation"
      youtubeTutorialVideoId={MISSION_TUTORIALS["dynamic-images"].videoId}
    />
  );
}
