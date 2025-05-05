import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowRight, ArrowLeft, Send, 
  CheckCircle2, Circle, Play, Sparkles, 
  LucideIcon, Code, ImageIcon, UserSquare, 
  Share2, Wand2, MessageSquare
} from "lucide-react";
import { Confetti } from "@/components/ui/confetti";
import penguinAvatar from "@/assets/JourneyAvatar.png";

// Define the initial flappy bird game that students can play
const FLAPPY_BIRD_GAME_CODE = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لعبة الطائر المرفرف</title>
  <style>
    body { 
      margin: 0; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      background: #87CEEB;
      font-family: 'Tajawal', sans-serif;
    }
    canvas { 
      border: 2px solid #000; 
      display: block; 
      background: #87CEEB; 
    }
    #game-container {
      position: relative;
    }
    #score {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 24px;
      color: white;
      background: rgba(0,0,0,0.5);
      padding: 5px 10px;
      border-radius: 5px;
    }
    #start-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 10px 20px;
      font-size: 18px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="game-canvas" width="480" height="640"></canvas>
    <div id="score">0</div>
    <button id="start-button">ابدأ اللعبة</button>
  </div>

  <script>
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const startButton = document.getElementById('start-button');
    
    // Game variables
    let gameRunning = false;
    let score = 0;
    let frames = 0;
    
    // Bird variables
    const bird = {
      x: 50,
      y: canvas.height/2,
      width: 30,
      height: 30,
      gravity: 0.5,
      velocity: 0,
      jump: -10
    };
    
    // Pipe variables
    const pipes = [];
    const pipeGap = 150;
    const pipeWidth = 50;
    
    // Start button event listener
    startButton.addEventListener('click', startGame);
    
    // Start game function
    function startGame() {
      gameRunning = true;
      score = 0;
      scoreDisplay.innerHTML = score;
      bird.y = canvas.height/2;
      bird.velocity = 0;
      pipes.length = 0;
      startButton.style.display = 'none';
      
      // Add keyboard controls
      document.addEventListener('keydown', jump);
      
      // Add tap/click control
      canvas.addEventListener('click', jump);
      
      // Start game loop
      gameLoop();
    }
    
    // Jump function
    function jump(e) {
      if (!gameRunning) return;
      
      if (e.type === 'keydown' && e.code !== 'Space') return;
      
      bird.velocity = bird.jump;
    }
    
    // Game loop
    function gameLoop() {
      if (!gameRunning) return;
      
      update();
      draw();
      
      frames++;
      requestAnimationFrame(gameLoop);
    }
    
    // Update game state
    function update() {
      // Update bird position
      bird.velocity += bird.gravity;
      bird.y += bird.velocity;
      
      // Generate new pipe
      if (frames % 100 === 0) {
        const pipeY = Math.random() * (canvas.height - pipeGap) + pipeWidth;
        pipes.push({
          x: canvas.width,
          y: pipeY,
          width: pipeWidth,
          scored: false
        });
      }
      
      // Update pipes and check collisions
      for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= 2;
        
        // Score when passing pipe
        if (!pipes[i].scored && pipes[i].x + pipes[i].width < bird.x) {
          pipes[i].scored = true;
          score++;
          scoreDisplay.innerHTML = score;
        }
        
        // Check collisions
        if (
          bird.x + bird.width > pipes[i].x && 
          bird.x < pipes[i].x + pipes[i].width && 
          (bird.y < pipes[i].y || bird.y + bird.height > pipes[i].y + pipeGap)
        ) {
          gameOver();
        }
      }
      
      // Remove offscreen pipes
      if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
        pipes.shift();
      }
      
      // Check if bird hits boundaries
      if (bird.y < 0 || bird.y + bird.height > canvas.height) {
        gameOver();
      }
    }
    
    // Draw game elements
    function draw() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw bird
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
      
      // Draw pipes
      ctx.fillStyle = '#4CAF50';
      for (let i = 0; i < pipes.length; i++) {
        // Top pipe
        ctx.fillRect(pipes[i].x, 0, pipes[i].width, pipes[i].y);
        // Bottom pipe
        ctx.fillRect(
          pipes[i].x, 
          pipes[i].y + pipeGap, 
          pipes[i].width, 
          canvas.height - pipes[i].y - pipeGap
        );
      }
    }
    
    // Game over function
    function gameOver() {
      gameRunning = false;
      document.removeEventListener('keydown', jump);
      canvas.removeEventListener('click', jump);
      startButton.style.display = 'block';
      startButton.innerHTML = 'العب مرة أخرى';
    }
  </script>
