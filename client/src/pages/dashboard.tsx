import { useLocation } from 'wouter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, CheckCircle2, User, Zap, Trophy, Star } from 'lucide-react';
import { useQuest } from '@/hooks/useQuest';
import journeyAvatar from '@/assets/JourneyAvatar.png';
import { Card } from '@/components/ui/card';

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const { xp, currentStage, unlockedBadges, completedMissions, isMissionCompleted } = useQuest();
  
  // Hard-coded student data (could be made dynamic in the future)
  const studentName = "صالح المنصوري";
  const studentGrade = "الصف الحادي عشر";
  const totalMissions = 25;
  const completedMissionsCount = 18;
  
  // Check mission completion status
  const isMission1Complete = isMissionCompleted(1);
  const isMission2Complete = isMissionCompleted(2);
  
  // Debug logging
  console.log("Dashboard rendered with:", { 
    completedMissions,
    isMission1Complete,
    currentStage
  });
  
  // Navigation handlers
  const handleStartMission1 = () => {
    navigate('/mission1');
  };

  const handleStartMission2 = () => {
    if (isMission1Complete) {
      // Placeholder for Mission 2 navigation
      // navigate('/mission2');
    }
  };

  const handleStartMission3 = () => {
    if (isMission1Complete && isMission2Complete) {
      // Placeholder for Mission 3 navigation
      // navigate('/mission3');
    }
  };
  
  const handleStartMission4 = () => {
    // Placeholder for Mission 4
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800 font-tajawal" dir="rtl">
      <Header xp={xp} />
      
      {/* Main content */}
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-6xl mx-auto rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Two-column layout: Journey on left, profile on right */}
          <div className="flex flex-col-reverse md:flex-row gap-8">
            
            {/* Left column: Mission Journey - zig-zag path */}
            <div className="w-full md:w-2/3">
              {/* Learning path with 3D isometric-like connected zig-zag flow */}
              <div className="relative py-8 pl-8 pr-4">
                {/* Custom SVG zigzag path connecting all missions */}
                <div className="absolute z-0 left-4 top-0 bottom-0">
                  <svg className="h-full" viewBox="0 0 120 650" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Main zigzag path */}
                    <path 
                      d="M60 0 L110 100 L10 200 L110 300 L10 400 L110 500 L60 600" 
                      stroke="#e2e8f0" 
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Colored active path - only shows up to the current mission */}
                    <path 
                      d="M60 0 L110 100 L10 200" 
                      stroke="#a78bfa" 
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={isMission1Complete ? "0" : "0"}
                    />
                  </svg>
                </div>
                
                {/* Mission 1 - "عبر عن نفسك بإبداع" */}
                <div className="relative z-10 flex mb-28 items-start">
                  {/* Mission 1 Node */}
                  <div className="absolute right-0 top-0">
                    <div 
                      className={`w-24 h-24 relative cursor-pointer transition-transform hover:scale-105`}
                      onClick={handleStartMission1}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-purple-500 transform skew-y-[16deg] rounded-lg shadow-lg" />
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="flex flex-col items-center">
                          <div className="text-xs opacity-80">LEVEL</div>
                          <div className="text-xl font-bold">١</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mission 1 Title - positioned to the right */}
                  <div 
                    className="flex-grow pt-2 mr-28 cursor-pointer" 
                    onClick={handleStartMission1}
                  >
                    <h3 className="font-semibold text-lg text-gray-800 mr-6">عبّر عن نفسك بإبداع</h3>
                  </div>
                </div>
                
                {/* Mission 2 - "كيف تصنع قصص تعلق في البال" */}
                <div className="relative z-10 flex mb-28 items-start">
                  {/* Mission node */}
                  <div className="absolute left-0 top-0">
                    <div 
                      className={`w-24 h-24 relative cursor-pointer transition-transform hover:scale-105`}
                      onClick={handleStartMission2}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 transform skew-y-[16deg] rounded-lg shadow-lg" />
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-2xl font-bold">٢</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mission title - positioned to the left */}
                  <div 
                    className="flex-grow pt-2 ml-28 cursor-pointer" 
                    onClick={handleStartMission2}
                  >
                    <h3 className="font-semibold text-lg text-gray-800">كيف تصنع قصص تعلق في البال</h3>
                  </div>
                  
                  {/* Dr. Pengy avatar - show at current active mission */}
                  <div className="absolute left-24 top-12">
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-md bg-white border-2 border-white">
                      <img 
                        src={journeyAvatar} 
                        alt="Dr. Pengy" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Mission 3 - "مهارات التصميم اللي تشد الانتباه" (Locked) */}
                <div className="relative z-10 flex mb-28 items-start">
                  {/* Mission node */}
                  <div className="absolute right-0 top-0">
                    <div className={`w-24 h-24 relative opacity-70`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 transform skew-y-[16deg] rounded-lg shadow-lg" />
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-2xl font-bold">٣</div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                        <Lock className="w-8 h-8 text-white opacity-70" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Mission title - positioned to the right */}
                  <div className="flex-grow pt-2 mr-28">
                    <h3 className="font-semibold text-lg text-gray-500 mr-6">مهارات التصميم اللي تشد الانتباه</h3>
                  </div>
                </div>
                
                {/* Mission 4 - "انشر ووسع جمهورك" (Locked) */}
                <div className="relative z-10 flex items-start">
                  {/* Mission node */}
                  <div className="absolute left-0 top-0">
                    <div className={`w-24 h-24 relative opacity-70`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-500 transform skew-y-[16deg] rounded-lg shadow-lg" />
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-2xl font-bold">٤</div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                        <Lock className="w-8 h-8 text-white opacity-70" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Mission title - positioned to the left */}
                  <div className="flex-grow pt-2 ml-28">
                    <h3 className="font-semibold text-lg text-gray-500">انشر ووسع جمهورك</h3>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column: Student Profile Card */}
            <div className="w-full md:w-1/3">
              <Card className="p-6 shadow-md h-auto bg-white border border-gray-100 rounded-xl">
                {/* Card Header */}
                <div className="text-center mb-5">
                  <h2 className="text-xl font-bold mb-1">ملف الطالب</h2>
                  <p className="text-xs text-gray-500">معلومات الطالب الأساسية</p>
                </div>
                
                {/* Profile details - 2 column layout */}
                <div className="grid grid-cols-2 gap-y-4 mb-8">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">اسم الطالب</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{studentName}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">الصف الدراسي</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{studentGrade}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">(XP) نقاط الخبرة</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">١,٣٥٠ نقطة</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">المهمات المكتملة</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{completedMissionsCount} / {totalMissions}</p>
                  </div>
                </div>
                
                {/* Profile picture */}
                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    <User className="w-10 h-10 text-purple-400" />
                  </div>
                </div>
                
                {/* Badges - simple layout */}
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <div className="bg-amber-50 rounded-lg p-3 flex flex-col items-center justify-center">
                    <Star className="h-6 w-6 text-amber-400 mb-1" />
                    <span className="text-xs font-medium text-center">متفوق</span>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center">
                    <Trophy className="h-6 w-6 text-blue-400 mb-1" />
                    <span className="text-xs font-medium text-center">بطل القسم</span>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3 flex flex-col items-center justify-center">
                    <Zap className="h-6 w-6 text-purple-400 mb-1" />
                    <span className="text-xs font-medium text-center">متميز</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}