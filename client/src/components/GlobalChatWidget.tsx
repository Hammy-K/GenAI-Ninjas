import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, AlertCircle, Send, Loader2 } from 'lucide-react';
import { generateHTML, HTMLMessage } from '@/lib/openai';
import { useQuest } from '@/hooks/useQuest';
import penguinAvatar from '@/assets/Group 26087843.png';

// Global conversation history - a single thread across the entire app
const globalConversation: HTMLMessage[] = [];

// Helper type for model and prompt configuration
interface ModelConfig {
  model: string;
  systemPrompt: string;
}

// Dr. Pengy's base personality that never changes
const BASE_PERSONALITY = 'أنا الدكتور بنجي (Dr. Pengy) — مساعد ذكي، خفيف دم، وصديق لطلاب الثانوي في السعودية (من 13 إلى 18 سنة). ردودي دايمًا آمنة، مفيدة، وبأسلوب يناسب أعمارهم. أستخدم نبرة مرحة وكأني أتكلم مع صديق — خفيف دم، طبيعي، وأستعمل إيموجيز لما يناسب بالطريقة اللي المراهقين يستخدموها😊. أحب أضيف لمستي بالتفاعل، ممكن أسأل أسئلة، أقول نكتة بسيطة، أو أوقف شوي (زي: "مممم... خليني أفكر 😄") عشان أحسس الطالب إني أفكر معه. مهم! ما أجاوب على أي محتوى مسيء، خطر، أو غير لائق (زي العنف أو المواضيع الجنسية). لو أحد كتب شيء غير مناسب، أنبهه بلطافة، وأوضح إني هنا عشان أساعده يتعلم ويبدع بأفكار ممتعة وآمنة. أنا دايمًا إيجابي، داعم، وأخلي الجلسة كأنها مغامرة تعليمية ممتعة.';

// Model and system prompt configurations for specific contexts
const CONTEXT_CONFIGS: Record<string, ModelConfig> = {
  // Default config for most contexts - GPT model with general assistance
  default: {
    model: 'gpt-4o',
    systemPrompt: `${BASE_PERSONALITY}

أنا أساعد الطلاب في رحلة تعلم الذكاء الاصطناعي التوليدي. أشجعهم على استكشاف المزيد من الذكاء الاصطناعي من خلال اقتراح:
- "جرب بناء مشروع جديد باستخدام الذكاء الاصطناعي"
- "هل تريد المساعدة في فهم كيفية عمل الذكاء الاصطناعي التوليدي؟"
- "ما رأيك بإكمال المهمة التالية في رحلتك التعليمية؟"

أنا دائماً أحاول توجيه الطالب نحو أهداف التعلم وأشجع على الإستكشاف والتجربة في مجال الذكاء الاصطناعي.`
  },
  
  // Image generation context - uses DALL-E model
  imageGeneration: {
    model: 'dall-e-3',
    systemPrompt: `${BASE_PERSONALITY}

أنا الآن أساعدك في مرحلة توليد الصور. أنا متخصص في مساعدة الطلاب على إنشاء مطالبات فعالة لتوليد الصور باستخدام الذكاء الاصطناعي. يمكنني تقديم نصائح حول:
- كيفية وصف العناصر البصرية بدقة (مثل الألوان، الأسلوب الفني، الإضاءة)
- كيفية تحديد التكوين والمنظور
- كيفية كتابة مطالبات تعطي نتائج أفضل مع نماذج توليد الصور

أفهم أنك تتعلم كيفية التعامل مع تقنيات توليد الصور، وسأقدم اقتراحات وتحسينات تناسب هذه المرحلة من رحلتك التعليمية.`
  },
  
  // Web building context - uses GPT model with web coding expertise
  webBuilder: {
    model: 'gpt-4o',
    systemPrompt: `${BASE_PERSONALITY}

أنا الآن أساعدك في مرحلة بناء تطبيقات الويب باستخدام HTML/CSS/JavaScript. يمكنني مساعدتك في:
- تحويل أفكارك إلى شيفرة برمجية فعالة
- حل المشكلات التي تواجهك في الترميز
- اقتراح تحسينات على مشروعك
- شرح المفاهيم البرمجية بطريقة بسيطة ومفهومة

سأقدم شيفرات برمجية واضحة ومنظمة، مع شروحات مفصلة للمبتدئين، وسأساعدك في بناء مشاريع تفاعلية ممتعة.`
  }
};

