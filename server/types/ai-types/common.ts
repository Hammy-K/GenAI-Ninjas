export type StandardAiResponse = {
  aiMessage: string;
  htmlContent: string;
  isHtmlGenerated: boolean;
  isConversationComplete: boolean;
};

export type AiRequestBody = {
  message: string;
  history: any[];
  userId: string;
  systemPrompt?: string;
};
