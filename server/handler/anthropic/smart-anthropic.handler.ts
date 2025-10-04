import { Request, Response } from "express";
import {
  anthropic,
  ANTHROPIC_CONFIG,
} from "server/config/ai-config/anthropic/anthropic.config";
import { isContentSafe } from "server/services/ai-moderation";
import { logStudentHtmlMessage } from "server/services/student-html-message";
import { createHtmlAiRequestLogs } from "server/services/html-ai-request-logs";
import { HTML_ANTHROPIC_AI_SYSTEM_PROMPT } from "server/templates/prompts/anthropic/anthropic.prompt";
import { ANTHROPIC_OUTPUT_REMINDER_PROMPT } from "server/templates/prompts/anthropic/anthropic-output-reminder.prompt";
import {
  AiRequestBody,
  StandardAiResponse,
} from "server/types/ai-types/common";
import { ClaudeMessage } from "server/types/ai-types/anthropic/claude";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/index.mjs";

export function parseClaudeResponse(claudeResponse: any): StandardAiResponse {
  try {
    const textContent = claudeResponse.content?.[0]?.text ?? "";

    let parsed = textContent;

    try {
      parsed = JSON.parse(parsed);

      if (typeof parsed === "string") parsed = JSON.parse(parsed);
    } catch (_) {
      console.error("Failed to double-parse Claude output");
    }

    return {
      aiMessage: parsed.aiMessage || "",
      htmlContent: parsed.htmlContent || "",
      isHtmlGenerated: parsed.isHtmlGenerated || false,
      isConversationComplete: parsed.isConversationComplete || false,
    };
  } catch (error) {
    console.error("Failed to parse Claude response:", error);

    return {
      aiMessage:
        "عذرًا، حدث خطأ في النظام. الرجاء إعادة المحاولة بعد لحظات، فقد يكون السبب ضغطًا مؤقتًا على الخدمة.",
      htmlContent: "",
      isHtmlGenerated: false,
      isConversationComplete: false,
    };
  }
}

export async function handleSmartAnthropicRequest(req: Request, res: Response) {
  const { message, history, userId }: AiRequestBody = req.body;

  if (!message || !Array.isArray(history)) {
    return res.status(400).json({ error: "Missing message or history" });
  }

  const isMessageSafe = await isContentSafe(message);

  if (!isMessageSafe) {
    return res.status(200).json({
      aiMessage: "عذرًا، لا يمكن استخدام هذا المحتوى.",
      htmlContent: "",
      isHtmlGenerated: false,
      isConversationComplete: false,
    });
  }

  logStudentHtmlMessage(userId, message);

  const baseMessages: ClaudeMessage[] = [
    { role: "assistant", content: HTML_ANTHROPIC_AI_SYSTEM_PROMPT },
    ...history.map(
      (msg: any): ClaudeMessage => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content:
          msg.role === "assistant" ? msg.aiMessage || msg.content : msg.content,
      }),
    ),
    { role: "assistant", content: ANTHROPIC_OUTPUT_REMINDER_PROMPT },
  ];

  for (const model of ANTHROPIC_CONFIG.FALLBACK_ORDER) {
    try {
      const requestTime = new Date();

      // TODO: the system prompt is sent twice, once in the baseMessages and once here
      const anthropicRequestBody: MessageCreateParamsNonStreaming = {
        model,
        max_tokens: ANTHROPIC_CONFIG.MAX_TOKENS,
        temperature: ANTHROPIC_CONFIG.TEMPERATURE,
        system: HTML_ANTHROPIC_AI_SYSTEM_PROMPT,
        messages: baseMessages,
      };

      const response = await anthropic.messages.create(anthropicRequestBody);

      const responseTime = new Date();

      const { input_tokens, output_tokens } = response.usage;

      createHtmlAiRequestLogs({
        studentId: userId,
        modelUsed: model,
        inputTokens: input_tokens,
        outputTokens: output_tokens,
        requestTime,
        responseTime,
        rawRequest: JSON.stringify(req.body),
        rawResponse: JSON.stringify(response),
      });

      // Accept only successful completions
      if (response.stop_reason === "end_turn") {
        const parsedResponse = parseClaudeResponse(response);

        return res.status(200).json(parsedResponse);
      }

      // else try next model...
      console.warn(
        `Model [${model}] ended with stop_reason [${response.stop_reason}] — trying next.`,
      );
    } catch (err: any) {
      console.error(`Model [${model}] failed with error:`, err.message);
      // fall through to try next model
    }
  }

  // ✅ If all fallbacks fail
  return res.status(500).json({
    error: "All fallback models failed to generate a valid response.",
  });
}

