import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WaveAnimation } from '../ui/wave-animation';
import { CheckIcon, Music } from 'lucide-react';
import { Confetti } from '../ui/confetti';

interface DiscoveryStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number) => void;
}

export function DiscoveryStage({ onComplete, onEarnXp }: DiscoveryStageProps) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const genAiSteps = t('genai_steps', { returnObjects: true }) as string[];
  
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if answer contains key terms related to AI generation
    if (answer.toLowerCase().includes('ذكاء') || 
        answer.toLowerCase().includes('اصطناعي') || 
        answer.toLowerCase().includes('توليد') || 
        answer.toLowerCase().includes('آلة') || 
        answer.toLowerCase().includes('ai') || 
        answer.toLowerCase().includes('machine')) {
      
      setShowCorrectAnswer(true);
      onEarnXp(30);
      setShowConfetti(true);
    }
  };
  
  const handleNextStage = () => {
    onComplete();
  };
  
  return (
    <div className="discovery-stage">
      <Confetti trigger={showConfetti} />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative overflow-hidden">
          <WaveAnimation />
          
          <h2 className="text-2xl font-bold text-primary mb-4">{t('discovery_title')}</h2>
          <p className="text-lg mb-6">{t('discovery_description')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">{t('example1_title')}</h3>
              <div className="bg-white rounded p-3 border border-neutral-100">
                <p className="text-neutral-700">كان يوماً صيفياً دافئاً في المدينة القديمة. تملأ رائحة البحر والتوابل الهواء، بينما كانت الشمس تتراقص على أمواج البحر الزرقاء. هذه المدينة التي تحمل قصص الأجداد وأحلام الأحفاد، تنبض بالحياة كل صباح مع أصوات الباعة وضحكات الأطفال...</p>
              </div>
            </div>
            
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">{t('example2_title')}</h3>
              <div className="bg-white rounded p-3 border border-neutral-100">
                <img 
                  src="https://img.freepik.com/free-vector/realistic-generative-ai-background_23-2149988046.jpg" 
                  alt="صورة مولدة بالذكاء الاصطناعي" 
                  className="w-full h-40 object-cover rounded" 
                />
              </div>
            </div>
            
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">{t('example3_title')}</h3>
              <div className="bg-white rounded p-3 border border-neutral-100 font-mono text-sm">
                <pre className="text-neutral-700 overflow-x-auto">function calculateArea(radius) {
  return Math.PI * radius * radius;
}

function calculateCircumference(radius) {
  return 2 * Math.PI * radius;
}

// حساب مساحة ومحيط دائرة
const radius = 5;
console.log(`المساحة: ${calculateArea(radius)}`);
console.log(`المحيط: ${calculateCircumference(radius)}`);</pre>
              </div>
            </div>
            
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">{t('example4_title')}</h3>
              <div className="bg-white rounded p-3 border border-neutral-100">
                <div className="flex items-center justify-center h-40">
                  <div className="flex flex-col items-center">
                    <Music className="h-16 w-16 text-neutral-400" />
                    <p className="mt-2 text-neutral-600">{t('music_generated')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-8">
            <h3 className="font-bold text-lg text-yellow-800 mb-3">{t('what_in_common')}</h3>
            <form className="mb-4" onSubmit={handleSubmitAnswer}>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-grow">
                  <Input
                    type="text"
                    className="w-full"
                    placeholder={t('answer_placeholder')}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>
                <Button type="submit">{t('check')}</Button>
              </div>
            </form>
            
            {showCorrectAnswer && (
              <div>
                <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <CheckIcon className="h-6 w-6 text-green-600 ml-2" />
                    <div>
                      <h4 className="font-bold text-green-800">{t('correct_answer')}</h4>
                      <p className="text-green-700">{t('correct_answer_text')}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-lg mb-4">{t('what_is_genai')}</p>
                
                <Button onClick={handleNextStage}>{t('next_stage')}</Button>
              </div>
            )}
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200">
            <h3 className="font-bold text-lg mb-3">{t('how_genai_works')}</h3>
            <div className="relative h-32 md:h-60 overflow-hidden rounded-lg mb-4">
              <img 
                src="https://img.freepik.com/free-vector/artificial-intelligence-concept-landing-page_52683-23748.jpg" 
                alt="توضيح لكيفية عمل الذكاء الاصطناعي" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                <p className="text-white p-4 font-bold">{t('genai_explanation')}</p>
              </div>
            </div>
            <p className="mb-4">{t('genai_process')}</p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              {genAiSteps.map((step, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: step }} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
