// ---- Chat message (client-side) ----
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

// ---- Progress flags (mirrors backend) ----
export type LovableProgressFlags = {
  welcomeDone: boolean; // true from start
  ideationOngoing: boolean; // true while AI is asking questions
  readyDone: boolean; // true when final prompt generated
  buildingOngoing: boolean; // true once student opened Lovable (client may set optimistically)
};

// ---- AI response (mirrors backend schema) ----
export type LovableAiResponse = {
  aiMessage: string;
  lovablePromptLink?: string;
  isReadyToGoToLovable: boolean;
  progress: LovableProgressFlags;
};

// ---- Chat request body (what we POST) ----
export type LovableChatRequest = {
  history: ChatMessage[]; // full conversation
  message: string; // current user input (server rejects empty)
  lastResponse?: LovableAiResponse; // server may return this on moderation/error
};
