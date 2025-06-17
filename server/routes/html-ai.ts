import { Request, Response, Router } from "express";
import {
  ANTHROPIC_CLAUDE_SONNET_3_7_MODEL,
  ANTHROPIC_CLAUDE_SONNET_4_MODEL,
} from "server/config/ai-config/anthropic/anthropic.config";
import { OPENAI_GPT_4_1_MINI_MODEL } from "server/config/ai-config/openai/openai.config";
import { handleAnthropicRequest } from "server/handler/anthropic/anthropic.handler";
import { handleAnthropicSmartRequest } from "server/handler/anthropic/smart-anthropic.handler";
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
        ANTHROPIC_CLAUDE_SONNET_4_MODEL,
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
        ANTHROPIC_CLAUDE_SONNET_3_7_MODEL,
      );
    },
  );

  // Register Anthropic smart claude switching between sonnet 3.7 and 4
  htmlAiRoutes.post(
    "/anthropic/smart-claude",
    async (req: Request, res: Response) => {
      return await handleAnthropicSmartRequest(
        req,
        res,
        ANTHROPIC_CLAUDE_SONNET_4_MODEL,
        ANTHROPIC_CLAUDE_SONNET_3_7_MODEL,
      );
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