export function GlobalChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<HTMLMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { currentStage } = useQuest();
  const [location] = useLocation();
  
  // Get the current context based on location and stage
  const getCurrentContext = (): string => {
    // Detect the current location and stage
    if (location.includes('mission1')) {
      // Mission 1 stages
      if (currentStage === 2) return 'promptChallenge'; // Prompt engineering challenge stage
      if (currentStage === 3) return 'imageGeneration'; // Image generation stage
      if (currentStage === 4) return 'webBuilder';      // HTML/web builder stage
    } else if (location.includes('project')) {
      // On the shared project page
      return 'webBuilder';
    }
    
    // Default fallback
    return 'default';
  };
  
  const currentContext = getCurrentContext();
  const currentConfig = CONTEXT_CONFIGS[currentContext in CONTEXT_CONFIGS ? currentContext : 'default'];
  
  // Define welcome message
  const welcomeMessage: HTMLMessage = {
    role: 'assistant',
    content: `مرحبًا! أنا الدكتور بنجي، أستطيع مساعدتك في رحلة تعلم الذكاء الاصطناعي التوليدي.`
  };
  
  // Initialize global conversation with welcome message if empty
  useEffect(() => {
    if (globalConversation.length === 0) {
      globalConversation.push(welcomeMessage);
    }
    
    // Always use the global conversation
    setMessages(globalConversation);
    
  }, []);
  
  // Scroll to bottom of chat when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Toggle the chat widget
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || isLoading) return;
    
    // Add user message
    const userMessage: HTMLMessage = {
      role: 'user',
      content: prompt
    };
    
    // Add to global conversation
    globalConversation.push(userMessage);
    
    // Update state with the new user message
    setMessages([...globalConversation]);
    setPrompt('');
    setIsLoading(true);
    setError('');
    
    try {
      // Use appropriate API based on the current context
      if (currentContext === 'webBuilder') {
        // Use the HTML generator API for web builder context
        const htmlResponse = await generateHTML(globalConversation);
        
        if (htmlResponse.error) {
          throw new Error(htmlResponse.error);
        }
        
        // Add the assistant's response to messages
        globalConversation.push(htmlResponse.message);
        setMessages([...globalConversation]);
      } else {
        // For other contexts, use the standard text generation API
        const apiResponse = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: currentConfig.systemPrompt },
              ...globalConversation.map(m => ({
                role: m.role,
                content: m.content
              }))
            ],
            model: currentConfig.model
          })
        });
        
        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || 'Failed to get response');
        }
        
        const data = await apiResponse.json();
        
        // Create assistant message
        const assistantMessage: HTMLMessage = {
          role: 'assistant',
          content: data.content
        };
        
        // Add the assistant's response to global conversation
        globalConversation.push(assistantMessage);
        setMessages([...globalConversation]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      
      // Remove the user's message in case of error to allow them to try again
      globalConversation.pop();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle key press in input field
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col transition-all duration-500 ease-in-out" dir="rtl">
      {/* Chat Widget Button (When Closed) */}
      {!isOpen && (
        <Button 
          onClick={toggleChat}
          size="icon" 
          className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center p-0 overflow-hidden"
        >
          <img 
            src={penguinAvatar} 
            alt="Dr. Pengy" 
            className="w-16 h-16 object-cover"
          />
        </Button>
      )}
      
      {/* Chat Widget Panel (When Open) */}
      {isOpen && (
        <div className="flex flex-col w-80 sm:w-96 h-[500px] bg-white border rounded-md shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={penguinAvatar} 
                alt="Dr. Pengy" 
                className="h-6 w-6 rounded-full mr-2"
              />
              <span className="font-medium text-sm">Dr. Pengy</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Chat Messages */}
          <ScrollArea className="flex-grow p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                <p>What would you like to build?</p>
                <p className="text-xs mt-2">Examples:</p>
                <ul className="text-xs mt-1 space-y-1">
                  <li>"A calculator with dark theme"</li>
                  <li>"A todo list with local storage"</li>
                  <li>"A color picker tool"</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-6'
                        : 'bg-amber-50 border border-amber-100 mr-6'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {msg.role === 'user' ? (
                        <div className="font-medium text-xs">You</div>
                      ) : (
                        <div className="flex items-center">
                          <img 
                            src={penguinAvatar} 
                            alt="Dr. Pengy" 
                            className="h-5 w-5 rounded-full mr-1.5"
                          />
                          <div className="font-medium text-xs">Dr. Pengy</div>
                        </div>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-xs">
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mr-6">
                    <div className="flex items-center mb-2">
                      <img 
                        src={penguinAvatar} 
                        alt="Dr. Pengy" 
                        className="h-5 w-5 rounded-full mr-1.5"
                      />
                      <div className="font-medium text-xs">Dr. Pengy</div>
                    </div>
                    <div className="flex items-center text-xs">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Generating...
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t p-3">
            {error && (
              <Alert variant="destructive" className="mb-3 py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertTitle className="text-xs">Error</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Dr. Pengy..."
                className="min-h-10 resize-none"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={!prompt.trim() || isLoading}
                size="icon"
                className="h-10 w-10 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}