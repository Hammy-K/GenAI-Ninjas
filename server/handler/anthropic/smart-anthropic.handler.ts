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
    let textContent = claudeResponse.content?.[0]?.text ?? "";

    // Remove markdown code blocks if present
    textContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed = textContent;

    try {
      parsed = JSON.parse(parsed);

      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch (parseError) {
      console.error("Failed to parse Claude output:", parseError);
      console.error("Raw text content:", textContent);

      // Return error message instead of empty
      return {
        aiMessage: "عذرًا، حدث خطأ في معالجة الرد. يرجى المحاولة مرة أخرى.",
        htmlContent: "",
        isHtmlGenerated: false,
        isConversationComplete: false,
      };
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

  // Only log if userId exists
  if (userId && userId.trim() !== "") {
    try {
      logStudentHtmlMessage(userId, message);
    } catch (error) {
      console.error("Failed to log student message:", error);
    }
  }

  // Build messages correctly - NO system prompt in messages array
  const baseMessages: ClaudeMessage[] = history
    .map(
      (msg: any): ClaudeMessage => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content:
          msg.role === "assistant" ? msg.aiMessage || msg.content : msg.content,
      }),
    )
    .filter((msg) => msg.content && msg.content.trim() !== "");

  // Add current user message
  baseMessages.push({
    role: "user",
    content: `${message}\n\n${ANTHROPIC_OUTPUT_REMINDER_PROMPT}`,
  });

  for (const model of ANTHROPIC_CONFIG.FALLBACK_ORDER) {
    try {
      const requestTime = new Date();

      const anthropicRequestBody: MessageCreateParamsNonStreaming = {
        model,
        max_tokens: ANTHROPIC_CONFIG.MAX_TOKENS,
        temperature: ANTHROPIC_CONFIG.TEMPERATURE,
        system: HTML_ANTHROPIC_AI_SYSTEM_PROMPT, // System prompt ONLY here
        messages: baseMessages,
      };

      const response = await anthropic.messages.create(anthropicRequestBody);

      const responseTime = new Date();

      const { input_tokens, output_tokens } = response.usage;

      createHtmlAiRequestLogs({
        studentId: userId || "unknown",
        modelUsed: model,
        inputTokens: input_tokens,
        outputTokens: output_tokens,
        requestTime,
        responseTime,
        rawRequest: JSON.stringify(req.body),
        rawResponse: JSON.stringify(response),
      });

      if (response.stop_reason === "end_turn") {
        const parsedResponse = parseClaudeResponse(response);
        return res.status(200).json(parsedResponse);
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
