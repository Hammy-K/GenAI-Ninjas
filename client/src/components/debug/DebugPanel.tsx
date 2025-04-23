import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { clearAllDataAndReload } from '@/lib/clearData';

/**
 * Debug Panel Component
 * Only appears in development mode to provide debugging tools
 */
export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const handleClearData = async () => {
    setIsClearing(true);
    await clearAllDataAndReload();
    // No need to reset state since page will reload
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-slate-800 text-white p-4 rounded-lg shadow-lg flex flex-col space-y-2 w-[240px]">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">🛠️ Debug Tools</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </Button>
          </div>
          <hr className="border-slate-600" />
          <Button 
            variant="destructive" 
            size="sm"
            disabled={isClearing}
            onClick={handleClearData}
          >
            {isClearing ? 'Clearing...' : 'Clear All Data & Reload'}
          </Button>
          <p className="text-xs text-slate-400 mt-2">
            This will clear all localStorage, cookies, and server session data.
          </p>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-slate-800 text-white hover:bg-slate-700"
          onClick={() => setIsOpen(true)}
        >
          🛠️ Debug
        </Button>
      )}
    </div>
  );
}