import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckIcon, Loader2 } from 'lucide-react';
import { WaveAnimation } from '../ui/wave-animation';
import { Confetti } from '../ui/confetti';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzePrompt } from '@/lib/openai';
import { Progress } from '@/components/ui/progress';

interface PromptChallengeStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
}

export function PromptChallengeStage({ onComplete, onEarnXp }: PromptChallengeStageProps) {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const weakPromptExamples = t('weak_prompt_examples', { returnObjects: true }) as string[];
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [currentWeakPrompt, setCurrentWeakPrompt] = useState(weakPromptExamples[0]);
  
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [analysis, setAnalysis] = useState<{ score: number; feedback: string; improvement: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const totalChallenges = weakPromptExamples.length;
  
  useEffect(() => {
    setCurrentWeakPrompt(weakPromptExamples[currentPromptIndex]);
    setImprovedPrompt('');
    setAnalysis(null);
  }, [currentPromptIndex, weakPromptExamples]);
  
  const handleSubmitImprovement = async () => {
    if (!improvedPrompt.trim()) return;
    
    setError('');
    setIsAnalyzing(true);
    
    try {
      const result = await analyzePrompt(improvedPrompt);
      setAnalysis(result);
      
      if (result.score >= 7) {
        // Good improvement
        onEarnXp(15);
        setShowConfetti(true);
        
        // Mark this challenge as completed
        setCompletedChallenges(prev => prev + 1);
        
        // Wait a moment before automatically advancing to next challenge
        if (currentPromptIndex < weakPromptExamples.length - 1) {
          setTimeout(() => {
            setCurrentPromptIndex(prev => prev + 1);
          }, 3000);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleNextStage = () => {
    onComplete();
  };
  
  const progressPercentage = (completedChallenges / totalChallenges) * 100;
  
  return (
    <div className="prompt-challenge-stage">
      <Confetti trigger={showConfetti} />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative overflow-hidden">
          <WaveAnimation />
          
          <h2 className="text-2xl font-bold text-primary mb-4">{t('prompt_challenge_title')}</h2>
          <p className="text-lg mb-6">{t('prompt_challenge_description')}</p>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>التقدم</span>
              <span>{completedChallenges} / {totalChallenges}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-700">{t('weak_prompt')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-lg font-medium">{currentWeakPrompt}</p>
                
                <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h4 className="font-bold text-neutral-700 mb-2">{t('why_weak')}</h4>
                  <p className="text-neutral-600">{t('weak_explanation')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-700">{t('improved_prompt')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Textarea 
                  placeholder={t('improve_prompt')}
                  value={improvedPrompt}
                  onChange={(e) => setImprovedPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {analysis && (
                  <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex items-center mb-2">
                      <h4 className="font-bold text-neutral-700">التقييم: </h4>
                      <div className="ml-2 flex items-center">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div 
                            key={i}
                            className={`w-2 h-4 ml-[2px] rounded-sm ${i < analysis.score ? 'bg-green-500' : 'bg-neutral-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-neutral-600 mb-2">{analysis.feedback}</p>
                    
                    {analysis.score >= 7 && (
                      <div className="flex items-start mt-2 text-green-600">
                        <CheckIcon className="h-5 w-5 ml-1 flex-shrink-0 mt-0.5" />
                        <p className="font-semibold">{t('challenge_complete')}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubmitImprovement} 
                  disabled={isAnalyzing || !improvedPrompt.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      {t('generating')}
                    </>
                  ) : (
                    t('submit_improvement')
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {completedChallenges === totalChallenges && (
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
