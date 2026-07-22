import type { ChatMessage } from "@/lovable-mission/types/lovable.types";

const API_PATH = "/api/ai-chat/openai";
const GENERIC_ERROR_AR = "تعذّر توليد ردّ المساعد. أعد إرسال رسالتك بعد لحظات، وإن استمرّ الخطأ حدّث الصفحة.";

// System prompt for Dr. Pengy storyboard conversation  
const STORYBOARD_SYSTEM_PROMPT = `أنت د. بنجي، خبير في الثقافة السعودية والحكايات. مهمتك هي مساعدة الطلاب في تطوير فكرة قصة وتحويلها إلى storyboard مكون من 6 مشاهد لفيديو فيروسي مدته 30 ثانية.

اتبع هذا التدفق بدقة:

1. **تلقي فكرة القصة**: عندما يقدم الطالب فكرته الأولية، استقبلها بترحاب وود وتحقق من وضوحها.

2. **التوضيح/الاقتراح**: 
   - إذا كانت الفكرة غامضة → اطرح أسئلة توضيحية
   - إذا كانت واضحة → اقترح تحسين أو تطوير بسيط لجعلها أكثر إثارة
   - حافظ على المحادثة خفيفة ومشجعة

3. **تأكيد القصة النهائية**: عندما تصبح الفكرة جاهزة، أكدها مع الطالب:
   "إذن القصة عن [X] يحدث في [Y]، صح؟ نثبت هذي؟"

4. **إنتاج الـstoryboard**: بعد التأكيد، أنتج storyboard مكون من 6 مشاهد، كل مشهد 5 ثوانٍ:

🎬 Storyboard (30 seconds)

Scene 1 (5s)
الموضوع: ...
الحركة: ...
المكان والزمان: ...
الصوت: ...

Scene 2 (5s)
الموضوع: ...
الحركة: ...
المكان والزمان: ...
الصوت: ...

[... وهكذا للمشاهد الـ6]

شخصيتك:
- ودود ومشجع ومرح
- خبير في الثقافة السعودية
- ماهر في صناعة المحتوى الفيروسي
- تحافظ على المحتوى مناسب ثقافياً ومشوق`;

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function sendStoryboardChat(params: {
  history: ChatMessage[];
  message: string;
  signal?: AbortSignal;
}): Promise<{ ok: boolean; message: { role: string; content: string } }> {
  try {
    const body = {
      history: params.history ?? [],
      message: params.message ?? "",
      systemPrompt: STORYBOARD_SYSTEM_PROMPT,
    };

    const res = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: params.signal,
    });

    const data = await safeJson(res);

    // Expecting server shape: { ok: boolean, message: { role: string, content: string } }
    if (
      data &&
      typeof data === "object" &&
      "message" in (data as any) &&
      data.message &&
      typeof data.message.content === "string"
    ) {
      return {
        ok: !!(data as any).ok,
        message: {
          role: "assistant",
          content: (data as any).message.content,
        },
      };
    }

    // Unexpected shape -> minimal error response
    return {
      ok: false,
      message: { role: "assistant", content: GENERIC_ERROR_AR },
    };
  } catch (err) {
    return {
      ok: false,
      message: { role: "assistant", content: GENERIC_ERROR_AR },
    };
  }
}