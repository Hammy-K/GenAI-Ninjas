import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckIcon, Image, Loader2, MessageSquare } from 'lucide-react';
import { generateText, generateImage } from '@/lib/openai';
import { WaveAnimation } from '../ui/wave-animation';
import { Confetti } from '../ui/confetti';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TryAIStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
  onUnlockBadge: (badgeName: string) => void;
}

export function TryAIStage({ onComplete, onEarnXp, onUnlockBadge }: TryAIStageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('text');
  
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  
  const [generatedText, setGeneratedText] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [textError, setTextError] = useState('');
  const [imageError, setImageError] = useState('');
  
  const [showTextSuccessConfetti, setShowTextSuccessConfetti] = useState(false);
  const [showImageSuccessConfetti, setShowImageSuccessConfetti] = useState(false);

  const [hasCompletedText, setHasCompletedText] = useState(false);
  const [hasCompletedImage, setHasCompletedImage] = useState(false);
  
  const tipsList = t('tips_list', { returnObjects: true }) as string[];
  
  const handleGenerateText = async () => {
    if (!textPrompt.trim()) return;
    
    setTextError('');
    setIsGeneratingText(true);
    setGeneratedText('');
    
    try {
      const response = await generateText({ prompt: textPrompt });
      if (response.error) {
        setTextError(response.error);
      } else {
        setGeneratedText(response.text);
        setShowTextSuccessConfetti(true);
        onEarnXp(20);
        setHasCompletedText(true);
        
        // Unlock the prompt master badge if not already unlocked
        onUnlockBadge('prompt_master_badge');
      }
    } catch (error) {
      setTextError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsGeneratingText(false);
    }
  };
  
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setImageError('');
    setIsGeneratingImage(true);
    setGeneratedImageUrl('');
    
    try {
      const response = await generateImage({ prompt: imagePrompt });
      if (response.error) {
        setImageError(response.error);
      } else {
        setGeneratedImageUrl(response.url);
        setShowImageSuccessConfetti(true);
        onEarnXp(30);
        setHasCompletedImage(true);
        
        // Unlock the image artist badge if not already unlocked
        onUnlockBadge('image_artist_badge');
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  const handleNextStage = () => {
    onComplete();
  };
  
  const bothActivitiesCompleted = hasCompletedText && hasCompletedImage;
  
  return (
    <div className="try-ai-stage">
      <Confetti trigger={showTextSuccessConfetti} />
      <Confetti trigger={showImageSuccessConfetti} />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative overflow-hidden">
          <WaveAnimation />
          
          <h2 className="text-2xl font-bold text-primary mb-4">{t('try_ai_title')}</h2>
          <p className="text-lg mb-6">{t('try_ai_description')}</p>
          
          <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('text_generation')}
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                {t('image_generation')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('text_generation')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Textarea 
                        placeholder={t('text_prompt_placeholder')}
                        value={textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    {textError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{textError}</AlertDescription>
                      </Alert>
                    )}
                    
                    {generatedText && (
                      <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                        <h3 className="font-bold mb-2 flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                          النص المولد
                        </h3>
                        <p className="whitespace-pre-wrap">{generatedText}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    onClick={handleGenerateText} 
                    disabled={isGeneratingText || !textPrompt.trim()}
                  >
                    {isGeneratingText ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      t('generate')
                    )}
                  </Button>
                  
                  {generatedText && (
                    <Button variant="outline" onClick={() => {
                      setTextPrompt('');
                      setGeneratedText('');
                    }}>
                      {t('try_again')}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="image" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('image_generation')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Textarea 
                        placeholder={t('image_prompt_placeholder')}
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    {imageError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{imageError}</AlertDescription>
                      </Alert>
                    )}
                    
                    {generatedImageUrl && (
                      <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                        <h3 className="font-bold mb-2 flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                          الصورة المولدة
                        </h3>
                        <div className="mt-2">
                          <img 
                            src={generatedImageUrl} 
                            alt="صورة مولدة بالذكاء الاصطناعي" 
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    onClick={handleGenerateImage} 
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      t('generate')
                    )}
                  </Button>
                  
                  {generatedImageUrl && (
                    <Button variant="outline" onClick={() => {
                      setImagePrompt('');
                      setGeneratedImageUrl('');
                    }}>
                      {t('try_again')}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200 mb-6">
            <h3 className="font-bold text-lg text-yellow-800 mb-2">{t('prompt_tips')}</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              {tipsList.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
          
          {bothActivitiesCompleted && (
            <div className="flex justify-center">
              <Button
                onClick={handleNextStage}
                size="lg"
                className="mt-4"
              >
                {t('next_stage')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
