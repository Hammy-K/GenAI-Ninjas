import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, ArrowLeft, Download, Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { generateProjectIdea } from '@/lib/openai';
import { useStageState } from '@/hooks/useStageState';

interface ProjectIdeaStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
  onUnlockBadge: (badgeName: string) => void;
  onBack: () => void;
}

interface ProjectIdeaState {
  interests: string;
  goal: string;
  tools: string;
  projectIdea: {
    title: string;
    description: string;
    steps: string[];
    tools: string[];
    difficulty: string;
  } | null;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
}

export function ProjectIdeaStage({ onComplete, onEarnXp, onUnlockBadge, onBack }: ProjectIdeaStageProps) {
  // Use custom hook for persisted state
  const [state, setState] = useStageState<ProjectIdeaState>('projectIdea', {
    interests: '',
    goal: '',
    tools: '',
    projectIdea: null,
    hasEarnedXp: false,
    hasUnlockedBadge: false
  });
  
  // Utility functions to update individual state properties
  const setInterests = (value: string) => setState(prev => ({ ...prev, interests: value }));
  const setGoal = (value: string) => setState(prev => ({ ...prev, goal: value }));
  const setTools = (value: string) => setState(prev => ({ ...prev, tools: value }));
  const setProjectIdea = (idea: typeof state.projectIdea) => setState(prev => ({ ...prev, projectIdea: idea }));
  
  // Local UI state - no need to persist
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const handleGenerateIdea = async () => {
    if (!state.interests.trim() || !state.goal.trim() || !state.tools.trim()) return;
    
    setError('');
    setIsGenerating(true);
    
    try {
      const idea = await generateProjectIdea(state.interests, state.goal, state.tools);
      setProjectIdea(idea);
      
      // Only award XP and badge once
      if (!state.hasEarnedXp) {
        onEarnXp(40);
        setState(prev => ({ ...prev, hasEarnedXp: true }));
      }
      
      if (!state.hasUnlockedBadge) {
        onUnlockBadge('project_creator_badge');
        setState(prev => ({ ...prev, hasUnlockedBadge: true }));
      }
    } catch (err: any) {
      const error = err as Error;
      if (error.message && (error.message.includes("quota") || error.message.toLowerCase().includes("429"))) {
        setError("API quota exceeded. Please try again later or use a different API key.");
      } else if (error.message && (error.message.includes("check your input") || error.message.toLowerCase().includes("400"))) {
        setError("Invalid input. Please try different project parameters.");
      } else {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="project-idea-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Generate Project Idea</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Create a personalized AI project idea based on your interests and goals.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="interests">Your Interests</Label>
                    <Input
                      id="interests"
                      value={state.interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder="e.g., Education, games, art"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="goal">Your Goal</Label>
                    <Input
                      id="goal"
                      value={state.goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g., Learn coding, create website"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tools">Preferred Tools</Label>
                    <Input
                      id="tools"
                      value={state.tools}
                      onChange={(e) => setTools(e.target.value)}
                      placeholder="e.g., Web design, Python, ChatGPT"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleGenerateIdea} 
                    disabled={isGenerating || !state.interests.trim() || !state.goal.trim() || !state.tools.trim()}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Project Idea
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                {projectIdea ? (
                  <div className="bg-neutral-50 p-4 rounded-lg border">
                    <h3 className="font-bold text-lg text-primary mb-2">{projectIdea.title}</h3>
                    
                    <div className="mb-3">
                      <h4 className="font-bold mb-1">Description:</h4>
                      <p className="text-sm">{projectIdea.description}</p>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-bold mb-1">Steps:</h4>
                      <ol className="list-decimal list-inside text-sm">
                        {projectIdea.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    
                    <div className="mb-2">
                      <h4 className="font-bold mb-1">Tools:</h4>
                      <div className="flex flex-wrap gap-1">
                        {projectIdea.tools.map((tool, index) => (
                          <span 
                            key={index}
                            className="bg-neutral-200 px-2 py-0.5 rounded-md text-xs"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-3">
                      <span className="text-sm font-medium mr-2">Difficulty:</span>
                      <span 
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          projectIdea.difficulty === 'beginner'
                            ? 'bg-green-100 text-green-800'
                            : projectIdea.difficulty === 'intermediate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {projectIdea.difficulty}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-6 bg-neutral-50 rounded-lg border border-dashed">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 text-neutral-300 mb-2 mx-auto" />
                      <p className="text-neutral-500 text-sm">Enter your interests, goals, and preferred tools to generate a project idea.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
              <span>Continue to Final Stage</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
