// ---- Chat message (client-side) ----
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

// ---- Storyboard conversation state ----
export type StoryboardConversationState = {
  phase: "initial" | "clarifying" | "confirming" | "storyboard_generated" | "complete";
  storyIdea?: string;
  finalStory?: string;
  storyboard?: string;
};

// ---- AI response (storyboard specific) ----
export type StoryboardAiResponse = {
  aiMessage: string;
  conversationState: StoryboardConversationState;
  isStoryboardGenerated: boolean;
  isConversationComplete: boolean;
};

// ---- Chat request body (what we POST) ----
export type StoryboardChatRequest = {
  history: ChatMessage[]; // full conversation
  message: string; // current user input
  conversationState?: StoryboardConversationState;
};