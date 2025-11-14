import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { analyzePrompt } from "@/lib/openai";
import { useStageState } from "@/hooks/useStageState";
import { validateInput, validatePromptAnalyzerInput } from "@/lib/inputFilter";
import { trackStageProgress, logPromptToFirestore } from "@/lib/firebase";

interface StarterPromptChallengeProps {
  onComplete: () => void;
  onEarnXp: (amount: number, source?: string) => void;
  onUnlockBadge?: (badgeName: string, source?: string) => void;
  onBack: () => void;
}

interface StarterPromptChallengeState {
  improvedPrompt: string;
  analysis: { score: number; feedback: string; improvement: string } | null;
  hasCompleted: boolean;
  hasEarnedXp: boolean;
  hasUnlockedBadge: boolean;
}

export function StarterPromptChallenge({
  onComplete,
  onEarnXp,
  onUnlockBadge,
  onBack,
}: StarterPromptChallengeProps) {
  const [state, setState] = useStageState<StarterPromptChallengeState>(
    "starterPromptChallenge",
    {
      improvedPrompt: "",
      analysis: null,
      hasCompleted: false,
      hasEarnedXp: false,
      hasUnlockedBadge: false,
    },
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const weakPrompt = "صمم لي لعبة";

  const setImprovedPrompt = (prompt: string) =>
    setState((prev) => ({ ...prev, improvedPrompt: prompt }));
  const setAnalysis = (
    analysisData: {
      score: number;
      feedback: string;
      improvement: string;
    } | null,
  ) => setState((prev) => ({ ...prev, analysis: analysisData }));
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
      setAnalysis(result);

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
          setState((prev) => ({
            ...prev,
            hasUnlockedBadge: true,
          }));

          trackStageProgress("prompt_challenge", "badge_unlocked", {
            badge_name: "prompt_engineer_badge",
          });
        }

        setState((prev) => ({ ...prev, hasCompleted: true }));
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

      trackStageProgress("prompt_challenge", "error", {
        error_message: error instanceof Error ? error.message : "Unknown error",
        prompt_length: state.improvedPrompt.length,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-[#4a5568] mb-3">
            هندسة الأوامر
          </h1>
          <p className="text-[#718096] text-lg">
            (تعلم كيف تكتب أوامر واضحة للذكاء الاصطناعي)
          </p>
        </div>

        {/* Description */}
        <p className="text-center text-[#4a5568] mb-8 leading-relaxed">
          شارك محاولتك لتحسين الأمر، واحصل على تقييم وملاحظات من الذكاء
          الاصطناعي لمساعدتك
        </p>

        {/* Weak Prompt Display */}
        <div className="bg-[#e2e8f0] rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-[#718096] mb-2">الأمر الضعيف:</p>
          <p className="text-xl font-semibold text-[#4a5568]">{weakPrompt}</p>
        </div>

        {/* Input Area */}
        <Textarea
          placeholder="اكتب هنا محاولتك لتحسين الأمر..."
          value={state.improvedPrompt}
          onChange={(e) => setImprovedPrompt(e.target.value)}
          className="min-h-[140px] mb-4 text-base bg-white border-2 border-[#e2e8f0] rounded-xl focus:border-[#4299e1] transition-colors resize-none"
          dir="auto"
        />

        <p className="text-xs text-[#a0aec0] text-center mb-6">
          لا تقلق، هذا تمرين ولا تحتاج بأي شكل أن تتضمن معلومات شخصية
        </p>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitImprovement}
          disabled={isAnalyzing || !state.improvedPrompt.trim()}
          className="w-full bg-[#4299e1] hover:bg-[#3182ce] text-white py-6 rounded-xl text-lg font-medium transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جاري التحليل...
            </>
          ) : (
            <>
              احصل على التقييم
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <Alert
            variant="destructive"
            className="mt-4 bg-red-50 border-red-200"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {state.analysis && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
            {/* Score Display */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#4299e1] to-[#3182ce] text-white text-3xl font-bold mb-3">
                {state.analysis.score}
              </div>
              <p className="text-[#718096]">من 10</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#e2e8f0] h-2 rounded-full mb-6">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#4299e1] to-[#3182ce] transition-all duration-500"
                style={{ width: `${state.analysis.score * 10}%` }}
              />
            </div>

            {/* Feedback */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#4a5568] mb-2">
                  الملاحظات:
                </p>
                <p className="text-[#718096] leading-relaxed">
                  {state.analysis.feedback}
                </p>
              </div>

              {/* Improvement Suggestion */}
              <div className="border-t border-[#e2e8f0] pt-4">
                <p className="text-sm font-semibold text-[#4a5568] mb-2">
                  اقتراح للتحسين:
                </p>
                <p className="text-[#718096] leading-relaxed">
                  {state.analysis.improvement}
                </p>
              </div>

              {/* Success Message */}
              {state.analysis.score >= 7 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-medium text-lg">
                    🎉 ممتاز! نجحت في التحدي
                  </p>
                </div>
              )}

              {/* Try Again Message */}
              {state.analysis.score < 7 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-amber-700 font-medium">
                    جرب مرة أخرى بإضافة المزيد من التفاصيل
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Links (like the original app) */}
        {!state.analysis && (
          <div className="mt-12 flex justify-center gap-4 opacity-60">
            <a href="#" className="text-[#718096] hover:text-[#4a5568]">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a href="#" className="text-[#718096] hover:text-[#4a5568]">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        )}

        {/* Footer Note */}
        <p className="text-center text-xs text-[#a0aec0] mt-8">
          صنع بـ ❤️ لمساعدة الطلاب على تعلم هندسة الأوامر بطريقة ممتعة
        </p>
      </div>
    </div>
  );
}
