import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { HTML_AI_SYSTEM_PROMPT } from "server/templates/html-ai-prompt";
import { AiResponse } from "server/types/html-ai-response";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GPT_MODEL = "gpt-4o"; // or "gpt-3.5-turbo" if you're cost-conscious

export function registerHtmlAiRoute(router: Router) {
  const htmlAiRoutes = Router();

  htmlAiRoutes.post("/", async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (!message || !Array.isArray(history)) {
      return res.status(400).json({ error: "Missing message or history" });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: GPT_MODEL,
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
            content: HTML_AI_SYSTEM_PROMPT,
          },
          ...history,
          { role: "user", content: message },
        ],
        temperature: 0.5,
      });

      console.log("#############################");
      console.log("Response from AI API:", completion.choices[0].message);
      console.log("#############################");

      const content = completion.choices[0].message.content;
      res.status(200).json({ content });
    } catch (error) {
      console.error("Error generating AI chat:", error);
      res.status(500).json({ error: "AI generation failed" });
    }
  });

  router.use("/html-ai", htmlAiRoutes);
}
