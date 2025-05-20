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
      }),
    });

    const data = await response.json();

    console.log("✅ Raw AI API response:", data);

    const aiResponse = parseAiResponse(data.content);

    console.log("################################");
    console.log("Parsed AI response:", aiResponse);
    console.log("################################");

    return aiResponse;
  } catch (error) {
    console.error("Failed to call AI API:", error);

    return {
      role: "assistant",
      aiMessage:
        "أوه لا! شكلي تلخبطت شوي. ممكن تعيد المحاولة؟ وأنا حاضر أساعدك بكل حماس! 😊",
      htmlContent: undefined,
      isHtmlGenerated: false,
      isConversationComplete: false,
    };
  }
};
