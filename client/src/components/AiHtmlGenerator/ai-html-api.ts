import { Message, AiResponse } from "./types";

/**
 * Parses the raw AI response content into a structured AiResponse object,
 * falling back to defaults where necessary.
 */
function parseAiResponse(rawContent: string): AiResponse {
  try {
    const parsed = JSON.parse(rawContent);

    return {
      role: "assistant",
      aiMessage: parsed.aiMessage || "",
      htmlContent: parsed.htmlContent || undefined,
      isHtmlGenerated: parsed.isHtmlGenerated ?? false,
      isConversationComplete: parsed.isConversationComplete ?? false,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);

    return {
      role: "assistant",
      aiMessage:
        "يا للأسف! صار خطأ بسيط وما قدرت أفهم ردك. جرب ترسله من جديد، وأنا معك خطوة بخطوة! 💪",
      htmlContent: undefined,
      isHtmlGenerated: false,
      isConversationComplete: false,
    };
  }
}

/**
 * Calls the AI backend with user message and message history,
 * returning a structured AiResponse object.
 */
export const callAiApi = async (
  userMessage: string,
  messageHistory: Message[],
  studentId: string,
): Promise<AiResponse> => {
  try {
    const response = await fetch("/api/html-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        history: messageHistory.map(({ role, content }) => ({ role, content })),
        studentId: studentId,
      }),
    });

    const data = await response.json();

    const aiResponse = parseAiResponse(data.content);

    return aiResponse;
  } catch (error) {
    console.error("Failed to call AI API:", error);

    return {
      role: "assistant",
      aiMessage:
        "أوه لا! شكلي تلخبطت شوي. ممكن تعيد المحاولة؟ وأنا حاضر أساعدك  ! 😊",
      htmlContent: undefined,
      isHtmlGenerated: false,
      isConversationComplete: false,
    };
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();

    formData.append("audio", audioBlob, "audio.webm");

    const response = await fetch("/api/ai-transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to transcribe audio");
    }

    const data = await response.json();
    const transcription = data.text;

    return transcription;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
};
