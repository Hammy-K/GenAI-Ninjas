import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useXpTracker } from '@/hooks/useXpTracker';
import { useStageState } from '@/hooks/useStageState';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, ChevronLeft, ChevronRight, Code, Loader2, 
  Send, Wand2, X, Share2, Save, Plus, AlertTriangle
} from 'lucide-react';
import { Confetti } from '@/components/ui/confetti';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateHTML, HTMLMessage } from '@/lib/openai';
import { saveProject, loadProject } from '@/lib/firebase';
import { useLocation } from 'wouter';

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
  isChatOpen: boolean;
  projectId: string | null;
  isSaving: boolean;
  shareUrl: string | null;
  showShareDialog: boolean;
  showResetDialog: boolean;
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
  
  // Get the current location for routing
  const [location, setLocation] = useLocation();
  
  // Initialize state with localStorage values or defaults
  const [state, setState] = useStageState<HTMLGeneratorState>('html_generator', {
    messages: [],
    prompt: '',
    currentHTML: '',
    isLoading: false,
    error: '',
    hasEarnedXp: false,
    hasUnlockedBadge: false,
    viewMode: 'preview',
    isChatOpen: false,
    projectId: null,
    isSaving: false,
    shareUrl: null,
    showShareDialog: false,
    showResetDialog: false
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
  
  // Handle toggling the chat widget
  const toggleChat = () => {
    setState(prev => ({ ...prev, isChatOpen: !prev.isChatOpen }));
  };
  
  // Check if project ID is in URL (for shared projects)
  useEffect(() => {
    const pathParts = location.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'project') {
      const projectId = pathParts[2];
      loadSharedProject(projectId);
    }
  }, [location]);
  
  // Load a shared project
  const loadSharedProject = async (projectId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: '' }));
      
      const project = await loadProject(projectId);
      
      if (project && project.html) {
        setState(prev => ({
          ...prev,
          currentHTML: project.html,
          projectId,
          isLoading: false,
          shareUrl: window.location.href
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Project not found', 
          isLoading: false 
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load project',
        isLoading: false
      }));
    }
  };
  
  // Save the current project to Firebase
  const saveAndShareProject = async () => {
    if (!state.currentHTML) return;
    
    try {
      setState(prev => ({ ...prev, isSaving: true, error: '' }));
      
      // Save the project to Firebase
      const projectId = await saveProject(state.currentHTML);
      
      // Create share URL
      const shareUrl = `${window.location.origin}/project/${projectId}`;
      
      // Update state with project info
      setState(prev => ({
        ...prev,
        projectId,
        shareUrl,
        isSaving: false,
        showShareDialog: true
      }));
      
      // Award XP for saving project if not already awarded
      if (awardIfNotAlreadyAwarded(onEarnXp, 15, 'html_generator_save_project')) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save project',
        isSaving: false
      }));
    }
  };
  
  // Copy share URL to clipboard
  const copyShareUrl = () => {
    if (!state.shareUrl) return;
    
    navigator.clipboard.writeText(state.shareUrl)
      .then(() => {
        // Success notification goes here
      })
      .catch(err => {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to copy URL to clipboard'
        }));
      });
  };
  
  // Start a new project
  const startNewProject = () => {
    setState(prev => ({
      ...prev,
      currentHTML: '',
      messages: [],
      projectId: null,
      shareUrl: null,
      showShareDialog: false,
      showResetDialog: false
    }));
  };
  
  // Confirm before starting new project
  const confirmReset = () => {
    setState(prev => ({ ...prev, showResetDialog: true }));
  };

  return (
    <div className="html-generator-stage min-h-screen flex flex-col">
      {showConfetti && <Confetti />}
      
      {/* Share Project Dialog */}
      <Dialog open={state.showShareDialog} onOpenChange={(open) => setState(prev => ({ ...prev, showShareDialog: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Project Saved!</DialogTitle>
            <DialogDescription>
              Your project has been saved successfully. Share the link below to show others your creation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={state.shareUrl || ''}
                className="text-xs"
              />
            </div>
            <Button 
              type="button" 
              size="sm" 
              className="px-3"
              onClick={copyShareUrl}
            >
              <span className="sr-only">Copy</span>
              Copy
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setState(prev => ({ ...prev, showShareDialog: false }))}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Reset Dialog */}
      <Dialog open={state.showResetDialog} onOpenChange={(open) => setState(prev => ({ ...prev, showResetDialog: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Project?</DialogTitle>
            <DialogDescription>
              This will clear your current project and chat history. Make sure you've saved your work if you want to keep it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 mt-4">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, showResetDialog: false }))}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                startNewProject();
                setState(prev => ({ ...prev, showResetDialog: false }));
              }}
            >
              Start New Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Header with Navigation */}
      <div className="py-6 border-b bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleContinue}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-medium text-center flex items-center justify-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-500" />
            AI Web Builder
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Type what you want to build, and watch it come to life instantly.
          </p>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-grow flex flex-col relative">
        {/* Preview Panel - Full Width */}
        <div className="flex-grow flex flex-col">
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
                
                {/* Project Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex items-center gap-1 text-xs"
                    onClick={saveAndShareProject}
                    disabled={state.isSaving}
                  >
                    {state.isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3 w-3" />
                        Save & Share
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex items-center gap-1 text-xs"
                    onClick={confirmReset}
                  >
                    <Plus className="h-3 w-3" />
                    New Project
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-grow bg-white h-[75vh]">
            {!state.currentHTML ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Your creation will appear here</p>
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
        
        {/* Floating Chat Widget */}
        <div className={`fixed bottom-4 right-4 z-50 flex flex-col transition-all duration-300 ease-in-out 
                         ${state.isChatOpen ? 'w-80 sm:w-96 h-[500px]' : 'w-16 h-16'}`}>
          {/* Chat Widget Button (When Closed) */}
          {!state.isChatOpen && (
            <Button 
              onClick={toggleChat}
              size="icon" 
              className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center"
            >
              <Wand2 className="h-6 w-6" />
            </Button>
          )}
          
          {/* Chat Widget Panel (When Open) */}
          {state.isChatOpen && (
            <div className="flex flex-col h-full overflow-hidden bg-white border rounded-md shadow-xl">
              {/* Chat Header */}
              <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <Wand2 className="h-4 w-4 mr-2" />
                  <span className="font-medium text-sm">Chat with AI</span>
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
                {state.messages.length === 0 ? (
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
                    {state.messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-6'
                            : 'bg-muted mr-6'
                        }`}
                      >
                        <div className="font-medium text-xs mb-1">
                          {msg.role === 'user' ? 'You' : 'AI Assistant'}
                        </div>
                        <div className="whitespace-pre-wrap text-xs">
                          {msg.role === 'assistant' 
                            ? 'I created the HTML code based on your request. You can see it in the preview.'
                            : msg.content}
                        </div>
                      </div>
                    ))}
                    
                    {state.isLoading && (
                      <div className="p-3 rounded-lg bg-muted mr-6">
                        <div className="font-medium text-xs mb-1">AI Assistant</div>
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
                {state.error && (
                  <Alert variant="destructive" className="mb-3 py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertTitle className="text-xs">Error</AlertTitle>
                    <AlertDescription className="text-xs">{state.error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={state.prompt}
                    onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Describe what to build..."
                    disabled={state.isLoading}
                    className="flex-grow text-sm h-9"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9"
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
          )}
        </div>
      </div>
    </div>
  );
}