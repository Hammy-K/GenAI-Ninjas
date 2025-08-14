import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
  rtl: true,
  title: <>مدخلات متعددة (مثل: الاسم + المزاج)</>,
  description: (
    <>
      ادمج أكثر من حقل لإنتاج نتيجة أذكى وأكثر دقة، بناءً على قواعد دمج بسيطة.
    </>
  ),
  cardHeading: <>ابدأ بدمج الحقول</>,
  cardLead: <>مدخلان أو أكثر ← قرار/نتيجة أدق</>,
  bullets: [
    { icon: "🧩", text: <>أنواع المدخلات: نص / رقم / اختيار / وقت</> },
    { icon: "🎯", text: <>نوع الإخراج: نص / لون / صورة / اقتراح</> },
    {
      icon: "🖱️",
      text: <>التفاعل: زر اضغط أو Enter + تحديث مباشر عند تغيير أي حقل</>,
    },
    {
      icon: "🔁",
      text: (
        <>القاعدة: دمج القيم عبر if/else أو جدول مطابقة لإنتاج إخراج مناسب</>
      ),
    },
  ],
  formula: <>\nمدخلات متعددة + قاعدة دمج واضحة = تجربة أذكى 🔥\n</>,
  questionIntro: (
    <>
      <span className="inline-block ml-2">👉</span> فكّر الآن:
    </>
  ),
  question: (
    <>
      ما هي الحقول المطلوبة؟ وكيف يؤثر كل حقل على الإخراج؟ وما النتيجة المتوقعة؟
    </>
  ),
};

const aiWelcomeMessage = `
اكتب لي الآتي لبناء تجربة **مدخلات متعددة** مرتبطة بالبطاقة الحالية:
1) قائمة الحقول بأسمائها وأنواعها (مثال: الاسم: نص، المزاج: اختيار، الوقت: وقت).
2) قواعد الدمج/المنطق (مثال: إذا كان المزاج «سعيد» + الوقت «صباح» → رسالة مرحة وخلفية زرقاء).
3) شكل الإخراج المطلوب (رسالة/لون/صورة/اقتراح).
4) أسلوب الواجهة أو الثيم (فاتح/داكن، أو ألوان محددة).
سأولّد نموذج HTML/JS بمدخلات متعددة يُحدّث النتيجة فورًا عند تغيير أي حقل، ويعمل بزر «إرسال» أو زر Enter.`;

export default function MultiInputsPlayground() {
  return (
    <AiPlayground
      aiWelcomeMessage={aiWelcomeMessage}
      playgroundWelcomeCardProps={welcomeProps}
    />
  );
}
