import { Request, Response } from "express";
import {
  anthropic,
  ANTHROPIC_MAX_TOKENS,
  ANTHROPIC_TEMPERATURE,
} from "server/config/ai-config/anthropic/anthropic.config";
import { isContentSafe } from "server/services/ai-moderation";
import { logStudentHtmlMessage } from "server/services/student-html-message";
import { HTML_ANTHROPIC_AI_SYSTEM_PROMPT } from "server/templates/prompts/anthropic/anthropic.prompt";
import { ANTHROPIC_OUTPUT_REMINDER_PROMPT } from "server/templates/prompts/anthropic/anthropic-output-reminder.prompt";
import { ClaudeMessage } from "server/types/ai-types/anthropic/claude";
import {
  AiRequestBody,
  StandardAiResponse,
} from "server/types/ai-types/common";

export function parseClaudeResponse(claudeResponse: any): StandardAiResponse {
  try {
    const textContent = claudeResponse.content[0].text;
    
    // Try to parse the content - handle potential double-encoding
    let parsedContent;
    try {
      parsedContent = JSON.parse(textContent);
      
      // If the result is a string, try parsing again (double-encoded case)
      if (typeof parsedContent === 'string') {
        parsedContent = JSON.parse(parsedContent);
      }
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      throw parseError;
    }

    return {
      aiMessage: parsedContent.aiMessage || "",
      htmlContent: parsedContent.htmlContent || "",
      isHtmlGenerated: parsedContent.isHtmlGenerated || false,
      isConversationComplete: parsedContent.isConversationComplete || false,
    };
  } catch (error) {
    console.error("Failed to parse Claude response:", error);

    return {
      aiMessage: "عذرًا، حدث خطأ في النظام.",
      htmlContent: "",
      isHtmlGenerated: false,
      isConversationComplete: false,
    };
  }
}

export async function handleAnthropicRequest(
  req: Request,
  res: Response,
  model: string,
) {
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

  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      temperature: ANTHROPIC_TEMPERATURE,
      system: HTML_ANTHROPIC_AI_SYSTEM_PROMPT,
      messages: messages,
    });

    const standardResponse = parseClaudeResponse(response);

    return res.status(200).json(standardResponse);
  } catch (error) {
    console.error("Error generating AI chat:", error);

    return res.status(500).json({ error: "AI generation failed" });
  }
}
