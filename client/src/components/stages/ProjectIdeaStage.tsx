import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckIcon, Download, Loader2, Sparkles } from 'lucide-react';
import { WaveAnimation } from '../ui/wave-animation';
import { Confetti } from '../ui/confetti';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { generateProjectIdea } from '@/lib/openai';

interface ProjectIdeaStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
  onUnlockBadge: (badgeName: string) => void;
}

export function ProjectIdeaStage({ onComplete, onEarnXp, onUnlockBadge }: ProjectIdeaStageProps) {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [interests, setInterests] = useState('');
  const [goal, setGoal] = useState('');
  const [tools, setTools] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const [projectIdea, setProjectIdea] = useState<{
    title: string;
    description: string;
    steps: string[];
    tools: string[];
    difficulty: string;
  } | null>(null);
  
  const handleGenerateIdea = async () => {
    if (!interests.trim() || !goal.trim() || !tools.trim()) return;
    
    setError('');
    setIsGenerating(true);
    
    try {
      const idea = await generateProjectIdea(interests, goal, tools);
      setProjectIdea(idea);
      setShowConfetti(true);
      onEarnXp(40);
      
      // Unlock the project creator badge
      onUnlockBadge('project_creator_badge');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSaveIdea = () => {
    // In a real app, you might save to a database or export as PDF
    // Here we'll just trigger the next stage
    onComplete();
  };
  
  return (
    <div className="project-idea-stage">
      <Confetti trigger={showConfetti} />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative overflow-hidden">
          <WaveAnimation />
          
          <h2 className="text-2xl font-bold text-primary mb-4">{t('project_title')}</h2>
          <p className="text-lg mb-6">{t('project_description')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('your_project_idea')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="interests">{t('project_interests')}</Label>
                    <Input
                      id="interests"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder={t('interests_placeholder')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="goal">{t('project_goal')}</Label>
                    <Input
                      id="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder={t('goal_placeholder')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tools">{t('project_tools')}</Label>
                    <Input
                      id="tools"
                      value={tools}
                      onChange={(e) => setTools(e.target.value)}
                      placeholder={t('tools_placeholder')}
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleGenerateIdea} 
                    disabled={isGenerating || !interests.trim() || !goal.trim() || !tools.trim()}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="ml-2 h-4 w-4" />
                        {t('generate_ideas')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              {projectIdea ? (
                <Card>
                  <CardHeader className="bg-primary bg-opacity-10 border-b border-primary border-opacity-20">
                    <CardTitle className="text-primary">{projectIdea.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="mb-4">
                      <h3 className="font-bold mb-2">الوصف:</h3>
                      <p>{projectIdea.description}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-bold mb-2">الخطوات:</h3>
                      <ol className="list-decimal list-inside space-y-1">
                        {projectIdea.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    
                    <div className="mb-2">
                      <h3 className="font-bold mb-2">الأدوات:</h3>
                      <div className="flex flex-wrap gap-2">
                        {projectIdea.tools.map((tool, index) => (
                          <span 
                            key={index}
                            className="bg-neutral-100 px-2 py-1 rounded-md text-sm"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <span className="font-bold ml-2">المستوى:</span>
                      <span 
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          projectIdea.difficulty === 'beginner'
                            ? 'bg-green-100 text-green-800'
                            : projectIdea.difficulty === 'intermediate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {projectIdea.difficulty === 'beginner'
                          ? 'مبتدئ'
                          : projectIdea.difficulty === 'intermediate'
                          ? 'متوسط'
                          : 'متقدم'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleSaveIdea} 
                      className="w-full"
                      variant="default"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      {t('save_idea')}
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center p-6 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-neutral-300 mb-4 mx-auto" />
                    <p className="text-neutral-500">أدخل اهتماماتك وأهدافك والأدوات التي ترغب في استخدامها لتوليد فكرة مشروع مناسبة لك.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
