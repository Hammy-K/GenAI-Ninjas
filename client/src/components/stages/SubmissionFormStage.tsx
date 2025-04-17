import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface SubmissionFormStageProps {
  onComplete: () => void;
  onBack: () => void;
}

export function SubmissionFormStage({ onComplete, onBack }: SubmissionFormStageProps) {
  return (
    <div className="submission-form-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Submit Your Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6 text-muted-foreground">
              Please submit your AI-generated project link using the form below to complete your assignment.
            </p>
            
            <div className="rounded-md overflow-hidden border mb-6">
              <iframe
                className="airtable-embed"
                src="https://airtable.com/embed/appJeonZeuFDNlKUV/pagw0b4VcV4TCxJUi/form"
                frameBorder="0"
                width="100%"
                height="533"
                style={{ background: 'transparent', border: 'none' }}
                title="Project Submission Form"
              />
            </div>
            
            <div className="flex justify-between mt-4">
              <Button 
                onClick={onBack} 
                variant="outline" 
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Stage
              </Button>
              <Button 
                onClick={onComplete} 
                className="flex items-center"
              >
                Continue to Celebration
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}