import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Image, Loader2, MessageSquare } from 'lucide-react';
import { generateText, generateImage } from '@/lib/openai';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight } from 'lucide-react';

interface TryAIStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
  onUnlockBadge: (badgeName: string) => void;
}

export function TryAIStage({ onComplete, onEarnXp, onUnlockBadge }: TryAIStageProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  
  // Track completed tasks for progression
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const handleGenerateText = async () => {
    if (!textPrompt.trim()) return;
    
    setError('');
    setIsGeneratingText(true);
    
    try {
      const response = await generateText({ prompt: textPrompt });
      if (response.error) {
        setError(response.error);
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
    if (!imagePrompt.trim()) return;
    
    setError('');
    setIsGeneratingImage(true);
    
    try {
      const response = await generateImage({ prompt: imagePrompt });
      if (response.error) {
        setError(response.error);
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
            
            <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="mb-6">
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
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  {error && activeTab === 'text' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {generatedText && (
                    <div className="bg-neutral-50 p-4 rounded-lg border">
                      <h3 className="font-bold mb-2">Generated Text:</h3>
                      <p className="whitespace-pre-wrap">{generatedText}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <Button 
                      onClick={handleGenerateText} 
                      disabled={isGeneratingText || !textPrompt.trim()}
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
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  {error && activeTab === 'image' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {generatedImageUrl && (
                    <div className="bg-neutral-50 p-4 rounded-lg border">
                      <h3 className="font-bold mb-2">Generated Image:</h3>
                      <div className="mt-2">
                        <img 
                          src={generatedImageUrl} 
                          alt="AI-generated image" 
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <Button 
                      onClick={handleGenerateImage} 
                      disabled={isGeneratingImage || !imagePrompt.trim()}
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
          <CardFooter className="flex justify-center">
            <Button 
              onClick={onComplete} 
              size="lg"
              disabled={!hasCompleted}
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
