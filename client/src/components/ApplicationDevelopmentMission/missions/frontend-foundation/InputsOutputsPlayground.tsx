import React from "react";
import AiPlayground from "../../playground/AiPlayground";
import { PlaygroundWelcomeCardProps } from "../../playground/PlaygroundWelcomeCard";

const welcomeProps: PlaygroundWelcomeCardProps = {
    rtl: true,
    title: <>إدخال ← إخراج</>,
    description: (
        <>ابنِ تطبيقًا صغيرًا: إدخال واحد يعطي إخراجًا واضحًا فورًا.</>
    ),
    cardHeading: <>ابدأ بحركة واحدة</>,
    cardLead: <>حقل إدخال واحد + زر = نتيجة فورية</>,
    bullets: [
        { icon: "⌨️", text: <>نوع الإدخال: نص / رقم / اختيار</> },
        { icon: "🖥️", text: <>نوع الإخراج: نص </> },
        { icon: "🖱️", text: <>التفاعل: زر اضغط أو Enter</> },
        { icon: "🔁", text: <>القاعدة: كل إدخال يغيّر الإخراج مباشرة</> },
    ],
    formula: <>إدخال واحد + إخراج واضح = تطبيق ممتع 🔥</>,
    questionIntro: (
        <>
            <span className="inline-block ml-2">👉</span> فكّر الآن:
        </>
    ),
    question: <>ما هو الإدخال؟ وما هو الإخراج المتوقع؟</>,
};

const aiWelcomeMessage =
    "اكتب: 1) نوع الإدخال (نص/رقم/اختيار) 2) نوع الإخراج (نص/صورة/لون/صوت) 3) الثيم. سأبني لك نموذج HTML/JS بسيط يعمل مباشرة.";

export default function InputsOutputsPlayground() {
    return (
        <AiPlayground
            aiWelcomeMessage={aiWelcomeMessage}
            playgroundWelcomeCardProps={welcomeProps}
        />
    );
}
