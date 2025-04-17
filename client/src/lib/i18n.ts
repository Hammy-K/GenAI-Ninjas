import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
const resources = {
  ar: {
    translation: {
      // General
      app_name: "برنامج الجاهزية للمستقبل",
      xp: "XP {{count}}",
      progress: "المرحلة {{current}} من {{total}}",
      next_stage: "انتقل للمرحلة التالية",
      start_journey: "ابدأ الرحلة الآن",
      check: "تحقق",
      answer_placeholder: "اكتب إجابتك هنا...",
      correct_answer: "إجابة صحيحة!",

      // Header
      menu: "القائمة",

      // Progress stages
      stage1: "👋",
      stage2: "اكتشاف",
      stage3: "د. بنجي",
      stage4: "الصور",
      stage5: "الموقع",
      stage6: "التسليم",
      stage7: "🎉",

      // Welcome Stage
      welcome_title: "أهلاً بك في رحلة الذكاء الاصطناعي التوليدي! 🚀",
      welcome_description:
        "استعد لاستكشاف عالم الذكاء الاصطناعي التوليدي من خلال رحلة تفاعلية ممتعة! ستتعلم كيفية استخدام هذه التقنيات المذهلة وتطبيقها في مشاريعك الإبداعية.",
      learn_explore: "تعلم واستكشف",
      learn_explore_desc:
        "ستتعرف على ماهية الذكاء الاصطناعي التوليدي وكيفية عمله بطريقة مبسطة وممتعة.",
      try_yourself: "جرب بنفسك",
      try_yourself_desc:
        "ستجرب استخدام الذكاء الاصطناعي في توليد النصوص والصور والأفكار الإبداعية.",
      create_project: "ابتكر مشروعك",
      create_project_desc:
        "ستتمكن من إنشاء فكرة مشروع إبداعي خاص بك بمساعدة الذكاء الاصطناعي.",
      what_to_learn: "ما الذي سنتعلمه في هذه الرحلة؟",
      learning_points: [
        "فهم الذكاء الاصطناعي التوليدي وآلية عمله",
        "تجربة استخدام الذكاء الاصطناعي في توليد النصوص",
        "تجربة استخدام الذكاء الاصطناعي في توليد الصور",
        "تعلم كتابة توجيهات أفضل للذكاء الاصطناعي",
        "توليد أفكار إبداعية للمشاريع",
        "البدء في تنفيذ مشروعك الخاص",
      ],
      important_hint: "تلميح مهم!",
      no_experience_needed:
        "لا تحتاج إلى خبرة سابقة في البرمجة أو الذكاء الاصطناعي. صممنا هذه الرحلة لتكون ممتعة وسهلة الفهم للجميع!",
      badges_title: "الشارات التي يمكنك الحصول عليها",
      explorer_badge: "المستكشف",
      prompt_master_badge: "سيد التوجيهات",
      image_artist_badge: "فنان الصور",
      project_creator_badge: "مبتكر المشاريع",

      // Discovery Stage
      discovery_title: "استكشاف الذكاء الاصطناعي التوليدي 🔍",
      discovery_description:
        "دعنا نكتشف سوياً أمثلة على ما يمكن للذكاء الاصطناعي التوليدي إنشاؤه. هل يمكنك تخمين ما يجمع بين هذه الأمثلة؟",
      example1_title: "مثال 1: نص",
      example2_title: "مثال 2: صورة",
      example3_title: "مثال 3: كود برمجي",
      example4_title: "مثال 4: موسيقى",
      music_generated: "ملف موسيقى مولد بالذكاء الاصطناعي",
      what_in_common: "ما الذي يجمع بين كل هذه الأمثلة؟",
      correct_answer_text:
        "جميع هذه الأمثلة تم إنشاؤها بواسطة الذكاء الاصطناعي التوليدي وليس بواسطة البشر.",
      what_is_genai:
        "الذكاء الاصطناعي التوليدي هو نوع من الذكاء الاصطناعي القادر على إنشاء محتوى جديد - نصوص، صور، موسيقى، وحتى كود برمجي - بناءً على البيانات التي تدرب عليها.",
      how_genai_works: "كيف يعمل الذكاء الاصطناعي التوليدي؟",
      genai_process: "يعمل الذكاء الاصطناعي التوليدي من خلال:",
      genai_steps: [
        '<span class="font-bold">التدريب:</span> يتم تغذيته بكميات هائلة من البيانات (نصوص، صور، الخ)',
        '<span class="font-bold">التعلم:</span> يتعلم الأنماط والعلاقات في هذه البيانات',
        '<span class="font-bold">التوليد:</span> يستخدم ما تعلمه لإنشاء محتوى جديد بناءً على توجيهات المستخدم',
      ],
      genai_explanation: "شرح كيفية عمل الذكاء الاصطناعي التوليدي",

      // Try AI Stage
      try_ai_title: "جرب الذكاء الاصطناعي التوليدي! 🤖",
      try_ai_description:
        "حان الوقت لتجرب الذكاء الاصطناعي بنفسك! اكتب توجيهاً (prompt) وشاهد ما يمكن للذكاء الاصطناعي إنشاؤه.",
      text_generation: "توليد النصوص",
      text_prompt_placeholder:
        "اكتب توجيهاً للذكاء الاصطناعي، مثال: اكتب قصة قصيرة عن مغامرة في الفضاء",
      image_generation: "توليد الصور",
      image_prompt_placeholder:
        "اكتب وصفاً للصورة التي تريد إنشاءها، مثال: رسم لمدينة مستقبلية بألوان زاهية",
      generate: "توليد",
      generating: "جاري التوليد...",
      try_again: "حاول مرة أخرى",
      share_creation: "شارك إبداعك",
      prompt_tips: "نصائح لكتابة توجيهات أفضل:",
      tips_list: [
        "كن محدداً ودقيقاً في وصفك",
        "اذكر التفاصيل المهمة مثل الألوان، الأسلوب، الجو العام",
        "تجنب الغموض والتوجيهات القصيرة جداً",
        "حاول مختلف الصياغات إذا لم تحصل على النتيجة المرغوبة",
      ],

      // Prompt Challenge Stage
      prompt_challenge_title: "تحدي التوجيهات! 🎯",
      prompt_challenge_description:
        "هل يمكنك تحسين هذه التوجيهات لتحصل على نتائج أفضل من الذكاء الاصطناعي؟",
      weak_prompt: "توجيه ضعيف",
      improved_prompt: "توجيه محسّن",
      improve_prompt: "حسّن هذا التوجيه",
      submit_improvement: "أرسل التحسين",
      challenge_complete: "أحسنت! أكملت التحدي",
      weak_prompt_examples: [
        "اصنع صورة",
        "اكتب شيئاً",
        "قل لي عن الذكاء الاصطناعي",
        "ساعدني",
      ],
      why_weak: "لماذا هذا توجيه ضعيف؟",
      weak_explanation:
        "هذا التوجيه غامض وغير محدد. الذكاء الاصطناعي يحتاج لمزيد من المعلومات ليعطي نتيجة جيدة.",

      // Project Idea Stage
      project_title: "ابتكر مشروعك الخاص! 💡",
      project_description:
        "حان الوقت لإنشاء فكرة مشروع خاصة بك بمساعدة الذكاء الاصطناعي!",
      project_interests: "ما هي اهتماماتك؟",
      interests_placeholder: "مثال: الألعاب، البيئة، التعليم، الفن...",
      project_goal: "ما هو هدفك من المشروع؟",
      goal_placeholder: "مثال: تعليم، ترفيه، حل مشكلة...",
      project_tools: "ما هي الأدوات التي تريد استخدامها؟",
      tools_placeholder: "مثال: تطبيق جوال، موقع ويب، ألعاب...",
      generate_ideas: "توليد الأفكار",
      your_project_idea: "فكرة مشروعك",
      save_idea: "حفظ الفكرة",

      // Wrap Up Stage
      wrap_up_title: "أحسنت! أكملت الرحلة 🎉",
      wrap_up_description:
        "لقد انتهيت من رحلة الذكاء الاصطناعي التوليدي. إليك ما تعلمته وما يمكنك فعله الآن:",
      what_learned: "ما تعلمته:",
      next_steps: "الخطوات التالية:",
      download_certificate: "تحميل الشهادة",
      badges_earned: "الشارات التي حصلت عليها:",
      share_results: "شارك نتائجك",
      start_again: "ابدأ من جديد",

      // Footer
      copyright: "© 2025 رحلة الذكاء الاصطناعي التوليدي. جميع الحقوق محفوظة.",
      help: "مساعدة",
      save_progress: "حفظ التقدم",
      settings: "الإعدادات",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ar",
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
});

export default i18n;
