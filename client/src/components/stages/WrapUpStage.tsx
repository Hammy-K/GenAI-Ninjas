import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Image, Lightbulb, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';

interface WrapUpStageProps {
  onRestart: () => void;
  totalXp: number;
  unlockedBadges: string[];
}

export function WrapUpStage({ onRestart, totalXp, unlockedBadges }: WrapUpStageProps) {
  const badges = [
    {
      id: 'explorer_badge',
      name: 'Explorer',
      icon: <Lightbulb className="h-6 w-6" />,
      description: 'Discovered the world of GenAI'
    },
    {
      id: 'prompt_master_badge',
      name: 'Prompt Master',
      icon: <MessageSquare className="h-6 w-6" />,
      description: 'Created effective AI prompts'
    },
    {
      id: 'image_artist_badge',
      name: 'Image Artist',
      icon: <Image className="h-6 w-6" />,
      description: 'Generated AI images'
    },
    {
      id: 'project_creator_badge',
      name: 'Project Creator',
      icon: <Sparkles className="h-6 w-6" />,
      description: 'Designed a GenAI project'
    }
  ];
  
  return (
    <div className="wrap-up-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Congratulations!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <p className="mb-4">
                You've completed the GenAI Quest adventure and earned valuable knowledge about generative AI.
              </p>
              
              <div className="bg-primary/10 text-primary font-bold text-xl rounded-full px-6 py-3 inline-block">
                {totalXp} XP Earned
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-center">Badges Earned</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {badges.map((badge) => {
                  const isUnlocked = unlockedBadges.includes(badge.id);
                  
                  return (
                    <div key={badge.id} className="flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 
                        ${isUnlocked ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                        {badge.icon}
                      </div>
                      <span className={`text-sm font-medium ${isUnlocked ? 'text-primary' : 'text-neutral-500'}`}>
                        {badge.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg border">
              <h3 className="font-bold mb-3">What You've Learned:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>Understanding the basics of generative AI</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>Creating effective prompts for AI systems</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>Generating text and images with AI</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>Building web applications with AI</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={onRestart} 
              size="lg"
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Start Again</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
