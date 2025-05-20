import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzePrompt } from "@/lib/openai";
import { useStageState } from "@/hooks/useStageState";
import { validateInput, validatePromptAnalyzerInput } from "@/lib/inputFilter";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { useQuest } from "@/hooks/useQuest";
import { trackStageProgress, logPromptToFirestore } from "@/lib/firebase";
import penguinPngPath from "@assets/Penguin.png";

interface PromptChallengeStageProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge?: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface PromptChallengeState {
  improvedPrompt: string;
  analysis: { score: number; feedback: string; improvement: string } | null;
  hasCompleted: boolean;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
}

export function PromptChallengeStage({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: PromptChallengeStageProps) {
  // Use quest hook for global state
  const { isStageTimerExpired, markStageTimerExpired, markStageVisited } =
    useQuest();

  // Use custom hook for persisted state
  const [state, setState] = useStageState<PromptChallengeState>(
    "promptChallenge",
    {
      improvedPrompt: "",
      analysis: null,
      hasCompleted: false,
      hasEarnedXp: false,
      hasUnlockedBadge: false,
    },
  );

  // Stage ID for this component
  const STAGE_ID = 3; // Prompt Challenge is stage 3
  const STAGE_TIME_LIMIT = 5; // 5 minutes

  // Mark stage as visited
  useEffect(() => {
    markStageVisited(STAGE_ID);
  }, [markStageVisited]);

  // Handle timer expiration
  const handleTimeUp = (stageId: number) => {
    markStageTimerExpired(stageId);
  };

  // Utility functions to update individual state properties
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

  // Local UI state - no need to persist
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const weakPrompt = "صمم لي صورة";
  const goodPromptExample =
    "أبغى لعبة بسيطة فيها شخصية تقفز وتتخطى عقبات زي Flappy Bird، بألوان زاهية ومناسبة للأطفال";
  const badPromptExample = "سوي لي تطبيق";

  const handleSubmitImprovement = async () => {
    // First validate the input using the shared utility function
    const generalValidation = validateInput(state.improvedPrompt);
    if (!generalValidation.isValid) {
      setError(generalValidation.errorMessage);
      return;
    }

    // Then check if the prompt is too similar to the example prompt
    const exampleCheck = validatePromptAnalyzerInput(state.improvedPrompt);
    if (!exampleCheck.isValid) {
      setError(exampleCheck.errorMessage);

      // Track this as a plagiarism attempt in analytics
      trackStageProgress("prompt_challenge", "example_copied", {
        prompt_length: state.improvedPrompt.length,
      });

      return;
    }

    setError("");
    setIsAnalyzing(true);

    // Track prompt submission in analytics
    trackStageProgress("prompt_challenge", "prompt_submitted", {
      prompt_length: state.improvedPrompt.length,
    });

    try {
      // Log the prompt to Firestore
      await logPromptToFirestore("prompt_analysis", state.improvedPrompt, {
        original_prompt: weakPrompt,
        stage: "prompt_challenge",
      });

      const result = await analyzePrompt(state.improvedPrompt);
      setAnalysis(result);

      // Track analysis result
      trackStageProgress("prompt_challenge", "analysis_received", {
        score: result.score,
        succeeded: result.score >= 7,
      });

      if (result.score >= 7) {
        // Only award XP and badge once
        if (!state.hasEarnedXp) {
          onEarnXp(15, "prompt_engineering_success");
          setHasEarnedXp(true);
        }

        // Award the Prompt Engineer badge
        if (!state.hasUnlockedBadge && onUnlockBadge) {
          onUnlockBadge("prompt_engineer_badge", "prompt_engineering_success");
          setState((prev) => ({
            ...prev,
            hasUnlockedBadge: true,
          }));

          // Track badge unlocking
          trackStageProgress("prompt_challenge", "badge_unlocked", {
            badge_name: "prompt_engineer_badge",
          });
        }

        setHasCompleted(true);
      }
    } catch (err: any) {
      const error = err as Error;
      if (
        error instanceof Error &&
        error.message &&
        (error.message.includes("quota") ||
          error.message.toLowerCase().includes("429"))
      ) {
        setError(
          "API quota exceeded. Please try again later or use a different API key.",
        );
      } else {
        setError(
          error instanceof Error ? error.message : "An unknown error occurred",
        );
      }

      // Track error
      trackStageProgress("prompt_challenge", "error", {
        error_message: error instanceof Error ? error.message : "Unknown error",
        prompt_length: state.improvedPrompt.length,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="prompt-challenge-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <CountdownTimer
                stageId={STAGE_ID}
                minutes={STAGE_TIME_LIMIT}
                onTimeUp={handleTimeUp}
                isExpired={isStageTimerExpired(STAGE_ID)}
              />
            </div>

            <div className="flex justify-center mb-3">
              <img src={penguinPngPath} alt="د. بنجي" className="h-20 w-auto" />
            </div>

            <CardTitle className="text-2xl md:text-3xl text-center">
              تحدي هندسة الأوامر
            </CardTitle>

            <p className="text-center mt-3 font-medium text-lg">
              تعلم كيف تكتب أوامر يخلّي الذكاء الاصطناعي يفهمك تمام.
            </p>
          </CardHeader>

          <CardContent>
            {isStageTimerExpired(STAGE_ID) && (
              <Alert className="bg-amber-50 border-amber-200 mb-4">
                <AlertDescription className="text-sm">
                  انتهى الوقت المقترح لهذه المرحلة، لكن يمكنك أن تأخذ وقتك إذا
                  احتجت لوقت إضافي. يمكنك الانتقال إلى المرحلة التالية عندما
                  تكون جاهزاً.
                </AlertDescription>
              </Alert>
            )}

            {/* Examples Section with Check/X Icons */}
            <div className="bg-neutral-50 rounded-lg border p-4 mb-6">
              <h3 className="font-bold text-lg mb-3 text-center">
                أمثلة على الأوامر
              </h3>

              <div className="flex items-center mb-3 bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="ml-3 bg-red-100 p-2 rounded-full">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-red-600">{badPromptExample}</p>
                  <p className="text-sm text-red-600 mt-1">
                    غير واضح وغير محدد
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="ml-3 bg-green-100 p-2 rounded-full">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-green-600">
                    {goodPromptExample}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    واضح، محدد، ويحتوي على تفاصيل مفيدة
                  </p>
                </div>
              </div>
            </div>

            {/* Challenge Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">حسّن هذا البرومبت:</h3>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                <p className="font-medium">{weakPrompt}</p>
              </div>

              <Textarea
                placeholder="أعد كتابة البرومبت ليكون أكثر تحديداً وتفصيلاً"
                value={state.improvedPrompt}
                onChange={(e) => setImprovedPrompt(e.target.value)}
                className="min-h-[100px] mb-4 bg-white text-sm rtl:text-right"
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
                  "تحليل البرومبت"
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

            {/* Results Section */}
            {state.analysis && (
              <div
                className={`p-4 rounded-lg border mb-6 ${
                  state.analysis.score >= 7
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
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
                        قربت! هذا التقييم: {state.analysis.score}/10 😅
                      </h3>
                    </>
                  )}
                </div>

                <div className="w-full bg-white h-2 rounded-full my-2">
                  <div
                    className={`h-2 rounded-full ${state.analysis.score >= 7 ? "bg-green-500" : "bg-amber-500"}`}
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

            {/* Goal Description */}
            {!state.analysis && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-6 text-center">
                <p className="text-sm text-blue-700">
                  هدفك هو الحصول على تقييم 7/10 أو أعلى للانتقال للمرحلة
                  التالية. كلما كان البرومبت أكثر تفصيلاً وتحديداً، كلما كانت
                  النتيجة أفضل!
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowRight className="ml-2 h-4 w-4" />
              <span>للخلف</span>
            </Button>

            <Button
              onClick={onComplete}
              size="lg"
              disabled={!(state.analysis && state.analysis.score >= 7)} // Disable until score is 7 or higher
              className={
                state.analysis && state.analysis.score >= 7
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              <span>المتابعة</span>
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
