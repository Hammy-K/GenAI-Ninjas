import { useTranslation } from 'react-i18next';

import noonLogo from '@/assets/Group 603416.png';
import mcitLogo from '@/assets/MCITlogo.png';

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-neutral-100 px-4 py-5">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-3 md:mb-0 text-center md:text-right">
          <p className="text-sm text-neutral-500">{t('copyright')}</p>
        </div>
        <div className="flex items-center space-x-reverse space-x-8">
          <a 
            href="https://mcit.gov.sa" 
            target="_blank" 
            rel="noopener noreferrer"
            className="focus:outline-none flex items-center"
            aria-label="Ministry of Communications and Information Technology"
          >
            <img src={mcitLogo} alt="MCIT Logo" className="h-12" />
          </a>
          <a 
            href="https://noon.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="focus:outline-none flex items-center"
            aria-label="Noon"
          >
            <img src={noonLogo} alt="Noon Logo" className="h-10" />
          </a>
        </div>
      </div>
    </footer>
  );
}
