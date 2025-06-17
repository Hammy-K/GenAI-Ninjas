import { Request, Response } from "express";
import {
  anthropic,
  ANTHROPIC_MAX_TOKENS,
  ANTHROPIC_TEMPERATURE,
} from "server/config/ai-config/anthropic/anthropic.config";
import { parseClaudeResponse } from "./anthropic.handler";
import { AiRequestBody } from "server/types/ai-types/common";
import { isContentSafe } from "server/services/ai-moderation";
import { logStudentHtmlMessage } from "server/services/student-html-message";
import { ANTHROPIC_OUTPUT_REMINDER_PROMPT } from "server/templates/prompts/anthropic/anthropic-output-reminder.prompt";
import { HTML_ANTHROPIC_AI_SYSTEM_PROMPT } from "server/templates/prompts/anthropic/anthropic.prompt";
import { ClaudeMessage } from "server/types/ai-types/anthropic/claude";

type ClaudeTryResult =
  | {
      success: true;
      data: any;
    }
  | {
      success: false;
      status: number;
      model: string;
      retryAfter?: number;
      retryUntil?: number;
      error: any;
      headers: Record<string, string>;
    };

function isNonRetryable(status: number) {
  return [400, 401, 403, 404, 413].includes(status);
}

function parseRetryAfter(headers: Record<string, string>): number | undefined {
  const raw = headers["retry-after"];

  if (!raw) return undefined;

  const seconds = parseInt(raw, 10);

  if (isNaN(seconds) || seconds <= 0) return undefined;

  return Math.min(seconds, 120); // Max 2 minutes
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryClaudeModelOnce(
  req: Request,
  model: string,
): Promise<ClaudeTryResult> {
  try {
    const { message, history, userId }: AiRequestBody = req.body;

    if (!message || !Array.isArray(history)) {
      console.error("Missing message or history in tryClaudeModelOnce");

      return {
        success: true,
        data: {
          aiMessage: "عذرًا، حدث خطأ في النظام.",
          htmlContent: "",
          isHtmlGenerated: false,
          isConversationComplete: false,
        },
      };
    }

    const isMessageSafe = await isContentSafe(message);

    if (!isMessageSafe) {
      return {
        success: true,
        data: {
          aiMessage: "عذرًا، لا يمكن استخدام هذا المحتوى.",
          htmlContent: "",
          isHtmlGenerated: false,
          isConversationComplete: false,
        },
      };
    }

    logStudentHtmlMessage(userId, message);

    const messages: ClaudeMessage[] = [
      {
        role: "assistant",
        content: HTML_ANTHROPIC_AI_SYSTEM_PROMPT,
      },
    ];

    const historyMessages: ClaudeMessage[] = history.map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content:
        msg.role === "assistant" ? msg.aiMessage || msg.content : msg.content,
    }));

    messages.push(...historyMessages);

    messages.push({
      role: "assistant",
      content: ANTHROPIC_OUTPUT_REMINDER_PROMPT,
    });

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      temperature: ANTHROPIC_TEMPERATURE,
      system: HTML_ANTHROPIC_AI_SYSTEM_PROMPT,
      messages: messages,
    });

    console.log("#############################");
    console.log(`[${model}] Request succeeded try claude once: [${response}] `);
    console.log("#############################");

    return {
      success: true,
      data: response,
    };
  } catch (err: any) {
    const status = err?.statusCode || err?.response?.status || 500;
    const headers = err?.response?.headers || {};
    const retryAfter = parseRetryAfter(headers);
    const retryUntil = retryAfter ? Date.now() + retryAfter * 1000 : undefined;

    console.error(`[${model}] Request failed:`, {
      status,
      retryAfter,
      retryUntil,
      error: err?.message || err,
    });

    return {
      success: false,
      status,
      model,
      retryAfter,
      retryUntil,
      error: err,
      headers,
    };
  }
}

export async function handleAnthropicSmartRequest(
  req: Request,
  res: Response,
  primaryModel: string,
  secondaryModel: string,
) {
  const startTime = Date.now();
  const MAX_TOTAL_TIME = 2 * 60 * 1000;

  function checkTimeout() {
    if (Date.now() - startTime > MAX_TOTAL_TIME) {
      console.error("Request timeout - exceeded maximum processing time.");

      throw new Error("Request timeout - exceeded maximum processing time.");
    }
  }

  try {
    checkTimeout();
    const primary = await tryClaudeModelOnce(req, primaryModel);

    if (primary.success) {
      const standardResponse = parseClaudeResponse(primary.data);

      return res.json(standardResponse);
    }

    console.log("Trying secondary model:", secondaryModel);

    checkTimeout();
    const secondary = await tryClaudeModelOnce(req, secondaryModel);

    if (secondary.success) {
      const standardResponse = parseClaudeResponse(secondary.data);

      return res.json(standardResponse);
    }

    const bothNonRetryable =
      isNonRetryable(primary.status) && isNonRetryable(secondary.status);

    if (bothNonRetryable) {
      console.error(
        "Both models returned non-retryable errors. Returning 500.",
      );

      return res.status(500).json({
        error: "Both models returned non-retryable errors",
        details: { primary, secondary },
      });
    }

    // Filter out stale retry times and validate they're in the future
    const retryables = [primary, secondary]
      .filter((r) => r.retryUntil && r.retryUntil > Date.now())
      .filter((r) => r.retryUntil! - Date.now() < MAX_TOTAL_TIME);

    if (retryables.length === 0) {
      console.error("No retryable models. Returning 500.");

      return res.status(500).json({
        error: "No retryable models",
        details: { primaryError: primary.error, secondary: secondary.error },
      });
    }

    // Choose the model with shortest retry wait
    retryables.sort((a, b) => a.retryUntil! - b.retryUntil!);

    const chosen = retryables[0];

    const now = Date.now();

    const waitTime = Math.max(0, chosen.retryUntil! - now);

    const jitter = chosen.retryAfter ? 0 : Math.random() * 2000;

    const finalWaitTime = waitTime + jitter;

    console.log(
      `⏳ Waiting ${finalWaitTime}ms for model ${chosen.model} retry...`,
    );

    checkTimeout();
    await sleep(finalWaitTime);

    console.log(`Retrying model: ${chosen.model}`);

    checkTimeout();
    const retry = await tryClaudeModelOnce(req, chosen.model);

    if (retry.success) {
      console.log("Retry succeeded");

      const standardResponse = parseClaudeResponse(retry.data);

      return res.json(standardResponse);
    }

    const otherModel =
      chosen.model === primaryModel ? secondaryModel : primaryModel;

    const otherRetry = retryables.find((r) => r.model === otherModel);

    if (otherRetry && otherRetry.retryUntil) {
      const otherWait = Math.max(0, otherRetry.retryUntil - Date.now());

      console.log(`Retrying other model ${otherModel} after ${otherWait}ms`);

      checkTimeout();
      await sleep(otherWait);

      checkTimeout();
      const finalTry = await tryClaudeModelOnce(req, otherModel);

      if (finalTry.success) {
        console.log("Fallback retry succeeded");

        const standardResponse = parseClaudeResponse(finalTry.data);

        return res.json(standardResponse);
      }

      console.error("Fallback retry failed:", finalTry);
    }

    console.error("All retries failed");

    return res.status(500).json({
      error: "All retries failed",
      details: { primary, secondary },
    });
  } catch (error) {
    console.error("Error generating AI chat:", error);

    return res.status(500).json({ error: "AI generation failed" });
  }
}
