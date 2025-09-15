import type { Router } from "express";
import { handleOpenAIChat } from "./ai-chat.handler";

export function registerAiChatRoutes(router: Router): void {
  router.post("/ai-chat/openai", handleOpenAIChat);
}
