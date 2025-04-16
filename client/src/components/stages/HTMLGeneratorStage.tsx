import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useXpTracker } from '@/hooks/useXpTracker';
import { useStageState } from '@/hooks/useStageState';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Code, Loader2, Send, Wand2 } from 'lucide-react';
import { Confetti } from '@/components/ui/confetti';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { generateHTML, HTMLMessage } from '@/lib/openai';

interface HTMLGeneratorStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface HTMLGeneratorState {
  messages: HTMLMessage[];
  prompt: string;
  currentHTML: string;
  isLoading: boolean;
  error: string;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
  viewMode: 'preview' | 'code';
}

export function HTMLGeneratorStage({ 
  onComplete, 
  onEarnXp, 
  onUnlockBadge, 
  onBack 
}: HTMLGeneratorStageProps) {
  const { t } = useTranslation();
  const { isAlreadyAwarded, markAsAwarded, awardIfNotAlreadyAwarded } = useXpTracker();
  const [showConfetti, setShowConfetti] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize state with localStorage values or defaults
  const [state, setState] = useStageState<HTMLGeneratorState>('html_generator', {
    messages: [],
    prompt: '',
    currentHTML: '',
    isLoading: false,
    error: '',
    hasEarnedXp: false,
    hasUnlockedBadge: false,
    viewMode: 'preview'
  });
  
  // Scroll to bottom of chat when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);
  
  // Handle prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.prompt.trim() || state.isLoading) return;
    
    // Add user message
    const userMessage: HTMLMessage = {
      role: 'user',
      content: state.prompt
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      prompt: '',
      isLoading: true,
      error: ''
    }));
    
    try {
      // Award XP for the first prompt if not already awarded
      if (state.messages.length === 0) {
        if (awardIfNotAlreadyAwarded(onEarnXp, 20, 'html_generator_first_prompt')) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
      
      // Generate HTML using the complete message history
      const response = await generateHTML([...state.messages, userMessage]);
      
      if (response.error) {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to generate HTML',
          isLoading: false
        }));
        return;
      }
      
      // Update state with the new message and HTML
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage, response.message],
        currentHTML: response.html,
        isLoading: false
      }));
      
      // Award XP for receiving a response if not already awarded
      if (state.messages.length <= 2) {
        if (awardIfNotAlreadyAwarded(onEarnXp, 30, 'html_generator_first_response')) {
          setState(prev => ({ ...prev, hasEarnedXp: true }));
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false
      }));
    }
  };
  
  // Award badge when user continues to next stage
  const handleContinue = () => {
    // Award web builder badge if not already awarded
    if (!state.hasUnlockedBadge) {
      if (!isAlreadyAwarded('html_generator_badge', 'web_builder_badge')) {
        onUnlockBadge('web_builder_badge', 'html_generator_badge');
        markAsAwarded('html_generator_badge', 'web_builder_badge');
        setState(prev => ({ ...prev, hasUnlockedBadge: true }));
      }
    }
    onComplete();
  };
  
  return (
    <div className="html-generator-stage">
      {showConfetti && <Confetti />}
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center flex items-center justify-center">
              <Wand2 className="h-6 w-6 mr-2 text-purple-500" />
              AI Web Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Describe what you want to build and the AI will generate complete HTML code for you.
              You can follow up with more instructions to refine your creation.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Chat Panel */}
              <div className="flex flex-col h-[500px] border rounded-md overflow-hidden">
                <div className="bg-gray-100 border-b px-4 py-2 flex items-center">
                  <Wand2 className="h-4 w-4 mr-2" />
                  <span className="font-medium text-sm">Chat with AI</span>
                </div>
                
                <ScrollArea className="flex-grow p-4 bg-white">
                  {state.messages.length === 0 ? (
                    <div className="text-center text-muted-foreground p-4">
                      <p>Start by describing what you want to build.</p>
                      <p className="text-sm mt-2">For example:</p>
                      <ul className="text-sm mt-1 space-y-1">
                        <li>"Build a calculator with dark theme"</li>
                        <li>"Create a todo list app"</li>
                        <li>"Make a color picker tool"</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {state.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-6'
                              : 'bg-muted mr-6'
                          }`}
                        >
                          <div className="font-medium mb-1">
                            {msg.role === 'user' ? 'You' : 'AI Assistant'}
                          </div>
                          <div className="whitespace-pre-wrap text-sm">
                            {msg.role === 'assistant' 
                              ? 'I created the HTML code based on your request. You can see it in the preview panel.'
                              : msg.content}
                          </div>
                        </div>
                      ))}
                      
                      {state.isLoading && (
                        <div className="p-3 rounded-lg bg-muted mr-6">
                          <div className="font-medium mb-1">AI Assistant</div>
                          <div className="flex items-center text-sm">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating HTML...
                          </div>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                <div className="border-t p-3">
                  {state.error && (
                    <Alert variant="destructive" className="mb-3 py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-sm">Error</AlertTitle>
                      <AlertDescription className="text-xs">{state.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      value={state.prompt}
                      onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Describe what you want to build..."
                      disabled={state.isLoading}
                      className="flex-grow"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!state.prompt.trim() || state.isLoading}
                    >
                      {state.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </div>
              
              {/* Preview/Code Panel */}
              <div className="flex flex-col h-[500px] border rounded-md overflow-hidden">
                <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {state.viewMode === 'preview' ? 'Live Preview' : 'HTML Code'}
                  </span>
                  
                  {state.currentHTML && (
                    <div className="flex items-center gap-2">
                      <div className="flex border rounded overflow-hidden">
                        <Button
                          type="button"
                          size="sm"
                          variant={state.viewMode === 'preview' ? 'default' : 'outline'}
                          className="rounded-none px-3 py-1 h-8 text-xs"
                          onClick={() => setState(prev => ({ ...prev, viewMode: 'preview' }))}
                        >
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={state.viewMode === 'code' ? 'default' : 'outline'}
                          className="rounded-none px-3 py-1 h-8 text-xs"
                          onClick={() => setState(prev => ({ ...prev, viewMode: 'code' }))}
                        >
                          Code
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow bg-white">
                  {!state.currentHTML ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Your code preview will appear here</p>
                    </div>
                  ) : state.viewMode === 'preview' ? (
                    <iframe
                      title="HTML Preview"
                      className="w-full h-full border-0"
                      srcDoc={state.currentHTML}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <ScrollArea className="h-full w-full">
                      <pre className="p-4 text-xs text-gray-800 whitespace-pre-wrap">
                        {state.currentHTML}
                      </pre>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-purple-50 p-4 rounded-md border border-purple-100">
              <h3 className="font-bold text-purple-800 mb-2">How to use this tool:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-purple-700">
                <li>Start by describing what you want to build</li>
                <li>View the generated HTML code in the preview panel</li>
                <li>Continue the conversation to refine your creation</li>
                <li>Ask for specific changes like "make the background blue" or "add a header"</li>
                <li>Each new message builds on the previous conversation</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Keep the conversation going to explore more capabilities of the AI code generator
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}