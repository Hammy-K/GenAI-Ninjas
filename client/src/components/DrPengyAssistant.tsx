import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, AlertCircle, Send, Loader2 } from 'lucide-react';
import { useQuest } from '@/hooks/useQuest';
import { useLocation } from 'wouter';
import { chatWithDrPengy } from '@/lib/pengyApi';
import penguinAvatar from '@/assets/Group 26087843.png';

// Chat history message type
export interface DrPengyMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'loading' | 'error' | 'success';
}

// Dr. Pengy modes config based on different stages
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

// Conversation history stored per stage
const stageConversations: Record<string, DrPengyMessage[]> = {};

export function DrPengyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DrPengyMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { currentStage } = useQuest();
  const [location] = useLocation();
  
  // Get the current stage or page context
  const getCurrentContext = (): string => {
    // Extract from location or stage
    if (location.includes('mission1')) {
      if (currentStage === 2) return 'promptChallenge';
      if (currentStage === 3) return 'imageGeneration';
      if (currentStage === 4) return 'webBuilder';
    }
    return 'default';
  };
  
  const currentContext = getCurrentContext();
  const currentMode = DR_PENGY_MODES[currentContext];
  
  // Load conversation from our storage based on current context
  useEffect(() => {
    const contextConversation = stageConversations[currentContext] || [];
    setMessages(contextConversation);
    
    // If no conversation and it's the first load, add a welcome message
    if (contextConversation.length === 0) {
      const welcomeMessage: DrPengyMessage = {
        role: 'assistant',
        content: `مرحبًا! أنا ${currentMode.assistantName}. ${currentMode.description}`,
        timestamp: Date.now(),
        status: 'success'
      };
      
      setMessages([welcomeMessage]);
      stageConversations[currentContext] = [welcomeMessage];
    }
  }, [currentContext]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || isProcessing) return;
    
    // Add user message
    const userMessage: DrPengyMessage = {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    };
    
    // Add loading message from assistant
    const loadingMessage: DrPengyMessage = {
      role: 'assistant',
      content: 'جاري التفكير...',
      timestamp: Date.now(),
      status: 'loading'
    };
    
    // Update UI and clear input
    const updatedMessages = [...messages, userMessage, loadingMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsProcessing(true);
    setError('');
    
    // Scroll to the latest message
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    try {
      // Simulate API call with a delay - when we implement the real API, we'll remove this
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For the demo, just use a simulated response to avoid setting up the backend endpoint
      const simulatedResponse = {
        content: `مرحبًا! أنا سعيد بالمساعدة. 😊 ${userInput.includes('?') ? 'أحاول الإجابة على سؤالك بأفضل ما لدي.' : 'يمكنني مساعدتك في هذا الموضوع.'}`
      };
      
      // Replace loading message with response
      const assistantResponse: DrPengyMessage = {
        role: 'assistant',
        content: simulatedResponse.content,
        timestamp: Date.now(),
        status: 'success'
      };
      
      // Update messages, removing the loading message
      const finalMessages = [...messages, userMessage, assistantResponse];
      setMessages(finalMessages);
      
      // Save to context storage
      stageConversations[currentContext] = finalMessages;
      
      // Set processing to false
      setIsProcessing(false);
      
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
      
      // Update messages, replacing loading message with error
      const errorMessage: DrPengyMessage = {
        role: 'assistant',
        content: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.',
        timestamp: Date.now(),
        status: 'error'
      };
      
      const updatedMessages = [...messages, userMessage, errorMessage];
      setMessages(updatedMessages);
      stageConversations[currentContext] = updatedMessages;
      
      setIsProcessing(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Widget Button (When Closed) */}
      {!isOpen && (
        <Button 
          onClick={toggleWidget}
          className="rounded-full h-14 w-14 shadow-lg"
        >
          <img 
            src={penguinAvatar} 
            alt="Dr. Pengy" 
            className="w-8 h-8 object-cover"
          />
        </Button>
      )}
      
      {/* Chat Widget Panel (When Open) */}
      {isOpen && (
        <div className="flex flex-col w-80 h-96 bg-white border rounded-md shadow-xl overflow-hidden">
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
              onClick={toggleWidget}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Chat Messages */}
          <ScrollArea className="flex-grow p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                <p>مرحبًا! كيف يمكنني مساعدتك اليوم؟</p>
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
                        <div className="font-medium text-xs">أنت</div>
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
                      {msg.status === 'loading' ? (
                        <div className="flex items-center">
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          {msg.content}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
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
            
            <div className="flex gap-2">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك هنا..."
                className="min-h-10 resize-none"
                disabled={isProcessing}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!userInput.trim() || isProcessing}
                size="icon"
                className="h-10 w-10 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}