import { Request, Response, Router } from "express";
import { ANTHROPIC_CONFIG } from "server/config/ai-config/anthropic/anthropic.config";

import { OPENAI_GPT_4_1_MINI_MODEL } from "server/config/ai-config/openai/openai.config";
import { handleAnthropicRequest } from "server/handler/anthropic/anthropic.handler";
import { handleSmartAnthropicRequest } from "server/handler/anthropic/smart-anthropic.handler";
import { handleOpenAIRequest } from "server/handler/openai/openai.handler";

export function registerHtmlAiRoute(router: Router): void {
  const htmlAiRoutes = Router();

  // Register Anthropic Claude Sonnet 4 route
  htmlAiRoutes.post(
    "/anthropic/claude-sonnet-4",
    async (req: Request, res: Response) => {
      return await handleAnthropicRequest(
        req,
        res,
        ANTHROPIC_CONFIG.MODELS.CLAUDE_SONNET_4,
      );
    },
  );

  // Register Anthropic Claude Sonnet 3.7 route
  htmlAiRoutes.post(
    "/anthropic/claude-sonnet-3-7",
    async (req: Request, res: Response) => {
      return await handleAnthropicRequest(
        req,
        res,
        ANTHROPIC_CONFIG.MODELS.CLAUDE_SONNET_3_7,
      );
    },
  );

  // Register Anthropic smart claude switching between sonnet 4, 3.7, 3.5 and haiku 3.5
  htmlAiRoutes.post(
    "/anthropic/smart-claude",
    async (req: Request, res: Response) => {
      return await handleSmartAnthropicRequest(req, res);
    },
  );

  // Register OpenAi Gpt 4.1 mini route
  htmlAiRoutes.post(
    "/openai/gpt-4-1-mini",
    async (req: Request, res: Response) => {
      return await handleOpenAIRequest(req, res, OPENAI_GPT_4_1_MINI_MODEL);
    },
  );

  router.use("/html-ai", htmlAiRoutes);
}
