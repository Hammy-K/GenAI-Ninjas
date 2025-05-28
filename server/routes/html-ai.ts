import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { isContentSafe } from "server/services/ai-moderation";
import { logStudentHtmlMessage } from "server/services/student-html-message";
import { HTML_AI_SYSTEM_PROMPT } from "server/templates/html-ai-prompt";
import { AiResponse } from "server/types/html-ai-response";
import { HTML_CLAUDE_AI_SYSTEM_PROMPT } from "server/templates/html-claude-ai-prompt";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

type ClaudeMessage = {
  role: "assistant" | "user";
  content: string;
};

type StandardAiResponse = {
  aiMessage: string;
  htmlContent: string;
  isHtmlGenerated: boolean;
  isConversationComplete: boolean;
};

function parseClaudeResponse(claudeResponse: any): StandardAiResponse {
  try {
    const textContent = claudeResponse.content[0].text;

    console.log("#################################");
    console.log("Claude Response:", textContent);
    console.log("#################################");

    const parsedContent = JSON.parse(textContent);

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

export function registerHtmlAiRoute(router: Router) {
  const htmlAiRoutes = Router();

  htmlAiRoutes.post("/", async (req: Request, res: Response) => {
    const { message, history, studentId } = req.body;

    if (!message || !Array.isArray(history)) {
      return res.status(400).json({ error: "Missing message or history" });
    }

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

    const messages: ClaudeMessage[] = [
      {
        role: "assistant",
        content: HTML_CLAUDE_AI_SYSTEM_PROMPT,
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
      content: `
                Reminder: Please reply using only the following valid JSON format:
                {
                  "aiMessage": "Your friendly, Saudi-style message to the student in Arabic",
                  "htmlContent": "Complete HTML game code (only when generating/editing code, otherwise empty string)",
                  "isHtmlGenerated": true/false (true only when htmlContent contains code),
                  "isConversationComplete": true/false (true only when student explicitly says they're done)
                }
      `.trim(),
    });

    try {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        temperature: 0.1,
        system: HTML_CLAUDE_AI_SYSTEM_PROMPT,
        messages: messages,
      });

      const standardResponse = parseClaudeResponse(response);

      console.log("####################################");
      console.log("Standard Response:", standardResponse);
      console.log("####################################");

      return res.status(200).json({
        content: JSON.stringify(standardResponse),
      });
    } catch (error) {
      console.error("Error generating AI chat:", error);

      return res.status(500).json({ error: "AI generation failed" });
    }
  });

  router.use("/html-ai", htmlAiRoutes);
}

// import { Router, Request, Response } from "express";
// import Anthropic from "@anthropic-ai/sdk";
// import { isContentSafe } from "server/services/ai-moderation";
// import { logStudentHtmlMessage } from "server/services/student-html-message";
// import { HTML_AI_SYSTEM_PROMPT } from "server/templates/html-ai-prompt";
// import { AiResponse } from "server/types/html-ai-response";

// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// export function registerHtmlAiRoute(router: Router) {
//   const htmlAiRoutes = Router();

//   htmlAiRoutes.post("/", async (req: Request, res: Response) => {
//     const { message, history, studentId } = req.body;

//     if (!message || !Array.isArray(history)) {
//       return res.status(400).json({ error: "Missing message or history" });
//     }

//     try {
//       const isMessageSafe = await isContentSafe(message);
//       if (!isMessageSafe) {
//         return res.status(200).json({
//           content: JSON.stringify({
//             aiMessage: "عذرًا، لا يمكن استخدام هذا المحتوى.",
//             htmlContent: "",
//             isHtmlGenerated: false,
//             isConversationComplete: false,
//           }),
//         });
//       }

//       logStudentHtmlMessage(studentId, message);

//       // Convert history to Claude format
//       const claudeMessages = history.map((msg: any) => ({
//         role: msg.role === "assistant" ? "assistant" : "user",
//         content:
//           msg.role === "assistant" ? msg.aiMessage || msg.content : msg.content,
//       }));

//       // Add the current message
//       claudeMessages.push({
//         role: "user",
//         content: message,
//       });

