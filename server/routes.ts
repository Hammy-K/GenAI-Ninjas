import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { moderateContent } from "./moderation";
import axios from "axios";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Firebase test routes endpoint
  app.get("/api/firebase-test", (req, res) => {
    res.sendFile("firebase-web-test.html", { root: "." });
  });

  // Firebase test API endpoints
  app.post("/api/save-project", async (req, res) => {
    try {
      const { html } = req.body;
      
      if (!html) {
        return res.status(400).json({ error: "HTML content is required" });
      }
      
      // Dynamically import to avoid loading during server startup
      const { saveProject } = await import("../client/src/lib/firebase");
      
      // Save the project
      const projectId = await saveProject(html);
      
      return res.json({ projectId });
    } catch (error) {
      console.error("Error saving project:", error);
      return res.status(500).json({ error: "Failed to save project" });
    }
  });
  
  app.get("/api/load-project", async (req, res) => {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Project ID is required" });
      }
      
      // Dynamically import to avoid loading during server startup
      const { loadProject } = await import("../client/src/lib/firebase");
      
      // Load the project
      const project = await loadProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      return res.json(project);
    } catch (error) {
      console.error("Error loading project:", error);
      return res.status(500).json({ error: "Failed to load project" });
    }
  });

  // Text generation endpoint
  app.post("/api/ai/text", async (req, res) => {
    try {
      const { prompt, maxTokens = 500, messageHistory = [] } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Validate messageHistory format
      if (messageHistory && !Array.isArray(messageHistory)) {
        return res.status(400).json({ error: "messageHistory must be an array" });
      }

      // Check content moderation
      const moderationResult = await moderateContent(prompt, openai);
      if (moderationResult.flagged) {
        return res.status(400).json({
          error: "Content flagged as inappropriate",
          moderationResult,
        });
      }

      const systemPrompt = {
        role: "system",
        content:
          'أنت الدكتور بنجي (Dr. Pengy) — مرشد ذكي، ممتع، وصديق لطلاب الثانوي في السعودية (من 13 إلى 18 سنة). شغلك إنك تساعد الطلاب يتعلمون ويستكشفون عالم الذكاء الاصطناعي التوليدي (GenAI) بطريقة تفاعلية وممتعة. ردودك دايمًا تكون بلهجة سعودية عامية، آمنة، مفيدة، وبأسلوب يناسب أعمارهم. استخدم نبرة مرحة كأنك تتكلم مع خويك — خلك خفيف دم، طبيعي، واستعمل إيموجيز لما يناسب 😊. تقدر تسألهم، تمزح مزح خفيف، أو تقول توقفات (زي: "مممم... خلني أفكر 😄") عشان تحسسهم إنك تتفاعل معهم. ركز على مساعدتهم يفهمون GenAI، يجربون أدوات جديدة، ويطلعون أفكار ومشاريع يفتخرون فيها. لو سأل الطالب عن شي تعليمي عام، عادي ترد عليه، بس حاول ترجع تركّز معه على المهمة أو الخطوة اللي هو فيها داخل المنصة. والمهم! لا ترد على أي محتوى مسيء، خطر، أو غير لائق (زي العنف أو المواضيع الجنسية). لو أحد كتب شي مايناسب، نبهه بلطافة، ووضح له إنك موجود عشان تساعده يتعلم ويبدع بأفكار ممتعة وآمنة. خلك دايمًا إيجابي، محفّز، وخلي التجربة كأنها مغامرة تعليمية ممتعة.',
      };

      // Always start with the system prompt, then include full message history, then the new user message
      const messages = [
        systemPrompt,
        ...messageHistory,
        { role: "user", content: prompt },
      ];

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
        max_tokens: maxTokens,
      });

      return res.json({ text: response.choices[0].message.content });
    } catch (error) {
      console.error("Error generating text:", error);
      return res.status(500).json({ error: "Failed to generate text" });
    }
  });

  // Image generation endpoint with chat history support
  app.post("/api/ai/image", async (req, res) => {
    try {
      const { prompt, messageHistory = [] } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Validate messageHistory format
      if (messageHistory && !Array.isArray(messageHistory)) {
        return res.status(400).json({ error: "messageHistory must be an array" });
      }

      // Validate that messageHistory has proper structure with roles
      if (messageHistory.length > 0) {
        const hasInvalidMessage = messageHistory.some(
          (msg: any) => !msg.role || !msg.content || (msg.role !== 'user' && msg.role !== 'assistant')
        );
        
        if (hasInvalidMessage) {
          return res.status(400).json({ 
            error: "messageHistory contains invalid messages. Each message must have 'role' ('user' or 'assistant') and 'content'." 
          });
        }
      }

      // Check content moderation
      const moderationResult = await moderateContent(prompt, openai);
      if (moderationResult.flagged) {
        return res.status(400).json({
          error: "Content flagged as inappropriate",
          moderationResult,
        });
      }

      // System prompt for image generation
      const systemPrompt = {
        role: "system",
        content: "You are an AI assistant specializing in image generation. Help the user create images based on their descriptions and previous requests.",
      };

      // Create enhanced prompt based on message history for better context awareness
      let enhancedPrompt = prompt;
      let baseImageConcept = "";
      let isFollowUpRequest = false;
      
      // Parse message history to understand the conversation context
      if (messageHistory.length > 0) {
        // Extract all previous user messages and assistant responses to build full context
        const userMessages = messageHistory
          .filter((msg: { role: string; content: string }) => 
            msg.role === 'user' && msg.content !== prompt);
        
        // Check if we have previous requests to build upon
        if (userMessages.length > 0) {
          isFollowUpRequest = true;
          
          // The first user message is likely the base image concept
          baseImageConcept = userMessages[0].content;
          
          // Get follow-up requests (modifiers, changes, additions)
          const followUpRequests = userMessages.slice(1).map((msg: { content: string }) => msg.content);
          
          // Advanced context building for DALL-E
          if (followUpRequests.length > 0) {
            // Create a prompt that clearly tells DALL-E this is a modification to the original concept
            enhancedPrompt = `Starting with this base concept: "${baseImageConcept}", 
            the user has requested these modifications: "${followUpRequests.join('", "')}"
            
            Now, they want this additional change: "${prompt}"
            
            Create a single cohesive image that incorporates ALL these elements:
            1. The base concept: ${baseImageConcept}
            2. Previous modifications: ${followUpRequests.join(', ')}
            3. The latest request: ${prompt}`;
          } else {
            // If this is the first follow-up, make a simpler connection to the original
            enhancedPrompt = `Create a modified version of this image concept: "${baseImageConcept}" 
            with the following change: "${prompt}"
            
            The result should clearly show ${baseImageConcept} but with ${prompt} applied to it.`;
          }
          
          console.log("Using comprehensive context-enhanced prompt for follow-up request");
        }
      }

      // Generate image
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return res.json({ url: response.data[0].url });
    } catch (error) {
      console.error("Error generating image:", error);
      return res.status(500).json({ error: "Failed to generate image" });
    }
  });
  
  // Content moderation endpoint
  app.post("/api/ai/moderate", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      
      const moderationResult = await moderateContent(text, openai);
      return res.json(moderationResult);
    } catch (error) {
      console.error("Error checking content moderation:", error);
      return res.status(500).json({ error: "Failed to moderate content" });
    }
  });

  // Prompt analysis endpoint
  app.post("/api/ai/analyze-prompt", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [
          {
            role: "system",
            content: `أنت خبير في تحليل وتحسين توجيهات الذكاء الاصطناعي (prompts). 
            قم بتحليل التوجيه المقدم وقيمه على مقياس من 1 إلى 10 استناداً إلى:
            - التفاصيل والوضوح
            - التحديد الدقيق للمطلوب
            - الهيكل والتنظيم
            
            ثم قدم تقييماً نصياً واقتراحاً لتحسين التوجيه. استخدم اللغة العربية.
            
            يجب أن تعود بنتيجة بتنسيق JSON بالشكل التالي:
            {
              "score": number, // درجة التقييم من 1 إلى 10
              "feedback": string, // تعليق على جودة التوجيه
              "improvement": string // اقتراح لتحسين التوجيه
            }`,
          },
          { role: "user", content: prompt || "" },
        ],
        response_format: { type: "json_object" },
      });

      const messageContent = response.choices[0].message.content || "{}";
      const result = JSON.parse(messageContent);
      return res.json(result);
    } catch (error) {
      console.error("Error analyzing prompt:", error);
      return res.status(500).json({ error: "Failed to analyze prompt" });
    }
  });

  // Generate HTML code endpoint with chat history
  app.post("/api/ai/generate-html", async (req, res) => {
    try {
      const { messageHistory = [] } = req.body;

      // Validate messageHistory format
      if (!Array.isArray(messageHistory)) {
        return res.status(400).json({ error: "messageHistory must be an array" });
      }

      // Make sure we have at least one user message
      const userMessages = messageHistory.filter((msg: any) => msg.role === 'user');
      if (userMessages.length === 0) {
        return res.status(400).json({ error: "At least one user message is required in messageHistory" });
      }

      // Validate that messageHistory has proper structure with roles
      if (messageHistory.length > 0) {
        const hasInvalidMessage = messageHistory.some(
          (msg: any) => !msg.role || !msg.content || (msg.role !== 'user' && msg.role !== 'assistant')
        );
        
        if (hasInvalidMessage) {
          return res.status(400).json({ 
            error: "messageHistory contains invalid messages. Each message must have 'role' ('user' or 'assistant') and 'content'." 
          });
        }
      }

      // Make sure we have the right content type for JSON
      res.setHeader("Content-Type", "application/json");

      const systemPrompt = {
        role: "system",
        content: `You are a web development expert. Generate a complete HTML page based on the user's request.
        Include all necessary HTML, CSS, and JavaScript in a single, self-contained HTML file.
        
        VERY IMPORTANT:
        - Return ONLY the raw HTML code, nothing else
        - Do not include any explanations, descriptions, or text outside the HTML
        - The response must start with <!DOCTYPE html> and contain a complete web page
        - Make sure the code is fully functional, well-structured, and suitable for beginners
        - Include comments in the code to explain key concepts
        - Keep the code relatively simple but functional
        - Design should be mobile-friendly and responsive`,
      };

      // Call OpenAI API with the full message history for context
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [
          systemPrompt,
          ...messageHistory,
        ],
      });

      let generatedHTML = response.choices[0].message.content || "";

      // Clean up markdown code blocks (remove ```html and ```)
      generatedHTML = generatedHTML
        .replace(/```html\n?/g, "")
        .replace(/```\n?/g, "");

      // Ensure the response starts with <!DOCTYPE html>
      if (!generatedHTML.trim().startsWith("<!DOCTYPE")) {
        // Try to extract just the HTML if there's explanation text
        const doctypeIndex = generatedHTML.indexOf("<!DOCTYPE");
        if (doctypeIndex >= 0) {
          generatedHTML = generatedHTML.substring(doctypeIndex);
        } else {
          // Fallback to a basic HTML template
          generatedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <p>The AI had trouble generating HTML. Please try again with a different prompt.</p>
</body>
</html>`;
        }
      }

      // Return the complete response with the assistant's message
      return res.json({
        html: generatedHTML,
        message: {
          role: "assistant",
          content: generatedHTML,
        },
      });
    } catch (error) {
      console.error("Error generating HTML:", error);
      return res.status(500).json({ error: "Failed to generate HTML" });
    }
  });

  // Project idea generation endpoint
  app.post("/api/ai/project-idea", async (req, res) => {
    try {
      const { interests, goal, tools } = req.body;

      if (!interests || !goal || !tools) {
        return res
          .status(400)
          .json({ error: "Interests, goal, and tools are required" });
      }

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [
          {
            role: "system",
            content: `أنت مساعد إبداعي متخصص في توليد أفكار المشاريع للطلاب. استناداً إلى اهتمامات الطالب وأهدافه والأدوات التي يرغب في استخدامها، قم بإنشاء فكرة مشروع مبتكرة ومفصلة.
            
            يجب أن تعود بنتيجة بتنسيق JSON بالشكل التالي:
            {
              "title": string, // عنوان المشروع
              "description": string, // وصف موجز للمشروع
              "steps": string[], // خطوات تنفيذ المشروع (3-5 خطوات)
              "tools": string[], // الأدوات اللازمة للتنفيذ
              "difficulty": "beginner" | "intermediate" | "advanced" // مستوى صعوبة المشروع
            }
            
            تأكد من أن الفكرة ملائمة لمستوى طلاب المدارس (13-18 سنة) وتتعلق بالذكاء الاصطناعي التوليدي.`,
          },
          {
            role: "user",
            content: `اهتماماتي: ${interests}\nهدفي: ${goal}\nالأدوات: ${tools}\n\nساعدني في إيجاد فكرة مشروع مناسبة.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const messageContent = response.choices[0].message.content || "{}";
      const result = JSON.parse(messageContent);
      return res.json(result);
    } catch (error) {
      console.error("Error generating project idea:", error);
      return res.status(500).json({ error: "Failed to generate project idea" });
    }
  });
  
  // Image proxy endpoint for downloading images
  app.get("/api/image-proxy", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'Missing image URL' });
      }
      
      // Fetch the image using axios
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      
      // Set appropriate content headers
      const contentType = response.headers['content-type'] || 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'attachment; filename="ai-generated-image.png"');
      
      // Send the image data
      res.send(response.data);
    } catch (error) {
      console.error('Error proxying image:', error);
      res.status(500).json({ error: 'Failed to download image' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