</body>
</html>`;

// Game mission steps interface
interface GameMissionStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  isCompleted: boolean;
  isActive: boolean;
}

// Chat message interface
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * GameDevMission Component
 * 
 * This component implements the "Why Do We Love Games?" mission
 * with a continuous, single-screen experience featuring a progressive checklist.
 */
export default function GameDevMission() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "مرحبًا بك في مهمة 'لماذا نحب الألعاب؟' 🎮 أنا د. بنجي وسأكون مرشدك خلال هذه المهمة. هيا نبدأ باللعب أولاً لفهم ما يجعل الألعاب ممتعة!"
    }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mission state
  const [missionsSteps, setMissionSteps] = useState<GameMissionStep[]>([
    {
      id: 1,
      title: "لماذا نحب الألعاب؟",
      description: "ألعب والتفكير في ما يجعل اللعبة ممتعة",
      icon: Play,
      isCompleted: false,
      isActive: true
    },
    {
      id: 2,
      title: "تخيل فكرة لعبتك",
      description: "وصف فكرة اللعبة والهدف منها",
      icon: Sparkles,
      isCompleted: false,
      isActive: false
    },
    {
      id: 3,
      title: "إنشاء النموذج الأولي",
      description: "توليد شفرة اللعبة الأساسية",
      icon: Code,
      isCompleted: false,
      isActive: false
    },
    {
      id: 4,
      title: "تخصيص سلوك اللعبة",
      description: "تعديل طريقة عمل اللعبة",
      icon: Wand2,
      isCompleted: false,
      isActive: false
    },
    {
      id: 5,
      title: "إضافة العناصر المرئية",
      description: "تصميم مظهر اللعبة",
      icon: ImageIcon,
      isCompleted: false,
      isActive: false
    },
    {
      id: 6,
      title: "اختبار اللعبة",
      description: "جمع الملاحظات والتحسين",
      icon: UserSquare,
      isCompleted: false,
      isActive: false
    },
    {
      id: 7,
      title: "التعديلات النهائية",
      description: "إضافة اللمسات الأخيرة ونشر اللعبة",
      icon: Share2,
      isCompleted: false,
      isActive: false
    },
    {
      id: 8,
      title: "التفكير والإنجازات",
      description: "التأمل في ما تعلمته وما أنجزته",
      icon: MessageSquare,
      isCompleted: false,
      isActive: false
    }
  ]);

  // Current active step and game code state
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [gameCode, setGameCode] = useState(FLAPPY_BIRD_GAME_CODE);
  const [gameIdea, setGameIdea] = useState("");
  const [reflections, setReflections] = useState<string[]>([]);
  
  // Handle chat submission
  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;
    
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setUserMessage("");
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the Assistant API
      // For now, we'll simulate a response
      setTimeout(() => {
        const assistantResponse: ChatMessage = {
          role: "assistant",
          content: "هذا رد مؤقت من د. بنجي. في التطبيق الكامل، سيتم توصيل هذا بواجهة برمجة التطبيقات المساعدة."
        };
        
        setMessages(prev => [...prev, assistantResponse]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Handle step completion
  const completeCurrentStep = (response: string = "") => {
    // Update the current step to completed
    const updatedSteps = [...missionsSteps];
    updatedSteps[activeStepIndex].isCompleted = true;
    
    // If there's a next step, make it active
    if (activeStepIndex < updatedSteps.length - 1) {
      updatedSteps[activeStepIndex + 1].isActive = true;
      setActiveStepIndex(activeStepIndex + 1);
    }
    
    setMissionSteps(updatedSteps);
    
    // Store reflection if provided
    if (response) {
      const newReflections = [...reflections];
      newReflections[activeStepIndex] = response;
      setReflections(newReflections);
    }
    
    // Show confetti animation
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-700 font-tajawal">
      <Header xp={0} />
      
      {/* Back to Dashboard Button */}
      <div className="bg-white border-b py-2">
        <div className="max-w-6xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToDashboard}
            className="flex items-center text-sm"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة إلى لوحة المهام
          </Button>
        </div>
      </div>
      
      {/* Progress Bar - Shows overall mission progress */}
      <ProgressBar 
        currentStage={missionsSteps.filter(step => step.isCompleted).length + 1} 
        totalStages={missionsSteps.length} 
      />
      
      {/* Main Content Area with 30/70 Split */}
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Dr. Pengy Chat Panel - 30% width */}
            <div className="w-full md:w-[30%] order-2 md:order-1">
              <Card className="h-full">
                <CardContent className="p-4 h-[calc(100vh-220px)] flex flex-col">
                  <h3 className="text-lg font-bold mb-3 text-right">الدردشة مع د. بنجي</h3>
                  
                  {/* Chat Messages */}
                  <ScrollArea className="flex-grow mb-3 h-[calc(100%-100px)]">
                    <div className="flex flex-col space-y-3 text-right">
                      {messages.map((message, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg max-w-[85%] ${
                            message.role === "assistant" 
                              ? "bg-primary/10 self-start rounded-bl-none ml-auto" 
                              : "bg-muted self-end rounded-br-none mr-auto"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className="flex items-center gap-2 mb-1">
                              <img src={penguinAvatar} alt="Dr. Pengy" className="w-6 h-6 rounded-full" />
                              <span className="font-bold text-sm">د. بنجي</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  
                  {/* Chat Input */}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon"
                      disabled={!userMessage.trim() || isLoading}
                      onClick={handleSendMessage}
                    >
                      {isLoading ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <Input
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      className="text-right"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content Area - 70% width */}
            <div className="w-full md:w-[70%] order-1 md:order-2">
              <Card className="h-full">
                <CardContent className="p-4 h-[calc(100vh-220px)] flex flex-col">
                  {/* Mission Steps Checklist */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {missionsSteps.map((step) => (
                      <Button
                        key={step.id}
                        variant={step.isActive ? "default" : step.isCompleted ? "outline" : "ghost"}
                        className={`h-auto py-2 justify-start text-right ${
                          !step.isActive && !step.isCompleted ? "opacity-50 cursor-not-allowed" : ""
                        } ${step.isCompleted ? "border-green-500 text-green-600" : ""}`}
                        disabled={!step.isActive && !step.isCompleted}
                        onClick={() => {
                          if (step.isCompleted || step.isActive) {
                            setActiveStepIndex(step.id - 1);
                          }
                        }}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center w-full mb-1">
                            {step.isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
                            ) : (
                              <Circle className="h-4 w-4 ml-2" />
                            )}
                            <span className="font-medium">{step.title}</span>
                          </div>
                          <span className="text-xs opacity-70">{step.description}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Active Step Content */}
                  <div className="flex-grow flex flex-col overflow-hidden">
                    <h2 className="text-xl font-bold mb-2 text-right">
                      {missionsSteps[activeStepIndex].title}
                    </h2>
                    
                    {/* Step 1: Why We Love Games */}
                    {activeStepIndex === 0 && (
                      <div className="flex flex-col h-full">
                        <p className="text-right mb-3">
                          ألعب اللعبة أدناه وفكر في ما يجعلها ممتعة. ما هي العناصر التي تجعلك ترغب في الاستمرار باللعب؟
                        </p>
                        
                        {/* Game Preview */}
                        <div className="flex-grow border rounded-md overflow-hidden mb-4">
                          <iframe
                            title="Flappy Bird"
                            className="w-full h-full border-0"
                            srcDoc={gameCode}
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>
                        
                        {/* Reflection Input */}
                        <div className="flex flex-col gap-2">
                          <Textarea
                            placeholder="اكتب هنا ما يجعل هذه اللعبة ممتعة برأيك (2-3 نقاط)..."
                            className="resize-none h-20 text-right"
                            value={reflections[0] || ""}
                            onChange={(e) => {
                              const newReflections = [...reflections];
                              newReflections[0] = e.target.value;
                              setReflections(newReflections);
                            }}
                          />
                          <Button 
                            onClick={() => completeCurrentStep(reflections[0])}
                            disabled={!reflections[0] || reflections[0].length < 10}
                            className="self-start"
                          >
                            تم
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Step 2: Imagine Your Game Idea */}
                    {activeStepIndex === 1 && (
                      <div className="flex flex-col h-full">
                        <p className="text-right mb-3">
                          تخيل لعبة بسيطة تود إنشاؤها. صف فكرة اللعبة، والموضوع، والهدف منها في جملة أو جملتين.
                        </p>
                        
                        {/* Game Idea Input */}
                        <div className="flex flex-col gap-2">
                          <Textarea
                            placeholder="اكتب هنا فكرة لعبتك..."
                            className="resize-none h-20 text-right"
                            value={gameIdea}
                            onChange={(e) => setGameIdea(e.target.value)}
                          />
                          <Button 
                            onClick={() => completeCurrentStep(gameIdea)}
                            disabled={!gameIdea || gameIdea.length < 10}
                            className="self-start"
                          >
                            تم
                          </Button>
                        </div>
                        
                        {/* Placeholders for future steps */}
                        <div className="flex-grow border border-dashed rounded-md mt-4 flex items-center justify-center">
                          <p className="text-muted-foreground">
                            سيظهر هنا معاينة للعبتك عندما نصل للخطوة التالية
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Placeholder for remaining steps */}
                    {activeStepIndex > 1 && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-muted-foreground mb-4">
                          هذه الخطوة قيد التطوير، وستكون متاحة قريبًا
                        </p>
                        
                        {/* For the demo, let's add a button to complete the step anyway */}
                        <Button onClick={() => completeCurrentStep()}>
                          اكمل الخطوة (للعرض التوضيحي)
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Confetti effect when completing a step */}
      {showConfetti && <Confetti />}
    </div>
  );
}