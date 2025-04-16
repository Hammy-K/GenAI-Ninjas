import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckIcon, Download, RefreshCw, Share2 } from 'lucide-react';
import { WaveAnimation } from '../ui/wave-animation';
import { Confetti } from '../ui/confetti';

interface Badge {
  name: string;
  icon: JSX.Element;
  unlocked: boolean;
}

interface WrapUpStageProps {
  onRestart: () => void;
  totalXp: number;
  unlockedBadges: string[];
}

export function WrapUpStage({ onRestart, totalXp, unlockedBadges }: WrapUpStageProps) {
  const { t } = useTranslation();
  
  const badges: Badge[] = [
    {
      name: t('explorer_badge'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      unlocked: unlockedBadges.includes('explorer_badge')
    },
    {
      name: t('prompt_master_badge'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      unlocked: unlockedBadges.includes('prompt_master_badge')
    },
    {
      name: t('image_artist_badge'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      unlocked: unlockedBadges.includes('image_artist_badge')
    },
    {
      name: t('project_creator_badge'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      unlocked: unlockedBadges.includes('project_creator_badge')
    }
  ];
  
  const learningPoints = [
    "فهم الذكاء الاصطناعي التوليدي وآلية عمله",
    "كيفية كتابة توجيهات فعالة للذكاء الاصطناعي",
    "تجربة توليد النصوص والصور باستخدام الذكاء الاصطناعي",
    "تطوير وتحسين الأفكار باستخدام الذكاء الاصطناعي"
  ];
  
  const nextSteps = [
    "طبّق ما تعلمته في مشاريعك الشخصية",
    "استكشف المزيد من أدوات الذكاء الاصطناعي",
    "شارك إبداعاتك مع الآخرين",
    "تعلم المزيد عن تقنيات الذكاء الاصطناعي المتقدمة"
  ];
  
  return (
    <div className="wrap-up-stage">
      <Confetti trigger={true} />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative overflow-hidden">
          <WaveAnimation />
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-4">{t('wrap_up_title')}</h2>
            <p className="text-lg">{t('wrap_up_description')}</p>
            
            <div className="mt-6 inline-block bg-primary bg-opacity-10 px-6 py-3 rounded-full">
              <span className="text-primary font-bold text-xl">
                {t('xp', { count: totalXp })}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">{t('what_learned')}</h3>
                <ul className="space-y-2">
                  {learningPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 ml-2 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">{t('next_steps')}</h3>
                <ul className="space-y-2">
                  {nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-accent ml-2 flex-shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">{t('badges_earned')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {badges.map((badge, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                      badge.unlocked 
                        ? 'bg-primary-light text-white' 
                        : 'bg-neutral-200 text-neutral-400'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <span className={`text-sm font-medium ${
                    badge.unlocked ? 'text-primary' : 'text-neutral-500'
                  }`}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="outline" className="flex items-center">
              <Download className="ml-2 h-5 w-5" />
              {t('download_certificate')}
            </Button>
            
            <Button variant="outline" className="flex items-center">
              <Share2 className="ml-2 h-5 w-5" />
              {t('share_results')}
            </Button>
            
            <Button onClick={onRestart} className="flex items-center">
              <RefreshCw className="ml-2 h-5 w-5" />
              {t('start_again')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
