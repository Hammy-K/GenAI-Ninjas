import { Message, AiResponse } from "./types";

/**
 * Parses the raw AI response content into a structured AiResponse object,
 * falling back to defaults where necessary.
 */
function parseAiResponse(response: any): AiResponse {
  try {
    return {
      role: "assistant",
      aiMessage: response.aiMessage || "",
      htmlContent: response.htmlContent || undefined,
      isHtmlGenerated: response.isHtmlGenerated ?? false,
      isConversationComplete: response.isConversationComplete ?? false,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);

    return {
      role: "assistant",
      aiMessage:
        "أوه! شكلي متوهّق من كثر الطلبات 😵‍💫 عطيني كم ثانية وارجع جرّب !",
      htmlContent: undefined,
      isHtmlGenerated: false,
      isConversationComplete: false,
    };
  }
}

// Available endpoints:
const HTML_AI_API_ENDPOINTS = {
  anthropicClaudeSonnet4: "/api/html-ai/anthropic/claude-sonnet-4",
  anthropicClaudeSonnet3_7: "/api/html-ai/anthropic/claude-sonnet-3-7",
  anthropicSmartClaude: "/api/html-ai/anthropic/smart-claude",
  openaiGpt4_1_mini: "/api/html-ai/openai/gpt-4-1-mini",
};

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
    const response = await fetch(HTML_AI_API_ENDPOINTS.anthropicSmartClaude, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        history: messageHistory.map(({ role, content }) => ({ role, content })),
        userId: studentId,
      }),
    });

    const data = await response.json();

    const aiResponse = parseAiResponse(data);

    return aiResponse;
  } catch (error) {
    console.error("Failed to call AI API:", error);

    return {
      role: "assistant",
      aiMessage:
        "أوه! شكلي متوهّق من كثر الطلبات 😵‍💫 عطيني كم ثانية وارجع جرّب !",
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
