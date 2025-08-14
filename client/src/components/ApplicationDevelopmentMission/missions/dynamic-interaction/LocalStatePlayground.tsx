import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>تخزين الحالة محليًا (بدون باكند)</>,
  description: (
    <>تتبع مدخلات وخيارات المستخدم داخل الجلسة باستخدام state أو localStorage.</>
  ),
  cardHeading: <>اجعل التطبيق يتذكّرك</>,
  cardLead: <>state فوري + حفظ اختياري في المتصفح</>,
  bullets: [
    { icon: "🧠", text: <>في الذاكرة: useState / useReducer لإدارة القيم</> },
    { icon: "💾", text: <>في المتصفح: localStorage / sessionStorage مع serialize/deserialize</> },
    { icon: "🔄", text: <>المزامنة: استرجاع عند التحميل وتحديث عند التغيير (debounce اختياري)</> },
    { icon: "⚠️", text: <>الخصوصية: تجنّب البيانات الحساسة وحدّد مدة صلاحية إن لزم</> },
  ],
  formula: <>state داخل الجلسة + تخزين متصفح اختياري = تجربة تتذكّر المستخدم 🔒</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>ما المفاتيح التي تريد حفظها؟ ما القيم الافتراضية؟ أين الحفظ (ذاكرة فقط/LocalStorage)؟ ومتى تُستعاد؟ وهل تريد مسحًا تلقائيًا؟</>
  ),
};

const aiWelcomeMessage = `\nاكتب لي التفاصيل التالية لأُعدّ تخزينًا محليًا يناسب بطاقتك الحالية:\n1) قائمة المفاتيح والقيم الافتراضية (مثال: theme=dark, fontSize=16, lastTab=home).\n2) نطاق الحفظ: الذاكرة فقط أم localStorage أم sessionStorage.\n3) توقيت الحفظ: عند كل تغيير أم عند الضغط على زر حفظ.\n4) سياسة الاسترجاع: عند التحميل/التنقّل، ومعالجة القيم غير الصالحة.\n5) مدة الصلاحية (TTL) إن لزم، ومقدمة للمفاتيح (prefix) مثل app:playground:.\n6) عناصر التحكم: زر إعادة ضبط لمسح القيم، وخيار تصدير/استيراد JSON.\nسأولّد نموذج HTML/JS يقرأ/يكتب بأمان (JSON.stringify/parse)، ويدعم storage events للتحديث عبر التبويبات.`;

export default function LocalStatePlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
    />
  );
}
