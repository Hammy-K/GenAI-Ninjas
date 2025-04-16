import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Image, MessageSquare, Sparkles, RefreshCw, Award, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface WrapUpStageProps {
  onRestart: () => void;
  totalXp: number;
  unlockedBadges: string[];
  onCompleteMission?: (missionId: number) => void;
}

export function WrapUpStage({ onRestart, totalXp, unlockedBadges, onCompleteMission }: WrapUpStageProps) {
  const [location, navigate] = useLocation();
  
  // Handle mission completion and return to dashboard
  const handleCompleteMission = () => {
    if (onCompleteMission) {
      // Complete Mission 1
      onCompleteMission(1);
      console.log("Mission 1 completion triggered");
    } else {
      console.log("Mission completion function not available");
    }
    
    // Navigate back to dashboard
    navigate('/');
  };
  
  const badges = [
    {
      id: 'prompt_engineer_badge',
      name: 'Prompt Engineer',
      icon: <MessageSquare className="h-8 w-8" />,
      description: 'Created effective AI prompts'
    },
    {
      id: 'image_artist_badge',
      name: 'Image Artist',
      icon: <Image className="h-8 w-8" />,
      description: 'Generated AI images'
    },
    {
      id: 'ai_coder_badge',
      name: 'AI-Coder',
      icon: <Sparkles className="h-8 w-8" />,
      description: 'Built a web app with AI'
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
              <div className="flex justify-center gap-8 mx-auto">
                {badges.map((badge) => {
                  const isUnlocked = unlockedBadges.includes(badge.id);
                  
                  return (
                    <div key={badge.id} className="flex flex-col items-center text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 
                        ${isUnlocked ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                        <span className="h-8 w-8">
                          {badge.icon}
                        </span>
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
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              onClick={handleCompleteMission} 
              size="lg"
              variant="default"
              className="flex items-center w-full sm:w-auto"
            >
              <Award className="mr-2 h-5 w-5" />
              <span>Mission Completed</span>
            </Button>
            
            <Button 
              onClick={onRestart} 
              size="lg"
              variant="outline"
              className="flex items-center w-full sm:w-auto"
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
