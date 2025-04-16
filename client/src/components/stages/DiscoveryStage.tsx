import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useStageState } from '@/hooks/useStageState';

interface DiscoveryStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
  onBack: () => void;
}

interface DiscoveryState {
  hasEarnedXp: boolean;
  hasExploredOptions: boolean;
}

export function DiscoveryStage({ onComplete, onEarnXp, onBack }: DiscoveryStageProps) {
  // Use the custom hook to persist state
  const [state, setState] = useStageState<DiscoveryState>('discovery', {
    hasEarnedXp: false,
    hasExploredOptions: false
  });
  
  const handleComplete = () => {
    // Only award XP if not already awarded (prevents duplicates on navigation)
    if (!state.hasEarnedXp) {
      onEarnXp(30);
      setState(prev => ({ ...prev, hasEarnedXp: true }));
    }
    onComplete();
  };
  
  return (
    <div className="discovery-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Discover Generative AI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Generative AI refers to artificial intelligence systems that can generate new content, including text, images, 
              code, and more, based on patterns learned from existing data.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">Text Generation</h3>
                <p>AI systems that can write essays, stories, and answer questions in natural language</p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">Image Creation</h3>
                <p>AI that can create realistic or artistic images based on text descriptions</p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">Code Writing</h3>
                <p>AI that can generate programming code based on natural language instructions</p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">Music Composition</h3>
                <p>AI that can create original musical compositions in various styles</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Previous Stage</span>
            </Button>
            <Button onClick={handleComplete} size="lg">
              <span>Continue to Next Stage</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
