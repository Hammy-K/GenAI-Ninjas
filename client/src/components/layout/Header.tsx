import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface HeaderProps {
  xp: number;
}

export function Header({ xp }: HeaderProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-primary px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-md">
      <div className="flex items-center space-x-reverse space-x-2">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <span className="text-primary-dark text-xl font-bold">جن</span>
        </div>
        <h1 className="text-white font-bold text-xl">{t('app_name')}</h1>
      </div>
      
      <div className="flex items-center space-x-reverse space-x-3">
        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center">
          <span className="text-white font-bold">{t('xp', { count: xp })}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </div>
        
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button 
              className="text-white focus:outline-none" 
              title={t('menu')}
              aria-label={t('menu')}
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px]">
            <div className="py-4">
              <div className="px-4 py-2 hover:bg-neutral-100 rounded-md cursor-pointer">
                {t('help')}
              </div>
              <div className="px-4 py-2 hover:bg-neutral-100 rounded-md cursor-pointer">
                {t('save_progress')}
              </div>
              <div className="px-4 py-2 hover:bg-neutral-100 rounded-md cursor-pointer">
                {t('settings')}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
