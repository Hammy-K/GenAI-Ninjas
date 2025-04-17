import { useLocation } from 'wouter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, CheckCircle2, User, Zap, Trophy, Star } from 'lucide-react';
import { useQuest } from '@/hooks/useQuest';
import penguinAvatar from '@assets/Penguin.png';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const { xp, currentStage, unlockedBadges, completedMissions, isMissionCompleted } = useQuest();
  
  // Student profile data - using state to handle user input
  const [studentName, setStudentName] = useState<string>(() => {
    // Try to get from localStorage
    return localStorage.getItem('studentName') || '';
  });
  
  const [studentGrade, setStudentGrade] = useState<string>(() => {
    // Try to get from localStorage 
    return localStorage.getItem('studentGrade') || '';
  });
  
  const [showProfileForm, setShowProfileForm] = useState<boolean>(!studentName || !studentGrade);
  
  // Save student information when provided
  useEffect(() => {
    if (studentName) {
      localStorage.setItem('studentName', studentName);
    }
    if (studentGrade) {
      localStorage.setItem('studentGrade', studentGrade);
    }
  }, [studentName, studentGrade]);
  
  // Track mission completion status
  const isMission1Complete = isMissionCompleted(1);
  const isMission2Complete = isMissionCompleted(2);
  const isMission3Complete = isMissionCompleted(3);
  
  // Next active mission
  const getNextActiveMission = () => {
    if (!isMission1Complete) return 1;
    if (!isMission2Complete) return 2;
    if (!isMission3Complete) return 3;
    return 4;
  };
  
  const nextActiveMission = getNextActiveMission();
  
  // Debug logging
  console.log("Dashboard rendered with:", { 
    completedMissions,
    isMission1Complete,
    currentStage,
    nextActiveMission
  });
  
  // Navigation handlers
  const handleStartMission = (missionNumber: number) => {
    if (missionNumber === 1) {
      navigate('/mission1');
    } else if (missionNumber === 2 && isMission1Complete) {
      // Future implementation: navigate('/mission2');
      console.log("Mission 2 would be started");
    } else if (missionNumber === 3 && isMission1Complete && isMission2Complete) {
      // Future implementation: navigate('/mission3');
      console.log("Mission 3 would be started");
    }
  };
  
  // Handle form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowProfileForm(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800 font-tajawal" dir="rtl">
      <Header xp={xp} />
      
      {/* Profile information form (shown only on first visit) */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-center mb-4">مرحباً بك!</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">فضلاً أدخل معلوماتك الأساسية لبدء الرحلة التعليمية</p>
            
            <form onSubmit={handleProfileSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="studentName">اسمك</Label>
                  <Input 
                    id="studentName" 
                    value={studentName} 
                    onChange={(e) => setStudentName(e.target.value)} 
                    placeholder="الاسم الكامل" 
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="studentGrade">الصف الدراسي</Label>
                  <Input 
                    id="studentGrade" 
                    value={studentGrade} 
                    onChange={(e) => setStudentGrade(e.target.value)} 
                    placeholder="مثال: الصف التاسع" 
                    className="mt-1"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">بدء الرحلة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Two-column layout: Journey on left, profile on right */}
          <div className="flex flex-col-reverse md:flex-row gap-6">
            
            {/* Left column: Mission Journey with zigzag path */}
            <div className="w-full md:w-2/3">
              {/* Learning path with zigzag flow */}
              <div className="relative py-6 px-4 md:px-8">
                {/* Connected zigzag path - SVG for proper path alignment */}
                <div className="absolute z-0 inset-0 right-12 left-12">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Main zigzag path - Full path */}
                    <path 
                      d="M80 10 L20 120 L80 230 L20 340 L80 450" 
                      stroke="#e2e8f0" 
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    
                    {/* Active section of the path - Only shows up to the current mission */}
                    <path 
                      d={nextActiveMission >= 1 ? "M80 10 L20 120" : ""}
                      stroke="#a78bfa" 
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path 
                      d={nextActiveMission >= 2 ? "M20 120 L80 230" : ""}
                      stroke="#a78bfa" 
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path 
                      d={nextActiveMission >= 3 ? "M80 230 L20 340" : ""}
                      stroke="#a78bfa" 
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path 
                      d={nextActiveMission >= 4 ? "M20 340 L80 450" : ""}
                      stroke="#a78bfa" 
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>
                
                {/* Mission 1 - "عبر عن نفسك بإبداع" */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 1 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div 
                      className={`relative cursor-pointer transition-transform hover:scale-105 mr-4
                        ${isMission1Complete ? 'text-green-600' : 'text-purple-600'}`}
                      onClick={() => handleStartMission(1)}
                    >
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center 
                        ${isMission1Complete ? 'bg-green-100' : 'bg-purple-100'}`}
                      >
                        {isMission1Complete ? (
                          <CheckCircle2 className="w-8 h-8" />
                        ) : (
                          <div className="text-lg font-bold">١</div>
                        )}
                      </div>
                    </div>
                    
                    <h3 
                      className={`font-medium text-sm cursor-pointer hover:opacity-80
                        ${isMission1Complete ? 'text-green-600' : 'text-purple-600'}`}
                      onClick={() => handleStartMission(1)}
                    >
                      عبّر عن نفسك بإبداع
                    </h3>
                    
                    {/* د. بنجي avatar - only show for next active mission */}
                    {nextActiveMission === 1 && (
                      <div className="absolute right-16 -top-6 transform translate-y-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md border-2 border-purple-200">
                          <img 
                            src={penguinAvatar} 
                            alt="د. بنجي" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1"></div>
                </div>
                
                {/* Mission 2 - "كيف تصنع قصص تعلق في البال" */}
                <div className="relative z-10 flex items-center mb-24">
                  <div className="flex-1"></div>
                  
                  {/* Mission 2 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div 
                      className={`relative cursor-pointer transition-transform hover:scale-105 ml-4
                        ${isMission2Complete ? 'text-green-600' : (isMission1Complete ? 'text-purple-600' : 'text-gray-400')}`}
                      onClick={() => isMission1Complete && handleStartMission(2)}
                    >
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center 
                        ${isMission2Complete ? 'bg-green-100' : (isMission1Complete ? 'bg-purple-100' : 'bg-gray-100')}`}
                      >
                        {isMission2Complete ? (
                          <CheckCircle2 className="w-8 h-8" />
                        ) : !isMission1Complete ? (
                          <Lock className="w-6 h-6 opacity-50" />
                        ) : (
                          <div className="text-lg font-bold">٢</div>
                        )}
                      </div>
                    </div>
                    
                    <h3 
                      className={`font-medium text-sm
                        ${isMission2Complete ? 'text-green-600' : (isMission1Complete ? 'text-purple-600 cursor-pointer hover:opacity-80' : 'text-gray-400')}`}
                      onClick={() => isMission1Complete && handleStartMission(2)}
                    >
                      كيف تصنع قصص تعلق في البال
                    </h3>
                    
                    {/* د. بنجي avatar - only show for next active mission */}
                    {nextActiveMission === 2 && (
                      <div className="absolute -right-2">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm border-2 border-white">
                          <img 
                            src={penguinAvatar} 
                            alt="د. بنجي" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mission 3 - "مهارات التصميم اللي تشد الانتباه" */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 3 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div 
                      className={`relative cursor-pointer transition-transform hover:scale-105 mr-4
                        ${isMission3Complete ? 'text-green-600' : (isMission1Complete && isMission2Complete ? 'text-purple-600' : 'text-gray-400')}`}
                      onClick={() => isMission1Complete && isMission2Complete && handleStartMission(3)}
                    >
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center 
                        ${isMission3Complete ? 'bg-green-100' : (isMission1Complete && isMission2Complete ? 'bg-purple-100' : 'bg-gray-100')}`}
                      >
                        {isMission3Complete ? (
                          <CheckCircle2 className="w-8 h-8" />
                        ) : !(isMission1Complete && isMission2Complete) ? (
                          <Lock className="w-6 h-6 opacity-50" />
                        ) : (
                          <div className="text-lg font-bold">٣</div>
                        )}
                      </div>
                    </div>
                    
                    <h3 
                      className={`font-medium text-sm
                        ${isMission3Complete ? 'text-green-600' : (isMission1Complete && isMission2Complete ? 'text-purple-600 cursor-pointer hover:opacity-80' : 'text-gray-400')}`}
                      onClick={() => isMission1Complete && isMission2Complete && handleStartMission(3)}
                    >
                      مهارات التصميم اللي تشد الانتباه
                    </h3>
                    
                    {/* د. بنجي avatar - only show for next active mission */}
                    {nextActiveMission === 3 && (
                      <div className="absolute -left-2">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm border-2 border-white">
                          <img 
                            src={penguinAvatar} 
                            alt="د. بنجي" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1"></div>
                </div>
                
                {/* Mission 4 - "انشر ووسع جمهورك" */}
                <div className="relative z-10 flex items-center">
                  <div className="flex-1"></div>
                  
                  {/* Mission 4 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-sm text-gray-400">
                      انشر ووسع جمهورك
                    </h3>
                    
                    {/* د. بنجي avatar - only show for next active mission */}
                    {nextActiveMission === 4 && (
                      <div className="absolute -right-2">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm border-2 border-white">
                          <img 
                            src={penguinAvatar} 
                            alt="د. بنجي" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column: Student Profile Card */}
            <div className="w-full md:w-1/3">
              <Card className="border border-gray-100 rounded-xl p-5">
                {/* Card Header */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold mb-0.5">ملف الطالب</h2>
                  <p className="text-xs text-gray-500">معلومات الطالب الأساسية</p>
                </div>
                
                {/* Profile picture */}
                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                    <User className="w-10 h-10 text-purple-400" />
                  </div>
                </div>
                
                {/* Profile details - 2 column layout */}
                <div className="grid grid-cols-2 gap-y-3 mb-6 text-sm">
                  <div className="text-right">
                    <p className="font-medium text-gray-500">اسم الطالب</p>
                  </div>
                  <div>
                    <p className="font-medium">{studentName || '-'}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-gray-500">الصف الدراسي</p>
                  </div>
                  <div>
                    <p className="font-medium">{studentGrade || '-'}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-gray-500">(XP) نقاط الخبرة</p>
                  </div>
                  <div>
                    <p className="font-medium">{xp || 0} نقطة</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-gray-500">المهمات المكتملة</p>
                  </div>
                  <div>
                    <p className="font-medium">{completedMissions?.length || 0} / 4</p>
                  </div>
                </div>
                
                {/* Badges - simple layout */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-amber-50 rounded-lg p-3 flex flex-col items-center justify-center">
                    <Star className="h-5 w-5 text-amber-400 mb-1" />
                    <span className="text-xs font-medium text-center">متفوق</span>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center">
                    <Trophy className="h-5 w-5 text-blue-400 mb-1" />
                    <span className="text-xs font-medium text-center">بطل القسم</span>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3 flex flex-col items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-400 mb-1" />
                    <span className="text-xs font-medium text-center">متميز</span>
                  </div>
                </div>
                
                {/* Edit profile button */}
                {!showProfileForm && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 text-sm"
                    onClick={() => setShowProfileForm(true)}
                  >
                    تعديل معلوماتي
                  </Button>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}