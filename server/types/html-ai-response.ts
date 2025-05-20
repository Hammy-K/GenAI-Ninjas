export type AiResponse = {
  role: "assistant";
  aiMessage: string;
  htmlContent?: string;
  isHtmlGenerated?: boolean;
  isConversationComplete?: boolean;
};
