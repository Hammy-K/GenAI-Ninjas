import { useLocation } from 'wouter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useQuest } from '@/hooks/useQuest';
import journeyAvatar from '@/assets/JourneyAvatar.png';

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const { xp, currentStage, unlockedBadges } = useQuest();
  
  // Hard-coded student name for now (could be made dynamic in the future)
  const studentName = "Student";
  
  // Check if Mission 1 is complete
  const isMission1Complete = currentStage === 6; // If on final stage, Mission 1 is complete
  
  const handleStartMission1 = () => {
    navigate('/mission1');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-700 font-tajawal">
      <Header xp={xp} />
      
      {/* Main content */}
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, {studentName}!</h1>
            <p className="text-muted-foreground">Your GenAI learning journey begins here.</p>
          </div>
          
          {/* Missions section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Your Missions</h2>
            
            {/* Learning path with connecting lines */}
            <div className="relative mx-auto max-w-md py-8">
              {/* Background path line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 -translate-x-1/2 z-0"></div>
              
              {/* Mission 1 - Active */}
              <div className="relative z-10 flex items-center mb-24">
                <div className="w-full">
                  <div className="flex items-center mb-2">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-16 h-16 rounded-lg bg-primary shadow-lg flex items-center justify-center text-white font-bold text-xl relative overflow-hidden">
                        <span className="z-10">1</span>
                        {currentStage > 1 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-green-500">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-grow bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-lg">Mission 1: Build Your First GenAI App</h3>
                      <p className="text-sm text-gray-600 mb-3">Learn prompting, generate with AI, and publish your first web app.</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                          <span className="text-xs">Badges: {unlockedBadges.length}/3</span>
                        </div>
                        <Button 
                          onClick={handleStartMission1}
                          size="sm"
                          className="h-8"
                        >
                          {isMission1Complete ? 'Continue' : 'Start'}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Penguin avatar if current stage is within Mission 1 */}
                  {currentStage < 6 && (
                    <div className="absolute -bottom-6 left-3 ml-1.5">
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-md bg-white">
                        <img 
                          src={journeyAvatar} 
                          alt="Dr. Pengy" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mission 2 - Locked */}
              <div className="relative z-10 flex items-center mb-24">
                <div className="w-full">
                  <div className="flex items-center mb-2">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-16 h-16 rounded-lg bg-gray-300 flex items-center justify-center text-white font-bold text-xl">
                        <Lock className="w-6 h-6 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-grow bg-white rounded-lg border border-gray-200 p-4 shadow-sm opacity-75">
                      <h3 className="font-bold text-lg text-gray-500">Mission 2: Advanced GenAI Skills</h3>
                      <p className="text-sm text-gray-400 mb-3">Complete Mission 1 to unlock this mission.</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                          <span className="text-xs text-gray-400">Badges: 0/3</span>
                        </div>
                        <Button 
                          disabled
                          size="sm"
                          variant="outline"
                          className="h-8 opacity-50"
                        >
                          Locked
                          <Lock className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mission 3 - Locked */}
              <div className="relative z-10 flex items-center">
                <div className="w-full">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-16 h-16 rounded-lg bg-gray-300 flex items-center justify-center text-white font-bold text-xl">
                        <Lock className="w-6 h-6 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-grow bg-white rounded-lg border border-gray-200 p-4 shadow-sm opacity-75">
                      <h3 className="font-bold text-lg text-gray-500">Mission 3: GenAI Expert Challenge</h3>
                      <p className="text-sm text-gray-400 mb-3">Complete previous missions to unlock.</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                          <span className="text-xs text-gray-400">Badges: 0/3</span>
                        </div>
                        <Button 
                          disabled
                          size="sm"
                          variant="outline"
                          className="h-8 opacity-50"
                        >
                          Locked
                          <Lock className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}