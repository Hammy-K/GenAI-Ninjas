import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Image, Loader2, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';
import { generateText, generateImage } from '@/lib/openai';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStageState } from '@/hooks/useStageState';

interface TryAIStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
  onUnlockBadge: (badgeName: string) => void;
  onBack: () => void;
}

interface TryAIState {
  activeTab: string;
  textPrompt: string;
  imagePrompt: string;
  generatedText: string;
  generatedImageUrl: string;
  hasCompleted: boolean;
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
    messageHistory: []
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
      const response = await generateText({ 
        prompt: state.textPrompt,
        messageHistory: state.messageHistory
      });
      
      if (!response.error) {
        setState(prev => ({
          ...prev,
          messageHistory: [
            ...prev.messageHistory,
            { role: 'user', content: state.textPrompt },
            { role: 'assistant', content: response.text }
          ]
        }));
      }
      if (response.error) {
        if (response.error === 'Content flagged as inappropriate') {
          const categories = response.moderationResult.categories;
          const flaggedCategories = Object.entries(categories)
            .filter(([_, flagged]) => flagged)
            .map(([category]) => category)
            .join(', ');
          setError(`Content was flagged for: ${flaggedCategories}. Please revise your prompt.`);
        }
        // Check for quota exceeded error
        else if (response.error.includes("quota") || response.error.toLowerCase().includes("429")) {
          setError("API quota exceeded. Please try again later or use a different API key.");
        } else {
          setError(response.error);
        }
      } else {
        setGeneratedText(response.text);
        onEarnXp(20);
        setHasCompleted(true);
        onUnlockBadge('prompt_master_badge');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsGeneratingText(false);
    }
  };
  
  const handleGenerateImage = async () => {
    if (!state.imagePrompt.trim()) return;
    
    setError('');
    setIsGeneratingImage(true);
    
    try {
      const response = await generateImage({ prompt: state.imagePrompt });
      if (response.error) {
        // Check for quota exceeded or bad request errors
        if (response.error.includes("quota") || response.error.toLowerCase().includes("429")) {
          setError("API quota exceeded. Please try again later or use a different API key.");
        } else if (response.error.includes("check your input") || response.error.toLowerCase().includes("400")) {
          setError("Invalid prompt. Please try a different description without potentially problematic content.");
        } else {
          setError(response.error);
        }
      } else {
        setGeneratedImageUrl(response.url);
        onEarnXp(30);
        setHasCompleted(true);
        onUnlockBadge('image_artist_badge');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsGeneratingImage(false);
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
                  <div>
                    <Textarea 
                      placeholder="Enter a prompt (e.g., 'Write a short story about a space adventure')"
                      value={state.textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  {error && state.activeTab === 'text' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {state.generatedText && (
                    <div className="bg-neutral-50 p-4 rounded-lg border">
                      <h3 className="font-bold mb-2">Generated Text:</h3>
                      <p className="whitespace-pre-wrap">{state.generatedText}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <Button 
                      onClick={handleGenerateText} 
                      disabled={isGeneratingText || !state.textPrompt.trim()}
                    >
                      {isGeneratingText ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Text'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Textarea 
                      placeholder="Describe an image (e.g., 'A futuristic city with flying cars')"
                      value={state.imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  {error && state.activeTab === 'image' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {state.generatedImageUrl && (
                    <div className="bg-neutral-50 p-4 rounded-lg border">
                      <h3 className="font-bold mb-2">Generated Image:</h3>
                      <div className="mt-2">
                        <img 
                          src={state.generatedImageUrl} 
                          alt="AI-generated image" 
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <Button 
                      onClick={handleGenerateImage} 
                      disabled={isGeneratingImage || !state.imagePrompt.trim()}
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Image'
                      )}
                    </Button>
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
