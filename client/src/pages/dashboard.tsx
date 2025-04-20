import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  User,
  Zap,
  Trophy,
  Star,
  AlertCircle,
  ChevronRight,
} from "lucide-react";


import { useQuest } from "@/hooks/useQuest";
import penguinAvatar from "@assets/Penguin.png";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateInput } from "@/lib/inputFilter";

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const {
    xp,
    currentStage,
    unlockedBadges,
    completedMissions,
    isMissionCompleted,
  } = useQuest();

  // Student profile data - using state to handle user input
  const [studentName, setStudentName] = useState<string>(() => {
    // Try to get from localStorage
    return localStorage.getItem("studentName") || "";
  });

  const [studentGrade, setStudentGrade] = useState<string>(() => {
    // Try to get from localStorage
    return localStorage.getItem("studentGrade") || "";
  });
  const [schoolName, setSchoolName] = useState<string>(() => {
    return localStorage.getItem("schoolName") || "";
  });

  const [formError, setFormError] = useState<string>("");
  const [showProfileForm, setShowProfileForm] = useState<boolean>(
    !studentName || !studentGrade || !schoolName,
  );

  // CAPTCHA state
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  const [captchaPassed, setCaptchaPassed] = useState<boolean>(false);

  // Emoji options for the simple CAPTCHA
  const captchaEmojis = ["💜", "🌟", "🎮", "🎨", "📱"];
  const targetEmoji = "💜"; // The heart emoji users need to click

  // Calculate badges earned
  const badgeIcons: Record<string, JSX.Element> = {
    prompt_engineer_badge: <Star className="h-5 w-5" />,
    image_artist_badge: <Trophy className="h-5 w-5" />,
    ai_coder_badge: <Zap className="h-5 w-5" />,
  };

  // Save student information when provided
  useEffect(() => {
    if (studentName) {
      localStorage.setItem("studentName", studentName);
    }
    if (studentGrade) {
      localStorage.setItem("studentGrade", studentGrade);
    }
    if (schoolName) {
      localStorage.setItem("schoolName", schoolName);
    }
  }, [studentName, studentGrade, schoolName]);

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
    nextActiveMission,
  });

  // Navigation handlers
  const handleStartMission = (missionNumber: number) => {
    if (missionNumber === 1) {
      navigate("/mission1");
    } else if (missionNumber === 2 && isMission1Complete) {
      // Future implementation: navigate('/mission2');
      console.log("Mission 2 would be started");
    } else if (
      missionNumber === 3 &&
      isMission1Complete &&
      isMission2Complete
    ) {
      // Future implementation: navigate('/mission3');
      console.log("Mission 3 would be started");
    }
  };

  // Validate if input contains meaningful content (not just random characters)
  const isValidInput = (input: string): boolean => {
    // Check if input is too short
    if (input.trim().length < 2) return false;

    // Check for repeated characters that might indicate random input
    const repeatedCharsRegex = /(.)\1{3,}/; // 4 or more of the same character in a row
    if (repeatedCharsRegex.test(input)) return false;

    // Check for keyboard smashing patterns
    const keyboardSmashPatterns = [
      /asdf/i,
      /qwer/i,
      /zxcv/i, // English keyboard rows
      /1234/i, // Sequential numbers
    ];
    if (keyboardSmashPatterns.some((pattern) => pattern.test(input)))
      return false;

    // Add other checks as needed
    return true;
  };

  // Handle emoji click for CAPTCHA
  const handleEmojiClick = (emoji: string) => {
    if (emoji === targetEmoji) {
      setCaptchaPassed(true);

      // If CAPTCHA is passed, complete the form submission
      localStorage.setItem("studentName", studentName);
      localStorage.setItem("studentGrade", studentGrade);
      localStorage.setItem("schoolName", schoolName);
      setShowProfileForm(false);
      setShowCaptcha(false);
    } else {
      // If wrong emoji clicked, give feedback but don't close the CAPTCHA
      setFormError("اختر القلب 💜 لتأكيد أنك طالب حقيقي");
      setTimeout(() => setFormError(""), 2000);
    }
  };

  // Handle form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset any previous errors
    setFormError("");

    // Validate name using the shared utility function
    const nameValidation = validateInput(studentName);
    if (!nameValidation.isValid) {
      setFormError(nameValidation.errorMessage || "الرجاء إدخال اسم حقيقي");
      return;
    }

    // Validate grade using the shared utility function
    const gradeValidation = validateInput(studentGrade);
    if (!gradeValidation.isValid) {
      setFormError(
        gradeValidation.errorMessage || "الرجاء إدخال صف دراسي صحيح",
      );
      return;
    }

    //If all validations pass, show the CAPTCHA
    setShowCaptcha(true);
  };

  // Add the pulse animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(167, 139, 250, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(167, 139, 250, 0);
        }
      }
      .pulse {
        animation: pulse 2s infinite;
      }
      
      .mission-highlight {
        border: 2px solid #a78bfa;
        box-shadow: 0 4px 12px rgba(167, 139, 250, 0.3);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-white text-gray-800 font-tajawal"
      dir="rtl"
    >
      <Header xp={xp} />

      {/* Profile information form (shown only on first visit) */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-center mb-4">مرحباً بك!</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
              فضلاً أدخل معلوماتك الأساسية لبدء الرحلة التعليمية
            </p>

            {/* Show form error if any */}
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            {showCaptcha ? (
              /* CAPTCHA Screen */
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-2">
                    اضغط على القلب 💜 قبل ما تبدأ
                  </h3>
                  <p className="text-sm text-gray-600">
                    هذا للتأكد من أنك طالب حقيقي وليس روبوت
                  </p>
                </div>

                <div className="flex justify-center gap-4 text-4xl">
                  {captchaEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="transition-transform hover:scale-110 focus:outline-none p-3"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowCaptcha(false)}
                >
                  العودة للنموذج
                </Button>
              </div>
            ) : (
              /* Main Form */
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
                  <div>
                    <Label htmlFor="schoolName">اسم المدرسة</Label>
                    <Input
                      id="schoolName"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="اسم المدرسة"
                      className="mt-1"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    بدء الرحلة
                  </Button>
                </div>
              </form>
            )}
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
              <div
                className="relative py-6 px-4 md:px-8 overflow-y-auto max-h-[80vh]"
                style={{ minHeight: "3500px" }}
              >
                {/* Connected zigzag path - SVG for proper path alignment */}
                <div className="absolute z-0 inset-0 right-12 left-12 h-full">
                  <svg
                    className="w-full h-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 2250"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Main zigzag path - Full path for 20 missions */}
                    <path
                      d="M80 10 L20 120 L80 230 L20 340 L80 450 L20 560 L80 670 L20 780 L80 890 L20 1000 L80 1110 L20 1220 L80 1330 L20 1440 L80 1550 L20 1660 L80 1770 L20 1880 L80 1990 L20 2100 L80 2210"
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
                    <path
                      d={nextActiveMission >= 5 ? "M80 450 L20 560" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 6 ? "M20 560 L80 670" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 7 ? "M80 670 L20 780" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 8 ? "M20 780 L80 890" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 9 ? "M80 890 L20 1000" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 10 ? "M20 1000 L80 1110" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 11 ? "M80 1110 L20 1220" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 12 ? "M20 1220 L80 1330" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 13 ? "M80 1330 L20 1440" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 14 ? "M20 1440 L80 1550" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 15 ? "M80 1550 L20 1660" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 16 ? "M20 1660 L80 1770" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 17 ? "M80 1770 L20 1880" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 18 ? "M20 1880 L80 1990" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 19 ? "M80 1990 L20 2100" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={nextActiveMission >= 20 ? "M20 2100 L80 2210" : ""}
                      stroke="#a78bfa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>

                <div className="relative z-10 flex justify-center mb-2">
                  <div className="text-purple-600 font-bold text-xl px-5 py-2 rounded-xl shadow-lg bg-white border border-purple-300">
                    ⭐ ابدأ هنا ⭐
                  </div>
                </div>

                {/* Mission 1 - "عبر عن نفسك بإبداع" */}
                {/* Mission 1 – "تعرف على الذكاء الاصطناعي التوليدي" */}
                <div className="relative z-10 mb-36">
                  <div className="flex items-center justify-end w-1/2">
                    {/* Square + Title wrapper */}
                    <div
                      className="cursor-pointer transition-transform hover:scale-105 mr-4"
                      onClick={() => handleStartMission(1)}
                    >
                      {/* 16×16 square */}
                      <div
                        className={`w-16 h-16 rounded-lg flex items-center justify-center
                          ${isMission1Complete ? "bg-green-100 text-green-600" : 
                            nextActiveMission === 1 ? "bg-purple-100 text-purple-600 pulse mission-highlight" : 
                            "bg-purple-100 text-purple-600"}`}
                      >
                        {isMission1Complete ? (
                          <CheckCircle2 className="w-8 h-8" />
                        ) : (
                          <span className="text-lg font-bold">1</span>
                        )}
                      </div>

                      {/* Title, now directly below the square */}
                      <h3
                        className={`mt-1 text-sm font-medium
                          ${isMission1Complete ? "text-green-600" : "text-purple-600"}`}
                      >
                        تعرف على الذكاء الاصطناعي التوليدي
                      </h3>
                    </div>

                    {/* Dr. Pengy avatar for the next active mission */}
                    {nextActiveMission === 1 && (
                      <div className="absolute left-1/2 -top-6 transform -translate-x-1/2 after:absolute after:inset-0 after:rounded-lg after:animate-pulse-ring">
                        <img
                          src={penguinAvatar}
                          alt="د. بنجي"
                          className="w-16 h-16 object-contain relative z-10"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mission 2 - "كيف تصنع قصص تعلق في البال" */}
                <div className="relative z-10 flex items-center mb-36">
                  <div className="flex-1"></div>

                  {/* Mission 2 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div
                      className={`relative cursor-pointer transition-transform hover:scale-105 ml-4
                        ${isMission2Complete ? "text-green-600" : isMission1Complete ? "text-purple-600" : "text-gray-400"}`}
                      onClick={() =>
                        isMission1Complete && handleStartMission(2)
                      }
                    >
                      <div
                        className={`w-16 h-16 rounded-lg flex items-center justify-center 
                        ${isMission2Complete ? "bg-green-100" : 
                          isMission1Complete && nextActiveMission === 2 ? "bg-purple-100 pulse mission-highlight" : 
                          isMission1Complete ? "bg-purple-100" : "bg-gray-100"}`}
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
                        ${isMission2Complete ? "text-green-600" : isMission1Complete ? "text-purple-600 cursor-pointer hover:opacity-80" : "text-gray-400"}`}
                      onClick={() =>
                        isMission1Complete && handleStartMission(2)
                      }
                    >
                      تعرف على اهتماماتك
                    </h3>

                    {/* د. بنجي avatar - only show for next active mission */}
                    {nextActiveMission === 2 && (
                      <div className="absolute left-1/2 -translate-x-1/2. transform translate-y-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden">
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
                <div className="relative z-10 flex items-center mb-36">
                  {/* Mission 3 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div
                      className={`relative cursor-pointer transition-transform hover:scale-105 mr-4
                        ${isMission3Complete ? "text-green-600" : isMission1Complete && isMission2Complete ? "text-purple-600" : "text-gray-400"}`}
                      onClick={() =>
                        isMission1Complete &&
                        isMission2Complete &&
                        handleStartMission(3)
                      }
                    >
                      <div
                        className={`w-16 h-16 rounded-lg flex items-center justify-center 
                        ${isMission3Complete ? "bg-green-100" : 
                          isMission1Complete && isMission2Complete && nextActiveMission === 3 ? "bg-purple-100 pulse mission-highlight" : 
                          isMission1Complete && isMission2Complete ? "bg-purple-100" : "bg-gray-100"}`}
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
                        ${isMission3Complete ? "text-green-600" : isMission1Complete && isMission2Complete ? "text-purple-600 cursor-pointer hover:opacity-80" : "text-gray-400"}`}
                      onClick={() =>
                        isMission1Complete &&
                        isMission2Complete &&
                        handleStartMission(3)
                      }
                    >
                      تعرف على المسارات و المشاريع
                    </h3>

                    {/* د. بنجي avatar - only show for next active mission */}
                    {nextActiveMission === 3 && (
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

                {/* Mission 4 - "انشر ووسع جمهورك" */}
                <div className="relative z-10 flex items-center mb-36">
                  <div className="flex-1"></div>

                  {/* Mission 4 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>

                    <h3 className="font-medium text-sm text-gray-400">
                      اختر مسارك و ابني!
                    </h3>

                    {/* د. بنجي avatar - only show for next active mission */}
                    {nextActiveMission === 4 && (
                      <div className="absolute left-16 -top-6 transform translate-y-0">
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
                </div>

                {/* Mission 5 - Right side */}
                <div className="relative z-10 flex items-center mb-36">
                  {/* Mission 5 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div className="relative mr-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>

                      {/* Title below the square */}
                      <h3 className="mt-1 text-sm font-medium text-gray-400 text-center">
                        {/* مشاريع الأنظمة الذكية */}
                      </h3>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Mission 6 - Left side */}
                <div className="relative z-10 flex items-center mb-24">
                  <div className="flex-1"></div>
                  {/* Mission 6 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission 7 - Right side */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 7 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div className="relative mr-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Mission 8 - Left side */}
                <div className="relative z-10 flex items-center mb-24">
                  <div className="flex-1"></div>
                  {/* Mission 8 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission 9 - Right side */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 9 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div className="relative mr-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Mission 10 - Left side */}
                <div className="relative z-10 flex items-center mb-24">
                  <div className="flex-1"></div>
                  {/* Mission 10 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>

                      {/* Title below the square */}
                      <h3 className="mt-1 text-sm font-medium text-gray-400 text-center">
                        تطوير تطبيقات الذكاء الاصطناعي
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Mission 11 - Right side */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 11 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div className="relative mr-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Mission 12 - Left side */}
                <div className="relative z-10 flex items-center mb-24">
                  <div className="flex-1"></div>
                  {/* Mission 12 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission 13 - Right side */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 13 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div className="relative mr-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Mission 14 - Left side */}
                <div className="relative z-10 flex items-center mb-24">
                  <div className="flex-1"></div>
                  {/* Mission 14 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission 15 - Right side */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 15 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div className="relative mr-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Mission 16 - Left side */}
                <div className="relative z-10 flex items-center mb-24">
                  <div className="flex-1"></div>
                  {/* Mission 16 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission 17 - Right side */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 17 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div className="relative mr-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Mission 18 - Left side */}
                <div className="relative z-10 flex items-center mb-24">
                  <div className="flex-1"></div>
                  {/* Mission 18 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission 19 - Right side */}
                <div className="relative z-10 flex items-center mb-24">
                  {/* Mission 19 Node - Right side */}
                  <div className="flex items-center justify-end w-1/2">
                    <div className="relative mr-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Mission 20 - Left side */}
                <div className="relative z-10 flex items-center !mb-0 !pb-0">
                  <div className="flex-1"></div>
                  {/* Mission 20 Node - Left side */}
                  <div className="flex items-center justify-start w-1/2">
                    <div className="relative ml-4 text-gray-400">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <Lock className="w-6 h-6 opacity-50" />
                      </div>

                      {/* Title below the square */}
                      <h3 className="mt-1 text-sm font-medium text-gray-400 text-center">
                        مشروع التخرج
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Student Profile Card - with sticky positioning */}
            <div className="w-full md:w-1/3 md:sticky md:top-4 self-start">
              <Card className="border border-gray-100 rounded-xl p-5">
                {/* Card Header
                <div className="text-center mb-4"> 
                  <h2 className="text-xl font-bold mb-0.5">ملف الطالب</h2>
                </div>
                
                */}
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
                    <p className="font-medium">{studentName || "-"}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-gray-500">الصف الدراسي</p>
                  </div>
                  <div>
                    <p className="font-medium">{studentGrade || "-"}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-gray-500">اسم المدرسة</p>
                  </div>
                  <div>
                    <p className="font-medium">{schoolName || "-"}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-gray-500">
                      (XP) نقاط الخبرة
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{xp || 0} نقطة</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-gray-500">
                      المهمات المكتملة
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">
                      {completedMissions?.length || 0} / 20
                    </p>
                  </div>
                </div>

                {/* Badges section */}
                <div className="mt-4">
                  <h3 className="text-sm font-bold mb-3 text-gray-700">
                    الشارات المكتسبة
                  </h3>

                  {unlockedBadges.length === 0 ? (
                    <div className="text-center py-3 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      لم تحصل على أي شارات بعد. أكمل المهام للحصول على شارات!
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {unlockedBadges.includes("prompt_engineer_badge") && (
                        <div className="bg-amber-50 rounded-lg p-3 flex flex-col items-center justify-center">
                          <Star className="h-5 w-5 text-amber-400 mb-1" />
                          <span className="text-xs font-medium text-center">
                            مهندس تحفيز
                          </span>
                        </div>
                      )}

                      {unlockedBadges.includes("image_artist_badge") && (
                        <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center">
                          <Trophy className="h-5 w-5 text-blue-400 mb-1" />
                          <span className="text-xs font-medium text-center">
                            فنان الصور
                          </span>
                        </div>
                      )}

                      {unlockedBadges.includes("ai_coder_badge") && (
                        <div className="bg-purple-50 rounded-lg p-3 flex flex-col items-center justify-center">
                          <Zap className="h-5 w-5 text-purple-500 mb-1" />
                          <span className="text-xs font-medium text-center">
                            مبرمج ذكاء اصطناعي
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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
