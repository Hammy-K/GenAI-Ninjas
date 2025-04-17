import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzePrompt } from '@/lib/openai';
import { useStageState } from '@/hooks/useStageState';
import { validateInput } from '@/lib/inputFilter';

interface PromptChallengeStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge?: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface PromptChallengeState {
  improvedPrompt: string;
  analysis: { score: number; feedback: string; improvement: string } | null;
  hasCompleted: boolean;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
}

export function PromptChallengeStage({ onComplete, onEarnXp, onUnlockBadge, onBack }: PromptChallengeStageProps) {
  // Use custom hook for persisted state
  const [state, setState] = useStageState<PromptChallengeState>('promptChallenge', {
    improvedPrompt: '',
    analysis: null,
    hasCompleted: false,
    hasEarnedXp: false,
    hasUnlockedBadge: false
  });
  
  // Utility functions to update individual state properties
  const setImprovedPrompt = (prompt: string) => setState(prev => ({ ...prev, improvedPrompt: prompt }));
  const setAnalysis = (analysisData: { score: number; feedback: string; improvement: string } | null) => 
    setState(prev => ({ ...prev, analysis: analysisData }));
  const setHasCompleted = (completed: boolean) => setState(prev => ({ ...prev, hasCompleted: completed }));
  const setHasEarnedXp = (earned: boolean) => setState(prev => ({ ...prev, hasEarnedXp: earned }));
  
  // Local UI state - no need to persist
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  const weakPrompt = "Create an image of a cat";
  
  const handleSubmitImprovement = async () => {
    // Validate the input using the shared utility function
    const validation = validateInput(state.improvedPrompt);
    if (!validation.isValid) {
      setError(validation.errorMessage);
      return;
    }
    
    setError('');
    setIsAnalyzing(true);
    
    try {
      const result = await analyzePrompt(state.improvedPrompt);
      setAnalysis(result);
      
      if (result.score >= 7) {
        // Only award XP and badge once
        if (!state.hasEarnedXp) {
          onEarnXp(15, 'prompt_engineering_success');
          setHasEarnedXp(true);
        }
        
        // Award the Prompt Engineer badge
        if (!state.hasUnlockedBadge && onUnlockBadge) {
          onUnlockBadge('prompt_engineer_badge', 'prompt_engineering_success');
          setState(prev => ({
            ...prev,
            hasUnlockedBadge: true
          }));
        }
        
        setHasCompleted(true);
      }
    } catch (err: any) {
      const error = err as Error;
      if (error instanceof Error && error.message && 
          (error.message.includes("quota") || error.message.toLowerCase().includes("429"))) {
        setError("API quota exceeded. Please try again later or use a different API key.");
      } else {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="prompt-challenge-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">تحدي هندسة البرومبت</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              تعلم كيفية كتابة برومبتات أفضل من خلال تحسين الأمثلة الضعيفة. البرومبتات الجيدة محددة وواضحة ومفصلة.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold mb-3">بروبت ضعيف:</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                  <p className="font-medium">{weakPrompt}</p>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg border">
                  <h4 className="font-bold mb-2">لماذا هذا ضعيف؟</h4>
                  <p className="text-sm">هذا البرومبت غامض جداً. لا يحدد نوع القطة أو المكان أو الأسلوب أو أي تفاصيل أخرى قد تساعد الذكاء الاصطناعي على إنشاء صورة محددة.</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold mb-3">البروبت المحسّن:</h3>
                <Textarea 
                  placeholder="أعد كتابة البروبت لجعله أكثر تحديداً وتفصيلاً..."
                  value={state.improvedPrompt}
                  onChange={(e) => setImprovedPrompt(e.target.value)}
                  className="min-h-[100px] mb-4"
                  dir="auto"
                />
                
                <Button 
                  onClick={handleSubmitImprovement} 
                  disabled={isAnalyzing || !state.improvedPrompt.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    'تحليل البروبت'
                  )}
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {state.analysis && (
              <div className="bg-neutral-50 p-4 rounded-lg border mb-6">
                <h3 className="font-bold mb-2">تحليل:</h3>
                <div className="mb-2">
                  <span className="font-medium">النتيجة: {state.analysis.score}/10</span>
                  <div className="w-full bg-neutral-200 h-2 rounded-full mt-1">
                    <div 
                      className={`h-2 rounded-full ${state.analysis.score >= 7 ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${state.analysis.score * 10}%` }}
                    />
                  </div>
                </div>
                <p className="mb-3">{state.analysis.feedback}</p>
                <p className="text-sm text-neutral-600">{state.analysis.improvement}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={onBack} 
              variant="outline" 
              size="lg"
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              <span>المرحلة السابقة</span>
            </Button>
            <Button 
              onClick={onComplete} 
              size="lg"
              disabled={false} // Allow users to proceed even if API calls fail
            >
              <span>الانتقال للمرحلة التالية</span>
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
