import { useLocation, Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckCircle2,
  User,
  Zap,
  Trophy,
  Star,
  AlertCircle,
  ChevronRight,
  Gamepad2,
  AppWindow,
  PenTool,
  FlaskRound,
  ArrowLeftCircle,
} from "lucide-react";

import { useQuest } from "@/hooks/useQuest";
import penguinAvatar from "@assets/WelcomePenguin.png";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateInput } from "@/lib/inputFilter";
import AIGameGeneratorIntroCard from "@/components/AiHtmlGenerator/AiGameGeneratorIntroCard";
import IntroMissionCard from "@/components/Dashboard/IntroMissionCard";
import AIVideoIntroCard from "@/components/VideoGallery/AiVideosIntroCard";
import { useOrganization } from "@/hooks/useOrganization";
import { ApplicationDevelopmentMissionCard } from "@/components/ApplicationDevelopmentMission/ApplicationDevelopmentMissionCard";
import ApplicationDevelopmentMissionIntroCard from "@/components/ApplicationDevelopmentMission/ApplicaitonDevelopmentMissionIntroCard";

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const organization = useOrganization();
  const {
    xp,
    currentStage,
    unlockedBadges,
    completedMissions,
    isMissionCompleted,
  } = useQuest();

  // Stream navigation state
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [showStreamContent, setShowStreamContent] = useState(false);

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

  // Badge icons for legitimate earned badges - no fake badges
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
      const destinationUrl = organization.isMain
        ? "/intro-mission"
        : `/${organization.name}/intro-mission`;

      navigate(destinationUrl);
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

  // Animation cleanup effect - removed as it was causing issues with streams display

  // Add the pulse animation styles
  useEffect(() => {
    const style = document.createElement("style");
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

      .stream-card {
        transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        position: relative;
        transform-origin: center;
      }
      
      .stream-card:hover:not(.locked):not(.selected) {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px -5px rgba(167, 139, 250, 0.4);
      }
      
      .stream-card.locked {
        opacity: 0.7;
        filter: grayscale(0.8);
      }
      
      .stream-grid.content-active .stream-card.selected {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(1.1);
        width: 80%;
        max-width: 320px;
        margin: 0 auto;
        z-index: 10;
        box-shadow: 0 20px 50px -15px rgba(167, 139, 250, 0.6);
        padding: 1rem !important;
      }
      
      /* Make title slightly smaller in expanded view */
      .stream-grid.content-active .stream-card.selected h3 {
        font-size: 1rem;
      }
      
      .stream-grid {
        transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      }
      
      .stream-grid.content-active .stream-card:not(.selected) {
        opacity: 0.15;
        transform: scale(0.85) translateY(20px);
        pointer-events: none;
      }
      
      .stream-status {
        font-size: 0.75rem;
        transition: all 0.3s ease;
      }
      
      .intro-mission-card {
        transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        max-height: 200px;
        overflow: hidden;
        opacity: 1;
      }
      
      .intro-mission-card.collapsed {
        max-height: 0;
        margin: 0;
        padding: 0;
        opacity: 0;
        border: none;
      }
      
      /* Grid layout for content container to fix spacing issues */
      .content-container {
        display: grid;
        grid-template-areas: "content";
      }
      
      .intro-mission-card {
        grid-area: content;
        will-change: max-height, opacity;
        transform: translateZ(0);
      }
      
      .stream-grid {
        grid-area: content;
        will-change: transform, opacity;
        transform: translateZ(0);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Define stream data with icons, titles and lock status
  const streams = [
    {
      id: "games",
      title: "تصميم العاب خرافية",
      icon: (
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center">
            <Gamepad2 className="w-14 h-14 text-purple-600" strokeWidth={1.5} />
          </div>
        </div>
      ),
      isLocked: !isMission1Complete,
    },
    {
      id: "apps",
      title: "تطوير تطبيقات ممتعة",
      icon: (
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center">
            <AppWindow className="w-14 h-14 text-blue-500" strokeWidth={1.5} />
          </div>
        </div>
      ),
      isLocked: true, // Always locked for now
    },
    {
      id: "content",
      title: "انشاء محتوى و قصص",
      icon: (
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center">
            <PenTool className="w-14 h-14 text-amber-500" strokeWidth={1.5} />
          </div>
        </div>
      ),
      isLocked: true, // Always locked for now
    },
    {
      id: "science",
      title: "تجارب علمية وتقنية (STEM)",
      icon: (
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center">
            <FlaskRound
              className="w-14 h-14 text-emerald-500"
              strokeWidth={1.5}
            />
          </div>
        </div>
      ),
      isLocked: true, // Always locked for now
    },
  ];

  // Handle stream selection (reverted to original functionality)
  const handleStreamSelect = (streamId: string) => {
    // Find the stream
    const stream = streams.find((s) => s.id === streamId);

    // Don't do anything if stream is locked
    if (stream?.isLocked) return;

    setSelectedStream(streamId);
    setShowStreamContent(true);
  };

  // Handle back button from stream to streams grid
  const handleBackToStreams = () => {
    setSelectedStream(null);
    setShowStreamContent(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-white text-gray-800 font-tajawal"
      dir="rtl"
    >
      <Header xp={xp} />

      {/* Profile information form (shown only on first visit) */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
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
              <div className="text-center">
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

                <Button className="mt-6" onClick={() => setShowCaptcha(false)}>
                  العودة للنموذج
                </Button>
              </div>
            ) : (
              /* Main Form */
              <form onSubmit={handleProfileSubmit}>
                <div>
                  <div>
                    <Label htmlFor="studentName">اسمك</Label>
                    <Input
                      id="studentName"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="الاسم الكامل"
                      className="mt-1 bg-white border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div className="my-2">
                    <Label htmlFor="studentGrade">الصف الدراسي</Label>
                    <Input
                      id="studentGrade"
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                      placeholder="مثال: الصف التاسع"
                      className="mt-1 bg-white border-gray-300 rounded-lg"
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
                      className="mt-1 bg-white border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full mt-10">
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
            {/* Left column: Streams & Journey UI */}
            <div className="w-full md:w-2/3">
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
                {/* Intro Mission Card - Always shown on top but collapses when stream is selected */}
                {/* <div
                  className={`relative mb-8 min-h-[145px] bg-gradient-to-r from-purple-50 to-indigo-50 p-5 pb-7 rounded-xl border border-purple-100 intro-mission-card ${showStreamContent ? "collapsed" : ""}`}
                >
                  <div className="absolute top-4 left-10">
                    <img
                      src={penguinAvatar}
                      alt="د. بنجي"
                      className="w-20 h-20 pointer-events-none"
                    />
                  </div>

                  <div className="text-right ml-16 min-h-[120px] flex flex-col">
                    <h2 className="text-xl font-bold text-purple-700">
                      المهمة التعريفية
                    </h2>
                    <p className="text-m text-purple-600">
                      تعرف على الذكاء الاصطناعي التوليدي
                    </p>

                    <div className="text-right absolute bottom-5 right-6">
                      <span
                        className={`text-sm ${isMission1Complete ? "text-green-600" : "text-purple-600"}`}
                      >
                        {isMission1Complete ? "مكتملة" : "غير مكتملة"}
                      </span>
                      <div
                        className={`h-3 w-3 rounded-full ${isMission1Complete ? "bg-green-500" : "bg-purple-500 animate-pulse"} mr-2 ml-2 inline-block`}
                      ></div>
                    </div>

                    <div className="mt-auto pt-4 flex justify-end">
                      <Button
                        className={`absolute bottom-4 left-4 w-32 text-center ${isMission1Complete ? "bg-purple-200 hover:bg-purple-300 text-purple-800" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                        onClick={() => handleStartMission(1)}
                      >
                        {isMission1Complete ? "إعادة المهمة" : "⭐ ابدأ هنا ⭐"}
                      </Button>
                    </div>
                  </div>
                </div> */}

                <IntroMissionCard
                  isComplete={isMission1Complete}
                  showStreamContent={showStreamContent}
                  onStartMission={() => handleStartMission(1)}
                />

                <AIGameGeneratorIntroCard />

                <AIVideoIntroCard />

                {organization.isMain && (
                  <ApplicationDevelopmentMissionIntroCard />
                )}

                {/* Stream Content Container - Changes based on state */}
                {/* <div className="min-h-[400px] content-container">
                  <div
                    className={`stream-grid ${showStreamContent ? "content-active" : ""}`}
                  >
                    <div
                      className={`${showStreamContent ? "opacity-0 pointer-events-none absolute" : "opacity-100"} transition-all duration-500`}
                    >
                      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                        اختر مسارك التعليمي
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {streams.map((stream) => (
                          <div
                            key={stream.id}
                            onClick={() => handleStreamSelect(stream.id)}
                            className={`stream-card bg-white rounded-xl p-6 border shadow-sm cursor-pointer ${
                              stream.isLocked
                                ? "locked border-gray-200"
                                : "border-purple-200 hover:border-purple-300"
                            } ${selectedStream === stream.id ? "selected" : ""}`}
                          >
                            <div
                              className={`absolute top-2 left-2 stream-status flex items-center ${selectedStream === stream.id ? "opacity-100" : "opacity-0"}`}
                            >
                              <div className="w-2 h-2 rounded-full bg-green-500 ml-1"></div>
                              <span className="text-xs text-green-600">
                                متاح
                              </span>
                            </div>

                            {stream.icon}

                            <h3 className="text-lg font-bold text-center mt-4 mb-2">
                              {stream.title}
                            </h3>

                            <div className="flex justify-center items-center">
                              {stream.isLocked ? (
                                <div className="flex items-center text-gray-500 text-sm">
                                  <Lock className="w-4 h-4 ml-1" />
                                  <span>أكمل المهمة التعريفية للفتح</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-purple-600 text-sm">
                                  <div className="w-2 h-2 rounded-full bg-green-500 ml-2"></div>
                                  <span>متاح</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`${!showStreamContent ? "opacity-0 pointer-events-none absolute" : "opacity-100"} transition-all duration-500`}
                    >
                      <div className="flex items-center mb-6">
                        <Button
                          variant="ghost"
                          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          onClick={handleBackToStreams}
                        >
                          <ArrowRight className="h-4 w-4" />
                          <span>العودة للمسارات</span>
                        </Button>
                      </div>

                      {selectedStream === "games" && (
                        <div className="p-6 space-y-6">
                          <h2 className="text-xl font-semibold text-center mb-8">
                            رحلة تعلم تطوير الألعاب
                          </h2>

                          <div className="relative max-w-3xl mx-auto">
                            <div className="grid grid-cols-4 gap-5">
                              <div className="relative">
                                <Link
                                  href="/missions/game-dev"
                                  className="block transform hover:scale-105 transition-transform"
                                >
                                  <div className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg shadow-md border-2 border-green-400 h-36 flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-2">🎮</div>
                                    <div className="font-medium text-sm">
                                      ليش نحب الألعاب؟
                                    </div>
                                  </div>
                                </Link>
                              </div>

                              <div className="relative">
                                <div className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg shadow-md border-2 border-gray-300 h-36 flex flex-col items-center justify-center text-center opacity-70">
                                  <div className="text-2xl mb-2">💡</div>
                                  <div className="font-medium text-sm">
                                    وش فكرة لعبتك؟
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                <div className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg shadow-md border-2 border-gray-300 h-36 flex flex-col items-center justify-center text-center opacity-70">
                                  <div className="text-2xl mb-2">🎯</div>
                                  <div className="font-medium text-sm">
                                    الأساسيات والميكانيكيات الرئيسية
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                <div className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg shadow-md border-2 border-gray-300 h-36 flex flex-col items-center justify-center text-center opacity-70">
                                  <div className="text-2xl mb-2">🧪</div>
                                  <div className="font-medium text-sm">
                                    نموذج أولي لأول مرحلة
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                <div className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg shadow-md border-2 border-gray-300 h-36 flex flex-col items-center justify-center text-center opacity-70">
                                  <div className="text-2xl mb-2">🎨</div>
                                  <div className="font-medium text-sm">
                                    الرسوميات والفن
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                <div className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg shadow-md border-2 border-gray-300 h-36 flex flex-col items-center justify-center text-center opacity-70">
                                  <div className="text-2xl mb-2">🎵</div>
                                  <div className="font-medium text-sm">
                                    الصوت والموسيقى
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                <div className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg shadow-md border-2 border-gray-300 h-36 flex flex-col items-center justify-center text-center opacity-70">
                                  <div className="text-2xl mb-2">🔁</div>
                                  <div className="font-medium text-sm">
                                    الاختبار والتعديل
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                <div className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg shadow-md border-2 border-gray-300 h-36 flex flex-col items-center justify-center text-center opacity-70">
                                  <div className="text-2xl mb-2">🚀</div>
                                  <div className="font-medium text-sm">
                                    النشر، الإطلاق، والمشاركة
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div> */}
              </div>
            </div>

            {/* Right column: Student Profile Card - with sticky positioning */}
            <div className="w-full md:w-1/3 md:sticky md:top-4 self-start">
              <Card className="border border-gray-100 rounded-xl p-5">
                {/* Profile picture */}
                <div className="flex flex-col w-full justify-center items-center mb-5">
                  {!organization.isMain && (
                    <div className="w-52 h-20 my-2 rounded-lg">
                      <img
                        src={organization.logo}
                        alt={`${organization.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

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
                    <p className="font-medium text-purple-600">{xp} نقطة</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-gray-500">
                      المهمات المكتملة
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">
                      {completedMissions.length} / 20
                    </p>
                  </div>
                </div>

                {/* Badges section
                <div className="mb-5">
                  <h3 className="font-semibold text-gray-600 mb-3">
                    الشارات المكتسبة
                  </h3>
                  <div className="flex space-x-2 space-x-reverse">
                    {unlockedBadges.length > 0 ? (
                      // Only show badges that are in our approved list (badgeIcons)
                      unlockedBadges
                        .filter(badge => Object.keys(badgeIcons).includes(badge))
                        .map((badge, index) => (
                          <div
                            key={index}
                            className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"
                            title={badge.replace('_badge', '').replace(/_/g, ' ')}
                          >
                            {badgeIcons[badge] || (
                              <Star className="h-5 w-5 text-purple-500" />
                            )}
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        لم تحصل على أي شارات بعد
                      </p>
                    )}
                  </div>
                </div>
                */}

                {/* Edit profile button */}
                {studentName && studentGrade && schoolName && (
                  <Button
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