/*import { Request, Response } from "express";
import {
  anthropic,
  ANTHROPIC_CONFIG,
} from "server/config/ai-config/anthropic/anthropic.config";
import { isContentSafe } from "server/services/ai-moderation";
import { logStudentHtmlMessage } from "server/services/student-html-message";
import { createHtmlAiRequestLogs } from "server/services/html-ai-request-logs";
import { HTML_ANTHROPIC_AI_SYSTEM_PROMPT } from "server/templates/prompts/anthropic/anthropic.prompt";
import { ANTHROPIC_OUTPUT_REMINDER_PROMPT } from "server/templates/prompts/anthropic/anthropic-output-reminder.prompt";
import {
  AiRequestBody,
  StandardAiResponse,
} from "server/types/ai-types/common";
import { ClaudeMessage } from "server/types/ai-types/anthropic/claude";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/index.mjs";

export function parseClaudeResponse(claudeResponse: any): StandardAiResponse {
  try {
    const textContent = claudeResponse.content?.[0]?.text ?? "";

    let parsed = textContent;

    try {
      parsed = JSON.parse(parsed);

      if (typeof parsed === "string") parsed = JSON.parse(parsed);
    } catch (_) {
      console.error("Failed to double-parse Claude output");
    }

    return {
      aiMessage: parsed.aiMessage || "",
      htmlContent: parsed.htmlContent || "",
      isHtmlGenerated: parsed.isHtmlGenerated || false,
      isConversationComplete: parsed.isConversationComplete || false,
    };
  } catch (error) {
    console.error("Failed to parse Claude response:", error);

    return {
      aiMessage:
        "عذرًا، حدث خطأ في النظام. الرجاء إعادة المحاولة بعد لحظات، فقد يكون السبب ضغطًا مؤقتًا على الخدمة.",
      htmlContent: "",
      isHtmlGenerated: false,
      isConversationComplete: false,
    };
  }
}

export async function handleSmartAnthropicRequest(req: Request, res: Response) {
  const { message, history, userId }: AiRequestBody = req.body;

  if (!message || !Array.isArray(history)) {
    return res.status(400).json({ error: "Missing message or history" });
  }

  const isMessageSafe = await isContentSafe(message);

  if (!isMessageSafe) {
    return res.status(200).json({
      aiMessage: "عذرًا، لا يمكن استخدام هذا المحتوى.",
      htmlContent: "",
      isHtmlGenerated: false,
      isConversationComplete: false,
    });
  }

  logStudentHtmlMessage(userId, message);

  const baseMessages: ClaudeMessage[] = [
    { role: "assistant", content: HTML_ANTHROPIC_AI_SYSTEM_PROMPT },
    ...history.map(
      (msg: any): ClaudeMessage => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content:
          msg.role === "assistant" ? msg.aiMessage || msg.content : msg.content,
      }),
    ),
    { role: "assistant", content: ANTHROPIC_OUTPUT_REMINDER_PROMPT },
  ];

  for (const model of ANTHROPIC_CONFIG.FALLBACK_ORDER) {
    try {
      const requestTime = new Date();

      // TODO: the system prompt is sent twice, once in the baseMessages and once here
      const anthropicRequestBody: MessageCreateParamsNonStreaming = {
        model,
        max_tokens: ANTHROPIC_CONFIG.MAX_TOKENS,
        temperature: ANTHROPIC_CONFIG.TEMPERATURE,
        system: HTML_ANTHROPIC_AI_SYSTEM_PROMPT,
        messages: baseMessages,
      };

      const response = await anthropic.messages.create(anthropicRequestBody);

      const responseTime = new Date();

      const { input_tokens, output_tokens } = response.usage;

      createHtmlAiRequestLogs({
        studentId: userId,
        modelUsed: model,
        inputTokens: input_tokens,
        outputTokens: output_tokens,
        requestTime,
        responseTime,
        rawRequest: JSON.stringify(req.body),
        rawResponse: JSON.stringify(response),
      });

      // Accept only successful completions
      if (response.stop_reason === "end_turn") {
        const parsedResponse = parseClaudeResponse(response);

        return res.status(200).json(parsedResponse);
      }

      // else try next model...
      console.warn(
        `Model [${model}] ended with stop_reason [${response.stop_reason}] — trying next.`,
      );
    } catch (err: any) {
      console.error(`Model [${model}] failed with error:`, err.message);
      // fall through to try next model
    }
  }

  // ✅ If all fallbacks fail
  return res.status(500).json({
    error: "All fallback models failed to generate a valid response.",
  });
}*/
