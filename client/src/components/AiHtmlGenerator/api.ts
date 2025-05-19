import { Message, ApiResponse } from "./types";

/**
 * Call the AI API with the user message and message history
 * @param userMessage The message from the user
 * @param messageHistory The complete message history
 * @returns Promise with the AI response
 */
export const callAiApi = async (
  userMessage: string,
  messageHistory: Message[],
): Promise<ApiResponse> => {
  // This is a placeholder - replace with your actual API call

  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await fetch("/api/html-ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: userMessage,
      history: messageHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    }),
  });

  const data = await response.json();

  return {
    content: data.content,
  };
};
