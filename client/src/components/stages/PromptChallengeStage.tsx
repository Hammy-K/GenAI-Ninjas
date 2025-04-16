import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzePrompt } from '@/lib/openai';
import { ArrowRight } from 'lucide-react';

interface PromptChallengeStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
}

export function PromptChallengeStage({ onComplete, onEarnXp }: PromptChallengeStageProps) {
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [analysis, setAnalysis] = useState<{ score: number; feedback: string; improvement: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const weakPrompt = "Create an image of a cat";
  
  const handleSubmitImprovement = async () => {
    if (!improvedPrompt.trim()) return;
    
    setError('');
    setIsAnalyzing(true);
    
    try {
      const result = await analyzePrompt(improvedPrompt);
      setAnalysis(result);
      
      if (result.score >= 7) {
        onEarnXp(15);
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
            <CardTitle className="text-2xl md:text-3xl text-center">Prompt Engineering Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Learn to write better prompts by improving weak examples. Good prompts are specific, clear, and detailed.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold mb-3">Weak Prompt:</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                  <p className="font-medium">{weakPrompt}</p>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg border">
                  <h4 className="font-bold mb-2">Why is this weak?</h4>
                  <p className="text-sm">This prompt is too vague. It doesn't specify what kind of cat, the setting, style, or any other details that would help the AI create a specific image.</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold mb-3">Your Improved Prompt:</h3>
                <Textarea 
                  placeholder="Rewrite the prompt to make it more specific and detailed..."
                  value={improvedPrompt}
                  onChange={(e) => setImprovedPrompt(e.target.value)}
                  className="min-h-[100px] mb-4"
                />
                
                <Button 
                  onClick={handleSubmitImprovement} 
                  disabled={isAnalyzing || !improvedPrompt.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze My Prompt'
                  )}
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {analysis && (
              <div className="bg-neutral-50 p-4 rounded-lg border mb-6">
                <h3 className="font-bold mb-2">Analysis:</h3>
                <div className="mb-2">
                  <span className="font-medium">Score: {analysis.score}/10</span>
                  <div className="w-full bg-neutral-200 h-2 rounded-full mt-1">
                    <div 
                      className={`h-2 rounded-full ${analysis.score >= 7 ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${analysis.score * 10}%` }}
                    />
                  </div>
                </div>
                <p className="mb-3">{analysis.feedback}</p>
                <p className="text-sm text-neutral-600">{analysis.improvement}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
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
