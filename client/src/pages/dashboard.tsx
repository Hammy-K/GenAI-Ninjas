import { useState } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock } from 'lucide-react';
import { useQuest } from '@/hooks/useQuest';

// Import mission card image
import mission1Image from '@/assets/Group 603416.png';

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
        <div className="max-w-6xl mx-auto">
          {/* Welcome header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, {studentName}!</h1>
            <p className="text-muted-foreground">Your GenAI learning journey begins here.</p>
          </div>
          
          {/* Missions section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Missions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Mission 1 - Active */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Mission 1: Build Your First GenAI App
                    {isMission1Complete && (
                      <span className="text-green-500 text-sm font-normal">
                        (Completed)
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Learn prompting, generate with AI, and publish your first web app.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100 mb-4">
                    <img 
                      src={mission1Image}
                      alt="Mission 1 - Build Your First GenAI App"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Difficulty: Beginner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Badges: {unlockedBadges.length} / 3</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleStartMission1} 
                    className="w-full"
                  >
                    {isMission1Complete ? 'Resume Mission' : 'Start Mission'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Mission 2 - Locked */}
              <Card className="border border-gray-200 opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-500">
                    Mission 2: Advanced GenAI Skills
                    <Lock className="w-4 h-4" />
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete Mission 1 to unlock this mission.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100 mb-4">
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <span>Difficulty: Intermediate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <span>Badges: 0 / 3</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    disabled 
                    variant="outline" 
                    className="w-full cursor-not-allowed"
                  >
                    Locked
                    <Lock className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Mission 3 - Locked */}
              <Card className="border border-gray-200 opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-500">
                    Mission 3: GenAI Expert Challenge
                    <Lock className="w-4 h-4" />
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete previous missions to unlock.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100 mb-4">
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <span>Difficulty: Advanced</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <span>Badges: 0 / 3</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    disabled 
                    variant="outline" 
                    className="w-full cursor-not-allowed"
                  >
                    Locked
                    <Lock className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}