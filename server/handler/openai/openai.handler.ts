import { Request, Response } from "express";
import {
  openai,
  OPENAI_TEMPERATURE,
} from "server/config/ai-config/openai/openai.config";
import { isContentSafe } from "server/services/ai-moderation";
import { logStudentHtmlMessage } from "server/services/student-html-message";
import { HTML_OPENAI_AI_SYSTEM_PROMPT } from "server/templates/prompts/openai/openai.prompt";
import { AiRequestBody } from "server/types/ai-types/common";

export async function handleOpenAIRequest(
  req: Request,
  res: Response,
  model: string,
) {
  const { message, history, studentId }: AiRequestBody = req.body;

  if (!message || !Array.isArray(history)) {
    return res.status(400).json({ error: "Missing message or history" });
  }

  try {
    const isMessageSafe = await isContentSafe(message);

    if (!isMessageSafe) {
      return res.status(200).json({
        content: JSON.stringify({
          aiMessage: "عذرًا، لا يمكن استخدام هذا المحتوى.",
          htmlContent: "",
          isHtmlGenerated: false,
          isConversationComplete: false,
        }),
      });
    }

    logStudentHtmlMessage(studentId, message);

    const completion = await openai.chat.completions.create({
      model: model,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "html_ai_system_prompt",
          schema: {
            type: "object",
            properties: {
              aiMessage: {
                type: "string",
                description:
                  "Your friendly, Saudi-style message to the student.",
              },
              htmlContent: {
                type: "string",
                description: "Only include this if you're sending game code.",
              },
              isHtmlGenerated: {
                type: "boolean",
                description: "True if code is included, false otherwise.",
              },
              isConversationComplete: {
                type: "boolean",
                description: "True only if the student is finished.",
              },
            },
            required: [
              "aiMessage",
              "htmlContent",
              "isHtmlGenerated",
              "isConversationComplete",
            ],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      messages: [
        {
          role: "system",
          content: HTML_OPENAI_AI_SYSTEM_PROMPT,
        },
        ...history,
        { role: "user", content: message },
      ],
      temperature: OPENAI_TEMPERATURE,
    });

    const content = completion.choices[0].message.content;
    res.status(200).json({ content });
  } catch (error) {
    console.error("Error generating AI chat:", error);

    res.status(500).json({ error: "AI generation failed" });
  }
}
