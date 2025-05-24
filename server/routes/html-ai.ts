import { Router, Request, Response } from "express";
// import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { isContentSafe } from "server/services/ai-moderation";
import { logStudentHtmlMessage } from "server/services/student-html-message";
import { HTML_AI_SYSTEM_PROMPT } from "server/templates/html-ai-prompt";
import { AiResponse } from "server/types/html-ai-response";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// const GPT_MODEL = "gpt-4.1-mini"; // or "gpt-3.5-turbo" if you're cost-conscious
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export function registerHtmlAiRoute(router: Router) {
  const htmlAiRoutes = Router();

  htmlAiRoutes.post("/", async (req: Request, res: Response) => {
    const { message, history, studentId } = req.body;

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

      // OpenAI completion (commented out)
      // const completion = await openai.chat.completions.create({
      //   model: GPT_MODEL,
      //   response_format: {
      //     type: "json_schema",
      //     json_schema: {
      //       name: "html_ai_system_prompt",
      //       schema: {
      //         type: "object",
      //         properties: {
      //           aiMessage: {
      //             type: "string",
      //             description:
      //               "Your friendly, Saudi-style message to the student.",
      //           },
      //           htmlContent: {
      //             type: "string",
      //             description: "Only include this if you're sending game code.",
      //           },
      //           isHtmlGenerated: {
      //             type: "boolean",
      //             description: "True if code is included, false otherwise.",
      //           },
      //           isConversationComplete: {
      //             type: "boolean",
      //             description: "True only if the student is finished.",
      //           },
      //         },
      //         required: [
      //           "aiMessage",
      //           "htmlContent",
      //           "isHtmlGenerated",
      //           "isConversationComplete",
      //         ],
      //         additionalProperties: false,
      //       },
      //       strict: true,
      //     },
      //   },
      //   messages: [
      //     {
      //       role: "system",
      //       content: HTML_AI_SYSTEM_PROMPT,
      //     },
      //     ...history,
      //     { role: "user", content: message },
      //   ],
      //   temperature: 0.1,
      // });

      // Convert history to Claude format
      const claudeMessages = history.map((msg: any) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      // Add current message
      claudeMessages.push({ role: "user", content: message });

      // Claude completion
      const completion = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        temperature: 0.1,
        system: `${HTML_AI_SYSTEM_PROMPT}

Please respond with a valid JSON object that matches this exact structure:
{
  "aiMessage": "Your friendly, Saudi-style message to the student.",
  "htmlContent": "Only include this if you're sending game code.",
  "isHtmlGenerated": true or false (true if code is included, false otherwise),
  "isConversationComplete": true or false (true only if the student is finished)
}

Make sure your response is valid JSON and includes all four required fields.`,
        messages: claudeMessages,
      });

      const content =
        completion.content[0].type === "text" ? completion.content[0].text : "";

      // const content = completion.choices[0].message.content;
      res.status(200).json({ content });
    } catch (error) {
      console.error("Error generating AI chat:", error);
      res.status(500).json({ error: "AI generation failed" });
    }
  });

  router.use("/html-ai", htmlAiRoutes);
}
