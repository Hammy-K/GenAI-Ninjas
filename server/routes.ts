import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { moderateContent } from "./moderation";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";
const IMAGE_MODEL = "dall-e-3";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Text generation endpoint
  app.post('/api/ai/text', async (req, res) => {
    try {
      const { prompt, maxTokens = 500 } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      const { prompt, maxTokens = 500, messageHistory = [] } = req.body;
      
      // Check content moderation
      const moderationResult = await moderateContent(prompt, openai);
      if (moderationResult.flagged) {
        return res.status(400).json({ 
          error: 'Content flagged as inappropriate',
          moderationResult 
        });
      }
      
      const messages = [
        { role: "system", content: "أنت مساعد ذكي للطلاب السعوديين الذين يتعلمون عن الذكاء الاصطناعي التوليدي. قدم إجابات واضحة ومفيدة باللغة العربية." },
        ...messageHistory,
        { role: "user", content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
        max_tokens: maxTokens
      });
      
      return res.json({ text: response.choices[0].message.content });
    } catch (error) {
      console.error('Error generating text:', error);
      return res.status(500).json({ error: 'Failed to generate text' });
    }
  });
  
  // Image generation endpoint
  app.post('/api/ai/image', async (req, res) => {
    try {
      const { prompt, size = "1024x1024", quality = "standard" } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      const response = await openai.images.generate({
        model: IMAGE_MODEL,
        prompt,
        n: 1,
        size,
        quality
      });
      
      return res.json({ url: response.data[0].url });
    } catch (error) {
      console.error('Error generating image:', error);
      return res.status(500).json({ error: 'Failed to generate image' });
    }
  });
  
  // Prompt analysis endpoint
  app.post('/api/ai/analyze-prompt', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
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
            }`
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      return res.json(result);
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      return res.status(500).json({ error: 'Failed to analyze prompt' });
    }
  });
  
  // Project idea generation endpoint
  app.post('/api/ai/project-idea', async (req, res) => {
    try {
      const { interests, goal, tools } = req.body;
      
      if (!interests || !goal || !tools) {
        return res.status(400).json({ error: 'Interests, goal, and tools are required' });
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
            
            تأكد من أن الفكرة ملائمة لمستوى طلاب المدارس (13-18 سنة) وتتعلق بالذكاء الاصطناعي التوليدي.`
          },
          { 
            role: "user", 
            content: `اهتماماتي: ${interests}\nهدفي: ${goal}\nالأدوات: ${tools}\n\nساعدني في إيجاد فكرة مشروع مناسبة.` 
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      return res.json(result);
    } catch (error) {
      console.error('Error generating project idea:', error);
      return res.status(500).json({ error: 'Failed to generate project idea' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
