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
import { ArrowRight, Send } from "lucide-react";
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

// Chat message interface
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  hasAction?: boolean;
  action?: {
    type: "play-game" | "submit-reflection" | "submit-idea" | "submit-code" | "next-step";
    data?: any;
  };
}

// Mission progression stages
enum MissionStage {
  INTRODUCTION = 0,
  PLAY_GAME = 1,
  REFLECTION = 2,
  GAME_IDEA = 3,
  PROTOTYPE = 4,
  GAME_BEHAVIOR = 5,
  VISUALS = 6,
  TESTING = 7,
  COMPLETION = 8
}

/**
 * GameDevMission Component
 * 
 * This component implements the "Why Do We Love Games?" mission
 * with a continuous, single-screen experience with Dr. Pengy guiding
 * students through each step.
 */
export default function GameDevMission() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Current mission stage
  const [stage, setStage] = useState<MissionStage>(MissionStage.INTRODUCTION);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "مرحبًا بك في مهمة 'لماذا نحب الألعاب؟' 🎮 أنا د. بنجي وسأكون مرشدك خلال هذه المهمة. هيا نبدأ رحلتنا!\n\nأول خطوة هي أن نلعب لعبة بسيطة ونفكر في ما يجعلها ممتعة. انقر على الزر أدناه للبدء.",
      hasAction: true,
      action: {
        type: "play-game"
      }
    }
  ]);
  
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gameCode, setGameCode] = useState(FLAPPY_BIRD_GAME_CODE);
  const [gameIdea, setGameIdea] = useState("");
  const [reflection, setReflection] = useState("");
  const [showGamePreview, setShowGamePreview] = useState(false);
  
  // Progress tracking
  const totalStages = 8;
  const stagesCompleted = stage > MissionStage.INTRODUCTION ? stage - 1 : 0;
  
  // Advance to the next stage in the mission
  const advanceStage = () => {
    setStage(prevStage => {
      const nextStage = prevStage + 1;
      
      // Add appropriate chat message from Dr. Pengy based on the next stage
      let message: ChatMessage = {
        role: "assistant",
        content: "",
        hasAction: true
      };
      
      switch (nextStage) {
        case MissionStage.PLAY_GAME:
          message.content = "رائع! الآن يمكنك لعب لعبة 'الطائر المرفرف'. جرّب اللعبة وفكر في ما يجعلها ممتعة.\n\nاضغط على زر 'ابدأ اللعبة' ثم استخدم المسافة (أو النقر) للقفز. حاول تجنب الأنابيب وتحقيق أعلى نقاط!";
          setShowGamePreview(true);
          break;
          
        case MissionStage.REFLECTION:
          message.content = "أحسنت! الآن بعد أن لعبت اللعبة، فكر في ما الذي جعلها ممتعة برأيك. ما هي العناصر التي تجعلك ترغب في الاستمرار باللعب؟\n\nاكتب ملاحظاتك في مربع النص أدناه (2-3 نقاط على الأقل).";
          message.action = { type: "submit-reflection" };
          break;
          
        case MissionStage.GAME_IDEA:
          message.content = "ملاحظات رائعة! العناصر التي ذكرتها هي بالفعل ما يجعل الألعاب ممتعة.\n\nحان الوقت الآن لتبدأ تخيل لعبتك الخاصة. ما هي فكرة اللعبة التي تود إنشاؤها؟ صف فكرة اللعبة، والموضوع، والهدف منها في جملة أو جملتين.";
          message.action = { type: "submit-idea" };
          setShowGamePreview(false);
          break;
          
        case MissionStage.PROTOTYPE:
          message.content = `فكرة رائعة! "${gameIdea}"\n\nالآن بعد أن لديك فكرة واضحة، سنبدأ في إنشاء نموذج أولي بسيط. في الخطوات القادمة، سنعمل على تطوير لعبتك خطوة بخطوة.\n\nهل أنت مستعد للبدء في إنشاء نموذج أولي للعبتك؟`;
          message.action = { type: "next-step" };
          break;
          
        case MissionStage.GAME_BEHAVIOR:
          message.content = "ممتاز! لقد بدأنا بإنشاء نموذج أولي للعبة. الآن سنركز على تخصيص سلوك اللعبة.\n\nسنتعلم كيف يمكننا تعديل كيفية تفاعل اللاعب مع اللعبة وكيف تتصرف العناصر داخل اللعبة.\n\nهل أنت مستعد للخطوة التالية؟";
          message.action = { type: "next-step" };
          break;
          
        case MissionStage.VISUALS:
          message.content = "أحسنت! الآن سنعمل على تحسين المظهر المرئي للعبة. سنتعلم كيف نضيف الرسومات والألوان لجعل اللعبة أكثر جاذبية.\n\nهل أنت مستعد للعمل على تصميم لعبتك؟";
          message.action = { type: "next-step" };
          break;
          
        case MissionStage.TESTING:
          message.content = "رائع! لقد أضفنا عناصر مرئية للعبة. الآن حان وقت اختبار اللعبة وجمع الملاحظات.\n\nفي عالم تطوير الألعاب الحقيقي، هذه خطوة مهمة حيث نجمع آراء اللاعبين ونحسن اللعبة بناءً على تجربتهم.\n\nهل أنت مستعد لتجربة لعبتك وتحسينها؟";
          message.action = { type: "next-step" };
          break;
          
        case MissionStage.COMPLETION:
          message.content = "تهانينا! 🎉 لقد أكملت مهمة 'لماذا نحب الألعاب' بنجاح!\n\nلقد تعلمت أساسيات تصميم الألعاب، وفكرت في ما يجعل الألعاب ممتعة، وبدأت في تطوير فكرة لعبة خاصة بك.\n\nيمكنك الآن العودة إلى لوحة المهام لاستكشاف المزيد من المهمات أو مواصلة تطوير مهاراتك في تصميم الألعاب!";
          // Show confetti for completion
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          break;
          
        default:
          message.content = "هذه الخطوة قيد التطوير حالياً وستكون متاحة قريباً. هل ترغب في العودة إلى لوحة المهام؟";
          break;
      }
      
      setMessages(prev => [...prev, message]);
      return nextStage;
    });
  };
  
  // Handle chat submission from user
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
      // For now, we'll simulate a response based on the current stage
      setTimeout(() => {
        let assistantResponse: ChatMessage = {
          role: "assistant",
          content: "أفهم ما تقول. في التطبيق الكامل، سأكون قادراً على التفاعل بذكاء مع استفساراتك المحددة."
        };
        
        // Add suggestions based on the current stage
        if (stage === MissionStage.REFLECTION) {
          assistantResponse.content += "\n\nلم تنسَ أن تشارك ملاحظاتك عن اللعبة في مربع النص أدناه.";
        } else if (stage === MissionStage.GAME_IDEA) {
          assistantResponse.content += "\n\nلا تنسَ أن تشارك فكرة لعبتك في مربع النص أدناه.";
        }
        
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

  // Handle reflection submission
  const handleReflectionSubmit = () => {
    if (!reflection || reflection.length < 10) return;
    
    // Add the user's reflection to the chat
    const userReflection: ChatMessage = {
      role: "user",
      content: reflection
    };
    
    setMessages(prev => [...prev, userReflection]);
    
    // Show confetti and advance to next stage
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      advanceStage();
    }, 1500);
  };
  
  // Handle game idea submission
  const handleGameIdeaSubmit = () => {
    if (!gameIdea || gameIdea.length < 10) return;
    
    // Add the user's game idea to the chat
    const userGameIdea: ChatMessage = {
      role: "user",
      content: gameIdea
    };
    
    setMessages(prev => [...prev, userGameIdea]);
    
    // Show confetti and advance to next stage
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      advanceStage();
    }, 1500);
  };
  
  // Handle button actions from Dr. Pengy's messages
  const handleAction = (action: any) => {
    switch (action.type) {
      case "play-game":
        // Start the game experience
        advanceStage();
        break;
        
      case "next-step":
        // Advance to the next step in the mission
        advanceStage();
        break;
        
      default:
        console.log("Unknown action type:", action.type);
        break;
    }
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
        currentStage={stagesCompleted + 1} 
        totalStages={totalStages} 
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
                          
                          {/* Action buttons for Dr. Pengy's messages */}
                          {message.role === "assistant" && message.hasAction && (
                            <div className="mt-2 flex justify-end">
                              {message.action?.type === "play-game" && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAction(message.action)}
                                  className="text-xs"
                                >
                                  ابدأ
                                </Button>
                              )}
                              
                              {message.action?.type === "next-step" && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAction(message.action)}
                                  className="text-xs"
                                >
                                  التالي
                                </Button>
                              )}
                            </div>
                          )}
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
                  <h2 className="text-xl font-bold mb-4 text-right">
                    لماذا نحب الألعاب؟
                  </h2>
                  
                  {/* Dynamic Content Based on Current Stage */}
                  <div className="flex-grow flex flex-col">
                    {/* Game Preview - Shown in Play Game and Reflection stages */}
                    {showGamePreview && (
                      <div className="flex-grow border rounded-md overflow-hidden mb-4">
                        <iframe
                          title="Flappy Bird"
                          className="w-full h-full border-0"
                          srcDoc={gameCode}
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    )}
                    
                    {/* Reflection Input Form - Shown in Reflection stage */}
                    {stage === MissionStage.REFLECTION && (
                      <div className="mt-auto">
                        <div className="flex flex-col gap-2">
                          <Textarea
                            placeholder="اكتب هنا ما يجعل هذه اللعبة ممتعة برأيك (2-3 نقاط)..."
                            className="resize-none h-20 text-right"
                            value={reflection}
                            onChange={(e) => setReflection(e.target.value)}
                          />
                          <Button 
                            onClick={handleReflectionSubmit}
                            disabled={!reflection || reflection.length < 10}
                            className="self-start"
                          >
                            إرسال ملاحظاتي
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Game Idea Input Form - Shown in Game Idea stage */}
                    {stage === MissionStage.GAME_IDEA && (
                      <div className="mt-auto">
                        <div className="flex flex-col gap-2">
                          <Textarea
                            placeholder="اكتب هنا فكرة لعبتك..."
                            className="resize-none h-20 text-right"
                            value={gameIdea}
                            onChange={(e) => setGameIdea(e.target.value)}
                          />
                          <Button 
                            onClick={handleGameIdeaSubmit}
                            disabled={!gameIdea || gameIdea.length < 10}
                            className="self-start"
                          >
                            إرسال فكرة اللعبة
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Placeholder for future implementation */}
                    {(stage >= MissionStage.PROTOTYPE && stage < MissionStage.COMPLETION) && (
                      <div className="flex-grow border border-dashed rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground text-center">
                          هذه المرحلة من تطوير اللعبة قيد التنفيذ وستكون متاحة قريبًا.
                          <br /><br />
                          يمكنك متابعة المحادثة مع د. بنجي للانتقال للخطوة التالية.
                        </p>
                      </div>
                    )}
                    
                    {/* Completion Message */}
                    {stage === MissionStage.COMPLETION && (
                      <div className="flex-grow flex flex-col items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🎮</div>
                          <h3 className="text-2xl font-bold mb-2">تهانينا!</h3>
                          <p className="mb-4">لقد أكملت مهمة "لماذا نحب الألعاب؟" بنجاح</p>
                          <Button 
                            onClick={handleBackToDashboard}
                            className="mt-4"
                          >
                            العودة إلى لوحة المهام
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Confetti effect when completing a stage */}
      {showConfetti && <Confetti />}
    </div>
  );
}