export interface Message {
  role: "user" | "assistant";
  content: string;
  className?: string;
}

export interface ApiResponse {
  content: string;
}

export type AiResponse = {
  role: "assistant";
  aiMessage: string;
  htmlContent?: string;
  isHtmlGenerated?: boolean;
  isConversationComplete?: boolean;
};
