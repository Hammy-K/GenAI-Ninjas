import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Loader2,
  Check,
  X,
  Trophy,
  Medal,
  Crown,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzePrompt } from "@/lib/openai";
import { useStageState } from "@/hooks/useStageState";
import { validateInput, validatePromptAnalyzerInput } from "@/lib/inputFilter";
import { trackStageProgress, logPromptToFirestore } from "@/lib/firebase";
import confetti from "canvas-confetti";
import penguinPngPath from "@assets/Penguin.png";
import celebrationSound from "@/assets/wow.mp3";

// Base64 encoded celebration sound (short chime)
const CELEBRATION_SOUND =
  "data:audio/mp3;base64,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";

interface PromptChallengeStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge?: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface LeaderboardEntry {
  id: number;
  studentName: string;
  score: number;
  createdAt: string;
}

interface PromptChallengeState {
  improvedPrompt: string;
  analysis: { score: number; feedback: string; improvement: string } | null;
  hasCompleted: boolean;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
  studentName: string;
  lastRank: number | null;
}

export function PromptChallengeStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: PromptChallengeStageProps) {
  const [state, setState] = useStageState<PromptChallengeState>(
    "promptChallenge",
    {
      improvedPrompt: "",
      analysis: null,
      hasCompleted: false,
      hasEarnedXp: false,
      hasUnlockedBadge: false,
      studentName: "",
      lastRank: null,
    },
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const weakPrompt = "صمم لي لعبة";
  const goodPromptExample =
    "أبغى لعبة بسيطة فيها شخصية تقفز وتتخطى عقبات زي Flappy Bird، بألوان زاهية ومناسبة للأطفال";
  const badPromptExample = "سوي لي تطبيق";

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio(celebrationSound);
    audioRef.current.volume = 0.5;
  }, []);

  // Check if student has entered their name
  useEffect(() => {
    if (!state.studentName) {
      setShowNameModal(true);
    }
  }, [state.studentName]);

  // Fetch leaderboard on mount and periodically
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const celebrate = () => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Fire confetti from the left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: ["#22c55e", "#eab308", "#3b82f6", "#f43f5e", "#a855f7"],
    });

    // Fire confetti from the right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: ["#22c55e", "#eab308", "#3b82f6", "#f43f5e", "#a855f7"],
    });

    // Fire more confetti after a short delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#22c55e", "#eab308", "#3b82f6"],
      });
    }, 250);
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard?limit=10");
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  };

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setState((prev) => ({ ...prev, studentName: nameInput.trim() }));
      setShowNameModal(false);
    }
  };

  const submitToLeaderboard = async (score: number, prompt: string) => {
    try {
      const res = await fetch("/api/leaderboard/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: state.studentName,
          score,
          prompt,
        }),
      });
      const data = await res.json();
      if (data.rank) {
        setState((prev) => ({ ...prev, lastRank: data.rank }));
      }
      fetchLeaderboard();
    } catch (err) {
      console.error("Failed to submit to leaderboard:", err);
    }
  };

  const setImprovedPrompt = (prompt: string) =>
    setState((prev) => ({ ...prev, improvedPrompt: prompt }));
  const setAnalysis = (
    analysisData: {
      score: number;
      feedback: string;
      improvement: string;
    } | null,
  ) => setState((prev) => ({ ...prev, analysis: analysisData }));
  const setHasCompleted = (completed: boolean) =>
    setState((prev) => ({ ...prev, hasCompleted: completed }));
  const setHasEarnedXp = (earned: boolean) =>
    setState((prev) => ({ ...prev, hasEarnedXp: earned }));

  const handleSubmitImprovement = async () => {
    const generalValidation = validateInput(state.improvedPrompt);
    if (!generalValidation.isValid) {
      setError(generalValidation.errorMessage);
      return;
    }

    const exampleCheck = validatePromptAnalyzerInput(state.improvedPrompt);
    if (!exampleCheck.isValid) {
      setError(exampleCheck.errorMessage);
      trackStageProgress("prompt_challenge", "example_copied", {
        prompt_length: state.improvedPrompt.length,
      });
      return;
    }

    setError("");
    setIsAnalyzing(true);

    trackStageProgress("prompt_challenge", "prompt_submitted", {
      prompt_length: state.improvedPrompt.length,
    });

    try {
      await logPromptToFirestore("prompt_analysis", state.improvedPrompt, {
        original_prompt: weakPrompt,
        stage: "prompt_challenge",
      });

      const result = await analyzePrompt(state.improvedPrompt);

      // Check if we got an error response
      if (!result || typeof result.score !== "number" || result.error) {
        throw new Error(result?.error || "Failed to analyze prompt");
      }

      // Show score animation
      setShowScoreAnimation(true);

      // Celebrate if score is 7 or above
      if (result.score >= 7) {
        celebrate();
      }

      setTimeout(() => setShowScoreAnimation(false), 2500);

      setAnalysis(result);

      // Submit to leaderboard
      await submitToLeaderboard(result.score, state.improvedPrompt);

      trackStageProgress("prompt_challenge", "analysis_received", {
        score: result.score,
        succeeded: result.score >= 7,
      });

      if (result.score >= 7) {
        if (!state.hasEarnedXp) {
          onEarnXp(15, "prompt_engineering_success");
          setHasEarnedXp(true);
        }

        if (!state.hasUnlockedBadge && onUnlockBadge) {
          onUnlockBadge("prompt_engineer_badge", "prompt_engineering_success");
          setState((prev) => ({ ...prev, hasUnlockedBadge: true }));
          trackStageProgress("prompt_challenge", "badge_unlocked", {
            badge_name: "prompt_engineer_badge",
          });
        }

        setHasCompleted(true);
      }
    } catch (err: any) {
      if (
        err?.message?.includes("quota") ||
        err?.message?.toLowerCase().includes("429")
      ) {
        setError("API quota exceeded. Please try again later.");
      } else {
        setError(err?.message || "An unknown error occurred");
      }
      trackStageProgress("prompt_challenge", "error", {
        error_message: err?.message || "Unknown error",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return (
      <span className="text-sm text-gray-500 w-5 text-center">{index + 1}</span>
    );
  };

  // Name Entry Modal
  if (showNameModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-white">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={penguinPngPath} alt="د. بنجي" className="h-24 w-auto" />
            </div>
            <CardTitle className="text-2xl">!مرحباً بك في التحدي</CardTitle>
            <p className="text-gray-600 mt-2">
              أدخل اسمك للمنافسة على المركز الأول
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="اسمك"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                className="text-center text-lg"
                dir="auto"
              />
              <Button
                onClick={handleNameSubmit}
                disabled={!nameInput.trim()}
                className="w-full text-lg py-6"
              >
                🚀 يلا نبدأ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="prompt-challenge-stage">
      {/* Score Animation Overlay */}
      {showScoreAnimation && state.analysis && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div
              className={`text-9xl font-bold animate-bounce ${
                state.analysis.score >= 7 ? "text-green-400" : "text-amber-400"
              }`}
              style={{
                textShadow:
                  state.analysis.score >= 7
                    ? "0 0 40px rgba(34, 197, 94, 0.5)"
                    : "0 0 40px rgba(234, 179, 8, 0.5)",
              }}
            >
              {state.analysis.score}
            </div>
            <div className="text-4xl text-white mt-6 font-bold">
              {state.analysis.score >= 7 ? "🎉 ممتاز!" : "💪 حاول مرة ثانية!"}
            </div>
            {state.lastRank && state.analysis.score >= 7 && (
              <div className="text-2xl text-yellow-400 mt-4 animate-pulse">
                🏆 ترتيبك: #{state.lastRank}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Challenge Card */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={penguinPngPath}
                    alt="د. بنجي"
                    className="h-12 w-auto"
                  />
                  <div>
                    <CardTitle className="text-xl">
                      تحدي هندسة الأوامر
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      مرحباً {state.studentName}!
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Examples */}
              <div className="py-3 mb-4">
                <h3 className="font-semibold text-base mb-2 text-center text-gray-700 mb-5">
                  أمثلة على الأوامر
                </h3>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-start gap-2 bg-red-50 p-2 rounded-md">
                    <div className="bg-red-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-red-600 leading-tight">
                        {badPromptExample}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        غير واضح وغير محدد
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-start gap-2 bg-green-50 p-2 rounded-md">
                    <div className="bg-green-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-green-600 leading-tight">
                        {goodPromptExample}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        واضح، محدد، ويحتوي على تفاصيل
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Challenge */}
              <div className="mb-6 border border-gray-200 rounded-lg p-5">
                <div className="p-4 mb-5">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-base text-gray-700">
                      حسّن هذا البرومبت
                    </h3>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <div className="bg-amber-50 p-2 rounded-md">
                        <p className="text-sm font-medium text-amber-800 leading-relaxed text-center">
                          {weakPrompt}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Textarea
                  placeholder="أعد كتابة البرومبت ليكون أكثر تحديداً وتفصيلاً"
                  value={state.improvedPrompt}
                  onChange={(e) => setImprovedPrompt(e.target.value)}
                  className="min-h-[100px] mb-4 text-sm rtl:text-right bg-gray-50 border-0 rounded-md"
                  dir="auto"
                />

                <Button
                  onClick={handleSubmitImprovement}
                  disabled={isAnalyzing || !state.improvedPrompt.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    "🚀 تحليل البرومبت"
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>خطأ</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Results */}
              {state.analysis && !showScoreAnimation && (
                <div
                  className={`p-4 rounded-lg mb-6 ${
                    state.analysis.score >= 7 ? "bg-green-50" : "bg-amber-50"
                  }`}
                >
                  <div className="flex items-center mb-3">
                    {state.analysis.score >= 7 ? (
                      <>
                        <div className="bg-green-100 p-2 rounded-full ml-3">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                        <h3 className="font-bold text-green-700">
                          أحسنت! تقييمك: {state.analysis.score}/10 🎉
                        </h3>
                      </>
                    ) : (
                      <>
                        <div className="bg-amber-100 p-2 rounded-full ml-3">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <h3 className="font-bold text-amber-700">
                          قربت! التقييم: {state.analysis.score}/10 😅
                        </h3>
                      </>
                    )}
                  </div>

                  <div className="w-full bg-white h-2 rounded-full my-2">
                    <div
                      className={`h-2 rounded-full ${
                        state.analysis.score >= 7
                          ? "bg-green-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${state.analysis.score * 10}%` }}
                    />
                  </div>

                  <div className="mt-3">
                    <p className="mb-3">{state.analysis.feedback}</p>
                    {state.analysis.score < 7 && (
                      <p className="text-sm text-amber-700">
                        جرب تضيف تفاصيل أو تحدد المطلوب أكثر.
                      </p>
                    )}
                    <p className="text-sm mt-2 border-t pt-2 border-dashed border-gray-300">
                      <strong>اقتراح للتحسين:</strong>{" "}
                      {state.analysis.improvement}
                    </p>
                  </div>

                  {state.analysis.score >= 7 && (
                    <div className="mt-4 bg-green-100 p-3 rounded-md text-center">
                      <p className="font-medium text-green-700">
                        تقدر تروح للمرحلة التالية! 🚀
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!state.analysis && (
                <div className="bg-blue-50 p-3 rounded-lg mb-6 text-center">
                  <p className="text-sm text-blue-700">
                    هدفك هو الحصول على تقييم 7/10 أو أعلى. كلما كان البرومبت
                    أكثر تفصيلاً، كلما كانت النتيجة أفضل!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-b from-purple-900 to-purple-950 text-white sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-yellow-400" />
                لوحة المتصدرين
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-purple-300 text-sm text-center py-4">
                  كن أول من يسجل نتيجة! 🏆
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        entry.studentName === state.studentName
                          ? "bg-purple-700/50 ring-2 ring-yellow-400"
                          : "bg-purple-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                        <span
                          className={`text-sm ${
                            entry.studentName === state.studentName
                              ? "font-bold"
                              : ""
                          }`}
                        >
                          {entry.studentName}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          entry.score >= 7 ? "text-green-400" : "text-amber-400"
                        }`}
                      >
                        {entry.score}/10
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {state.lastRank && state.lastRank > 10 && (
                <div className="mt-4 pt-4 border-t border-purple-700 text-center">
                  <p className="text-purple-300 text-sm">ترتيبك الحالي</p>
                  <p className="text-2xl font-bold">#{state.lastRank}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