//       const completion = await anthropic.messages.create({
//         model: CLAUDE_MODEL,
//         max_tokens: 4000,
//         temperature: 0.1,
//         system: `${HTML_AI_SYSTEM_PROMPT}

//   IMPORTANT: You must respond with valid JSON only. Do not use markdown code blocks or any other formatting. Return raw JSON in this exact format:
//   {
//     "aiMessage": "Your friendly, Saudi-style message to the student.",
//     "htmlContent": "Only include this if you're sending game code.",
//     "isHtmlGenerated": boolean,
//     "isConversationComplete": boolean
//   }

//   Make sure your JSON is valid and properly escaped. Do not include any text before or after the JSON.`,
//         messages: claudeMessages,
//       });

//       const content = completion.content[0].text;

//       // Validate that the response is proper JSON
//       try {
//         JSON.parse(content);
//       } catch (parseError) {
//         console.error("Claude returned invalid JSON:", content);
//         return res
//           .status(500)
//           .json({ error: "AI returned invalid JSON format" });
//       }

//       res.status(200).json({ content });
//     } catch (error) {
//       console.error("Error generating AI chat:", error);
//       res.status(500).json({ error: "AI generation failed" });
//     }
//   });

//   router.use("/html-ai", htmlAiRoutes);
// }

// import { Router, Request, Response } from "express";
// import OpenAI from "openai";
// import { isContentSafe } from "server/services/ai-moderation";
// import { logStudentHtmlMessage } from "server/services/student-html-message";
// import { HTML_AI_SYSTEM_PROMPT } from "server/templates/html-ai-prompt";
// import { AiResponse } from "server/types/html-ai-response";
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const GPT_MODEL = "gpt-4.1-mini"; // or "gpt-3.5-turbo" if you're cost-conscious
// export function registerHtmlAiRoute(router: Router) {
//   const htmlAiRoutes = Router();
//   htmlAiRoutes.post("/", async (req: Request, res: Response) => {
//     const { message, history, studentId } = req.body;
//     if (!message || !Array.isArray(history)) {
//       return res.status(400).json({ error: "Missing message or history" });
//     }
//     try {
//       const isMessageSafe = await isContentSafe(message);
//       if (!isMessageSafe) {
//         return res.status(200).json({
//           content: JSON.stringify({
//             aiMessage: "عذرًا، لا يمكن استخدام هذا المحتوى.",
//             htmlContent: "",
//             isHtmlGenerated: false,
//             isConversationComplete: false,
//           }),
//         });
//       }
//       logStudentHtmlMessage(studentId, message);
//       const completion = await openai.chat.completions.create({
//         model: GPT_MODEL,
//         response_format: {
//           type: "json_schema",
//           json_schema: {
//             name: "html_ai_system_prompt",
//             schema: {
//               type: "object",
//               properties: {
//                 aiMessage: {
//                   type: "string",
//                   description:
//                     "Your friendly, Saudi-style message to the student.",
//                 },
//                 htmlContent: {
//                   type: "string",
//                   description: "Only include this if you're sending game code.",
//                 },
//                 isHtmlGenerated: {
//                   type: "boolean",
//                   description: "True if code is included, false otherwise.",
//                 },
//                 isConversationComplete: {
//                   type: "boolean",
//                   description: "True only if the student is finished.",
//                 },
//               },
//               required: [
//                 "aiMessage",
//                 "htmlContent",
//                 "isHtmlGenerated",
//                 "isConversationComplete",
//               ],
//               additionalProperties: false,
//             },
//             strict: true,
//           },
//         },
//         messages: [
//           {
//             role: "system",
//             content: HTML_AI_SYSTEM_PROMPT,
//           },
//           ...history,
//           { role: "user", content: message },
//         ],
//         temperature: 0.1,
//       });
//       const content = completion.choices[0].message.content;
//       res.status(200).json({ content });
//     } catch (error) {
//       console.error("Error generating AI chat:", error);
//       res.status(500).json({ error: "AI generation failed" });
//     }
//   });
//   router.use("/html-ai", htmlAiRoutes);
// }
