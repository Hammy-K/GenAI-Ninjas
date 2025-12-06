import { useState, useEffect } from "react";
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
import penguinPngPath from "@assets/Penguin.png";

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

  const weakPrompt = "صمم لي لعبة";
  const goodPromptExample =
    "أبغى لعبة بسيطة فيها شخصية تقفز وتتخطى عقبات زي Flappy Bird، بألوان زاهية ومناسبة للأطفال";
  const badPromptExample = "سوي لي تطبيق";

  // Check if student has entered their name
  useEffect(() => {
    if (!state.studentName) {
      setShowNameModal(true);
    }
  }, [state.studentName]);

  // Fetch leaderboard on mount and periodically
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

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

      // Show score animation
      setShowScoreAnimation(true);
      setTimeout(() => setShowScoreAnimation(false), 2000);

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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center animate-bounce">
            <div
              className={`text-9xl font-bold ${
                state.analysis.score >= 7 ? "text-green-400" : "text-amber-400"
              }`}
            >
              {state.analysis.score}
            </div>
            <div className="text-3xl text-white mt-4">
              {state.analysis.score >= 7 ? "🎉 ممتاز!" : "💪 حاول مرة ثانية!"}
            </div>
            {state.lastRank && (
              <div className="text-xl text-white/80 mt-2">
                ترتيبك: #{state.lastRank}
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
