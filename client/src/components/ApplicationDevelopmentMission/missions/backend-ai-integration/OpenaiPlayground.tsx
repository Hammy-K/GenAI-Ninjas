import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>دمج واجهة OpenAI (نصوص/مساعدات)</>,
  description: (
    <>
      إرسال مُدخل المستخدم للنموذج واستلام الرد وعرضه بشكل جذاب، مع دعم البث
      (stream) وحالات التحميل/الأخطاء.
    </>
  ),
  cardHeading: <>ابدأ بمكالمات آمنة ومنسّقة</>,
  cardLead: <>سياق واضح + إعدادات مناسبة + عرض جذّاب = تجربة ذكية</>,
  bullets: [
    {
      icon: "🧠",
      text: (
        <>
          عرّف <b>system prompt</b> ليضبط شخصية المساعد وحدود الرد
        </>
      ),
    },
    {
      icon: "🌡️",
      text: (
        <>
          تحكّم في <b>temperature</b>، <b>max tokens</b>، و<b>top-p</b>
        </>
      ),
    },
    {
      icon: "📡",
      text: (
        <>
          فعّل <b>stream</b> لعرض الرد تدريجيًا، واستخدم{" "}
          <code>AbortController</code> للإلغاء
        </>
      ),
    },
    {
      icon: "🧾",
      text: (
        <>
          اطلب خرجًا <b>منظّمًا</b> (JSON) لتغذية واجهة/منطق لاحق
        </>
      ),
    },
    {
      icon: "🛡️",
      text: (
        <>
          احمِ المفتاح عبر <b>خادم وسيط</b> (لا مفاتيح في الواجهة)
        </>
      ),
    },
    {
      icon: "⚠️",
      text: <>اعرض حالات: تحميل، خطأ برسالة ودية، وإعادة توليد</>,
    },
  ],
  formula: <>سياق قوي + بث حي + أمان المفاتيح = تكامل احترافي 🔒</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما الهدف (مساعد كتابة/تلخيص/اقتراحات)؟ ما إعدادات النموذج (النموذج، درجة
      العشوائية، أقصى طول)؟ هل تريد بثًا مباشرًا؟ وهل تحتاج خرج JSON أم نص؟
    </>
  ),
};

const aiWelcomeMessage = `\nأرسل التفاصيل التالية لأبني لك نداء OpenAI كاملاً (عميل + مخدّم وسيط) مع بث ورقابة أخطاء:\n1) الهدف: مساعد كتابة/ملخّص/اقتراحات حسب سياق.\n2) الإعدادات:\n   - model (اكتب الموديل الذي تريد استخدامه)\n   - system prompt (شخصية/قواعد)\n   - temperature, maxTokens, topP\n   - stream: true/false\n3) تنسيق الإدخال: لغة المستخدم، طول المطلوب، وأي قيود (نبرة/أسلوب).\n4) تنسيق الإخراج: نص حر أم JSON (قدّم مثال أو schema بسيط).\n5) الأمان: سنستخدم مسار خادمي /api/openai لحماية المفتاح (لا مفاتيح في المتصفح).\n6) الواجهة: عرض الرد كفقاعات/بطاقة، زر إعادة توليد، نسخ، عدّاد توكنات اختياري.\n7) حالات الواجهة: تحميل (سكلتون/نقاط متحركة)، خطأ برسالة واضحة + زر retry، إلغاء عبر AbortController.\n\nسأولّد نموذج TypeScript يتضمن: fetch إلى /api/openai، بث تدريجي (إن طُلِب)، إلغاء الطلب، وحالات واجهة RTL عربية منظمة.`;

export default function OpenAIPlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
    />
  );
}
