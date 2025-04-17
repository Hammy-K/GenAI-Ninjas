import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Image, Loader2, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';
import { generateText, generateImage, type Message } from '@/lib/openai';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStageState } from '@/hooks/useStageState';

interface TryAIStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface ImageMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number;
  status?: 'loading' | 'error' | 'success';
  errorMessage?: string;
}

interface TryAIState {
  activeTab: string;
  textPrompt: string;
  imagePrompt: string;
  generatedText: string;
  generatedImageUrl: string;
  hasCompleted: boolean;
  messageHistory: Message[];
  imageMessageHistory: ImageMessage[];
}

export function TryAIStage({ onComplete, onEarnXp, onUnlockBadge, onBack }: TryAIStageProps) {
  // Use the custom hook to persist state
  const [state, setState] = useStageState<TryAIState>('tryAI', {
    activeTab: 'text',
    textPrompt: '',
    imagePrompt: '',
    generatedText: '',
    generatedImageUrl: '',
    hasCompleted: false,
    messageHistory: [],
    imageMessageHistory: []
  });
  
  // Create individual updater functions
  const setActiveTab = (tab: string) => setState(prev => ({ ...prev, activeTab: tab }));
  const setTextPrompt = (prompt: string) => setState(prev => ({ ...prev, textPrompt: prompt }));
  const setImagePrompt = (prompt: string) => setState(prev => ({ ...prev, imagePrompt: prompt }));
  const setGeneratedText = (text: string) => setState(prev => ({ ...prev, generatedText: text }));
  const setGeneratedImageUrl = (url: string) => setState(prev => ({ ...prev, generatedImageUrl: url }));
  const setHasCompleted = (completed: boolean) => setState(prev => ({ ...prev, hasCompleted: completed }));
  
  // Local state for UI processing indicators (no need to persist these)
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  
  const handleGenerateText = async () => {
    if (!state.textPrompt.trim()) return;
    
    setError('');
    setIsGeneratingText(true);
    
    try {
      // Use an empty array as fallback if messageHistory is undefined
      const messageHistory = state.messageHistory || [];
      
      const response = await generateText({ 
        prompt: state.textPrompt,
        messageHistory: messageHistory
      });
      
      if (!response.error) {
        setState(prev => {
          // Create a safe copy of the message history with fallback
          const prevMessageHistory = prev.messageHistory || [];
          
          return {
            ...prev,
            messageHistory: [
              ...prevMessageHistory,
              { role: 'user', content: state.textPrompt },
              { role: 'assistant', content: response.text }
            ]
          };
        });
      }
      if (response.error) {
        // Handle moderation-related errors with a friendly message
        if (response.error === 'Content flagged as inappropriate') {
          setError(`Your content may contain inappropriate material. Please revise your prompt.`);
        }
        // Check for quota exceeded error
        else if (response.error.includes("quota") || response.error.toLowerCase().includes("429")) {
          setError("API quota exceeded. Please try again later or use a different API key.");
        } else {
          setError(response.error);
        }
      } else {
        setGeneratedText(response.text);
        
        // Only award XP and badge once
        if (!state.hasCompleted) {
          onEarnXp(20, 'text_generation_complete');
          onUnlockBadge('prompt_master_badge', 'text_generation_complete');
          setHasCompleted(true);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsGeneratingText(false);
    }
  };
  
  // These helper functions are no longer needed as we're using direct setState calls
  // in the handleGenerateImage function to avoid race conditions and ensure proper message handling
  
  const handleGenerateImage = async () => {
    if (!state.imagePrompt.trim()) return;
    
    setError('');
    setIsGeneratingImage(true);
    
    // Save the current prompt before we process it
    const currentPrompt = state.imagePrompt;
    
    // First add the user's message to the chat
    setState(prev => {
      const prevMessageHistory = prev.imageMessageHistory || [];
      
      return {
        ...prev,
        imageMessageHistory: [
          ...prevMessageHistory,
          {
            role: 'user',
            content: currentPrompt,
            timestamp: Date.now()
          }
        ]
      };
    });
    
    // Then add a placeholder for the assistant's response
    // Save the index of the assistant message so we can update it later
    const assistantMessageIndex = (state.imageMessageHistory?.length || 0);
    
    // Add the assistant's "loading" message
    setState(prev => {
      const prevMessageHistory = prev.imageMessageHistory || [];
      
      return {
        ...prev,
        imageMessageHistory: [
          ...prevMessageHistory,
          {
            role: 'assistant',
            content: "Generating your image, please wait...",
            timestamp: Date.now(),
            status: 'loading'
          }
        ]
      };
    });
    
    try {
      // Use the saved prompt to generate the image
      const response = await generateImage({ prompt: currentPrompt });
      
      if (response.error) {
        // Update the assistant message with an error
        setState(prev => {
          const updatedHistory = [...(prev.imageMessageHistory || [])];
          if (assistantMessageIndex >= 0 && assistantMessageIndex < updatedHistory.length) {
            updatedHistory[assistantMessageIndex] = { 
              ...updatedHistory[assistantMessageIndex], 
              content: response.message || "I couldn't create that image. Please try a different description!",
              status: 'error',
              errorMessage: response.error
            };
          }
          return {
            ...prev,
            imageMessageHistory: updatedHistory
          };
        });
        
        // Also set the error for the alert
        setError(response.message || response.error);
      } else {
        // Update the assistant message with the successful image
        setState(prev => {
          const updatedHistory = [...(prev.imageMessageHistory || [])];
          if (assistantMessageIndex >= 0 && assistantMessageIndex < updatedHistory.length) {
            updatedHistory[assistantMessageIndex] = { 
              ...updatedHistory[assistantMessageIndex], 
              content: "Here's the image I created based on your description!",
              imageUrl: response.url,
              status: 'success'
            };
          }
          return {
            ...prev,
            imageMessageHistory: updatedHistory,
            generatedImageUrl: response.url
          };
        });
        
        // Only award XP and badge once
        if (!state.hasCompleted) {
          onEarnXp(30, 'image_generation_complete');
          onUnlockBadge('image_artist_badge', 'image_generation_complete');
          setHasCompleted(true);
        }
      }
    } catch (error) {
      // Update the assistant message with an error
      setState(prev => {
        const updatedHistory = [...(prev.imageMessageHistory || [])];
        if (assistantMessageIndex >= 0 && assistantMessageIndex < updatedHistory.length) {
          updatedHistory[assistantMessageIndex] = { 
            ...updatedHistory[assistantMessageIndex], 
            content: "Something went wrong creating your image. Please try again!",
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        return {
          ...prev,
          imageMessageHistory: updatedHistory
        };
      });
      
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsGeneratingImage(false);
      // Clear the input after processing is complete
      setState(prev => ({ ...prev, imagePrompt: '' }));
    }
  };
  
  return (
    <div className="try-ai-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Try AI Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Experience the power of generative AI by trying it yourself. Create text or images using simple prompts.
            </p>
            
            <Tabs defaultValue="text" value={state.activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Text Generation
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image Generation
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="mt-4">
                <div className="space-y-4">
                  {/* Display conversation thread if there's message history */}
                  <div className="bg-neutral-50 p-4 rounded-lg border mb-4">
                    <h3 className="font-bold mb-3">AI Conversation</h3>
                    <div className="space-y-4 overflow-y-auto max-h-[350px] p-1 mb-4">
                      {state.messageHistory && state.messageHistory.length > 0 ? (
                        state.messageHistory.map((message, index) => (
                          <div 
                            key={index} 
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`p-3 rounded-lg max-w-[85%] ${
                                message.role === 'user' 
                                  ? 'bg-blue-50 border border-blue-100 text-blue-800' 
                                  : 'bg-gray-100 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                  ${message.role === 'user' 
                                    ? 'bg-blue-200 text-blue-700' 
                                    : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {message.role === 'user' ? 'U' : 'AI'}
                                </div>
                                <p className="text-xs font-medium text-gray-500">
                                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                                </p>
                              </div>
                              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-[150px] text-gray-400">
                          <div className="text-center">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No messages yet. Start a conversation!</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {error && state.activeTab === 'text' && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex gap-2">
                      <Textarea 
                        placeholder="Type your message here... (e.g., 'Write a short story about a space adventure')"
                        value={state.textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                        className="min-h-[80px] flex-grow"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault();
                            if (!isGeneratingText && state.textPrompt.trim()) {
                              handleGenerateText();
                            }
                          }
                        }}
                      />
                      <Button 
                        onClick={handleGenerateText} 
                        disabled={isGeneratingText || !state.textPrompt.trim()}
                        className="self-end h-10 px-4"
                      >
                        {isGeneratingText ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
                            <path d="m22 2-7 20-4-9-9-4Z"/>
                            <path d="M22 2 11 13"/>
                          </svg>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Press Ctrl+Enter to send your message</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="mt-4">
                <div className="space-y-4">
                  {/* Chat-style UI for images */}
                  <div className="bg-neutral-50 p-4 rounded-lg border mb-4">
                    <h3 className="font-bold mb-3">AI Image Creator</h3>
                    <div className="space-y-4 overflow-y-auto max-h-[450px] p-1 mb-4" dir="auto">
                      {state.imageMessageHistory && state.imageMessageHistory.length > 0 ? (
                        state.imageMessageHistory.map((message, index) => (
                          <div 
                            key={index} 
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`p-3 rounded-lg max-w-[85%] ${
                                message.role === 'user' 
                                  ? 'bg-blue-50 border border-blue-100 text-blue-800' 
                                  : (message.status === 'error'
                                    ? 'bg-red-50 border border-red-100 text-gray-800'
                                    : 'bg-gray-100 border border-gray-200')
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                  ${message.role === 'user' 
                                    ? 'bg-blue-200 text-blue-700' 
                                    : (message.status === 'error'
                                      ? 'bg-red-200 text-red-700'
                                      : 'bg-gray-200 text-gray-700')
                                  }`}
                                >
                                  {message.role === 'user' ? 'U' : 'AI'}
                                </div>
                                <p className="text-xs font-medium text-gray-500">
                                  {message.role === 'user' ? 'You' : 'Image Creator'}
                                  {message.status === 'loading' && (
                                    <span className="inline-block ml-2">
                                      <Loader2 className="h-3 w-3 animate-spin inline-block" />
                                    </span>
                                  )}
                                </p>
                                <span className="text-xs text-gray-400 ml-auto">
                                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              {/* Message content */}
                              <p className="whitespace-pre-wrap text-sm mb-2">{message.content}</p>
                              
                              {/* If there's an image, display it */}
                              {message.imageUrl && (
                                <div className="mt-2 relative group">
                                  <img 
                                    src={message.imageUrl} 
                                    alt="AI-generated image" 
                                    className="w-full h-auto rounded-lg max-h-[300px] object-contain"
                                  />
                                  <div className="absolute inset-0 bg-gray-900 bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center rounded-lg">
                                    <a 
                                      href={message.imageUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      View Full Image
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-[200px] text-gray-400">
                          <div className="text-center">
                            <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No images created yet. Try describing one!</p>
                            <p className="text-xs mt-2">For example: "A colorful magical forest with glowing mushrooms"</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {error && state.activeTab === 'image' && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex gap-2">
                      <Textarea 
                        placeholder="Describe an image... (e.g., 'A futuristic city with flying cars')"
                        value={state.imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="min-h-[80px] flex-grow"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault();
                            if (!isGeneratingImage && state.imagePrompt.trim()) {
                              handleGenerateImage();
                            }
                          }
                        }}
                        dir="auto" // Auto-detect text direction for RTL support
                      />
                      <Button 
                        onClick={handleGenerateImage} 
                        disabled={isGeneratingImage || !state.imagePrompt.trim()}
                        className="self-end h-10 px-4"
                      >
                        {isGeneratingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
                            <path d="m22 2-7 20-4-9-9-4Z"/>
                            <path d="M22 2 11 13"/>
                          </svg>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Press Ctrl+Enter to generate your image</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={onBack} 
              variant="outline" 
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Previous Stage</span>
            </Button>
            <Button 
              onClick={onComplete} 
              size="lg"
              disabled={false} // Allow users to proceed even if API calls fail
            >
              <span>Continue to Next Stage</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
