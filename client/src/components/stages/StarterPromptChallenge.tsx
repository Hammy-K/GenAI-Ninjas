import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { analyzeStarterPrompt } from "@/lib/openai";
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
      trackStageProgress("starter_prompt_challenge", "example_copied", {
        prompt_length: state.improvedPrompt.length,
      });
      return;
    }

    setError("");
    setIsAnalyzing(true);

    trackStageProgress("starter_prompt_challenge", "prompt_submitted", {
      prompt_length: state.improvedPrompt.length,
    });

    try {
      await logPromptToFirestore(
        "starter_prompt_analysis",
        state.improvedPrompt,
        {
          original_prompt: weakPrompt,
          stage: "starter_prompt_challenge",
        },
      );

      const result = await analyzeStarterPrompt(state.improvedPrompt);
      setAnalysis(result);

      trackStageProgress("starter_prompt_challenge", "analysis_received", {
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

          trackStageProgress("starter_prompt_challenge", "badge_unlocked", {
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

      trackStageProgress("starter_prompt_challenge", "error", {
        error_message: error instanceof Error ? error.message : "Unknown error",
        prompt_length: state.improvedPrompt.length,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-8 bg-[#f8f4f0]">
      <div className="w-full max-w-4xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold text-[#2d3748] mb-5 leading-tight">
            هندسة الأوامر
          </h1>
          <p className="text-[#718096] text-xl md:text-2xl font-medium">
            (تعلم كيف تكتب أوامر واضحة للذكاء الاصطناعي)
          </p>
        </div>

        {/* Description */}
        <p className="text-center text-[#4a5568] mb-12 leading-relaxed text-lg md:text-xl max-w-3xl mx-auto">
          شارك محاولتك لتحسين الأمر، واحصل على تقييم وملاحظات من الذكاء
          الاصطناعي لمساعدتك
        </p>

        {/* Weak Prompt Display */}
        <div className="bg-white rounded-3xl p-10 mb-8 text-center shadow-md border border-[#e2e8f0]">
          <p className="text-base text-[#718096] mb-4 font-semibold">
            الأمر الضعيف:
          </p>
          <p className="text-3xl md:text-4xl font-bold text-[#2d3748]">
            صمم لي تطبيق يعطيني آيات من القرآن
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-3xl p-8 shadow-md border border-[#e2e8f0] mb-5">
          <Textarea
            placeholder="اكتب هنا محاولتك لتحسين الأمر..."
            value={state.improvedPrompt}
            onChange={(e) => setImprovedPrompt(e.target.value)}
            className="min-h-[200px] text-lg md:text-xl bg-[#f8f4f0] border-2 border-[#e2e8f0] rounded-2xl focus:border-[#4299e1] transition-all resize-none focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed p-6"
            dir="auto"
          />
        </div>

        <p className="text-sm text-[#a0aec0] text-center mb-8">
          لا تقلق، هذا تمرين ولا تحتاج بأي شكل أن تتضمن معلومات شخصية
        </p>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitImprovement}
          disabled={isAnalyzing || !state.improvedPrompt.trim()}
          className="w-full bg-gradient-to-r from-[#4299e1] to-[#3182ce] hover:from-[#3182ce] hover:to-[#2c5282] text-white py-8 rounded-3xl text-xl md:text-2xl font-bold transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transform"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="ml-3 h-7 w-7 animate-spin" />
              جاري التحليل...
            </>
          ) : (
            <>
              احصل على التقييم
              <svg
                className="mr-3 h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
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
            className="mt-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6"
          >
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="text-red-800 text-lg">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {state.analysis && (
          <div className="mt-10 bg-white rounded-3xl p-10 shadow-2xl border border-[#e2e8f0]">
            {/* Score Display */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-[#4299e1] to-[#3182ce] text-white text-5xl font-bold mb-5 shadow-2xl">
                {state.analysis.score}
              </div>
              <p className="text-[#718096] text-2xl font-semibold">من 10</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#e2e8f0] h-4 rounded-full mb-10 overflow-hidden">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-[#4299e1] to-[#3182ce] transition-all duration-700 shadow-sm"
                style={{ width: `${state.analysis.score * 10}%` }}
              />
            </div>

            {/* Feedback */}
            <div className="space-y-6">
              <div className="bg-[#f8f4f0] rounded-2xl p-8">
                <p className="text-lg font-bold text-[#2d3748] mb-4 flex items-center">
                  <span className="inline-block w-1.5 h-7 bg-[#4299e1] rounded-full ml-3"></span>
                  الملاحظات
                </p>
                <p className="text-[#4a5568] leading-relaxed text-lg md:text-xl">
                  {state.analysis.feedback}
                </p>
              </div>

              {/* Improvement Suggestion */}
              <div className="bg-[#f8f4f0] rounded-2xl p-8">
                <p className="text-lg font-bold text-[#2d3748] mb-4 flex items-center">
                  <span className="inline-block w-1.5 h-7 bg-[#48bb78] rounded-full ml-3"></span>
                  اقتراح للتحسين
                </p>
                <p className="text-[#4a5568] leading-relaxed text-lg md:text-xl">
                  {state.analysis.improvement}
                </p>
              </div>

              {/* Success Message */}
              {state.analysis.score >= 7 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 text-center shadow-md">
                  <p className="text-green-700 font-bold text-2xl md:text-3xl mb-2">
                    🎉 ممتاز! نجحت في التحدي
                  </p>
                  <p className="text-green-600 text-base md:text-lg mt-3">
                    الآن يمكنك استخدام هذه المهارة لبناء تطبيقاتك الخاصة
                  </p>
                </div>
              )}

              {/* Try Again Message */}
              {state.analysis.score < 7 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-8 text-center shadow-md">
                  <p className="text-amber-800 font-bold text-xl md:text-2xl mb-2">
                    💪 جرب مرة أخرى بإضافة المزيد من التفاصيل
                  </p>
                  <p className="text-amber-700 text-base md:text-lg mt-3 leading-relaxed">
                    تذكر الإجابة على الأسئلة الأربعة: ما هو؟ كيف يبدو؟ ماذا
                    يفعل؟ متطلبات خاصة؟
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {!state.analysis && (
          <div className="mt-20 flex justify-center gap-8 opacity-40">
            <a
              href="#"
              className="text-[#718096] hover:text-[#4a5568] transition-colors hover:scale-110 transform"
            >
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-[#718096] hover:text-[#4a5568] transition-colors hover:scale-110 transform"
            >
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        )}

        {/* Footer Note */}
        <p className="text-center text-sm text-[#a0aec0] mt-12">
          صنع بـ ❤️ لمساعدة الطلاب على تعلم هندسة الأوامر بطريقة ممتعة
        </p>
      </div>
    </div>
  );
}
