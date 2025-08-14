import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>استدعاء واجهات خارجية (APIs)</>,
  description: (
    <>
      تعلّم استخدام <code>fetch</code> لجلب البيانات من خدمات حقيقية مع حالات
      التحميل والأخطاء.
    </>
  ),
  cardHeading: <>ابدأ بنداء API آمن وموثوق</>,
  cardLead: <>طلب صحيح + حالات واجهة قوية + مفاتيح آمنة = تجربة احترافية</>,
  bullets: [
    {
      icon: "🌐",
      text: (
        <>
          حدّد <b>endpoint</b>، الطريقة (GET/POST)، والمعاملات (query/body)
        </>
      ),
    },
    {
      icon: "⏳",
      text: (
        <>
          اعرض <b>حالة تحميل</b> وسكلتون، وتعامل مع <b>حالة فارغة</b>
        </>
      ),
    },
    {
      icon: "⚠️",
      text: (
        <>
          التعامل مع <b>الأخطاء</b> برسائل واضحة + زر <b>إعادة المحاولة</b>
        </>
      ),
    },
    {
      icon: "🛡️",
      text: (
        <>
          لا تُفْشِ مفاتيحك — استخدم <b>خادماً وسيطاً</b> أو دوال Serverless
        </>
      ),
    },
    {
      icon: "🚫",
      text: (
        <>
          حلول <b>CORS</b> و <b>Timeout</b> باستخدام{" "}
          <code>AbortController</code>
        </>
      ),
    },
    {
      icon: "🔁",
      text: (
        <>
          محاولات تلقائية مع <b>Exponential Backoff</b> وتحديد <b>Rate Limit</b>
        </>
      ),
    },
  ],
  formula: <>API واضح + حالات واجهة متكاملة + أمان المفاتيح = تطبيق موثوق 🔒</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما هو الـ endpoint؟ ما الطريقة والمعاملات؟ كيف ستُظهِر التحميل/الخطأ؟ وهل
      ستستخدم بروكسي لحماية المفتاح؟
    </>
  ),
};

const aiWelcomeMessage = `\nأرسل لي التفاصيل التالية لكي أبني لك نداء API جاهز مع واجهة حالات:\n1) الخدمة والـ endpoint الكامل.\n2) الطريقة (GET/POST/PUT/DELETE) والمعاملات:\n   - Query params (مثال: ?city=Riyadh)\n   - Body (JSON) إن وُجد.\n3) الرؤوس (headers) والمصادقة:\n   - Authorization: Bearer <TOKEN> (إن وُجد)\n   - ملاحظة: لا تضع مفاتيح حساسة في الواجهة؛ استخدم خادم وسيط/Serverless.\n4) حالات الواجهة: تحميل، فارغة، خطأ مع رسالة وزر إعادة المحاولة.\n5) إعادة المحاولة: عدد المحاولات والمهلة بين كل محاولة (backoff).\n6) المهلة الزمنية للطلب (timeout ms) واستخدام AbortController.\n7) التعامل مع CORS (هل تحتاج بروكسي؟).\n8) طريقة العرض: بطاقة/قائمة/جدول + الحقول التي تهمك.\n9) التخزين المؤقت (cache) أو localStorage ومدة الصلاحية.\n10) الثيم/اللغة.\n\nسأولّد نموذج TypeScript + fetch يتضمن تايبنج للبيانات، مؤشرات تحميل/خطأ، إعادة المحاولة مع backoff، وواجهة عربية RTL.`;

export default function ExternalApisPlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
    />
  );
}
