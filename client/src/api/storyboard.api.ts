import type {
  ChatMessage,
  StoryboardAiResponse,
  StoryboardChatRequest,
  StoryboardConversationState,
} from "../types/storyboard.types";

const API_PATH = "/api/ai-chat/openai";
const GENERIC_ERROR_AR = "حدث خطأ أثناء توليد الرد. يرجى المحاولة مجددا.";

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
- تحافظ على المحتوى مناسب ثقافياً ومشوق

استجب دائماً بـJSON بهذا التنسيق:
{
  "aiMessage": "رسالتك للطالب بالعربية",
  "conversationState": {
    "phase": "initial" | "clarifying" | "confirming" | "storyboard_generated" | "complete",
    "storyIdea": "الفكرة الأولية إن وُجدت",
    "finalStory": "القصة النهائية إن تم تأكيدها", 
    "storyboard": "الـstoryboard الكامل إن تم إنتاجه"
  },
  "isStoryboardGenerated": true/false,
  "isConversationComplete": true/false
}`;

// Response format for structured JSON
const STORYBOARD_RESPONSE_FORMAT = {
  name: "storyboard_response",
  schema: {
    type: "object",
    properties: {
      aiMessage: { type: "string" },
      conversationState: {
        type: "object",
        properties: {
          phase: { 
            type: "string", 
            enum: ["initial", "clarifying", "confirming", "storyboard_generated", "complete"] 
          },
          storyIdea: { type: "string" },
          finalStory: { type: "string" },
          storyboard: { type: "string" }
        },
        required: ["phase"]
      },
      isStoryboardGenerated: { type: "boolean" },
      isConversationComplete: { type: "boolean" }
    },
    required: ["aiMessage", "conversationState", "isStoryboardGenerated", "isConversationComplete"],
    additionalProperties: false
  },
  strict: true
};

const DEFAULT_STATE: StoryboardAiResponse = {
  aiMessage: "حدث خطأ بسيط. حاول مرة أخرى.",
  conversationState: {
    phase: "initial"
  },
  isStoryboardGenerated: false,
  isConversationComplete: false,
};

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
  conversationState?: StoryboardConversationState;
  signal?: AbortSignal;
}): Promise<StoryboardAiResponse> {
  try {
    const body = {
      history: params.history ?? [],
      message: params.message ?? "",
      systemPrompt: STORYBOARD_SYSTEM_PROMPT,
      responseFormat: STORYBOARD_RESPONSE_FORMAT,
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
      const rawContent: string = (data as any).message.content;

      try {
        const parsed = JSON.parse(rawContent);

        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.aiMessage === "string" &&
          parsed.conversationState &&
          typeof parsed.conversationState === "object"
        ) {
          return {
            aiMessage: parsed.aiMessage,
            conversationState: parsed.conversationState,
            isStoryboardGenerated: !!parsed.isStoryboardGenerated,
            isConversationComplete: !!parsed.isConversationComplete,
          } as StoryboardAiResponse;
        }
      } catch {
        // not JSON -> fallthrough to error
      }
    }

    // Unexpected shape -> minimal error response
    return DEFAULT_STATE;
  } catch (err) {
    return DEFAULT_STATE;
  }
}