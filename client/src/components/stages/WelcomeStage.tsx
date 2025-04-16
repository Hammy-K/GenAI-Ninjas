import { useTranslation } from 'react-i18next';
import { CheckIcon, Lightbulb, MessageSquare, Sparkles } from 'lucide-react';
import { WaveAnimation } from '../ui/wave-animation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Lock } from 'lucide-react';

interface WelcomeStageProps {
  onComplete: () => void;
}

export function WelcomeStage({ onComplete }: WelcomeStageProps) {
  const { t } = useTranslation();
  
  const learningPoints = t('learning_points', { returnObjects: true }) as string[];

  return (
    <div className="welcome-stage">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative overflow-hidden">
          <WaveAnimation />
          
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">{t('welcome_title')}</h2>
          
          <p className="text-lg mb-6">{t('welcome_description')}</p>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h3 className="mr-3 font-bold text-lg">{t('learn_explore')}</h3>
              </div>
              <p>{t('learn_explore_desc')}</p>
            </div>
            
            <div className="flex-1 bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="mr-3 font-bold text-lg">{t('try_yourself')}</h3>
              </div>
              <p>{t('try_yourself_desc')}</p>
            </div>
            
            <div className="flex-1 bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mr-3 font-bold text-lg">{t('create_project')}</h3>
              </div>
              <p>{t('create_project_desc')}</p>
            </div>
          </div>
          
          <div className="flex justify-center mb-8">
            <img 
              src="https://img.freepik.com/free-vector/artificial-intelligence-concept_23-2148210411.jpg" 
              alt="رسم توضيحي للذكاء الاصطناعي" 
              className="rounded-lg w-full max-w-2xl h-auto shadow-md"
            />
          </div>
          
          <div className="bg-primary bg-opacity-5 rounded-lg p-6 border border-primary-light border-opacity-30 mb-6">
            <h3 className="text-xl font-bold text-primary mb-3">{t('what_to_learn')}</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {learningPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-accent ml-2 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 mb-6">
            <div className="flex items-start">
              <div className="p-2 bg-yellow-100 rounded-full ml-4">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{t('important_hint')}</h3>
                <p>{t('no_experience_needed')}</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onComplete} 
            className="mx-auto font-bold py-3 px-6 rounded-full text-lg shadow-lg flex items-center"
          >
            <span>{t('start_journey')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl-flip" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-neutral-700">{t('badges_title')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-2 relative">
                <Lightbulb className="h-8 w-8 text-neutral-400" />
                <div className="absolute top-0 right-0 w-5 h-5 bg-neutral-300 rounded-full flex items-center justify-center">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="text-sm font-medium text-neutral-500">{t('explorer_badge')}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-2 relative">
                <MessageSquare className="h-8 w-8 text-neutral-400" />
                <div className="absolute top-0 right-0 w-5 h-5 bg-neutral-300 rounded-full flex items-center justify-center">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="text-sm font-medium text-neutral-500">{t('prompt_master_badge')}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-2 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="absolute top-0 right-0 w-5 h-5 bg-neutral-300 rounded-full flex items-center justify-center">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="text-sm font-medium text-neutral-500">{t('image_artist_badge')}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-2 relative">
                <Sparkles className="h-8 w-8 text-neutral-400" />
                <div className="absolute top-0 right-0 w-5 h-5 bg-neutral-300 rounded-full flex items-center justify-center">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="text-sm font-medium text-neutral-500">{t('project_creator_badge')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
