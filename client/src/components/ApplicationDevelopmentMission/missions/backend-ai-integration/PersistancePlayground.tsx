import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>حفظ بيانات المستخدم (Replit DB أو localStorage)</>,
  description: (
    <>
      تخزين بسيط للتفضيلات/السجل مع قراءة/كتابة آمنة ومنظّمة، مع دعم الترحيل
      (migrations) والتخزين المؤقت (TTL).
    </>
  ),
  cardHeading: <>ابدأ بمخطط بيانات صغير (schema) ومفاتيح مُسمّاة</>,
  cardLead: <>مفاتيح واضحة + قراءة/كتابة موحّدة = تجربة ثابتة</>,
  bullets: [
    {
      icon: "🧩",
      text: (
        <>
          عرّف <b>schema</b>/<b>interface</b> للبيانات (name, language, theme…)
        </>
      ),
    },
    {
      icon: "💾",
      text: (
        <>
          اختر التخزين: <b>localStorage</b> للعميل (لا أسرار)، أو{" "}
          <b>Replit&nbsp;DB</b> عبر خادم وسيط لحماية التوكن
        </>
      ),
    },
    {
      icon: "🏷️",
      text: (
        <>
          استخدم <b>namespace</b> للمفاتيح (مثال: <code>app:prefs:v1</code>)
        </>
      ),
    },
    {
      icon: "✅",
      text: (
        <>
          واجهات آمنة: <b>get/set/update/remove</b> مع <code>try/catch</code> +
          قيم افتراضية
        </>
      ),
    },
    {
      icon: "⏱️",
      text: (
        <>
          تخزين مؤقّت: خزّن <code>{`{ value, ts, ttl }`}</code> وتحقّق من
          الصلاحية
        </>
      ),
    },
    {
      icon: "🔄",
      text: (
        <>
          ترحيل بسيط عند تغيير البنية (<b>version</b> في المفتاح أو داخل القيمة)
        </>
      ),
    },
  ],
  formula: <>بنية واضحة + مفاتيح مُعنونة + حماية الأسرار = حفظ موثوق 🔒</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما الذي تريد تخزينه؟ أين سيُخزَّن (localStorage/DB)؟ ما تسمية المفاتيح
      ونسختها؟ هل تحتاج TTL/caching؟ وما القيم الافتراضية عند الفشل؟
    </>
  ),
};

const aiWelcomeMessage = `\nأرسل التفاصيل التالية لأُنشئ لك وحدة حفظ جاهزة (واجهات get/set/update/remove + TTL + fallback):\n1) اختيار التخزين:\n   - localStorage (لا أسرار، سعة ~5–10MB)\n   - Replit DB (عبر مسار خادمي /api/db لحماية التوكن)\n2) البنية (schema) واسم الـnamespace/الإصدار:\n   - مثال: key = "app:prefs:v1"\n   - interface: { name: string; language: "ar"|"en"; theme: "light"|"dark"; lastSeenAt: number }\n3) العمليات المطلوبة: get/set/update/remove/clear\n4) التخزين المؤقّت (TTL): إن رغبت خزّن { value, ts, ttl } وحدّد مدة الدقائق\n5) القيم الافتراضية عند الفشل + سلوك الترحيل إن تغيّر schema\n6) الحساسية/الخصوصية: لا تخزن أسرار المستخدم أو التوكنات في الواجهة\n7) شكل العرض في الواجهة: بطاقة إعدادات/سجل آخر الردود/جدول كاش\n\nسأولّد TypeScript Utilities مع try/catch، تحقّق من الإصدار، دعم TTL، وتحويل JSON آمن، ومع قالب خادمي لـ Replit DB إن اخترته.`;

export default function PersistencePlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
    />
  );
}
