import { Request, Response } from "express";
import {
  anthropic,
  ANTHROPIC_CONFIG,
} from "server/config/ai-config/anthropic/anthropic.config";
import { isContentSafe } from "server/services/ai-moderation";
import { logStudentHtmlMessage } from "server/services/student-html-message";
import { createHtmlAiRequestLogs } from "server/services/html-ai-request-logs";
import { ANTHROPIC_OUTPUT_REMINDER_PROMPT } from "server/templates/prompts/anthropic/anthropic-output-reminder.prompt";
import { ClaudeMessage } from "server/types/ai-types/anthropic/claude";
import { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/index.mjs";
import {
  AiRequestBody,
  StandardAiResponse,
} from "server/types/ai-types/common";

export function parseClaudeResponseV2(claudeResponse: any): {
  success: boolean;
  data: StandardAiResponse;
} {
  const FALLBACK: StandardAiResponse = {
    aiMessage:
      "عذرًا، حدث خطأ في النظام. الرجاء إعادة المحاولة بعد لحظات، فقد يكون السبب ضغطًا مؤقتًا على الخدمة.",
    htmlContent: "",
    isHtmlGenerated: false,
    isConversationComplete: false,
  };

  try {
    const raw =
      claudeResponse?.content?.[0]?.text ??
      claudeResponse?.content?.[0] ??
      claudeResponse?.content ??
      "";

    if (typeof raw !== "string" || raw.trim().length === 0) {
      return { success: false, data: FALLBACK };
    }

    // 1) Slice between the first '{' and the last '}'.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      return { success: false, data: FALLBACK };
    }

    const sliced = raw.slice(start, end + 1).trim();

    // 2) Parse, with double-decode fallback if result is a string.
    let parsed: any;

    try {
      parsed = JSON.parse(sliced);

      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch (error) {
      console.error("JSON parsing failed: ", error);
      return { success: false, data: FALLBACK };
    }

    // 3) Normalize to StandardAiResponse with safe defaults.
    const normalized: StandardAiResponse = {
      aiMessage: typeof parsed.aiMessage === "string" ? parsed.aiMessage : "",
      htmlContent:
        typeof parsed.htmlContent === "string" ? parsed.htmlContent : "",
      isHtmlGenerated:
        typeof parsed.isHtmlGenerated === "boolean"
          ? parsed.isHtmlGenerated
          : false,
      isConversationComplete:
        typeof parsed.isConversationComplete === "boolean"
          ? parsed.isConversationComplete
          : false,
    };

    return { success: true, data: normalized };
  } catch {
    return { success: false, data: FALLBACK };
  }
}

export async function handleAppDevCodeGenerator(req: Request, res: Response) {
  const { message, history, userId, systemPrompt }: AiRequestBody = req.body;

  if (!message || !Array.isArray(history) || !systemPrompt) {
    return res
      .status(400)
      .json({ error: "Missing message, history or system prompt" });
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
    { role: "assistant", content: systemPrompt },
    { role: "assistant", content: ANTHROPIC_OUTPUT_REMINDER_PROMPT },
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

      const anthropicRequestBody: MessageCreateParamsNonStreaming = {
        model,
        max_tokens: ANTHROPIC_CONFIG.MAX_TOKENS,
        temperature: ANTHROPIC_CONFIG.TEMPERATURE,
        system: systemPrompt || "",
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

      if (response.stop_reason === "end_turn") {
        const { success, data: parsedResponse } =
          parseClaudeResponseV2(response);

        if (success) {
          return res.status(200).json(parsedResponse);
        }
      }

      console.warn(
        `Model [${model}] ended with stop_reason [${response.stop_reason}] — trying next.`,
      );
    } catch (err: any) {
      console.error(`Model [${model}] failed with error:`, err.message);
    }
  }

  return res.status(500).json({
    error: "All fallback models failed to generate a valid response.",
  });
}
