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
      const { prompt, maxTokens = 500, messageHistory = [] } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      // Check content moderation
      const moderationResult = await moderateContent(prompt, openai);
      if (moderationResult.flagged) {
        return res.status(400).json({ 
          error: 'Content flagged as inappropriate',
          moderationResult 
        });
      }
      
      const messages = [
        { role: "system", content: "أنت مرشد ذكي، ممتع، وصديق لطلاب الثانوي في السعودية (من 13 إلى 18 سنة). ردودك دايمًا تكون آمنة، مفيدة، وبأسلوب يناسب أعمارهم. استخدم نبرة مرحة وكأنك تتكلم مع صديق — خلك خفيف دم، طبيعي، واستعمل إيموجيز لما يناسب 😊. تقدر تستخدم أسئلة، نكت بسيطة، أو توقفات خفيفة (زي: \"مممم... خليني أفكر 😄\") عشان تحسس الطالب إنك تتفاعل معه. لكن! لا تجاوب على أي محتوى مسيء، خطر، أو غير لائق (زي العنف أو المواضيع الجنسية). إذا أحد كتب شيء غير مناسب، نبهه بلطافة، ووضح إنك هنا عشان تساعده يتعلم ويبدع بأفكار ممتعة وآمنة. خلك دايمًا إيجابي، داعم، وخلي الجلسة كأنها مغامرة تعليمية ممتعة." },
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
  
  // Image generation endpoint with content moderation
  app.post('/api/ai/image', async (req, res) => {
    try {
      const { prompt, size = "1024x1024", quality = "standard" } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      // Check content moderation before generating image
      const moderationResult = await moderateContent(prompt, openai);
      if (moderationResult.flagged) {
        return res.status(400).json({ 
          error: 'Content flagged as inappropriate',
          moderationResult,
          message: 'Oops! Your prompt contains content that isn\'t suitable for our friendly learning environment. Please try a different, more appropriate description.'
        });
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
      
      // Handle specific OpenAI API errors with user-friendly messages
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          return res.status(429).json({ 
            error: 'API quota exceeded. Please try again later.',
            message: 'Looks like our creative robot needs a short break! Please try again in a few moments.'
          });
        } else if (error.status === 400) {
          return res.status(400).json({ 
            error: 'Invalid request',
            message: 'Hmm, that prompt might contain something our image generator can\'t work with. Try simplifying or rewording your description.'
          });
        }
      }
      
      return res.status(500).json({ 
        error: 'Failed to generate image',
        message: 'Something went wrong with our magical image creator. Please try again!'
      });
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
          { role: "user", content: prompt || "" }
        ],
        response_format: { type: "json_object" }
      });
      
      const messageContent = response.choices[0].message.content || "{}";
      const result = JSON.parse(messageContent);
      return res.json(result);
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      return res.status(500).json({ error: 'Failed to analyze prompt' });
    }
  });
  
  // Generate Code endpoint
  app.post('/api/ai/generate-code', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      // For testing purposes, return a mock response
      if (process.env.NODE_ENV === 'development') {
        // Create a simple mock response based on the prompt
        const mockResponse = {
          html: `<!-- ${prompt} -->
<div class="calculator">
  <div class="display" id="display">0</div>
  <div class="buttons">
    <button class="btn" onclick="clearDisplay()">C</button>
    <button class="btn" onclick="appendToDisplay('7')">7</button>
    <button class="btn" onclick="appendToDisplay('8')">8</button>
    <button class="btn" onclick="appendToDisplay('9')">9</button>
    <button class="btn operator" onclick="setOperator('+')">+</button>
    <button class="btn" onclick="appendToDisplay('4')">4</button>
    <button class="btn" onclick="appendToDisplay('5')">5</button>
    <button class="btn" onclick="appendToDisplay('6')">6</button>
    <button class="btn operator" onclick="setOperator('-')">-</button>
    <button class="btn" onclick="appendToDisplay('1')">1</button>
    <button class="btn" onclick="appendToDisplay('2')">2</button>
    <button class="btn" onclick="appendToDisplay('3')">3</button>
    <button class="btn operator" onclick="setOperator('*')">×</button>
    <button class="btn" onclick="appendToDisplay('0')">0</button>
    <button class="btn" onclick="appendToDisplay('.')">.</button>
    <button class="btn equals" onclick="calculate()">=</button>
    <button class="btn operator" onclick="setOperator('/')">÷</button>
  </div>
</div>`,
          css: `.calculator {
  max-width: 300px;
  margin: 0 auto;
  background-color: #f0f0f0;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.display {
  background-color: #fff;
  padding: 15px;
  font-size: 24px;
  text-align: right;
  margin-bottom: 15px;
  border-radius: 5px;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.1);
  overflow: hidden;
  height: 50px;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.btn {
  padding: 15px;
  font-size: 18px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #e0e0e0;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #d0d0d0;
}

.operator {
  background-color: #ffa500;
  color: white;
}

.operator:hover {
  background-color: #ff8c00;
}

.equals {
  background-color: #4caf50;
  color: white;
}

.equals:hover {
  background-color: #388e3c;
}`,
          js: `// Variables to store the calculator state
let displayValue = '0';
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;

// Function to update the display
function updateDisplay() {
  document.getElementById('display').textContent = displayValue;
}

// Function to append a number to the display
function appendToDisplay(digit) {
  if (waitingForSecondOperand) {
    displayValue = digit;
    waitingForSecondOperand = false;
  } else {
    // Replace 0 with the new digit, otherwise append
    displayValue = displayValue === '0' ? digit : displayValue + digit;
  }
  updateDisplay();
}

// Function to set the operator
function setOperator(nextOperator) {
  // Store the first operand if not already stored
  if (firstOperand === null) {
    firstOperand = parseFloat(displayValue);
  } else if (operator) {
    // If we already have an operator, perform the calculation
    const result = calculate();
    displayValue = String(result);
    firstOperand = result;
  }
  
  // Set the new operator and waiting state
  operator = nextOperator;
  waitingForSecondOperand = true;
  updateDisplay();
}

// Function to perform the calculation
function calculate() {
  if (operator === null || waitingForSecondOperand) {
    return parseFloat(displayValue);
  }
  
  const secondOperand = parseFloat(displayValue);
  let result = 0;
  
  switch (operator) {
    case '+':
      result = firstOperand + secondOperand;
      break;
    case '-':
      result = firstOperand - secondOperand;
      break;
    case '*':
      result = firstOperand * secondOperand;
      break;
    case '/':
      result = firstOperand / secondOperand;
      break;
  }
  
  // Reset the calculator state
  operator = null;
  firstOperand = null;
  waitingForSecondOperand = true;
  displayValue = String(result);
  updateDisplay();
  return result;
}

// Function to clear the display
function clearDisplay() {
  displayValue = '0';
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
  updateDisplay();
}

// Initialize the display
updateDisplay();`,
          description: `I've created a simple calculator for you based on your request. This calculator includes:

1. A clean, modern design with a display at the top and buttons below
2. Basic arithmetic operations: addition, subtraction, multiplication, and division
3. Support for decimal numbers
4. A clear button to reset the calculator

The code is structured with:
- HTML for the calculator layout and buttons
- CSS for styling and visual effects
- JavaScript for the calculator's functionality and logic

You can perform calculations by clicking the number buttons, selecting an operation, entering another number, and pressing equals.`
        };
        
        // Ensure the content type is set to application/json
        res.setHeader('Content-Type', 'application/json');
        return res.json(mockResponse);
      }
      
      // If not in development, use the real OpenAI API
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [
          { 
            role: "system", 
            content: `You are a web development expert. Generate HTML, CSS, and JavaScript code based on the user's request.
            Return the code in a JSON object with the following structure:
            {
              "html": "HTML code here",
              "css": "CSS code here",
              "js": "JavaScript code here",
              "description": "Brief explanation of what you created"
            }
            
            Make sure the code is fully functional, well-structured, and suitable for beginners to understand.
            Include comments in the code to explain key concepts.
            Don't include <html>, <head>, or <body> tags as they will be added automatically.
            Keep the code relatively simple but functional.` 
          },
          { role: "user", content: prompt || "" }
        ],
        response_format: { type: "json_object" }
      });
      
      const messageContent = response.choices[0].message.content || "{}";
      const result = JSON.parse(messageContent);
      
      // Ensure the content type is set to application/json
      res.setHeader('Content-Type', 'application/json');
      return res.json(result);
    } catch (error) {
      console.error('Error generating code:', error);
      return res.status(500).json({ error: 'Failed to generate code' });
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
      
      const messageContent = response.choices[0].message.content || "{}";
      const result = JSON.parse(messageContent);
      return res.json(result);
    } catch (error) {
      console.error('Error generating project idea:', error);
      return res.status(500).json({ error: 'Failed to generate project idea' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
