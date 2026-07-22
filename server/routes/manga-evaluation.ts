import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { CONFIG } from "../config";

const router = Router();
const openai = new OpenAI({ apiKey: CONFIG.ai.openai.apiKey });

interface EvaluateStoryRequest {
  authorName: string;
  theme: string;
  storySummary: string;
  events: { description: string }[];
}

router.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const { authorName, theme, storySummary, events }: EvaluateStoryRequest =
      req.body;

    // Validate input
    if (!theme || !theme.trim()) {
      return res.status(400).json({ error: "يرجى اختيار موضوع القصة" });
    }

    if (!storySummary || !storySummary.trim()) {
      return res.status(400).json({ error: "يرجى كتابة ملخص القصة" });
    }

    const filledEvents = events.filter((e) => e.description.trim()).length;
    if (filledEvents < 3) {
      return res.status(400).json({ error: "يرجى إكمال جميع الأقسام الثلاثة" });
    }

    // Create evaluation prompt
    const eventsText = `بداية القصة:
${events[0].description}

وسط القصة:
${events[1].description}

نهاية القصة:
${events[2].description}`;

    // Theme-specific instructions
    let themeGuidance = "";
    if (theme === "عودة بنجي") {
      themeGuidance =
        "\n- هذه قصة عن عودة بنجي، فيجب أن تتضمن: سقوط أو فشل في البداية، ثم تدريب وتطوير، ثم عودة قوية ونجاح.";
    } else if (theme === "ضائع في الغابة") {
      themeGuidance =
        "\n- هذه قصة ضائع في الغابة، فيجب أن تتضمن: ضياع في مكان غير مألوف، تحديات البقاء، ومحاولات للعودة أو النجاة.";
    } else if (theme === "قصة من اختيارك") {
      themeGuidance =
        "\n- الطالب اختار قصته الخاصة، فقيّم الإبداع والأصالة في الموضوع الذي اختاره.";
    }

    const systemPrompt = `أنت معلم لغة عربية خبير في تقييم بنية القصص لطلاب المرحلة الثانوية. قيّم القصة من 1 إلى 10 وقدم نصائح واضحة ومباشرة.

**معايير التقييم للأقسام الثلاثة:**
- بداية القصة: هل تقدم الشخصيات والمكان بوضوح؟ هل الحدث المحرك للقصة واضح؟
- وسط القصة: هل التحدي أو المشكلة واضحة؟ هل الأحداث تتصاعد بشكل منطقي؟
- نهاية القصة: هل الخاتمة واضحة ومرضية؟ هل تم حل المشكلة أو التعلم من التجربة؟
- التطور الشخصي: هل الشخصية تتعلم أو تتغير؟${themeGuidance}

**مهم:** 
- قدم تقييمك بأسلوب بسيط ومباشر يفهمه طالب ثانوي وبلغة عامية سعودية
- كن لطيف في التقييم وتكلم مع الطالب بصفتك صديقه
- قدم اقتراحات محددة لتحسين الأقسام (بداية، وسط، نهاية)
- راعي موضوع القصة "${theme}" في تقييمك واقتراحاتك

قدم ردك بصيغة JSON:
{
  "score": <رقم من 1 إلى 10>,
  "feedback": "<ملخص قصير (2-3 جمل) للنقاط القوية مع الإشارة لتوافقها مع الموضوع>",
  "improvements": [
    "اقتراح محدد 1 (مثال: طوّر بداية القصة لتكون أوضح في تقديم الشخصيات)",
    "اقتراح محدد 2",
    "اقتراح محدد 3"
  ]
}`;

    const userPrompt = `الكاتب: ${authorName || "غير معروف"}
موضوع القصة: ${theme}

ملخص القصة:
${storySummary}

الأقسام الثلاثة:
${eventsText}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: CONFIG.ai.openai.models.GPT_4O_MINI,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return res.json({
      score: result.score || 0,
      feedback: result.feedback || "تعذر تقييم القصة",
      improvements: result.improvements || [],
    });
  } catch (error) {
    console.error("Error evaluating manga story:", error);
    return res.status(500).json({
      error: "حدث خطأ أثناء تقييم القصة",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export function registerMangaEvaluationRoutes(app: Router) {
  app.use("/api/manga", router);
}
