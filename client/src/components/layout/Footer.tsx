import { useTranslation } from 'react-i18next';
import { HelpCircle, Save, Settings } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-neutral-100 px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-3 md:mb-0 text-center md:text-right">
          <p className="text-sm text-neutral-500">{t('copyright')}</p>
        </div>
        <div className="flex space-x-reverse space-x-4">
          <button 
            className="text-neutral-500 hover:text-primary transition-colors focus:outline-none"
            title={t('help')}
            aria-label={t('help')}
          >
            <span className="sr-only">{t('help')}</span>
            <HelpCircle className="h-6 w-6" />
          </button>
          <button 
            className="text-neutral-500 hover:text-primary transition-colors focus:outline-none"
            title={t('save_progress')}
            aria-label={t('save_progress')}
          >
            <span className="sr-only">{t('save_progress')}</span>
            <Save className="h-6 w-6" />
          </button>
          <button 
            className="text-neutral-500 hover:text-primary transition-colors focus:outline-none"
            title={t('settings')}
            aria-label={t('settings')}
          >
            <span className="sr-only">{t('settings')}</span>
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </div>
    </footer>
  );
}
