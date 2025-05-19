import { Router, Request, Response } from "express";
import OpenAI from "openai";

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
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that answers user questions about anything. answer in arabic and a saudi engaging and friendly dialect",
          },
          ...history,
          { role: "user", content: message },
        ],
        temperature: 0.5,
      });

      const content = completion.choices[0].message.content;
      res.status(200).json({ content });
    } catch (error) {
      console.error("Error generating AI chat:", error);
      res.status(500).json({ error: "AI generation failed" });
    }
  });

  router.use("/html-ai", htmlAiRoutes);
}
