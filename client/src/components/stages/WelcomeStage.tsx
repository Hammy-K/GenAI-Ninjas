import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface WelcomeStageProps {
  onComplete: () => void;
}

export function WelcomeStage({ onComplete }: WelcomeStageProps) {
  return (
    <div className="welcome-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Welcome to GenAI Quest</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Learn about Generative AI through interactive challenges and earn badges as you progress
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">Learn</h3>
                <p>Discover the basics of Generative AI</p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">Try</h3>
                <p>Experiment with AI tools yourself</p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">Create</h3>
                <p>Build your own AI project idea</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={onComplete} size="lg">
              <span>Start Journey</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
