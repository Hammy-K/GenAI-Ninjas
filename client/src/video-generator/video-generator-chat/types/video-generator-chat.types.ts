export type ChatRole = "user" | "system";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ResponseFormat = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type AiChatRequest = {
  history: ChatMessage[];
  message: string;
  systemPrompt?: string;
  responseFormat: ResponseFormat;
};

export type AiChatSuccess = {
  ok: true;
  message: ChatMessage;
};

export type AiChatError = {
  ok: false;
  message: ChatMessage;
};

export type AiChatResponse = AiChatSuccess | AiChatError;
