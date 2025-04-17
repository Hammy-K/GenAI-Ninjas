import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface WelcomeStageProps {
  onComplete: () => void;
}

export function WelcomeStage({ onComplete }: WelcomeStageProps) {
  return (
    <div className="welcome-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">مرحباً بك في رحلة الذكاء التوليدي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              تعلم عن الذكاء الاصطناعي التوليدي من خلال تحديات تفاعلية واكسب الشارات أثناء تقدمك
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">تعلم</h3>
                <p>اكتشف أساسيات الذكاء الاصطناعي التوليدي</p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">جرب</h3>
                <p>اختبر أدوات الذكاء الاصطناعي بنفسك</p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 border">
                <h3 className="font-bold mb-2">ابتكر</h3>
                <p>ابني فكرة مشروعك الخاص باستخدام الذكاء الاصطناعي</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={onComplete} size="lg">
              <span>ابدأ الرحلة</span>
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
