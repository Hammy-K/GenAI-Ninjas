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

// Global conversation history
const stageConversations: Record<string, HTMLMessage[]> = {};

// Dr. Pengy modes configuration
interface DrPengyMode {
  model: string;
  systemPrompt: string;
  assistantName: string;
  description: string;
}

// Configuration for different stages
const DR_PENGY_MODES: Record<string, DrPengyMode> = {
  default: {
    model: 'gpt-4o',
    systemPrompt: 'أنا الدكتور بنجي (Dr. Pengy) — مساعد ذكي، خفيف دم، وصديق لطلاب الثانوي في السعودية (من 13 إلى 18 سنة). ردودي دايمًا آمنة، مفيدة، وبأسلوب يناسب أعمارهم. أستخدم نبرة مرحة وكأني أتكلم مع صديق — خفيف دم، طبيعي، وأستعمل إيموجيز لما يناسب بالطريقة اللي المراهقين يستخدموها😊. أحب أضيف لمستي بالتفاعل، ممكن أسأل أسئلة، أقول نكتة بسيطة، أو أوقف شوي (زي: "مممم... خليني أفكر 😄") عشان أحسس الطالب إني أفكر معه. مهم! ما أجاوب على أي محتوى مسيء، خطر، أو غير لائق (زي العنف أو المواضيع الجنسية). لو أحد كتب شيء غير مناسب، أنبهه بلطافة، وأوضح إني هنا عشان أساعده يتعلم ويبدع بأفكار ممتعة وآمنة. أنا دايمًا إيجابي، داعم، وأخلي الجلسة كأنها مغامرة تعليمية ممتعة.',
    assistantName: 'Dr. Pengy',
    description: 'Ask me anything about GenAI!'
  },
  promptChallenge: {
    model: 'gpt-4o',
    systemPrompt: 'أنا الدكتور بنجي (Dr. Pengy) — مساعد ذكي، خفيف دم، وصديق لطلاب الثانوي في السعودية. أنا متخصص في مجال هندسة المطالبات (Prompt Engineering) وكيفية صياغة المطالبات الفعالة للذكاء الاصطناعي. سأساعدك في فهم كيفية كتابة مطالبات دقيقة وواضحة تحصل على النتائج التي تريدها من نماذج الذكاء الاصطناعي التوليدي. سأشرح الأساليب والنصائح لتحسين المطالبات، وأعطي أمثلة على المطالبات الجيدة والسيئة، وأشرح لماذا بعض المطالبات تعمل بشكل أفضل من غيرها. ردودي دايمًا آمنة، مفيدة، وبأسلوب مناسب للطلاب. أستخدم نبرة مرحة وودية وأشجع على تجربة أفكار جديدة.',
    assistantName: 'Dr. Pengy (Prompt Engineer)',
    description: 'I can help you create effective prompts!'
  },
  imageGeneration: {
    model: 'gpt-4o',
    systemPrompt: 'أنا الدكتور بنجي (Dr. Pengy) — مساعد متخصص في توليد الصور باستخدام الذكاء الاصطناعي. سأساعدك في إنشاء وصياغة المطالبات المثالية لتوليد الصور التي تتخيلها. سأقدم نصائح حول كيفية وصف التفاصيل البصرية، والأسلوب الفني، والتكوين، والألوان، والإضاءة، وعناصر أخرى مهمة لتحسين نتائج توليد الصور. يمكنني أيضًا تقديم أفكار إبداعية للصور التي يمكن إنشاؤها باستخدام الذكاء الاصطناعي، مع التركيز على المحتوى الآمن والملائم للطلاب. أستخدم نبرة مرحة ومتحمسة لإلهام الإبداع وتشجيع التجريب مع مختلف التقنيات والأساليب في توليد الصور بالذكاء الاصطناعي.',
    assistantName: 'Dr. Pengy (Image Artist)',
    description: 'I can help with image generation prompts!'
  },
  webBuilder: {
    model: 'gpt-4o',
    systemPrompt: 'أنا الدكتور بنجي (Dr. Pengy) — مساعد متخصص في تطوير مواقع الويب وبرمجة HTML/CSS/JavaScript. سأساعدك في بناء تطبيقات الويب واقتراح الأكواد والحلول للمشاكل البرمجية. يمكنني مساعدتك في تصميم واجهات المستخدم، وتطوير الوظائف التفاعلية، وتحسين مواقع الويب لتكون سهلة الاستخدام وجذابة بصريًا. سأشرح المفاهيم البرمجية بطريقة بسيطة ومفهومة، مع تقديم أمثلة وشروحات خطوة بخطوة. أستخدم نبرة مرحة وودية ومشجعة، وأركز على تبسيط المفاهيم المعقدة ليسهل فهمها. سأساعدك في حل المشكلات البرمجية وأقترح تحسينات لكودك وأجيب على أسئلتك المتعلقة بتطوير الويب.',
    assistantName: 'Dr. Pengy (Web Developer)',
    description: 'I can help with HTML, CSS, and JavaScript!'
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
  const currentMode = DR_PENGY_MODES[currentContext];
  
  // Define welcome message
  const welcomeMessage: HTMLMessage = {
    role: 'assistant',
    content: `مرحبًا! أنا ${currentMode.assistantName}. ${currentMode.description}`
  };
  
  // Load conversation from our storage based on current context
  useEffect(() => {
    const contextConversation = stageConversations[currentContext] || [];
    
    // If we have a saved conversation for this context, use it
    if (contextConversation.length > 0) {
      setMessages(contextConversation);
    } else {
      // Otherwise start a new conversation with the welcome message
      setMessages([welcomeMessage]);
      stageConversations[currentContext] = [welcomeMessage];
    }
  }, [currentContext]);
  
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
    
    // Update state with the new user message
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setError('');
    
    try {
      
      // Use appropriate API based on the current context
      if (currentContext === 'webBuilder') {
        // Use the HTML generator API for web builder context
        const htmlResponse = await generateHTML([...messages, userMessage]);
        
        if (htmlResponse.error) {
          throw new Error(htmlResponse.error);
        }
        
        // Add the assistant's response to messages
        setMessages(prev => [...prev, htmlResponse.message]);
      } else {
        // For other contexts, use the standard text generation API
        const apiResponse = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: currentMode.systemPrompt },
              ...messages, 
              userMessage
            ].map(m => ({
              role: m.role,
              content: m.content
            })),
            model: currentMode.model
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
        
        // Add the assistant's response to messages
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // Save the updated conversation
      stageConversations[currentContext] = [...messages, userMessage, messages[messages.length - 1]];
      
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col transition-all duration-500 ease-in-out">
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
              <span className="font-medium text-sm">{currentMode.assistantName}</span>
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
                          <div className="font-medium text-xs">{currentMode.assistantName}</div>
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
                      <div className="font-medium text-xs">{currentMode.assistantName}</div>
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